import fs from "node:fs/promises";
import assert from "node:assert/strict";

const native=await fs.readFile(new URL("./apply-ios-native-services.mjs",import.meta.url),"utf8");
const testflight=await fs.readFile(new URL("./ios-testflight.sh",import.meta.url),"utf8");
const adapter=await fs.readFile(new URL("../firebase-platform-adapter.js",import.meta.url),"utf8");
const cap=JSON.parse(await fs.readFile(new URL("../capacitor.config.json",import.meta.url),"utf8"));
const pkg=JSON.parse(await fs.readFile(new URL("../package.json",import.meta.url),"utf8"));

assert.equal(pkg.dependencies?.["@capacitor-firebase/app-check"],"8.5.2");
assert.equal(cap.experimental?.ios?.spm?.packageOptions?.["@capacitor-firebase/app-check"]?.symlink,true);
assert.match(adapter,/standby-fail-open/);
assert.match(adapter,/continuing because backend enforcement is OFF/);
assert.doesNotMatch(native,/com\.apple\.developer\.devicecheck\.appattest-environment/);
assert.doesNotMatch(testflight,/Entitlements:com\.apple\.developer\.devicecheck\.appattest-environment/);
assert.doesNotMatch(testflight,/Print :com\.apple\.developer\.devicecheck\.appattest-environment/);
assert.match(native,/aps-environment/);
assert.match(testflight,/Print :Entitlements:aps-environment/);

console.log("PASS: native App Check dependency is present in approved standby/fail-open mode; production App Attest entitlement is not a release blocker until Apple capability is enabled");
