/*
 * FIDUNIO notification platform capability adapter.
 *
 * The shared notification registration owner remains notification-registration.js.
 * Web uses browser Firebase Messaging + Service Worker. Native iOS uses the
 * Capacitor Firebase Messaging plugin and never fakes navigator.serviceWorker.
 */
import {isNativeIOSRuntime} from "./platform-runtime.js";
import {FIDUNIO_NOTIFICATION_ROUTE_MESSAGE,normalizeNotificationRoute} from "./notification-routing.js";

function nativeMessagingPlugin(){
  if(!isNativeIOSRuntime())return null;
  return globalThis.Capacitor?.Plugins?.FirebaseMessaging||null;
}

function permissionValue(value){
  const text=String(value||"").toLowerCase();
  if(text==="granted"||text==="denied")return text;
  return "default";
}

export function getNotificationPlatformCapabilities(platformOptions){
  if(isNativeIOSRuntime(platformOptions)){
    return Object.freeze({
      registrationKind:"native-fcm",
      webPush:false,
      nativeRegistration:true,
    });
  }
  return Object.freeze({
    registrationKind:"web-push",
    webPush:true,
    nativeRegistration:false,
  });
}

export async function getNativeNotificationCapability(){
  const plugin=nativeMessagingPlugin();
  if(!plugin?.isSupported||!plugin?.checkPermissions)return{supported:false,permission:"unsupported"};
  try{
    const supported=await plugin.isSupported();
    if(supported?.isSupported!==true)return{supported:false,permission:"unsupported"};
    const permission=await plugin.checkPermissions();
    return{supported:true,permission:permissionValue(permission?.receive)};
  }catch{
    return{supported:false,permission:"unsupported"};
  }
}

export async function requestNativeNotificationPermission(){
  const plugin=nativeMessagingPlugin();
  if(!plugin?.requestPermissions)throw new Error("Native notification adapter is unavailable.");
  const result=await plugin.requestPermissions();
  return permissionValue(result?.receive);
}

export async function getNativeMessagingToken(){
  const plugin=nativeMessagingPlugin();
  if(!plugin?.getToken)throw new Error("Native Firebase Messaging is unavailable.");
  const result=await plugin.getToken();
  return String(result?.token||"");
}

export async function deleteNativeMessagingToken(){
  const plugin=nativeMessagingPlugin();
  if(!plugin?.deleteToken)return false;
  await plugin.deleteToken();
  return true;
}

function routeFromNativeEvent(event){
  const data=event?.notification?.data&&typeof event.notification.data==="object"
    ?event.notification.data
    :event?.data&&typeof event.data==="object"?event.data:null;
  return normalizeNotificationRoute(data);
}

export function subscribeNativeNotificationRoutes(handler){
  if(typeof handler!=="function")throw new Error("Native notification route handler is required.");
  const plugin=nativeMessagingPlugin();
  if(!plugin?.addListener)return()=>{};
  let active=true,handle=null;
  Promise.resolve(plugin.addListener("notificationActionPerformed",event=>{
    if(!active)return;
    const route=routeFromNativeEvent(event);
    if(route)handler({type:FIDUNIO_NOTIFICATION_ROUTE_MESSAGE,route},event);
  })).then(value=>{handle=value;if(!active)handle?.remove?.();}).catch(error=>console.warn("FIDUNIO native notification listener failed",error));
  return()=>{active=false;try{handle?.remove?.();}catch{}};
}

export const NOTIFICATION_PLATFORM_ADAPTER_V1=Object.freeze({
  sharedOwner:"notification-registration",
  webTransport:"web-push-service-worker",
  iosTransport:"apns-fcm-capacitor",
  fakeServiceWorker:false,
});
