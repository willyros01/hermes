/* FIDUNIO — App Store review submission through the App Store Connect API.
 * Release tooling only: it changes no app code.
 * Run by .github/workflows/ios-review-submit.yml with STAGE:
 *   inspect  read only: what App Store Connect holds now (default)
 *   prepare  version named after the newest valid build, that build attached,
 *            MANUAL release, App Review sign-in and contact
 *   submit   prepare, then send the version to App Review
 * Env: KEY (path to .p8), ASC_KEY_ID, ASC_ISSUER_ID; for prepare/submit also
 * DEMO_USER, DEMO_PASS, DEMO_PIN (never printed), ASSETS (screenshot folder). Any problem stops before submitting. */
import crypto from "node:crypto";
import fs from "node:fs";

const BUNDLE_ID = "io.github.willyros01.fidunio";
const EDITABLE = ["PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED", "INVALID_BINARY"];
const STAGE = process.env.STAGE || "inspect";
const say = (s) => console.log(s);

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`missing ${name}`);
  return v.trim();
}
function token() {
  const enc = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${enc({ alg: "ES256", kid: required("ASC_KEY_ID"), typ: "JWT" })}.${enc({ iss: required("ASC_ISSUER_ID"), iat: now, exp: now + 900, aud: "appstoreconnect-v1" })}`;
  const sig = crypto.sign("sha256", Buffer.from(unsigned), { key: fs.readFileSync(required("KEY")), dsaEncoding: "ieee-p1363" }).toString("base64url");
  return `${unsigned}.${sig}`;
}
async function call(method, path, body) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${token()}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await res.text();
  let json = null;
  try { json = raw ? JSON.parse(raw) : null; } catch {}
  return { ok: res.ok, status: res.status, json };
}
const why = (r) => (r.json?.errors || []).map((e) => `${e.code}: ${e.detail || e.title}${e.meta ? " " + JSON.stringify(e.meta) : ""}`).join("; ").slice(0, 4000) || `HTTP ${r.status}`;
async function api(method, path, body) {
  const r = await call(method, path, body);
  if (!r.ok) throw new Error(`${method} ${path.split("?")[0]} — ${why(r)}`);
  return r.json;
}
async function peek(path) { const r = await call("GET", path); return r.ok ? r.json : { failed: why(r) }; }
const stateOf = (v) => v.attributes.appVersionState || v.attributes.appStoreState;
const yn = (v) => (v ? "yes" : "MISSING");

async function inspect(app, version) {
  const info = (await peek(`/v1/apps/${app.id}/appInfos`)).data || [];
  for (const i of info) {
    say(`app info: state ${i.attributes.appStoreState || i.attributes.state}, age rating ${i.attributes.appStoreAgeRating || "?"}`);
    const loc = (await peek(`/v1/appInfos/${i.id}/appInfoLocalizations`)).data || [];
    for (const l of loc) say(`  ${l.attributes.locale}: name "${l.attributes.name}", subtitle "${l.attributes.subtitle || ""}", privacy URL ${yn(l.attributes.privacyPolicyUrl)}`);
    const cat = await peek(`/v1/appInfos/${i.id}/primaryCategory`);
    say(`  primary category: ${cat.data?.id || "MISSING"}`);
    const age = await peek(`/v1/appInfos/${i.id}/ageRatingDeclaration`);
    say(`  age rating questions: ${age.data ? "present" : "MISSING"}`);
  }
  const price = await peek(`/v1/apps/${app.id}/appPriceSchedule?include=manualPrices`);
  say(`price schedule: ${price.failed ? "MISSING (" + price.failed.slice(0, 80) + ")" : (price.included || []).length + " price(s)"}`);
  const avail = await peek(`/v1/apps/${app.id}/appAvailabilityV2`);
  say(`availability: ${avail.failed ? "MISSING" : "set, new territories " + avail.data?.attributes?.availableInNewTerritories}`);
  if (!version) return;
  say(`version ${version.attributes.versionString}: copyright ${yn(version.attributes.copyright)}, release ${version.attributes.releaseType}`);
  const vl = (await peek(`/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`)).data || [];
  for (const l of vl) {
    const a = l.attributes;
    say(`  ${a.locale}: description ${a.description ? a.description.length + " chars" : "MISSING"}, keywords ${yn(a.keywords)}, support URL ${yn(a.supportUrl)}, promo ${a.promotionalText ? "yes" : "no"}`);
    const sets = (await peek(`/v1/appStoreVersionLocalizations/${l.id}/appScreenshotSets`)).data || [];
    for (const s of sets) {
      const n = ((await peek(`/v1/appScreenshotSets/${s.id}/appScreenshots`)).data || []).length;
      say(`    screenshots ${s.attributes.screenshotDisplayType}: ${n}`);
    }
    if (!sets.length) say("    screenshots: NONE");
  }
  const b = await peek(`/v1/appStoreVersions/${version.id}/build`);
  say(`  build attached: ${b.data ? b.data.attributes.version : "none"}`);
  const rd = await peek(`/v1/appStoreVersions/${version.id}/appStoreReviewDetail`);
  const r = rd.data?.attributes;
  say(`  review info: ${r ? `contact ${yn(r.contactFirstName && r.contactLastName)} / email ${yn(r.contactEmail)} / phone ${yn(r.contactPhone)}, demo ${r.demoAccountRequired ? r.demoAccountName || "MISSING" : "not set"}, notes ${r.notes ? r.notes.length + " chars" : "none"}` : "NONE"}`);
}

/* Read-only: The Marker's live settings, which FIDUNIO copies (Willy, 8 Nov 2026). */
async function reference() {
  const mk = (await api("GET", "/v1/apps?filter[bundleId]=io.github.willyros01.marker")).data?.[0];
  say(`reference app ${mk.attributes.name} (${mk.id}), contentRights ${mk.attributes.contentRightsDeclaration}`);
  const infos = (await api("GET", `/v1/apps/${mk.id}/appInfos`)).data || [];
  const live = infos.find((i) => (i.attributes.appStoreState || i.attributes.state) === "READY_FOR_SALE" || (i.attributes.state === "READY_FOR_DISTRIBUTION")) || infos[0];
  for (const rel of ["primaryCategory", "secondaryCategory"]) say(`  ${rel}: ${(await peek(`/v1/appInfos/${live.id}/${rel}`)).data?.id || "none"}`);
  for (const l of (await peek(`/v1/appInfos/${live.id}/appInfoLocalizations`)).data || []) say(`  ${l.attributes.locale}: privacy ${l.attributes.privacyPolicyUrl}`);
  const age = (await peek(`/v1/appInfos/${live.id}/ageRatingDeclaration`)).data?.attributes || {};
  say(`  age rating: ${JSON.stringify(age).slice(0, 900)}`);
  const pr = await peek(`/v1/apps/${mk.id}/appPriceSchedule?include=baseTerritory,manualPrices`);
  say(`  price: base ${(pr.included || []).filter((x) => x.type === "territories").map((x) => x.id).join(",")} manual ${(pr.included || []).filter((x) => x.type === "appPrices").length}`);
  const av = await peek(`/v1/apps/${mk.id}/appAvailabilityV2?include=territoryAvailabilities&limit[territoryAvailabilities]=200`);
  const ta = (av.included || []).filter((x) => x.attributes?.available).length;
  say(`  availability: new territories ${av.data?.attributes?.availableInNewTerritories}, available in ${ta}`);
  const vs = (await api("GET", `/v1/apps/${mk.id}/appStoreVersions?filter[platform]=IOS&limit=3`)).data || [];
  const v = vs[0];
  say(`  version ${v.attributes.versionString}: copyright "${v.attributes.copyright}", release ${v.attributes.releaseType}`);
  for (const l of (await peek(`/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations`)).data || []) say(`  ${l.attributes.locale}: support ${l.attributes.supportUrl}, marketing ${l.attributes.marketingUrl || "none"}`);
  const rd = (await peek(`/v1/appStoreVersions/${v.id}/appStoreReviewDetail`)).data?.attributes || {};
  say(`  review contact: ${rd.contactFirstName} ${rd.contactLastName}, ${rd.contactEmail}, phone ${rd.contactPhone ? "set (" + String(rd.contactPhone).length + " chars)" : "none"}`);
  for (const u of ["https://cuberoot-systems.com/fidunio/privacy", "https://cuberoot-systems.com/fidunio/privacy.html", "https://cuberoot-systems.com/fidunio/", "https://cuberoot-systems.com/fidunio/support"]) {
    const r = await fetch(u, { redirect: "follow" }).catch((e) => ({ status: String(e.message).slice(0, 40) }));
    say(`  web ${u}: ${r.status}`);
  }
}

/* Listing (Willy approved the text on 8 Nov 2026; category, price, countries,
 * contact and copyright the same as The Marker). */
const LISTING = {
  locale: "en-US",
  subtitle: "Private family messaging",
  keywords: "private,secure,encrypted,family,messaging,chat,invitation,groups,photos",
  description: "FIDUNIO is a private, invitation-only messenger for families. Every message, photo and group chat is end-to-end encrypted, so only the people in the conversation can read it. Messages can be set to disappear. No ads, no tracking. An invitation from an existing member is required to join.",
  copyright: "2026 Wilfredo Rosales",
  privacyPolicyUrl: "https://www.cuberoot-systems.com/fidunio/privacy/",
  supportUrl: "https://www.cuberoot-systems.com/fidunio/support",
  category: "SOCIAL_NETWORKING",
};
const reviewNotes = (pin) => [
  "FIDUNIO is an invitation-only, end-to-end encrypted messenger for families.",
  "Sign in with the demo account above. When FIDUNIO asks for the six-digit PIN, enter " + pin + ".",
  "The demo account is already a member, so no invitation is needed.",
  "Tap + to start a conversation or create a group. Messages can be set to disappear in each chat. Users can be blocked and messages reported in Settings > Safety.",
  "Contact: willyros01@gmail.com",
].join("\n");

async function setListing(app, version) {
  const mk = (await api("GET", "/v1/apps?filter[bundleId]=io.github.willyros01.marker")).data[0];
  await api("PATCH", `/v1/apps/${app.id}`, { data: { type: "apps", id: app.id, attributes: { contentRightsDeclaration: "DOES_NOT_USE_THIRD_PARTY_CONTENT" } } });
  say("OK    content rights: no third-party content");

  const info = ((await api("GET", `/v1/apps/${app.id}/appInfos`)).data || []).find((i) => (i.attributes.appStoreState || i.attributes.state) !== "READY_FOR_SALE" && i.attributes.state !== "READY_FOR_DISTRIBUTION");
  if (!info) throw new Error("no editable app info");
  await api("PATCH", `/v1/appInfos/${info.id}`, { data: { type: "appInfos", id: info.id, relationships: { primaryCategory: { data: { type: "appCategories", id: LISTING.category } } } } });
  say(`OK    category ${LISTING.category}`);
  const il = ((await api("GET", `/v1/appInfos/${info.id}/appInfoLocalizations`)).data || []).find((l) => l.attributes.locale === LISTING.locale);
  if (!il) throw new Error(`no ${LISTING.locale} app info localization`);
  await api("PATCH", `/v1/appInfoLocalizations/${il.id}`, { data: { type: "appInfoLocalizations", id: il.id, attributes: { subtitle: LISTING.subtitle, privacyPolicyUrl: LISTING.privacyPolicyUrl } } });
  say("OK    subtitle and privacy policy address");

  const age = (await api("GET", `/v1/appInfos/${info.id}/ageRatingDeclaration`)).data;
  await api("PATCH", `/v1/ageRatingDeclarations/${age.id}`, { data: { type: "ageRatingDeclarations", id: age.id, attributes: {
    advertising: false, alcoholTobaccoOrDrugUseOrReferences: "NONE", contests: "NONE", gambling: false, gamblingSimulated: "NONE",
    gunsOrOtherWeapons: "NONE", healthOrWellnessTopics: false, lootBox: false, medicalOrTreatmentInformation: "NONE",
    messagingAndChat: true, parentalControls: false, profanityOrCrudeHumor: "NONE", ageAssurance: false,
    sexualContentGraphicAndNudity: "NONE", sexualContentOrNudity: "NONE", socialMedia: false, socialMediaAgeRestricted: false,
    horrorOrFearThemes: "NONE", matureOrSuggestiveThemes: "NONE", unrestrictedWebAccess: false, userGeneratedContent: true,
    violenceCartoonOrFantasy: "NONE", violenceRealisticProlongedGraphicOrSadistic: "NONE", violenceRealistic: "NONE" } } });
  say("OK    age rating answers (messaging and user content: yes; everything else: none)");

  const price = await call("GET", `/v1/apps/${app.id}/appPriceSchedule`);
  if (!price.ok) {
    const points = (await api("GET", `/v1/apps/${app.id}/appPricePoints?filter[territory]=CAN&limit=200`)).data || [];
    const free = points.find((x) => Number(x.attributes.customerPrice) === 0);
    if (!free) throw new Error("free price point not found");
    await api("POST", "/v1/appPriceSchedules", { data: { type: "appPriceSchedules", relationships: { app: { data: { type: "apps", id: app.id } }, baseTerritory: { data: { type: "territories", id: "CAN" } }, manualPrices: { data: [{ type: "appPrices", id: "${p0}" }] } } }, included: [{ type: "appPrices", id: "${p0}", attributes: { startDate: null }, relationships: { appPricePoint: { data: { type: "appPricePoints", id: free.id } } } }] });
  }
  say("OK    price: free (base Canada)");

  const avail = await call("GET", `/v1/apps/${app.id}/appAvailabilityV2`);
  if (!avail.ok) {
    const terr = [];
    let next = "/v1/territories?limit=200";
    while (next) { const page = await api("GET", next.replace("https://api.appstoreconnect.apple.com", "")); terr.push(...page.data.map((t) => t.id)); next = page.links?.next || null; }
    await api("POST", "/v2/appAvailabilities", { data: { type: "appAvailabilities", attributes: { availableInNewTerritories: true }, relationships: { app: { data: { type: "apps", id: app.id } }, territoryAvailabilities: { data: terr.map((t, i) => ({ type: "territoryAvailabilities", id: "${t" + i + "}" })) } } },
      included: terr.map((t, i) => ({ type: "territoryAvailabilities", id: "${t" + i + "}", attributes: { available: true }, relationships: { territory: { data: { type: "territories", id: t } } } })) });
    say(`OK    available in all ${terr.length} countries and regions`);
  } else say("OK    availability already set");

  await api("PATCH", `/v1/appStoreVersions/${version.id}`, { data: { type: "appStoreVersions", id: version.id, attributes: { copyright: LISTING.copyright } } });
  const vl = ((await api("GET", `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`)).data || []).find((l) => l.attributes.locale === LISTING.locale);
  if (!vl) throw new Error(`no ${LISTING.locale} version localization`);
  await api("PATCH", `/v1/appStoreVersionLocalizations/${vl.id}`, { data: { type: "appStoreVersionLocalizations", id: vl.id, attributes: { description: LISTING.description, keywords: LISTING.keywords, supportUrl: LISTING.supportUrl } } });
  say("OK    description, keywords, support address, copyright");

  const mv = (await api("GET", `/v1/apps/${mk.id}/appStoreVersions?filter[platform]=IOS&limit=1`)).data[0];
  const mr = (await api("GET", `/v1/appStoreVersions/${mv.id}/appStoreReviewDetail`)).data.attributes;
  return { vl, contact: { contactFirstName: mr.contactFirstName, contactLastName: mr.contactLastName, contactEmail: mr.contactEmail, contactPhone: mr.contactPhone } };
}

async function uploadScreens(vl) {
  const dir = process.env.ASSETS || "assets/fidunio-shots";
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort() : [];
  const groups = { APP_IPHONE_67: files.filter((f) => f.startsWith("iphone-")), APP_IPAD_PRO_3GEN_129: files.filter((f) => f.startsWith("ipad-")) };
  if (!groups.APP_IPHONE_67.length || !groups.APP_IPAD_PRO_3GEN_129.length) throw new Error(`screenshots missing in ${dir}`);
  const sets = (await api("GET", `/v1/appStoreVersionLocalizations/${vl.id}/appScreenshotSets`)).data || [];
  for (const [type, list] of Object.entries(groups)) {
    let set = sets.find((x) => x.attributes.screenshotDisplayType === type);
    if (set) for (const old of (await api("GET", `/v1/appScreenshotSets/${set.id}/appScreenshots`)).data || []) await api("DELETE", `/v1/appScreenshots/${old.id}`);
    else set = (await api("POST", "/v1/appScreenshotSets", { data: { type: "appScreenshotSets", attributes: { screenshotDisplayType: type }, relationships: { appStoreVersionLocalization: { data: { type: "appStoreVersionLocalizations", id: vl.id } } } } })).data;
    for (const f of list) {
      const buf = fs.readFileSync(`${dir}/${f}`);
      const shot = (await api("POST", "/v1/appScreenshots", { data: { type: "appScreenshots", attributes: { fileName: f, fileSize: buf.length }, relationships: { appScreenshotSet: { data: { type: "appScreenshotSets", id: set.id } } } } })).data;
      for (const op of shot.attributes.uploadOperations) {
        const r = await fetch(op.url, { method: op.method, headers: Object.fromEntries(op.requestHeaders.map((h) => [h.name, h.value])), body: buf.subarray(op.offset, op.offset + op.length) });
        if (!r.ok) throw new Error(`upload ${f} HTTP ${r.status}`);
      }
      await api("PATCH", `/v1/appScreenshots/${shot.id}`, { data: { type: "appScreenshots", id: shot.id, attributes: { uploaded: true, sourceFileChecksum: crypto.createHash("md5").update(buf).digest("hex") } } });
    }
    say(`OK    ${list.length} screenshots ${type}`);
  }
  for (let i = 0; i < 30; i++) {
    let pending = 0, failed = [];
    for (const set of (await api("GET", `/v1/appStoreVersionLocalizations/${vl.id}/appScreenshotSets`)).data || [])
      for (const s of (await api("GET", `/v1/appScreenshotSets/${set.id}/appScreenshots`)).data || []) {
        const st = s.attributes.assetDeliveryState?.state;
        if (st === "FAILED") failed.push(s.attributes.fileName); else if (st !== "COMPLETE") pending++;
      }
    if (failed.length) throw new Error("Apple rejected screenshots: " + failed.join(", "));
    if (!pending) { say("OK    Apple processed every screenshot"); return; }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("screenshots still processing after 150 s");
}

async function newestBuild(app) {
  const builds = (await api("GET", `/v1/builds?filter[app]=${app.id}&sort=-uploadedDate&limit=10&include=preReleaseVersion`)).data || [];
  return builds.find((b) => b.attributes.processingState === "VALID" && !b.attributes.expired);
}

async function prepare(app, version) {
  const build = await newestBuild(app);
  if (!build) throw new Error("no valid, unexpired build in App Store Connect");
  const pre = await api("GET", `/v1/builds/${build.id}/preReleaseVersion`);
  const vs = pre.data.attributes.version;
  say(`OK    newest valid build ${vs} (${build.attributes.version})`);

  if (version.attributes.versionString !== vs || version.attributes.releaseType !== "MANUAL") {
    await api("PATCH", `/v1/appStoreVersions/${version.id}`, { data: { type: "appStoreVersions", id: version.id, attributes: { versionString: vs, releaseType: "MANUAL" } } });
  }
  say(`OK    version ${vs}, release MANUAL`);
  await api("PATCH", `/v1/appStoreVersions/${version.id}/relationships/build`, { data: { type: "builds", id: build.id } });
  say(`OK    build ${build.attributes.version} attached`);

  const { vl, contact } = await setListing(app, version);
  await uploadScreens(vl);
  const attrs = {
    ...contact,
    notes: reviewNotes(required("DEMO_PIN")),
    demoAccountRequired: true,
    demoAccountName: required("DEMO_USER"),
    demoAccountPassword: required("DEMO_PASS"),
  };
  const rd = (await peek(`/v1/appStoreVersions/${version.id}/appStoreReviewDetail`)).data;
  if (rd) {
    await api("PATCH", `/v1/appStoreReviewDetails/${rd.id}`, { data: { type: "appStoreReviewDetails", id: rd.id, attributes: attrs } });
  } else {
    await api("POST", "/v1/appStoreReviewDetails", { data: { type: "appStoreReviewDetails", attributes: attrs, relationships: { appStoreVersion: { data: { type: "appStoreVersions", id: version.id } } } } });
  }
  say(`OK    App Review sign-in ${attrs.demoAccountName}, PIN and notes, contact ${contact.contactFirstName} ${contact.contactLastName}`);
  return build;
}

async function submit(app, version) {
  let sub = (await api("GET", `/v1/reviewSubmissions?filter[app]=${app.id}&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW`)).data?.[0];
  if (!sub) sub = (await api("POST", "/v1/reviewSubmissions", { data: { type: "reviewSubmissions", attributes: { platform: "IOS" }, relationships: { app: { data: { type: "apps", id: app.id } } } } })).data;
  const items = (await api("GET", `/v1/reviewSubmissions/${sub.id}/items?include=appStoreVersion`)).data || [];
  if (!items.some((i) => i.relationships?.appStoreVersion?.data?.id === version.id)) {
    await api("POST", "/v1/reviewSubmissionItems", { data: { type: "reviewSubmissionItems", relationships: { reviewSubmission: { data: { type: "reviewSubmissions", id: sub.id } }, appStoreVersion: { data: { type: "appStoreVersions", id: version.id } } } } });
  }
  const done = (await api("PATCH", `/v1/reviewSubmissions/${sub.id}`, { data: { type: "reviewSubmissions", id: sub.id, attributes: { submitted: true } } })).data;
  return done.attributes.state;
}

async function main() {
  if (!["inspect", "reference", "prepare", "submit", "diagnose"].includes(STAGE)) throw new Error("STAGE must be inspect, prepare or submit");
  const app = (await api("GET", `/v1/apps?filter[bundleId]=${encodeURIComponent(BUNDLE_ID)}`)).data?.[0];
  if (!app) throw new Error(`no App Store Connect app for ${BUNDLE_ID}`);
  say(`OK    app ${app.attributes.name} (${app.id})`);
  const versions = (await api("GET", `/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=20`)).data || [];
  say(`versions: ${versions.map((v) => `${v.attributes.versionString}=${stateOf(v)}`).join(", ") || "none"}`);
  const version = versions.find((v) => EDITABLE.includes(stateOf(v)));
  const builds = (await peek(`/v1/builds?filter[app]=${app.id}&sort=-uploadedDate&limit=5`)).data || [];
  say(`newest builds: ${builds.map((b) => `${b.attributes.version}=${b.attributes.processingState}${b.attributes.expired ? "(expired)" : ""}`).join(", ") || "none"}`);

  if (STAGE === "inspect") { await inspect(app, version); say("RESULT: inspect only — nothing was changed at Apple"); return; }
  if (STAGE === "reference") { await reference(); say("RESULT: reference only — nothing was changed at Apple"); return; }
  if (!version) throw new Error("no editable iOS version to submit");
  if (STAGE === "diagnose") {
    let sub = (await api("GET", `/v1/reviewSubmissions?filter[app]=${app.id}&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW`)).data?.[0];
    if (!sub) sub = (await api("POST", "/v1/reviewSubmissions", { data: { type: "reviewSubmissions", attributes: { platform: "IOS" }, relationships: { app: { data: { type: "apps", id: app.id } } } } })).data;
    const r = await call("POST", "/v1/reviewSubmissionItems", { data: { type: "reviewSubmissionItems", relationships: { reviewSubmission: { data: { type: "reviewSubmissions", id: sub.id } }, appStoreVersion: { data: { type: "appStoreVersions", id: version.id } } } } });
    if (r.ok) say("OK    Apple accepts the version for review (item added, not submitted)");
    else for (const e of r.json?.errors || []) for (const [k, list] of Object.entries(e.meta?.associatedErrors || {})) for (const a of list) say(`BLOCK ${k.split("/").slice(-2).join("/")}: ${a.code} — ${a.detail || a.title}`);
    say("RESULT: diagnose only — not submitted"); return;
  }
  const build = await prepare(app, version);
  if (STAGE === "prepare") { await inspect(app, version); say("RESULT: prepared — not submitted"); return; }
  const state = await submit(app, version);
  say(`RESULT: FIDUNIO submitted for review — build ${build.attributes.version}, state ${state}, release MANUAL`);
}

try { await main(); }
catch (e) { console.error(`FAIL  ${e.message}`); console.log("RESULT: stopped — not submitted"); process.exit(1); }
