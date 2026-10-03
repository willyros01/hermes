/*
 * FIDUNIO bounded platform-runtime authority.
 *
 * This module answers only which distribution is hosting the shared JavaScript.
 * It owns no Firebase, notification, security, storage, or UI state.
 * Feature owners use this one decision point to select web versus native adapters.
 */
export const FIDUNIO_PLATFORM=Object.freeze({WEB:"web",IOS_NATIVE:"ios-native"});\nexport const FIDUNIO_PUBLIC_WEB_BASE="https://willyros01.github.io/hermes/";

export function detectFidunioPlatform({
  capacitor=globalThis.Capacitor,
  protocol=globalThis.location?.protocol||"",
}={}){
  try{
    if(capacitor?.isNativePlatform?.()===true&&capacitor?.getPlatform?.()==="ios")return FIDUNIO_PLATFORM.IOS_NATIVE;
    if(capacitor?.getPlatform?.()==="ios"&&String(protocol).toLowerCase()==="capacitor:")return FIDUNIO_PLATFORM.IOS_NATIVE;
  }catch{}
  if(String(protocol).toLowerCase()==="capacitor:")return FIDUNIO_PLATFORM.IOS_NATIVE;
  return FIDUNIO_PLATFORM.WEB;
}

export function isNativeIOSRuntime(options){return detectFidunioPlatform(options)===FIDUNIO_PLATFORM.IOS_NATIVE;}
export function shouldUseWebServiceWorker(options){return !isNativeIOSRuntime(options);}
export function shouldUseWebPush(options){return !isNativeIOSRuntime(options);}
export function shouldUseWebAppCheck(options){return !isNativeIOSRuntime(options);}
export function fidunioPublicUrl(relative="./",{currentHref=globalThis.location?.href||FIDUNIO_PUBLIC_WEB_BASE,...platformOptions}={}){
  const base=isNativeIOSRuntime(platformOptions)?FIDUNIO_PUBLIC_WEB_BASE:currentHref;
  return new URL(relative,base);
}

export const PLATFORM_RUNTIME_AUTHORITY_V1=Object.freeze({
  nativeShell:"capacitor-ios",
  webServiceWorkerOwner:"web-only",
  webPushOwner:"web-only",
  webAppCheckProvider:"web-only",
  nativeNotificationOwner:"future-apns-fcm-adapter",
  nativeAppCheckProvider:"future-app-attest-devicecheck-adapter",
});
