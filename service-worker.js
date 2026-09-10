/* FIDUNIO account-E2EE runtime service worker. Network-first shell; no semantic source transforms. */
import "./version.js";
import {firebaseConfig} from "./firebase-config.js";
import {initializeApp} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {getMessaging,onBackgroundMessage} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-sw.js";
import {
  FIDUNIO_BACKGROUND_NOTIFICATION_TITLE,
  notificationEnvelopeFromFcmPayload,
  notificationOptionsForEnvelope
} from "./notification-background-policy.js";

const SW_VERSION=globalThis.FIDUNIO_RELEASE?.version||"unknown";
const SHELL_REVISION="1.1.17-data-only-sw-owner";
const CACHE=`fidunio-shell-${SW_VERSION}-${SHELL_REVISION}`;
const SHELL=["./","./index.html","./version.js","./styles.css","./styles-0.9.0.css","./bootstrap.js","./auth-ui-clean.js","./app.js","./firebase.js","./firebase-config.js","./notification-policy.js","./notification-registration.js","./notification-config.js","./notification-routing.js","./notification-background-policy.js","./settings-lifecycle.js","./new-message-owner.js","./pin-input.js","./local-security.js","./account-storage.js","./disappearing-content-policy.js","./disappearing-compose-policy.js","./disappearing-local-storage-plan.js","./disappearing-authoritative-projection.js","./disappearing-reconnect-recovery.js","./outbox-reconciliation-boundary.js","./attachment-send-service.js","./attachment-receive-service.js","./e2ee-account-attachment-crypto.js","./e2ee-account-runtime.js","./e2ee-account-lifecycle.js","./e2ee-account-identity-manager.js","./e2ee-account-firebase-adapter.js","./e2ee-account-firestore-adapter.js","./e2ee-account-crypto.js","./e2ee-account-recovery-client.js","./e2ee-account-message-runtime.js","./e2ee-account-message-service.js","./e2ee-account-message-crypto.js","./manifest.json","./favicon.png","./fidunio-logo.png","./icon-180.png","./icon-192.png","./icon-512.png"];
const FIREBASE_SDK=["https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js","https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js","https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js","https://www.gstatic.com/firebasejs/12.18.0/firebase-app-check.js","https://www.gstatic.com/firebasejs/12.18.0/firebase-functions.js","https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js","https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging.js","https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-sw.js"];
const NETWORK_TIMEOUT=4000;

self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled([...SHELL,...FIREBASE_SDK].map(url=>cache.add(url)))).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));

async function networkFirst(request){
  const cache=await caches.open(CACHE);
  try{
    const response=await Promise.race([fetch(request,{cache:"no-store"}),new Promise((_,reject)=>setTimeout(()=>reject(new Error("slow")),NETWORK_TIMEOUT))]);
    if(response&&response.ok)cache.put(request,response.clone());
    return response;
  }catch{
    const hit=await cache.match(request);
    if(hit)return hit;
    if(request.mode==="navigate"){
      const shell=await cache.match("./index.html");
      if(shell)return shell;
    }
    throw new Error("offline and not cached");
  }
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.hostname.endsWith("googleapis.com")||url.hostname.endsWith("firebaseio.com"))return;
  if(url.hostname==="www.gstatic.com"){
    event.respondWith(caches.open(CACHE).then(async cache=>{
      const hit=await cache.match(event.request);
      const fresh=fetch(event.request).then(response=>{
        if(response&&response.ok)cache.put(event.request,response.clone());
        return response;
      }).catch(()=>hit);
      return hit||fresh;
    }));
    return;
  }
  if(url.origin===self.location.origin)event.respondWith(networkFirst(event.request));
});

function notificationClickRoute(value){
  try{
    if(value?.type!=="direct-message")return null;
    const conversationId=String(value.conversationId||"");
    const messageId=String(value.messageId||"");
    if(!conversationId||conversationId.length>256||!messageId||messageId.length>256)return null;
    return{type:"direct-message",conversationId,messageId};
  }catch{return null;}
}

function notificationRouteUrl(baseHref,route){
  const url=new URL(baseHref||"./",self.registration.scope);
  url.searchParams.set("fidunioNotification",route.type);
  url.searchParams.set("conversationId",route.conversationId);
  url.searchParams.set("messageId",route.messageId);
  return url.href;
}

self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const route=notificationClickRoute(event.notification.data);
  if(!route)return;
  event.waitUntil((async()=>{
    const target=notificationRouteUrl(new URL("./",self.registration.scope).href,route);
    await self.clients.openWindow(target);
  })());
});

const notificationWorkerApp=initializeApp(firebaseConfig,"fidunio-notification-worker");
const notificationMessaging=getMessaging(notificationWorkerApp);
onBackgroundMessage(notificationMessaging,async payload=>{
  const envelope=notificationEnvelopeFromFcmPayload(payload);
  if(!envelope)return;
  const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});
  if(windows.some(client=>client.visibilityState==="visible"))return;
  await self.registration.showNotification(FIDUNIO_BACKGROUND_NOTIFICATION_TITLE,notificationOptionsForEnvelope(envelope));
});
