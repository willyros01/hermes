import assert from "node:assert/strict";
import {
  FIDUNIO_FIREBASE_SDK_VERSION,
  getPlatformFirebaseSdkVersion,
  createPlatformFirebaseAuth,
  createPlatformFirebaseAppCheck,
} from "../firebase-platform-adapter.js";

const web={capacitor:null,protocol:"https:"};
const ios={capacitor:{isNativePlatform:()=>true,getPlatform:()=>"ios"},protocol:"capacitor:"};
assert.equal(getPlatformFirebaseSdkVersion(web),FIDUNIO_FIREBASE_SDK_VERSION.WEB);
assert.equal(getPlatformFirebaseSdkVersion(ios),FIDUNIO_FIREBASE_SDK_VERSION.IOS_NATIVE);
assert.equal(FIDUNIO_FIREBASE_SDK_VERSION.WEB,"12.18.0");
assert.equal(FIDUNIO_FIREBASE_SDK_VERSION.IOS_NATIVE,"12.19.0");

for(const [name,platformOptions] of [["web",web],["ios",ios]]){
  const calls=[];const app={name};
  const authSdk={
    browserLocalPersistence:"local",
    indexedDBLocalPersistence:"idb",
    browserSessionPersistence:"session",
    getAuth:a=>{calls.push({kind:"getAuth",app:a});return "web-auth";},
    initializeAuth:(a,options)=>{calls.push({kind:"initializeAuth",app:a,options});return "ios-auth";},
  };
  const auth=createPlatformFirebaseAuth({app,authSdk,platformOptions});
  assert.equal(auth,name==="ios"?"ios-auth":"web-auth");
  assert.equal(calls.length,1);
  assert.equal(calls[0].app,app);
  if(name==="ios"){
    assert.equal(calls[0].kind,"initializeAuth");
    assert.equal(calls[0].options.persistence,"local");
    assert.equal("popupRedirectResolver" in calls[0].options,false);
    assert.notEqual(calls[0].options.persistence,"idb");
    assert.notEqual(calls[0].options.persistence,"session");
  }else assert.equal(calls[0].kind,"getAuth");
}

const app={};const appCheckCalls=[];
class Provider{constructor(key){this.key=key;}}
const appCheckSdk={
  ReCaptchaEnterpriseProvider:Provider,
  initializeAppCheck:(a,options)=>{appCheckCalls.push({a,options});return "web-app-check";},
};
assert.equal(createPlatformFirebaseAppCheck({app,appCheckSdk,siteKey:"public-key",platformOptions:ios}),null);
assert.equal(appCheckCalls.length,0);
assert.equal(createPlatformFirebaseAppCheck({app,appCheckSdk,siteKey:"public-key",platformOptions:web}),"web-app-check");
assert.equal(appCheckCalls.length,1);
assert.equal(appCheckCalls[0].options.provider.key,"public-key");

console.log("PASS: Firebase platform adapter owns web/iOS SDK, Auth persistence and App Check bootstrap differences");
