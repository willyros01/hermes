/*
 * FIDUNIO bounded platform-runtime authority.
 *
 * This module answers only which distribution is hosting the shared JavaScript.
 * It owns no Firebase, notification, security, storage, or UI state.
 * Feature owners use this one decision point to select web versus native adapters.
 */
export const FIDUNIO_PLATFORM=Object.freeze({WEB:"web",IOS_NATIVE:"ios-native",ANDROID_NATIVE:"android-native"});
export const FIDUNIO_PUBLIC_WEB_BASE="https://willyros01.github.io/hermes/";
export const FIDUNIO_INVITATION_WEB_LINK_BASE="https://www.cuberoot-systems.com/fidunio/join/";

export function detectFidunioPlatform({
  capacitor=globalThis.Capacitor,
  protocol=globalThis.location?.protocol||"",
}={}){
  try{
    if(capacitor?.isNativePlatform?.()===true&&capacitor?.getPlatform?.()==="ios")return FIDUNIO_PLATFORM.IOS_NATIVE;
    if(capacitor?.isNativePlatform?.()===true&&capacitor?.getPlatform?.()==="android")return FIDUNIO_PLATFORM.ANDROID_NATIVE;
    if(capacitor?.getPlatform?.()==="ios"&&String(protocol).toLowerCase()==="capacitor:")return FIDUNIO_PLATFORM.IOS_NATIVE;
  }catch{}
  if(String(protocol).toLowerCase()==="capacitor:")return FIDUNIO_PLATFORM.IOS_NATIVE;
  return FIDUNIO_PLATFORM.WEB;
}

export function isNativeIOSRuntime(options){return detectFidunioPlatform(options)===FIDUNIO_PLATFORM.IOS_NATIVE;}
export function isNativeAndroidRuntime(options){return detectFidunioPlatform(options)===FIDUNIO_PLATFORM.ANDROID_NATIVE;}
export function isNativeMobileRuntime(options){return isNativeIOSRuntime(options)||isNativeAndroidRuntime(options);}
export function shouldUseWebServiceWorker(options){return !isNativeMobileRuntime(options);}
export function shouldUseWebPush(options){return !isNativeMobileRuntime(options);}
export function shouldUseWebAppCheck(options){return !isNativeMobileRuntime(options);}
export function fidunioPublicUrl(relative="./",{currentHref=globalThis.location?.href||FIDUNIO_PUBLIC_WEB_BASE,...platformOptions}={}){
  const base=isNativeMobileRuntime(platformOptions)?FIDUNIO_PUBLIC_WEB_BASE:currentHref;
  return new URL(relative,base);
}

export const PLATFORM_RUNTIME_AUTHORITY_V1=Object.freeze({
  nativeShell:"capacitor-ios-or-android",
  webServiceWorkerOwner:"web-only",
  webPushOwner:"web-only",
  webAppCheckProvider:"web-only",
  nativeNotificationOwner:"future-apns-fcm-adapter",
  nativeAppCheckProvider:"future-app-attest-devicecheck-adapter",
});
