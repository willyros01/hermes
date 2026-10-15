import fs from 'node:fs';
import assert from 'node:assert/strict';
import {FIDUNIO_PLATFORM,detectFidunioPlatform,isNativeMobileRuntime,isNativeAndroidRuntime,shouldUseWebServiceWorker,shouldUseWebPush,shouldUseWebAppCheck,fidunioPublicUrl} from '../platform-runtime.js';
import {getNotificationPlatformCapabilities} from '../notification-platform-adapter.js';
import {getBackgroundPlatformKind,ensurePlatformBackgroundRegistration} from '../background-platform-adapter.js';
import {getPlatformFirebaseSdkVersion} from '../firebase-platform-adapter.js';
import {ANDROID_SW_RETIRE_SOURCE,retireAndroidServiceWorker} from './retire-android-sw.mjs';
import os from 'node:os';
import path from 'node:path';
const android={isNativePlatform:()=>true,getPlatform:()=> 'android'};
const ios={isNativePlatform:()=>true,getPlatform:()=> 'ios'};
const opts={capacitor:android,protocol:'https:'};
assert.equal(detectFidunioPlatform(opts),FIDUNIO_PLATFORM.ANDROID_NATIVE);
assert.equal(isNativeAndroidRuntime(opts),true);
assert.equal(isNativeMobileRuntime(opts),true);
assert.equal(shouldUseWebServiceWorker(opts),false);
assert.equal(shouldUseWebPush(opts),false);
assert.equal(shouldUseWebAppCheck(opts),false);
assert.equal(getNotificationPlatformCapabilities(opts).nativePlatform,'android-native');
assert.equal(getNotificationPlatformCapabilities(opts).webPush,false);
assert.equal(getBackgroundPlatformKind(opts),'android-native');
assert.equal(await ensurePlatformBackgroundRegistration({platformOptions:opts}),null);
assert.equal(getPlatformFirebaseSdkVersion(opts),'12.19.0');
assert.equal(detectFidunioPlatform({capacitor:ios,protocol:'capacitor:'}),FIDUNIO_PLATFORM.IOS_NATIVE);
assert.equal(detectFidunioPlatform({capacitor:null,protocol:'https:'}),FIDUNIO_PLATFORM.WEB);
assert.equal(fidunioPublicUrl('quick-start.html',{...opts,currentHref:'https://localhost/app/'}).href,'https://willyros01.github.io/hermes/quick-start.html');
for(const file of ['build/android-native.sh','build/android-sign.sh','build/android-build.sh','build/AndroidIcons.java'])assert.ok(fs.existsSync(file),'Missing Android build asset '+file);
assert.match(fs.readFileSync('firebase.js','utf8'),/android-native/);
assert.match(fs.readFileSync('notification-platform-adapter.js','utf8'),/FirebaseMessaging/);
assert.match(fs.readFileSync('background-platform-adapter.js','utf8'),/isNativeMobileRuntime/);
assert.match(fs.readFileSync('settings-lifecycle.js','utf8'),/nativePlatform/);
assert.match(fs.readFileSync('invitation-platform-adapter.js','utf8'),/isNativeMobileRuntime/);
console.log('PASS: FIDUNIO native Android runtime, notification, auth, invitation and source guards');

const boot={capacitor:null,protocol:'https:',hostname:'localhost',userAgent:'Mozilla/5.0 (Linux; Android 11; Fire HD 8) AppleWebKit/537.36'};
assert.equal(detectFidunioPlatform(boot),FIDUNIO_PLATFORM.ANDROID_NATIVE);
assert.equal(getNotificationPlatformCapabilities(boot).nativeRegistration,true);
assert.equal(shouldUseWebServiceWorker(boot),false);
assert.equal(shouldUseWebPush(boot),false);
assert.equal(shouldUseWebAppCheck(boot),false);
assert.equal(detectFidunioPlatform({...boot,hostname:'willyros01.github.io'}),FIDUNIO_PLATFORM.WEB);
assert.equal(detectFidunioPlatform({...boot,userAgent:'Mozilla/5.0 (Macintosh; Safari)'}),FIDUNIO_PLATFORM.WEB);
assert.equal(detectFidunioPlatform({...boot,protocol:'http:'}),FIDUNIO_PLATFORM.WEB);
assert.equal(detectFidunioPlatform({...boot,protocol:'capacitor:',userAgent:'Mozilla/5.0 (iPad)'}),FIDUNIO_PLATFORM.IOS_NATIVE);
// Retire ONLY old app shell caches, and NEVER localStorage / IndexedDB.
assert.match(ANDROID_SW_RETIRE_SOURCE,/registration\.unregister\(\)/);
assert.match(ANDROID_SW_RETIRE_SOURCE,/startsWith\("fidunio-shell-"\)/);
assert.ok(!ANDROID_SW_RETIRE_SOURCE.includes('localStorage'));
assert.ok(!ANDROID_SW_RETIRE_SOURCE.includes('indexedDB'));
assert.ok(!ANDROID_SW_RETIRE_SOURCE.includes('fetch",'));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fidunio-sw-test-'));
try{
  const asset=path.join(temp,'service-worker.js');
  fs.writeFileSync(asset,'const CACHE=`fidunio-shell-legacy`;');
  retireAndroidServiceWorker(asset);
  assert.equal(fs.readFileSync(asset,'utf8'),ANDROID_SW_RETIRE_SOURCE);
  retireAndroidServiceWorker(asset); // deterministic and idempotent
  assert.equal(fs.readFileSync(asset,'utf8'),ANDROID_SW_RETIRE_SOURCE);
}finally{fs.rmSync(temp,{recursive:true,force:true});}
assert.match(fs.readFileSync('build/android-native.sh','utf8'),/node build\/retire-android-sw\.mjs/);
console.log('PASS: Fire native origin detection, Web/iOS isolation, SW retirement and retained user data');

assert.match(fs.readFileSync('firebase.js','utf8'),/await user\.getIdToken\(true\)/);
console.log('PASS: Android native lease refreshes expired Firebase ID token before claim');
