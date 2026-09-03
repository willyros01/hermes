/* FIDUNIO 0.9.0 test service worker. Network-first shell; Firestore/Auth are never cached. */
importScripts("./version.js");
const SW_VERSION=globalThis.FIDUNIO_RELEASE?.version || "unknown";
const CACHE=`fidunio-shell-${SW_VERSION}`;
const SHELL=["./","./index.html","./version.js","./styles.css","./styles-0.9.0.css","./app.js","./firebase.js","./firebase-config.js","./manifest.json","./favicon.png","./fidunio-logo.png","./icon-180.png","./icon-192.png","./icon-512.png"];
const FIREBASE_SDK=["https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js","https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js","https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js"];
const NETWORK_TIMEOUT=4000;
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled([...SHELL,...FIREBASE_SDK].map(url=>cache.add(url)))).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));

async function transformApp(request,response){
  if(!response||!response.ok)return response;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||!url.pathname.endsWith("/app.js"))return response;
  let source=await response.text();

  // Preserve the validated sender-side receipt fast path and, for 0.9.0,
  // commit recipient Read state from the fresh Firestore snapshot BEFORE any
  // asynchronous key lookup/decryption. Receipt semantics must not depend on
  // per-device cryptographic processing completing first.
  const receiptNeedle=`      const existing=state.messages[conversationId] || [];
      const peerKey=await peerPublicKeyForConversation(conversationId,{refresh:true});`;
  const receiptReplacement=`      const existing=state.messages[conversationId] || [];
      if(!meta.fromCache){
        const rawStateById=new Map(rows.map(r=>[r.id,r.state||"sent"]));
        let receiptChanged=false;
        for(const local of existing){
          if(!local?.mine) continue;
          const next=rawStateById.get(local.id);
          if(next && next!==local.state){local.state=next;receiptChanged=true;}
        }
        if(receiptChanged && state.route==="chat" && String(state.selectedId)===String(conversationId)) render();

        if(state.route==="chat" && String(state.selectedId)===String(conversationId)){
          const unreadRows=rows.filter(r=>r.senderUid!==firebaseUser.uid && (r.state||"sent")!=="read");
          if(unreadRows.length){
            await Promise.allSettled(unreadRows.map(r=>updateCloudMessageState(conversationId,r.id,"read")));
          }
        }
      }
      const peerKey=await peerPublicKeyForConversation(conversationId,{refresh:true});`;
  source=source.replace(receiptNeedle,receiptReplacement);

  // 0.9.0 per-device envelope primitives. Each target installation gets its
  // own AES-GCM ciphertext derived from ECDH(sender-device, target-device).
  const helperNeedle=`async function resolvePeerUidForConversation(conversationId){`;
  const helperReplacement=`async function deriveDeviceEnvelopeKey(peerPublicJwk,conversationId){
  const mine=await getOrCreateDeviceKeyPair();
  const peer=await crypto.subtle.importKey("jwk",peerPublicJwk,{name:"ECDH",namedCurve:"P-256"},false,[]);
  const bits=await crypto.subtle.deriveBits({name:"ECDH",public:peer},mine.privateKey,256);
  const base=await crypto.subtle.importKey("raw",bits,"HKDF",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"HKDF",hash:"SHA-256",salt:new TextEncoder().encode("FIDUNIO-E2EE-v2"),info:new TextEncoder().encode(String(conversationId))},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
async function encryptDeviceEnvelope(text,targetPublicJwk,conversationId){
  const key=await deriveDeviceEnvelopeKey(targetPublicJwk,conversationId);
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:new TextEncoder().encode(String(conversationId))},key,new TextEncoder().encode(text));
  return {ciphertext:b64(cipher),iv:b64(iv)};
}
async function buildDeviceEnvelopes(text,conversationId){
  const peerUid=await resolvePeerUidForConversation(conversationId);
  if(!peerUid) throw new Error("Recipient identity is unavailable");
  const identity=await getOrCreateDeviceIdentity();
  const [peerDevices,myDevices]=await Promise.all([getCloudUserDevices(peerUid),getCloudUserDevices(firebaseUser.uid)]);
  const targets=new Map();
  for(const d of [...peerDevices,...myDevices]){
    const id=String(d.deviceId||d.id||"");
    if(id && d.publicJwk && d.active!==false) targets.set(id,{deviceId:id,publicJwk:d.publicJwk});
  }
  targets.set(identity.deviceId,{deviceId:identity.deviceId,publicJwk:identity.publicJwk});
  if(!peerDevices.some(d=>d.publicJwk && d.active!==false)) throw new Error("Recipient has no registered encryption device yet");
  const envelopes={};
  for(const target of targets.values()) envelopes[target.deviceId]=await encryptDeviceEnvelope(text,target.publicJwk,conversationId);
  return {envelopes,recipientDeviceIds:[...targets.keys()],identity};
}
async function decryptDeviceEnvelope(row,conversationId){
  const identity=await getOrCreateDeviceIdentity();
  const env=row?.envelopes?.[identity.deviceId];
  if(!env?.ciphertext||!env?.iv) throw new Error("No encrypted envelope exists for this device");
  if(!row?.senderDevicePublicJwk) throw new Error("Sender device key is unavailable");
  const mine=await getOrCreateDeviceKeyPair();
  const sender=await crypto.subtle.importKey("jwk",row.senderDevicePublicJwk,{name:"ECDH",namedCurve:"P-256"},false,[]);
  const bits=await crypto.subtle.deriveBits({name:"ECDH",public:sender},mine.privateKey,256);
  const base=await crypto.subtle.importKey("raw",bits,"HKDF",false,["deriveKey"]);
  const key=await crypto.subtle.deriveKey({name:"HKDF",hash:"SHA-256",salt:new TextEncoder().encode("FIDUNIO-E2EE-v2"),info:new TextEncoder().encode(String(conversationId))},base,{name:"AES-GCM",length:256},false,["decrypt"]);
  const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(env.iv),additionalData:new TextEncoder().encode(String(conversationId))},key,unb64(env.ciphertext));
  return new TextDecoder().decode(plain);
}
async function resolvePeerUidForConversation(conversationId){`;
  source=source.replace(helperNeedle,helperReplacement);

  // Receive e2ee:2 with this installation's envelope; retain e2ee:1 history compatibility.
  const decryptNeedle=`        if(m.e2ee){
          if(peerKey){try{text=await decryptCloudText(m,peerKey,conversationId);}catch{text="[Encrypted message — key unavailable]";}}
          else text="[Encrypted message — key unavailable]";
        }`;
  const decryptReplacement=`        if(m.e2ee===2){
          try{text=await decryptDeviceEnvelope(m,conversationId);}catch{text="[Encrypted message — not available on this device]";}
        }else if(m.e2ee){
          if(peerKey){try{text=await decryptCloudText(m,peerKey,conversationId);}catch{text="[Encrypted message — key unavailable]";}}
          else text="[Encrypted message — key unavailable]";
        }`;
  source=source.replace(decryptNeedle,decryptReplacement);

  // Send e2ee:2 envelopes at actual transmission time so Outbox retries use
  // the current authorized device registry rather than stale queued keys.
  const sendNeedle=`        const peerKey=await peerPublicKeyForConversation(payload.conversationId,{refresh:true});
        if(!peerKey) throw new Error("Recipient encryption key is not available yet");
        const peerUid=await resolvePeerUidForConversation(payload.conversationId);
        if(peerUid && peerTrustStatus(peerUid)==="changed"){
          throw new Error("Recipient encryption key changed. Verify the new key in Conversation Security before sending.");
        }
        const encrypted=await encryptCloudText(payload.text,peerKey,payload.conversationId);
        const identity=await getOrCreateDeviceIdentity();
        await sendCloudMessage(payload.conversationId,{
          id:payload.messageId,text:"",ciphertext:encrypted.ciphertext,iv:encrypted.iv,e2ee:encrypted.e2ee,
          senderDeviceId:identity.deviceId,
          timeLabel:payload.time,state:"sent"
        });`;
  const sendReplacement=`        const peerKey=await peerPublicKeyForConversation(payload.conversationId,{refresh:true});
        if(!peerKey) throw new Error("Recipient encryption key is not available yet");
        const peerUid=await resolvePeerUidForConversation(payload.conversationId);
        if(peerUid && peerTrustStatus(peerUid)==="changed") throw new Error("Recipient encryption key changed. Verify the new key in Conversation Security before sending.");
        const fanout=await buildDeviceEnvelopes(payload.text,payload.conversationId);
        await sendCloudMessage(payload.conversationId,{
          id:payload.messageId,text:"",ciphertext:"",iv:"",e2ee:2,
          envelopes:fanout.envelopes,recipientDeviceIds:fanout.recipientDeviceIds,
          senderDeviceId:fanout.identity.deviceId,senderDevicePublicJwk:fanout.identity.publicJwk,
          timeLabel:payload.time,state:"sent"
        });`;
  source=source.replace(sendNeedle,sendReplacement);

  const headers=new Headers(response.headers);headers.set("content-type","text/javascript; charset=utf-8");headers.delete("content-length");
  return new Response(source,{status:response.status,statusText:response.statusText,headers});
}
async function networkFirst(request){const cache=await caches.open(CACHE);try{let response=await Promise.race([fetch(request,{cache:"no-store"}),new Promise((_,reject)=>setTimeout(()=>reject(new Error("slow")),NETWORK_TIMEOUT))]);response=await transformApp(request,response);if(response&&response.ok)cache.put(request,response.clone());return response;}catch{const hit=await cache.match(request);if(hit)return hit;if(request.mode==="navigate"){const shell=await cache.match("./index.html");if(shell)return shell;}throw new Error("offline and not cached");}}
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;const url=new URL(event.request.url);if(url.hostname.endsWith("googleapis.com")||url.hostname.endsWith("firebaseio.com"))return;if(url.hostname==="www.gstatic.com"){event.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(event.request);const fresh=fetch(event.request).then(response=>{if(response&&response.ok)cache.put(event.request,response.clone());return response;}).catch(()=>hit);return hit||fresh;}));return;}if(url.origin===self.location.origin)event.respondWith(networkFirst(event.request));});