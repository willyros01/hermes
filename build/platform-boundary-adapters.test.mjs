import assert from "node:assert/strict";
import fs from "node:fs";
import {getBackgroundPlatformKind,ensurePlatformBackgroundRegistration,subscribePlatformBackgroundMessages} from "../background-platform-adapter.js";
import {createPlatformStartupWatchdog} from "../startup-platform-adapter.js";

const web={capacitor:null,protocol:"https:"};
const ios={capacitor:{isNativePlatform:()=>true,getPlatform:()=>"ios"},protocol:"capacitor:"};
assert.equal(getBackgroundPlatformKind(web),"web-service-worker");
assert.equal(getBackgroundPlatformKind(ios),"ios-native");
assert.equal(await ensurePlatformBackgroundRegistration({platformOptions:ios}),null);
assert.doesNotThrow(()=>subscribePlatformBackgroundMessages(()=>{},{platformOptions:ios})());
const inert=createPlatformStartupWatchdog({host:null,platformOptions:web});
assert.equal(typeof inert.fail,"function");assert.equal(typeof inert.clear,"function");

const bootstrap=fs.readFileSync("bootstrap.js","utf8");
const app=fs.readFileSync("app.js","utf8");
assert.match(bootstrap,/from "\.\/background-platform-adapter\.js"/);
assert.match(bootstrap,/from "\.\/startup-platform-adapter\.js"/);
assert.doesNotMatch(bootstrap,/isNativeIOSRuntime|shouldUseWebServiceWorker|navigator\.serviceWorker/);
assert.match(app,/subscribePlatformBackgroundMessages/);
assert.doesNotMatch(app,/shouldUseWebServiceWorker|navigator\.serviceWorker|serviceWorker\.register/);
console.log("PASS: startup and background platform policy is isolated behind bounded adapters");
