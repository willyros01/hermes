import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const pkg=JSON.parse(readFileSync("package.json","utf8"));
const cap=JSON.parse(readFileSync("capacitor.config.json","utf8"));
const adapter=readFileSync("notification-platform-adapter.js","utf8");
const settings=readFileSync("settings-lifecycle.js","utf8");

assert.equal(pkg.dependencies?.["@capacitor-firebase/messaging"],"8.5.2");
assert.deepEqual(cap.plugins?.FirebaseMessaging?.presentationOptions,["alert","badge","sound"]);
assert.equal(cap.ios?.handleApplicationNotifications,true);

assert.match(adapter,/FirebaseMessaging/);
assert.match(adapter,/requestPermissions\(\)/);
assert.match(adapter,/getToken\(\)/);
assert.match(adapter,/deleteToken\(\)/);
assert.match(adapter,/notificationActionPerformed/);
assert.match(adapter,/normalizeNotificationRoute/);
assert.match(adapter,/registrationKind:"native-fcm"/);
const adapterCode=adapter.replace(/\/\*[\s\S]*?\*\//g,"").replace(/\/\/.*$/gm,"");\nassert.doesNotMatch(adapterCode,/navigator\.serviceWorker|serviceWorker\.register/);

assert.match(settings,/getNativeMessagingToken/);
assert.match(settings,/\(\)=>"ios-native"/);

console.log("PASS: native iOS notification plugin, foreground presentation, token registration and tap routing are wired");
