import fs from "node:fs";
import assert from "node:assert/strict";

const settings=fs.readFileSync("settings-lifecycle.js","utf8");

assert.match(settings,/function prettyAbuseCategory\(category\)/);
assert.match(settings,/getCloudUserProfile/);
assert.match(settings,/participantProfiles=new Map\(\)/);
assert.match(settings,/displayName=uid=>participantProfiles\.get/);
assert.match(settings,/prettyAbuseCategory\(r\.category\)/);
assert.doesNotMatch(settings,/\$\{esc\(r\.reporterUid\|\|""\)\}/);
assert.doesNotMatch(settings,/→ \$\{esc\(r\.targetUid\)\}/);

console.log("PASS: abuse moderation renders readable participant names instead of raw Firebase UIDs");
