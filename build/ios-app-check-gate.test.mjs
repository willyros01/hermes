import fs from "node:fs/promises";
import assert from "node:assert/strict";

const native=await fs.readFile(new URL("./apply-ios-native-services.mjs",import.meta.url),"utf8");
const testflight=await fs.readFile(new URL("./ios-testflight.sh",import.meta.url),"utf8");
const cap=JSON.parse(await fs.readFile(new URL("../capacitor.config.json",import.meta.url),"utf8"));
const pkg=JSON.parse(await fs.readFile(new URL("../package.json",import.meta.url),"utf8"));

assert.equal(pkg.dependencies?.["@capacitor-firebase/app-check"],"8.5.2");
assert.equal(cap.experimental?.ios?.spm?.packageOptions?.["@capacitor-firebase/app-check"]?.symlink,true);
assert.match(native,/com\.apple\.developer\.devicecheck\.appattest-environment/);
assert.match(native,/<string>production<\/string>/);
assert.match(testflight,/Entitlements:com\.apple\.developer\.devicecheck\.appattest-environment/);
assert.match(testflight,/Print :com\.apple\.developer\.devicecheck\.appattest-environment/);
assert.match(testflight,/grep -qx production/);

console.log("PASS: native App Check dependency, App Attest entitlement, profile and signed-IPA gates are permanent");
