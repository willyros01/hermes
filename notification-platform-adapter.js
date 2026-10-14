/*
 * FIDUNIO notification platform capability adapter.
 *
 * The shared notification registration owner remains notification-registration.js.
 * Web uses browser Firebase Messaging + Service Worker. Native iOS uses the
 * Capacitor Firebase Messaging plugin and never fakes navigator.serviceWorker.
 */
import {isNativeMobileRuntime,isNativeAndroidRuntime} from "./platform-runtime.js";
import {FIDUNIO_NOTIFICATION_ROUTE_MESSAGE,normalizeNotificationRoute} from "./notification-routing.js";

function nativeMessagingPlugin(){
  if(!isNativeMobileRuntime())return null;
  return globalThis.Capacitor?.Plugins?.FirebaseMessaging||null;
}

// ADM is a separate transport. Do not replace or hijack Google's FCM plugin.
let selectedNativeProvider="fcm";
let pendingAdmToken="";
function admPlugin(){
  if(!isNativeAndroidRuntime())return null;
  return globalThis.Capacitor?.Plugins?.FidunioAdm||null;
}
async function activeAdm(){
  const plugin=admPlugin();
  if(!plugin?.available)return null;
  try{
    const status=await plugin.available();
    if(status?.supported===true&&status?.provider==="adm"){
      selectedNativeProvider="adm";
      return plugin;
    }
  }catch(error){console.warn("FIDUNIO ADM capability check failed",error);}
  return null;
}
export function getNativeNotificationLeasePlatform(){
  return isNativeAndroidRuntime()
    ?selectedNativeProvider==="adm"?"android-adm":"android-native"
    :"ios-native";
}

function permissionValue(value){
  const text=String(value||"").toLowerCase();
  if(text==="granted"||text==="denied")return text;
  return "default";
}

export function getNotificationPlatformCapabilities(platformOptions){
  if(isNativeMobileRuntime(platformOptions)){
    return Object.freeze({
      registrationKind:"native-fcm",
      webPush:false,
      nativeRegistration:true,
      nativePlatform:isNativeAndroidRuntime(platformOptions)?"android-native":"ios-native",
    });
  }
  return Object.freeze({
    registrationKind:"web-push",
    webPush:true,
    nativeRegistration:false,
    nativePlatform:null,
  });
}

export async function getNativeNotificationCapability(){
  const adm=await activeAdm();
  if(adm){
    const result=await adm.available();
    const permission=permissionValue(result?.permission);
    return{supported:true,permission};
  }
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
  const adm=await activeAdm();
  if(adm){
    const response=await adm.register();
    if(response?.provider!=="adm"||!String(response?.token||"").trim())
      throw new Error("ADM registration returned no valid token.");
    pendingAdmToken=response.token;
    return "granted";
  }
  const plugin=nativeMessagingPlugin();
  if(!plugin?.requestPermissions)throw new Error("Native notification adapter is unavailable.");
  const result=await plugin.requestPermissions();
  return permissionValue(result?.receive);
}

export async function getNativeMessagingToken(){
  const adm=await activeAdm();
  if(adm){
    if(pendingAdmToken){const token=pendingAdmToken;pendingAdmToken="";return token;}
    const response=await adm.register({silent:true});
    if(response?.provider!=="adm")throw new Error("ADM returned wrong provider.");
    return String(response?.token||"").trim();
  }
  const plugin=nativeMessagingPlugin();
  if(!plugin?.getToken)throw new Error("Native Firebase Messaging is unavailable.");
  const result=await plugin.getToken();
  return String(result?.token||"");
}

export async function deleteNativeMessagingToken(){
  if(await activeAdm()){
    // ADM does not expose Firebase's local deleteToken action. Authenticated
    // lease revocation, confirmed by the server, owns delivery cancellation.
    pendingAdmToken="";
    return true;
  }
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

export function subscribeNativeMessagingTokens(handler){
  if(typeof handler!=="function")throw new Error("Native notification token handler is required.");
  const plugin=nativeMessagingPlugin();
  if(!plugin?.addListener)return()=>{};
  let active=true,handle=null;
  Promise.resolve(plugin.addListener("tokenReceived",event=>{
    if(!active)return;
    const token=String(event?.token||"").trim();
    if(token)handler(token,event);
  })).then(value=>{handle=value;if(!active)handle?.remove?.();}).catch(error=>console.warn("FIDUNIO native token listener failed",error));
  return()=>{active=false;try{handle?.remove?.();}catch{}};
}

export function subscribeNativeNotificationRoutes(handler){
  if(typeof handler!=="function")throw new Error("Native notification route handler is required.");
  const fcm=nativeMessagingPlugin();
  const adm=admPlugin();
  let active=true;
  const handles=[];
  const add=(plugin)=>{if(!plugin?.addListener)return;
    Promise.resolve(plugin.addListener("notificationActionPerformed",event=>{
      if(!active)return;
      const route=routeFromNativeEvent(event);
      if(route)handler({type:FIDUNIO_NOTIFICATION_ROUTE_MESSAGE,route},event);
    })).then(handle=>{if(active)handles.push(handle);else handle?.remove?.();})
      .catch(error=>console.warn("FIDUNIO notification action listener failed",error));
  };
  add(fcm);
  add(adm);
  // On cold start, the activity intent may precede all JavaScript listeners.
  // Read it exactly once; the native bridge clears consumed route extras.
  if(adm?.takeRoute){
    Promise.resolve(adm.takeRoute()).then(routeData=>{
      if(!active)return;
      const route=normalizeNotificationRoute(routeData);
      if(route)handler({type:FIDUNIO_NOTIFICATION_ROUTE_MESSAGE,route},routeData);
    }).catch(error=>console.warn("FIDUNIO ADM pending route failed",error));
  }
  return()=>{active=false;for(const handle of handles)try{handle?.remove?.();}catch{}};
}

export const NOTIFICATION_PLATFORM_ADAPTER_V1=Object.freeze({
  sharedOwner:"notification-registration",
  webTransport:"web-push-service-worker",
  iosTransport:"apns-fcm-capacitor",
  androidTransport:"fcm-capacitor-or-amazon-adm-a3l",
  fakeServiceWorker:false,
});
