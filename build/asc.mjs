/* FIDUNIO Phase 2 Apple setup verifier.
 * Read-only: this script changes nothing at Apple.
 *
 * Usage:
 *   KEY=/path/AuthKey.p8 ASC_KEY_ID=... ASC_ISSUER_ID=... APPLE_TEAM_ID=... node build/asc.mjs check
 *
 * The App Store Connect API key can read both App Store Connect and developer
 * resources when its role permits. Never print or commit the private key.
 */
import crypto from "node:crypto";
import fs from "node:fs";

const BUNDLE_ID = "io.github.willyros01.fidunio";
const APP_NAME = "FIDUNIO";

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`missing environment variable ${name}`);
  return v;
}
function token() {
  const enc = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${enc({ alg: "ES256", kid: required("ASC_KEY_ID"), typ: "JWT" })}.${enc({ iss: required("ASC_ISSUER_ID"), iat: now, exp: now + 900, aud: "appstoreconnect-v1" })}`;
  const sig = crypto.sign("sha256", Buffer.from(unsigned), {
    key: fs.readFileSync(required("KEY")),
    dsaEncoding: "ieee-p1363",
  }).toString("base64url");
  return `${unsigned}.${sig}`;
}
async function api(path) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  const raw = await res.text();
  let json = null;
  try { json = raw ? JSON.parse(raw) : null; } catch {}
  if (!res.ok) {
    const why = (json?.errors || []).map((e) => `${e.code}: ${e.detail || e.title}`).join("; ") || `HTTP ${res.status}`;
    throw new Error(`${path.split("?")[0]} — ${why}`);
  }
  return json;
}

async function check() {
  let bad = 0;
  const ok = (m) => console.log(`OK    ${m}`);
  const no = (m) => { console.log(`FAIL  ${m}`); bad++; };
  const note = (m) => console.log(`NOTE  ${m}`);

  await api("/v1/apps?limit=1");
  ok("Apple accepts the App Store Connect API key");

  const ids = await api(`/v1/bundleIds?filter[identifier]=${encodeURIComponent(BUNDLE_ID)}&limit=5`);
  const bid = (ids.data || []).find((b) => b.attributes.identifier === BUNDLE_ID);
  if (!bid) {
    no(`explicit Bundle ID ${BUNDLE_ID} is not registered`);
  } else {
    ok(`Bundle ID ${BUNDLE_ID} is registered as "${bid.attributes.name}"`);
    const team = process.env.APPLE_TEAM_ID || "";
    if (!team) no("APPLE_TEAM_ID is missing");
    else if (bid.attributes.seedId && bid.attributes.seedId !== team) no(`Bundle ID team ${bid.attributes.seedId} does not match APPLE_TEAM_ID ${team}`);
    else ok(`Apple Team ID is consistent (${team})`);

    const caps = await api(`/v1/bundleIds/${bid.id}/bundleIdCapabilities`);
    const types = (caps.data || []).map((c) => c.attributes.capabilityType).sort();
    note(`enabled capabilities: ${types.join(", ") || "none"}`);
    types.includes("PUSH_NOTIFICATIONS") ? ok("Push Notifications capability is enabled") : no("Push Notifications capability is NOT enabled");
    const unexpected = types.filter((x) => !["PUSH_NOTIFICATIONS", "IN_APP_PURCHASE"].includes(x));
    if (unexpected.length) note(`review additional capabilities before Phase 2 closeout: ${unexpected.join(", ")}`);
  }

  const apps = await api(`/v1/apps?filter[bundleId]=${encodeURIComponent(BUNDLE_ID)}`);
  const app = (apps.data || [])[0];
  if (!app) no(`App Store Connect has no app record for ${BUNDLE_ID}`);
  else {
    app.attributes.name === APP_NAME ? ok(`App Store Connect app record is "${APP_NAME}"`) : no(`App record name is "${app.attributes.name}", expected "${APP_NAME}"`);
    ok(`App Store Connect SKU: ${app.attributes.sku}`);
    note(`primary locale: ${app.attributes.primaryLocale}`);
  }

  console.log(bad ? `RESULT: Phase 2 Apple setup has ${bad} blocking problem(s)` : "RESULT: Phase 2 Apple setup is ready");
  process.exit(bad ? 1 : 0);
}

try {
  if (process.argv[2] !== "check") throw new Error("use: node build/asc.mjs check");
  await check();
} catch (e) {
  console.error(`Apple setup check: ${e.message}`);
  process.exit(2);
}
