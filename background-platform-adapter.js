/*
 * FIDUNIO background platform adapter.
 *
 * Shared callers consume one background-message/registration contract.
 * Web uses the real Service Worker. Native iOS is intentionally a no-op until
 * the APNs/FCM adapter supplies the same contract; it never fakes navigator.serviceWorker.
 */
import {isNativeMobileRuntime,detectFidunioPlatform} from "./platform-runtime.js";
import {subscribeNativeNotificationRoutes} from "./notification-platform-adapter.js";

let registrationPromise=null;

export function getBackgroundPlatformKind(platformOptions){
  return isNativeMobileRuntime(platformOptions)?detectFidunioPlatform(platformOptions):"web-service-worker";
}

export async function ensurePlatformBackgroundRegistration({platformOptions}={}){
  if(isNativeMobileRuntime(platformOptions))return null;
  if(!("serviceWorker" in navigator))throw new Error("Service workers are not supported on this device/browser.");
  const registration=await navigator.serviceWorker.register("./service-worker.js",{scope:"./",type:"module"});
  await registration.update().catch(()=>{});
  return registration;
}

export function getPlatformBackgroundRegistration(options){
  if(!registrationPromise){
    registrationPromise=ensurePlatformBackgroundRegistration(options).catch(error=>{
      // Failed web registration must not poison later notification enable/retry.
      registrationPromise=null;
      throw error;
    });
  }
  return registrationPromise;
}

export function startPlatformBackground(options){
  if(isNativeMobileRuntime(options?.platformOptions))return;
  getPlatformBackgroundRegistration(options).catch(err=>console.warn("FIDUNIO service worker registration failed",err));
}

export function subscribePlatformBackgroundMessages(handler,{platformOptions}={}){
  if(typeof handler!=="function")throw new Error("Background message handler is required.");
  if(isNativeMobileRuntime(platformOptions))return subscribeNativeNotificationRoutes(handler);
  if(!("serviceWorker" in navigator))return()=>{};
  const listener=event=>handler(event.data,event);
  navigator.serviceWorker.addEventListener("message",listener);
  return()=>navigator.serviceWorker.removeEventListener("message",listener);
}

export const BACKGROUND_PLATFORM_ADAPTER_V1=Object.freeze({
  sharedContract:"registration-and-background-message",
  webOwner:"service-worker",
  iosOwner:"notification-platform-adapter",
  androidOwner:"notification-platform-adapter",
  fakeServiceWorker:false,
});
