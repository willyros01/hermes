import assert from "node:assert/strict";
import fs from "node:fs";
import {
  invitationTokenFromUniversalUrl,
  FIDUNIO_INVITATION_UNIVERSAL_HOST,
  FIDUNIO_INVITATION_UNIVERSAL_PATH,
  INVITATION_PLATFORM_LINK_ADAPTER_V1,
} from "../invitation-platform-adapter.js";

const token="abcDEF_123-xyz987654321";
assert.equal(FIDUNIO_INVITATION_UNIVERSAL_HOST,"www.cuberoot-systems.com");
assert.equal(FIDUNIO_INVITATION_UNIVERSAL_PATH,"/fidunio/join/");
assert.equal(invitationTokenFromUniversalUrl(`https://www.cuberoot-systems.com/fidunio/join/?invite=${token}`),token);
assert.equal(invitationTokenFromUniversalUrl(`https://www.cuberoot-systems.com/fidunio/join?invite=${token}`),token);
assert.equal(invitationTokenFromUniversalUrl(`http://www.cuberoot-systems.com/fidunio/join/?invite=${token}`),"");
assert.equal(invitationTokenFromUniversalUrl(`https://evil.example/fidunio/join/?invite=${token}`),"");
assert.equal(invitationTokenFromUniversalUrl(`https://www.cuberoot-systems.com/scorecard/join/?invite=${token}`),"");
assert.equal(INVITATION_PLATFORM_LINK_ADAPTER_V1.validatesInvitation,false);
assert.equal(INVITATION_PLATFORM_LINK_ADAPTER_V1.redeemsInvitation,false);

const firebase=fs.readFileSync("firebase.js","utf8");
const auth=fs.readFileSync("auth-ui-clean.js","utf8");
const native=fs.readFileSync("build/apply-ios-native-services.mjs","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));

assert.match(firebase,/FIDUNIO_INVITATION_WEB_LINK_BASE/);
assert.match(firebase,/new URL\(FIDUNIO_INVITATION_WEB_LINK_BASE\)/);
assert.match(auth,/readInitialNativeInvitationToken/);
assert.match(auth,/subscribeNativeInvitationLinks/);
assert.match(auth,/await initializeInvitationLinkRouting\(\)/);
assert.match(native,/applinks:www\.cuberoot-systems\.com/);
assert.equal(pkg.dependencies["@capacitor/app"],"8.1.1");

console.log("PASS: one FIDUNIO invitation URL routes through native Universal Links or web fallback without duplicating invitation authority");
