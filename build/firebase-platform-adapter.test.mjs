import assert from "node:assert/strict";
import {
  FIDUNIO_FIREBASE_SDK_VERSION,
  getPlatformFirebaseSdkVersion,
  createPlatformFirebaseAuth,
  createPlatformFirebaseAppCheck,
} from "../firebase-platform-adapter.js";

const web={capacitor:null,protocol:"https:"};
const nativeCalls=[];
const nativePlugin={
  initialize:async options=>{nativeCalls.push({kind:"initialize",options});},
  getToken:async options=>{
    nativeCalls.push({kind:"getToken",options});
    return{token:"native-app-check-token",expireTimeMillis:Date.now()+60*60*1000};
  },
};
const ios={capacitor:{isNativePlatform:()=>true,getPlatform:()=>"ios",Plugins:{FirebaseAppCheck:nativePlugin}},protocol:"capacitor:"};

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
class EnterpriseProvider{constructor(key){this.key=key;}}
class CustomProvider{constructor(options){this.options=options;}}
const appCheckSdk={
  ReCaptchaEnterpriseProvider:EnterpriseProvider,
  CustomProvider,
  initializeAppCheck:(a,options)=>{appCheckCalls.push({a,options});return a===app?"app-check":"unexpected";},
};

assert.equal(
  await createPlatformFirebaseAppCheck({app,appCheckSdk,siteKey:"public-key",platformOptions:web}),
  "app-check",
);
assert.equal(appCheckCalls.length,1);
assert.equal(appCheckCalls[0].options.provider.key,"public-key");
assert.equal(appCheckCalls[0].options.isTokenAutoRefreshEnabled,true);

assert.equal(
  await createPlatformFirebaseAppCheck({app,appCheckSdk,siteKey:"public-key",platformOptions:ios}),
  "app-check",
);
assert.equal(nativeCalls.length,2);
assert.equal(nativeCalls[0].kind,"initialize");
assert.equal(nativeCalls[0].options.isTokenAutoRefreshEnabled,true);
assert.equal(nativeCalls[1].kind,"getToken");
assert.equal(nativeCalls[1].options.forceRefresh,false);
assert.equal(appCheckCalls.length,2);
assert.ok(appCheckCalls[1].options.provider instanceof CustomProvider);
const bridged=await appCheckCalls[1].options.provider.options.getToken();
assert.equal(bridged.token,"native-app-check-token");
assert.ok(bridged.expireTimeMillis>Date.now());
assert.equal(nativeCalls.length,2);

assert.equal(
  await createPlatformFirebaseAppCheck({
    app,
    appCheckSdk,
    siteKey:"public-key",
    platformOptions:{capacitor:{isNativePlatform:()=>true,getPlatform:()=>"ios",Plugins:{}},protocol:"capacitor:"},
  }),
  null,
);
assert.equal(
  await createPlatformFirebaseAppCheck({
    app,
    appCheckSdk,
    siteKey:"public-key",
    platformOptions:{capacitor:{isNativePlatform:()=>true,getPlatform:()=>"ios",Plugins:{FirebaseAppCheck:{initialize:async()=>{throw new Error("native unavailable");},getToken:async()=>({token:"unused"})}}},protocol:"capacitor:"},
  }),
  null,
);

assert.equal(
  await createPlatformFirebaseAppCheck({
    app,
    appCheckSdk,
    siteKey:"public-key",
    platformOptions:{capacitor:{isNativePlatform:()=>true,getPlatform:()=>"ios",Plugins:{FirebaseAppCheck:{initialize:async()=>{},getToken:async()=>{throw new Error("token unavailable");}}}},protocol:"capacitor:"},
  }),
  null,
);

console.log("PASS: Firebase platform adapter owns web reCAPTCHA Enterprise, native App Attest/DeviceCheck bridging, and standby fail-open bootstrap");
