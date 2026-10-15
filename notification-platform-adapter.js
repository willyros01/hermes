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
// Selection starts UNKNOWN and is committed only after acquiring a token from
// the matching transport. Never record an Amazon token as android-native.
let selectedNativeProvider="";
let pendingAdmToken="";
function admPlugin(){
  if(!isNativeAndroidRuntime())return null;
  return globalThis.Capacitor?.Plugins?.FidunioAdm||null;
}
async function detectAndroidProvider(){
  if(!isNativeAndroidRuntime())return null;
  const plugin=admPlugin();
  if(!plugin?.available)throw new Error("Android native A3L notification bridge is unavailable.");
  let status;
  try{status=await plugin.available();}
  catch{throw new Error("Android A3L notification provider detection failed.");}
  if(status?.supported!==true||!["adm","fcm"].includes(status?.provider))
    throw new Error("Neither Amazon ADM nor Google FCM was detected on this Android device.");
  return {plugin,provider:status.provider,permission:permissionValue(status.permission)};
}
export async function getNativeNotificationProvider(){
  const selected=await detectAndroidProvider();
  return selected?.provider||"";
}
export function getNativeNotificationLeasePlatform(){
  if(!isNativeAndroidRuntime())return "ios-native";
  if(selectedNativeProvider==="adm")return "android-adm";
  if(selectedNativeProvider==="fcm")return "android-native";
  throw new Error("Android notification provider has not been verified.");
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
  if(isNativeAndroidRuntime()){
    let selected;
    try{selected=await detectAndroidProvider();}
    catch{return{supported:false,permission:"unsupported"};}
    if(selected.provider==="adm")
      return{supported:true,permission:selected.permission};
    // A3L selected FCM; keep the existing FirebaseMessaging FCM owner.
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
  const selected=await detectAndroidProvider();
  if(selected?.provider==="adm"){
    const response=await selected.plugin.register();
    if(response?.provider!=="adm"||String(response?.token||"").trim().length<20)
      throw new Error("ADM registration returned no valid token.");
    pendingAdmToken=String(response.token).trim();
    return "granted";
  }
  pendingAdmToken="";
  const plugin=nativeMessagingPlugin();
  if(!plugin?.requestPermissions)throw new Error("Native Firebase notification adapter is unavailable.");
  const result=await plugin.requestPermissions();
  return permissionValue(result?.receive);
}

export async function getNativeMessagingToken(){
  const selected=await detectAndroidProvider();
  if(selected?.provider==="adm"){
    const response=pendingAdmToken?{provider:"adm",token:pendingAdmToken}
      :await selected.plugin.register({silent:true});
    pendingAdmToken="";
    const token=String(response?.token||"").trim();
    if(response?.provider!=="adm"||token.length<20)
      throw new Error("ADM registration did not supply a valid Amazon token.");
    selectedNativeProvider="adm";
    return token;
  }
  pendingAdmToken="";
  const plugin=nativeMessagingPlugin();
  if(!plugin?.getToken)throw new Error("Native Firebase Messaging is unavailable.");
  const result=await plugin.getToken();
  const token=String(result?.token||"").trim();
  if(token.length<20)throw new Error("FCM registration did not supply a valid Google token.");
  if(selected?.provider==="fcm")selectedNativeProvider="fcm";
  return token;
}

export async function deleteNativeMessagingToken(){
  const selected=await detectAndroidProvider();
  if(selected?.provider==="adm"){
    // Only the authenticated lease authority revokes Amazon delivery.
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
