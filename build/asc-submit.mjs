/* FIDUNIO — App Store review submission through the App Store Connect API.
 * Release tooling only: it changes no app code.
 * Run by .github/workflows/ios-review-submit.yml with STAGE:
 *   inspect  read only: what App Store Connect holds now (default)
 *   prepare  version named after the newest valid build, that build attached,
 *            MANUAL release, App Review sign-in and contact
 *   submit   prepare, then send the version to App Review
 * Env: KEY (path to .p8), ASC_KEY_ID, ASC_ISSUER_ID; for prepare/submit also
 * DEMO_USER, DEMO_PASS (never printed). Any problem stops before submitting. */
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
const why = (r) => (r.json?.errors || []).map((e) => `${e.code}: ${e.detail || e.title}`).join("; ").slice(0, 1500) || `HTTP ${r.status}`;
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

  const attrs = {
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
  say(`OK    App Review sign-in ${attrs.demoAccountName}`);
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
  if (!["inspect", "reference", "prepare", "submit"].includes(STAGE)) throw new Error("STAGE must be inspect, prepare or submit");
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
  const build = await prepare(app, version);
  if (STAGE === "prepare") { await inspect(app, version); say("RESULT: prepared — not submitted"); return; }
  const state = await submit(app, version);
  say(`RESULT: FIDUNIO submitted for review — build ${build.attributes.version}, state ${state}, release MANUAL`);
}

try { await main(); }
catch (e) { console.error(`FAIL  ${e.message}`); console.log("RESULT: stopped — not submitted"); process.exit(1); }
