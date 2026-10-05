import fs from "node:fs";
import assert from "node:assert/strict";
const auth=fs.readFileSync("auth-ui-clean.js","utf8");
const bootstrap=fs.readFileSync("bootstrap.js","utf8");
const startup=fs.readFileSync("legal-startup-gate.js","utf8");
const settings=fs.readFileSync("settings-lifecycle.js","utf8");
const policy=fs.readFileSync("legal-policy.js","utf8");
const client=fs.readFileSync("legal-acceptance-client.js","utf8");
const functions=fs.readFileSync("functions/index.mjs","utf8");
const allow=fs.readFileSync("build/www-files.txt","utf8");

assert.match(policy,/termsVersion:"2026-10-04-v1"/);
assert.match(policy,/privacyVersion:"2026-10-04-v1"/);
assert.match(policy,/No liability/);
assert.match(policy,/To the fullest extent permitted by law/);
assert.match(policy,/You use FIDUNIO entirely at your own risk/);
assert.match(policy,/Apple and its subsidiaries are third-party beneficiaries/);
assert.match(policy,/laws of the Province of Ontario/);
assert.match(policy,/No warranty/);
assert.match(policy,/not an emergency service/i);

assert.match(bootstrap,/ensureStartupTermsAccepted/);
assert.ok(bootstrap.indexOf("ensureStartupTermsAccepted") < bootstrap.indexOf("startAccountGuard"),"Terms must precede account/auth startup");
assert.match(startup,/const DEVICE_KEY="fidunio:terms"/);
assert.match(startup,/I have read and agree/);
assert.match(startup,/startupTermsAccept/);
assert.match(startup,/startupTermsDecline/);
assert.match(startup,/FIDUNIO stays locked/);
assert.match(startup,/localStorage\.setItem/);
assert.doesNotMatch(startup,/getCloudLegalAcceptance/);

assert.match(auth,/acceptLegalPolicy\(\)\.catch/);
assert.doesNotMatch(auth,/ensureLegalAcceptance/);
assert.match(settings,/Legal & Support/);
assert.match(settings,/Privacy Policy/);
assert.match(settings,/Help & Contact Support/);

assert.match(client,/getCloudLegalAcceptance/);
assert.match(client,/acceptCloudLegalPolicy/);
assert.match(functions,/export const getLegalAcceptanceV1/);
assert.match(functions,/export const acceptLegalPolicyV1/);
assert.match(allow,/legal-policy\.js/);
assert.match(allow,/legal-startup-gate\.js/);
assert.match(allow,/legal-acceptance-client\.js/);

console.log("PASS: FIDUNIO first-launch Terms gate matches the app-family contract and server audit cannot block login");
