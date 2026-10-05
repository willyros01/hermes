import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const build=readFileSync("build/ios-testflight.sh","utf8");
const apply=readFileSync("build/apply-ios-native-services.mjs","utf8");
const plist=readFileSync("build/ios/GoogleService-Info.plist","utf8");

assert.match(build,/Print :Entitlements:aps-environment/);
assert.match(build,/signed-entitlements\.plist/);
assert.match(build,/Print :aps-environment/);
assert.match(build,/grep -qx production/);

assert.match(apply,/<key>aps-environment<\/key>[\s\S]*?<string>production<\/string>/);
assert.match(apply,/com\.apple\.Push/);
assert.match(apply,/com\.apple\.developer\.associated-domains/);
assert.match(apply,/applinks:www\.cuberoot-systems\.com/);
assert.match(apply,/didRegisterForRemoteNotificationsWithDeviceToken/);
assert.match(apply,/capacitorDidRegisterForRemoteNotifications/);

assert.match(plist,/<key>BUNDLE_ID<\/key>\s*<string>io\.github\.willyros01\.fidunio<\/string>/);
assert.match(plist,/<key>PROJECT_ID<\/key>\s*<string>fidunio-fef13<\/string>/);
assert.match(plist,/<key>GOOGLE_APP_ID<\/key>\s*<string>1:130339622893:ios:929f4e431c91ef7ed0e1e4<\/string>/);
assert.match(plist,/<key>GCM_SENDER_ID<\/key>\s*<string>130339622893<\/string>/);
assert.match(plist,/<key>STORAGE_BUCKET<\/key>\s*<string>fidunio-fef13\.firebasestorage\.app<\/string>/);

console.log("PASS: TestFlight archive and Firebase config require production APNs capability");
