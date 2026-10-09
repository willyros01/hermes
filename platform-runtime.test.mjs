import assert from "node:assert/strict";
import fs from "node:fs";
import {FIDUNIO_PLATFORM,detectFidunioPlatform,isNativeIOSRuntime,shouldUseWebServiceWorker,shouldUseWebPush,shouldUseWebAppCheck,fidunioPublicUrl} from "./platform-runtime.js";
const webCap={isNativePlatform:()=>false,getPlatform:()=>"web"};
const iosCap={isNativePlatform:()=>true,getPlatform:()=>"ios"};
assert.equal(detectFidunioPlatform({capacitor:webCap,protocol:"https:"}),FIDUNIO_PLATFORM.WEB);
assert.equal(detectFidunioPlatform({capacitor:iosCap,protocol:"capacitor:"}),FIDUNIO_PLATFORM.IOS_NATIVE);
assert.equal(detectFidunioPlatform({capacitor:undefined,protocol:"capacitor:"}),FIDUNIO_PLATFORM.IOS_NATIVE,"protocol fallback protects early Capacitor startup");
assert.equal(isNativeIOSRuntime({capacitor:iosCap,protocol:"capacitor:"}),true);
assert.equal(shouldUseWebServiceWorker({capacitor:iosCap,protocol:"capacitor:"}),false);
assert.equal(shouldUseWebPush({capacitor:iosCap,protocol:"capacitor:"}),false);
assert.equal(shouldUseWebAppCheck({capacitor:iosCap,protocol:"capacitor:"}),false);
assert.equal(shouldUseWebServiceWorker({capacitor:webCap,protocol:"https:"}),true);
assert.equal(shouldUseWebPush({capacitor:webCap,protocol:"https:"}),true);
assert.equal(shouldUseWebAppCheck({capacitor:webCap,protocol:"https:"}),true);
assert.equal(fidunioPublicUrl("./quick-start.html",{capacitor:iosCap,protocol:"capacitor:",currentHref:"capacitor://localhost/settings"}).href,"https://willyros01.github.io/hermes/quick-start.html");
assert.equal(fidunioPublicUrl("./quick-start.html",{capacitor:webCap,protocol:"https:",currentHref:"https://example.test/hermes/settings"}).href,"https://example.test/hermes/quick-start.html");

const bootstrap=fs.readFileSync("bootstrap.js","utf8");
const app=fs.readFileSync("app.js","utf8");
const firebase=fs.readFileSync("firebase.js","utf8");
const firebaseAdapter=fs.readFileSync("firebase-platform-adapter.js","utf8");
const backgroundAdapter=fs.readFileSync("background-platform-adapter.js","utf8");
const settings=fs.readFileSync("settings-lifecycle.js","utf8");
const notificationPlatformAdapter=fs.readFileSync("notification-platform-adapter.js","utf8");
const install=fs.readFileSync("install-guidance.js","utf8");
const localSecurity=fs.readFileSync("local-security.js","utf8");
const payloadPath="build/www-files.txt";
const payload=fs.existsSync(payloadPath)?fs.readFileSync(payloadPath,"utf8"):null;

assert.match(bootstrap,/from "\.\/background-platform-adapter\.js"/);
assert.match(bootstrap,/startPlatformBackground\(\)/);
assert.doesNotMatch(bootstrap,/shouldUseWebServiceWorker|navigator\.serviceWorker|isNativeIOSRuntime/);
assert.match(app,/subscribePlatformBackgroundMessages/);
assert.doesNotMatch(app,/shouldUseWebServiceWorker|navigator\.serviceWorker|serviceWorker\.register/);
assert.match(backgroundAdapter,/navigator\.serviceWorker\.register/);
assert.match(backgroundAdapter,/isNativeIOSRuntime/);

assert.match(firebase,/from "\.\/firebase-platform-adapter\.js"/);
assert.match(firebase,/createPlatformFirebaseAuth\(\{app,authSdk\}\)/);
assert.match(firebase,/createPlatformFirebaseAppCheck\(/);
assert.doesNotMatch(firebase,/isNativeIOSRuntime|shouldUseWebAppCheck|initializeAuth\(|indexedDBLocalPersistence|browserSessionPersistence/);
assert.match(firebaseAdapter,/isNativeIOSRuntime/);
assert.match(firebaseAdapter,/initializeAuth\(app,\{persistence:authSdk\.browserLocalPersistence\}\)/);

assert.match(settings,/getNotificationPlatformCapabilities\(\)/);
assert.doesNotMatch(settings,/isNativeIOSRuntime/);
assert.match(notificationPlatformAdapter,/isNativeIOSRuntime/);
assert.match(notificationPlatformAdapter,/registrationKind:"native-fcm"/);
assert.match(notificationPlatformAdapter,/registrationKind:"web-push"/);
assert.match(install,/nativeApp=isNativeIOSRuntime\(\)/);
assert.match(localSecurity,/platformAuthenticatorAvailable\(\)\{if\(isNativeBiometricRuntime\(\)\)return \(await nativeBiometricAvailability\(\)\)\.available/);assert.match(localSecurity,/import \{isNativeBiometricRuntime\} from "\.\/biometric-platform-adapter\.js";/);assert.doesNotMatch(localSecurity,/isNativeIOSRuntime|platform-runtime\.js/,"local-security detects native biometric runtime only through the biometric adapter");assert.match(localSecurity,/authenticateNativeBiometric/);
assert.match(app,/security\.hasBiometric\?\x27<button class="primary" id="deviceUnlockBtn">Unlock with Face ID or Biometric<\/button>\x27/);
if(payload){
  assert.match(payload,/^platform-runtime\.js$/m);
  assert.match(payload,/^background-platform-adapter\.js$/m);
  assert.match(payload,/^firebase-platform-adapter\.js$/m);
  assert.match(payload,/^notification-platform-adapter\.js$/m);
}
assert.match(firebase,/FIDUNIO_INVITATION_WEB_LINK_BASE/);
assert.match(firebase,/new URL\(FIDUNIO_INVITATION_WEB_LINK_BASE\)/);
assert.match(settings,/fidunioPublicUrl\("\.\/quick-start\.html"\)/);
assert.match(settings,/fidunioPublicUrl\("\.\/account-recovery\.html"\)/);
console.log("PASS: bounded web/Capacitor iOS runtime selection and platform-adapter integration guards");
