/*
 * FIDUNIO Firebase platform adapter.
 *
 * firebase.js remains the sole Firebase service owner. This adapter owns only
 * platform-specific Firebase bootstrap choices and must not own account,
 * recovery, E2EE, Firestore, messaging, or UI state.
 */
import {isNativeIOSRuntime} from "./platform-runtime.js";

export const FIDUNIO_FIREBASE_SDK_VERSION=Object.freeze({
  WEB:"12.18.0",
  IOS_NATIVE:"12.19.0",
});

export function getPlatformFirebaseSdkVersion(platformOptions){
  return isNativeIOSRuntime(platformOptions)
    ? FIDUNIO_FIREBASE_SDK_VERSION.IOS_NATIVE
    : FIDUNIO_FIREBASE_SDK_VERSION.WEB;
}

export function createPlatformFirebaseAuth({app,authSdk,platformOptions}={}){
  if(!app||!authSdk)throw new Error("Firebase Auth platform adapter is not initialized.");
  if(isNativeIOSRuntime(platformOptions)){
    // Native Capacitor does not use browser redirect/service-worker auth helpers.
    // Keep Firebase Auth persistence separate from FIDUNIO's own IndexedDB owner.
    return authSdk.initializeAuth(app,{persistence:authSdk.browserLocalPersistence});
  }
  return authSdk.getAuth(app);
}

function nativeAppCheckPlugin(platformOptions){
  return platformOptions?.capacitor?.Plugins?.FirebaseAppCheck
    || globalThis.Capacitor?.Plugins?.FirebaseAppCheck
    || null;
}

export async function createPlatformFirebaseAppCheck({app,appCheckSdk,siteKey,platformOptions}={}){
  if(!app||!appCheckSdk)throw new Error("Firebase App Check platform adapter is not initialized.");
  if(isNativeIOSRuntime(platformOptions)){
    const plugin=nativeAppCheckPlugin(platformOptions);
    if(!plugin?.initialize||!plugin?.getToken){
      console.warn("FIDUNIO App Check standby: native adapter unavailable; continuing because backend enforcement is OFF.");
      return null;
    }
    try{await plugin.initialize({isTokenAutoRefreshEnabled:true});}
    catch(error){
      console.warn("FIDUNIO App Check standby: native initialization failed; continuing because backend enforcement is OFF.",error);
      return null;
    }
    const provider=new appCheckSdk.CustomProvider({
      getToken:async()=>{
        const result=await plugin.getToken({forceRefresh:false});
        const token=String(result?.token||"").trim();
        if(!token)throw new Error("Native Firebase App Check returned no token.");
        const nativeExpiry=Number(result?.expireTimeMillis);
        return{
          token,
          expireTimeMillis:Number.isFinite(nativeExpiry)&&nativeExpiry>Date.now()
            ?nativeExpiry
            :Date.now()+30*60*1000,
        };
      },
    });
    return appCheckSdk.initializeAppCheck(app,{
      provider,
      isTokenAutoRefreshEnabled:true,
    });
  }
  if(!siteKey)throw new Error("Firebase App Check web site key is missing.");
  return appCheckSdk.initializeAppCheck(app,{
    provider:new appCheckSdk.ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled:true,
  });
}

export const FIREBASE_PLATFORM_ADAPTER_V1=Object.freeze({
  owner:"firebase-platform-bootstrap-only",
  webAuth:"getAuth",
  iosAuth:"initializeAuth-browserLocalPersistence",
  webAppCheck:"recaptcha-enterprise",
  iosAppCheck:"app-attest-devicecheck-native-bridge-standby-fail-open",
});
