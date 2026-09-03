import {
  isFirebaseConfigured,
  initFirebase,
  createFidunioAccount,
  signInFidunio,
  signOutFidunio,
  getFirebaseUser,
  startDirectConversation,
  subscribeMyConversations,
  subscribeConversationMessages,
  sendCloudMessage,
  updateCloudMessageState,
  getCloudUserProfile,
  getCloudConversation,
  publishCloudE2EEPublicKey,
  publishCloudE2EEDevice,
  getCloudUserDevices
} from "./firebase.js";

const app = document.querySelector("#app");
const FIDUNIO_VERSION = globalThis.FIDUNIO_RELEASE?.version || "unknown";

const contacts = [
  {id:"u1", name:"Maria Santos"},
  {id:"u2", name:"John Cruz"},
  {id:"u3", name:"Peter Lee"},
  {id:"u4", name:"Robert Cruz"},
  {id:"u5", name:"Ana Reyes"}
];

let state = {
  unlocked:false,
  route:"messages",
  previousRoute:"messages",
  online:navigator.onLine,
  selectedId:1,
  toolsOpen:false,
  newGroupMembers:[],
  newGroupName:"",
  modal:null,
  quickPhrases:["Yes","No","OK","On my way","Running late","Call me"],
  conversations:[
    {id:1,type:"direct",name:"Maria Santos",unread:2,preview:"I'll call you later.",time:"2:31 PM"},
    {id:2,type:"direct",name:"John Cruz",unread:0,preview:"See you tomorrow.",time:"11:20 AM"},
    {
      id:3,type:"group",name:"Family Group",unread:0,preview:"Dinner around 7?",time:"Yesterday",
      ownerId:"me", members:[
        {id:"me",name:"You",role:"Owner",joinedAt:"Before history",historyAccess:"all"},
        {id:"u1",name:"Maria Santos",role:"Member",joinedAt:"Before history",historyAccess:"all"},
        {id:"u2",name:"John Cruz",role:"Member",joinedAt:"Today, 2:15 PM",historyAccess:"from_join"}
      ]
    }
  ],
  messages:{
    1:[
      {id:"m1",mine:false,text:"Are we meeting tomorrow?",time:"10:31 AM",state:"read"},
      {id:"m2",mine:true,text:"Yes, around 9.",time:"10:32 AM",state:"read"}
    ],
    2:[
      {id:"j1",mine:false,text:"See you tomorrow.",time:"11:20 AM",state:"read"}
    ],
    3:[
      {id:"f0",mine:false,sender:"Maria Santos",text:"I picked up the groceries.",time:"1:48 PM",state:"read",historical:true},
      {id:"join",system:true,text:"John joined the group • Earlier messages hidden by default",time:"2:15 PM"},
      {id:"f1",mine:false,sender:"Maria Santos",text:"Dinner around 7?",time:"2:19 PM",state:"read"},
      {id:"f2",mine:true,text:"7 works for me.",time:"2:22 PM",state:"read"}
    ]
  },

  settings:{previews:false,autoLock:true,textSize:"normal",wifiAttachments:true,appearance:"auto"},
  peerTrust:{}
};

const DB_NAME = "fidunio-local";
const DB_VERSION = 2;
const STATE_KEY = "app-state";
let dbPromise = null;
let localKeyPromise = null;
let hydrated = false;
let persistTimer = null;
let firebaseReady = false;
let firebaseError = "";
let firebaseUser = null;
let cloudConversationUnsub = null;
let cloudMessageUnsub = null;
let cloudMessageConversationId = null;
let deviceSecurityInfo = null;
let deviceRegistryStatus = "";
let myRegisteredDevices = [];


function openDb(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
      if(!db.objectStoreNames.contains("outbox")) db.createObjectStore("outbox",{keyPath:"id"});
      if(!db.objectStoreNames.contains("history")) db.createObjectStore("history");
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
  return dbPromise;
}
function idbRequest(req){
  return new Promise((resolve,reject)=>{
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function getLocalKey(){
  if(localKeyPromise) return localKeyPromise;
  localKeyPromise=(async()=>{
    const db=await openDb();

    // Read in its own transaction. Safari/iOS can auto-close an IndexedDB
    // transaction across an await, so never reuse that transaction after
    // asynchronous key generation.
    let key=await idbRequest(db.transaction("meta","readonly").objectStore("meta").get("local-key"));
    if(key) return key;

    key=await crypto.subtle.generateKey({name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
    const tx=db.transaction("meta","readwrite");
    tx.objectStore("meta").put(key,"local-key");
    await txDone(tx);
    return key;
  })().catch(err=>{
    localKeyPromise=null;
    throw err;
  });
  return localKeyPromise;
}
function bytesToB64(bytes){
  let s=""; bytes.forEach(b=>s+=String.fromCharCode(b)); return btoa(s);
}
function b64ToBytes(s){
  const raw=atob(s); return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
async function encryptLocal(value){
  const key=await getLocalKey();
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const data=new TextEncoder().encode(JSON.stringify(value));
  const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,data);
  return {iv:bytesToB64(iv),ciphertext:bytesToB64(new Uint8Array(cipher))};
}
async function decryptLocal(record){
  const key=await getLocalKey();
  const plain=await crypto.subtle.decrypt(
    {name:"AES-GCM",iv:b64ToBytes(record.iv)},key,b64ToBytes(record.ciphertext)
  );
  return JSON.parse(new TextDecoder().decode(plain));
}
function serializableState(){
  return {
    conversations:state.conversations,
    messages:state.messages,
    settings:state.settings,
    peerTrust:state.peerTrust,
    quickPhrases:state.quickPhrases,
    selectedId:state.selectedId
  };
}
function txDone(tx){
  return new Promise((resolve,reject)=>{
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error || new Error("IndexedDB transaction failed"));
    tx.onabort=()=>reject(tx.error || new Error("IndexedDB transaction aborted"));
  });
}
async function persistState(){
  if(!hydrated) return;
  try{
    const db=await openDb();
    const encrypted=await encryptLocal(serializableState());
    const tx=db.transaction("meta","readwrite");
    tx.objectStore("meta").put(encrypted,STATE_KEY);
    await txDone(tx);
  }catch(err){ console.warn("Local state persistence failed",err); }
}
function persistSoon(){
  if(!hydrated) return;
  clearTimeout(persistTimer);
  persistTimer=setTimeout(()=>{ persistState(); },80);
}
async function loadPersistedState(){
  try{
    const db=await openDb();
    const encrypted=await idbRequest(db.transaction("meta","readonly").objectStore("meta").get(STATE_KEY));
    if(!encrypted) return;
    const saved=await decryptLocal(encrypted);
    if(saved.conversations) state.conversations=saved.conversations;
    if(saved.messages) state.messages=saved.messages;
    if(saved.settings) state.settings={...state.settings,...saved.settings};
    if(saved.peerTrust && typeof saved.peerTrust==="object") state.peerTrust=saved.peerTrust;
    if(saved.quickPhrases) state.quickPhrases=saved.quickPhrases;
    if(saved.selectedId && state.conversations.some(c=>String(c.id)===String(saved.selectedId))) state.selectedId=saved.selectedId;
  }catch(err){ console.warn("Could not restore local Fidunio state",err); }
}
async function queueOutboxMessage(conversationId,message){
  const db=await openDb();
  const c=state.conversations.find(x=>String(x.id)===String(conversationId));
  const encrypted=await encryptLocal({
    conversationId,
    messageId:message.id,
    text:message.text,
    time:message.time,
    cloud:!!message.cloud,
    conversation:c ? {
      id:c.id,
      name:c.name,
      type:c.type,
      cloud:!!c.cloud,
      peerUid:c.peerUid || c.uid || c.otherUid || null,
      preview:message.text,
      time:message.time,
      unread:0
    } : null
  });
  const tx=db.transaction("outbox","readwrite");
  tx.objectStore("outbox").put({
    id:message.id,
    conversationId,
    createdAt:Date.now(),
    payload:encrypted
  });
  await txDone(tx);
}
async function getOutboxRecords(){
  const db=await openDb();
  return idbRequest(db.transaction("outbox","readonly").objectStore("outbox").getAll());
}
async function removeOutboxMessage(id){
  const db=await openDb();
  const tx=db.transaction("outbox","readwrite");
  tx.objectStore("outbox").delete(id);
  await txDone(tx);
}
async function decryptOutboxRecord(record){
  const payload=await decryptLocal(record.payload);
  return {
    conversationId:payload.conversationId ?? record.conversationId,
    messageId:payload.messageId ?? record.id,
    text:payload.text ?? "",
    time:payload.time ?? "",
    cloud:!!payload.cloud,
    conversation:payload.conversation || null
  };
}
function ensureQueuedMessageFromPayload(payload){
  const conversationId=payload.conversationId;
  let c=state.conversations.find(x=>String(x.id)===String(conversationId));
  if(!c && payload.conversation){
    c={...payload.conversation,id:conversationId};
    state.conversations.unshift(c);
  }
  if(!state.messages[conversationId]) state.messages[conversationId]=[];
  let m=state.messages[conversationId].find(x=>x.id===payload.messageId);
  if(!m){
    m={
      id:payload.messageId,
      mine:true,
      text:payload.text,
      time:payload.time,
      state:"queued",
      cloud:payload.cloud
    };
    state.messages[conversationId].push(m);
  }else if(!["sent","delivered","read"].includes(m.state)){
    m.state="queued";
    m.cloud=payload.cloud;
  }
  if(c){
    c.preview=payload.text || c.preview;
    c.time=payload.time || c.time;
  }
  return {c,m};
}
async function restoreOutboxIntoState(){
  try{
    const records=await getOutboxRecords();
    for(const record of records){
      try{
        const payload=await decryptOutboxRecord(record);
        ensureQueuedMessageFromPayload(payload);
      }catch(err){
        console.warn("Could not restore queued message",record?.id,err);
      }
    }
  }catch(err){
    console.warn("Could not restore Outbox",err);
  }
}

async function cacheCloudHistory(conversationId,messages){
  try{
    const db=await openDb();
    const encrypted=await encryptLocal({
      conversationId,
      messages,
      savedAt:Date.now()
    });
    const tx=db.transaction("history","readwrite");
    tx.objectStore("history").put(encrypted,String(conversationId));
    await txDone(tx);
  }catch(err){
    console.warn("Cloud history cache failed",conversationId,err);
  }
}
async function loadCloudHistory(){
  try{
    const db=await openDb();

    // Safari/iOS may auto-close an IndexedDB transaction as soon as control
    // returns to the event loop. Do not await one request and then issue
    // another request on the same transaction. A single getAll() request is
    // sufficient because each encrypted record contains its conversationId.
    const values=await idbRequest(
      db.transaction("history","readonly").objectStore("history").getAll()
    );

    for(const value of values){
      try{
        const saved=await decryptLocal(value);
        if(!saved?.conversationId || !Array.isArray(saved.messages)) continue;
        const id=saved.conversationId;
        const current=state.messages[id] || [];
        const pending=current.filter(m=>m.cloud && m.mine && ["queued","sending","failed"].includes(m.state));
        const savedIds=new Set(saved.messages.map(m=>m.id));
        state.messages[id]=[
          ...saved.messages,
          ...pending.filter(m=>!savedIds.has(m.id))
        ];
      }catch(err){
        console.warn("Could not restore cached cloud history",err);
      }
    }
  }catch(err){
    console.warn("Could not load cloud history cache",err);
  }
}

function cloudDisplayName(c){
  if(!c?.cloud || !firebaseUser) return c?.name || "Conversation";
  return c.name || "FIDUNIO contact";
}
function mergeCloudConversation(remote){
  const existing=state.conversations.find(c=>String(c.id)===String(remote.id));
  const item={
    id:remote.id,type:"direct",cloud:true,
    // peerUid is part of the conversation's durable identity for E2EE.
    // Never drop it while merging Firestore conversation discovery into
    // an older locally cached conversation.
    peerUid:remote.peerUid || existing?.peerUid || existing?.uid || existing?.otherUid || null,
    name:remote.name || existing?.name || "FIDUNIO contact",
    unread:existing?.unread || 0,
    preview:remote.preview || existing?.preview || "Cloud conversation",
    time:remote.time || existing?.time || ""
  };
  if(existing) Object.assign(existing,item);
  else state.conversations.unshift(item);
  if(!state.messages[item.id]) state.messages[item.id]=[];
  return existing || item;
}
function stopCloudMessageSubscription(){
  if(cloudMessageUnsub){ cloudMessageUnsub(); cloudMessageUnsub=null; }
  cloudMessageConversationId=null;
}
function beginCloudConversationSubscription(){
  if(cloudConversationUnsub){cloudConversationUnsub();cloudConversationUnsub=null;}
  if(!firebaseUser) return;
  cloudConversationUnsub=subscribeMyConversations(firebaseUser.uid, rows=>{
    rows.forEach(mergeCloudConversation);
    // A restored Firestore conversation may repair peerUid for an older
    // local record. Reattach the active chat listener after reconciliation.
    ensureActiveCloudMessageSubscription();
    persistSoon();
    if(state.route==="messages" || state.route==="chat") render();
  }, err=>{
    firebaseError=err?.message || String(err);
    if(state.route==="settings") renderSettings();
  });
}
function ensureActiveCloudMessageSubscription(force=false){
  if(!firebaseUser || state.route!=="chat") return;
  const c=state.conversations.find(x=>String(x.id)===String(state.selectedId));
  if(c?.cloud) beginCloudMessageSubscription(c.id,{force});
}

/* FIDUNIO direct-message E2EE foundation */
const E2EE_VERSION=1;
let deviceKeyPair=null;
const peerKeyCache=new Map();
function b64(bytes){ let s=""; const u8=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes); for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode(...u8.subarray(i,i+0x8000)); return btoa(s); }
function unb64(s){ const bin=atob(s),out=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i); return out; }
async function getOrCreateDeviceKeyPair(){
  if(deviceKeyPair)return deviceKeyPair;
  const db=await openDb();
  const existing=await idbRequest(db.transaction("meta","readonly").objectStore("meta").get("e2ee-device-keypair-v1"));
  if(existing?.privateKey&&existing?.publicKey){deviceKeyPair=existing;return existing;}
  const kp=await crypto.subtle.generateKey({name:"ECDH",namedCurve:"P-256"},false,["deriveBits"]);
  const publicJwk=await crypto.subtle.exportKey("jwk",kp.publicKey);
  const stored={privateKey:kp.privateKey,publicKey:kp.publicKey,publicJwk,createdAt:Date.now()};
  const tx=db.transaction("meta","readwrite"); tx.objectStore("meta").put(stored,"e2ee-device-keypair-v1"); await txDone(tx);
  deviceKeyPair=stored; return stored;
}
function canonicalPublicJwk(jwk){
  return JSON.stringify({kty:jwk?.kty||"",crv:jwk?.crv||"",x:jwk?.x||"",y:jwk?.y||""});
}
async function publicKeyFingerprint(jwk){
  const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonicalPublicJwk(jwk)));
  return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,"0")).join("").toUpperCase();
}
function formatFingerprint(fp){
  return String(fp||"").match(/.{1,4}/g)?.join(" ")||"";
}
function shortDeviceId(id){
  const s=String(id||"");
  return s.length>12 ? `${s.slice(0,8)}…${s.slice(-4)}` : s;
}
function peerTrustRecord(peerUid){
  if(!peerUid) return null;
  return state.peerTrust?.[peerUid] || null;
}
function peerTrustStatus(peerUid){
  const t=peerTrustRecord(peerUid);
  if(!t?.observedFingerprint) return "unknown";
  if(t.verifiedFingerprint && t.verifiedFingerprint===t.observedFingerprint) return "verified";
  if(t.verifiedFingerprint && t.verifiedFingerprint!==t.observedFingerprint) return "changed";
  return t.previousFingerprint && t.previousFingerprint!==t.observedFingerprint ? "changed-unverified" : "unverified";
}
async function observePeerPublicKey(peerUid,jwk){
  if(!peerUid||!jwk) return null;
  if(!state.peerTrust || typeof state.peerTrust!=="object") state.peerTrust={};
  const fp=await publicKeyFingerprint(jwk);
  const prior=state.peerTrust[peerUid];
  if(!prior){
    state.peerTrust[peerUid]={
      observedFingerprint:fp,
      firstSeenAt:Date.now(),
      lastSeenAt:Date.now(),
      verifiedFingerprint:null,
      verifiedAt:null
    };
    await persistState();
    return state.peerTrust[peerUid];
  }
  if(prior.observedFingerprint!==fp){
    state.peerTrust[peerUid]={
      ...prior,
      previousFingerprint:prior.observedFingerprint||null,
      observedFingerprint:fp,
      changedAt:Date.now(),
      lastSeenAt:Date.now()
    };
    await persistState();
  }else{
    prior.lastSeenAt=Date.now();
  }
  return state.peerTrust[peerUid];
}
async function verifyCurrentPeerKey(peerUid){
  const t=peerTrustRecord(peerUid);
  if(!t?.observedFingerprint) throw new Error("No current contact key is available to verify.");
  state.peerTrust[peerUid]={
    ...t,
    verifiedFingerprint:t.observedFingerprint,
    verifiedAt:Date.now(),
    previousFingerprint:null,
    changedAt:null
  };
  await persistState();
}
function currentConversationSecurityStatus(c=currentConversation()){
  if(!c?.cloud || !c?.peerUid) return "not-applicable";
  return peerTrustStatus(c.peerUid);
}
async function getOrCreateDeviceIdentity(){
  const kp=await getOrCreateDeviceKeyPair();
  const db=await openDb();
  const store=db.transaction("meta","readonly").objectStore("meta");
  let identity=await idbRequest(store.get("e2ee-device-identity-v1"));
  if(!identity?.deviceId){
    identity={
      deviceId:crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${b64(crypto.getRandomValues(new Uint8Array(12))).replace(/[^a-zA-Z0-9]/g,"")}`,
      createdAt:Date.now()
    };
    const tx=db.transaction("meta","readwrite");
    tx.objectStore("meta").put(identity,"e2ee-device-identity-v1");
    await txDone(tx);
  }
  const fingerprint=await publicKeyFingerprint(kp.publicJwk);
  deviceSecurityInfo={
    ...identity,
    publicJwk:kp.publicJwk,
    fingerprint,
    label:"FIDUNIO Web device"
  };
  return deviceSecurityInfo;
}
async function deriveDirectKey(peerPublicJwk,conversationId){
  const mine=await getOrCreateDeviceKeyPair();
  const peer=await crypto.subtle.importKey("jwk",peerPublicJwk,{name:"ECDH",namedCurve:"P-256"},false,[]);
  const bits=await crypto.subtle.deriveBits({name:"ECDH",public:peer},mine.privateKey,256);
  const base=await crypto.subtle.importKey("raw",bits,"HKDF",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"HKDF",hash:"SHA-256",salt:new TextEncoder().encode("FIDUNIO-E2EE-v1"),info:new TextEncoder().encode(String(conversationId))},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
async function encryptCloudText(text,peerPublicJwk,conversationId){
  const key=await deriveDirectKey(peerPublicJwk,conversationId),iv=crypto.getRandomValues(new Uint8Array(12));
  const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:new TextEncoder().encode(String(conversationId))},key,new TextEncoder().encode(text));
  return {e2ee:E2EE_VERSION,ciphertext:b64(cipher),iv:b64(iv)};
}
async function decryptCloudText(row,peerPublicJwk,conversationId){
  if(!row?.e2ee||!row?.ciphertext||!row?.iv)return row?.text||"";
  const key=await deriveDirectKey(peerPublicJwk,conversationId);
  const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(row.iv),additionalData:new TextEncoder().encode(String(conversationId))},key,unb64(row.ciphertext));
  return new TextDecoder().decode(plain);
}
async function resolvePeerUidForConversation(conversationId){
  const c=state.conversations.find(x=>String(x.id)===String(conversationId));
  let peerUid=c?.peerUid || c?.uid || c?.otherUid || null;
  if(peerUid || !firebaseUser) return peerUid;

  // Repair older local conversation records that predate peerUid. The
  // Firestore conversation document is authoritative for membership, so we
  // can recover the other member without asking the user to copy an ID again.
  try{
    const remote=await getCloudConversation(conversationId,firebaseUser.uid);
    if(remote){
      const repaired=mergeCloudConversation(remote);
      peerUid=repaired?.peerUid || remote.peerUid || null;
      if(peerUid) await persistState();
    }
  }catch(err){
    console.warn("Could not repair cloud conversation peer identity",conversationId,err);
  }
  return peerUid;
}
async function peerPublicKeyForConversation(conversationId,{refresh=false}={}){
  const peerUid=await resolvePeerUidForConversation(conversationId);
  if(!peerUid)return null;
  if(!refresh && peerKeyCache.has(peerUid))return peerKeyCache.get(peerUid);
  try{
    const profile=await getCloudUserProfile(peerUid);
    const jwk=profile?.e2eePublicJwk||null;
    if(jwk){
      await observePeerPublicKey(peerUid,jwk);
      peerKeyCache.set(peerUid,jwk);
    }
    return jwk;
  }catch{return null;}
}
async function publishMyE2EEKey(){
  if(!firebaseUser)return;
  const identity=await getOrCreateDeviceIdentity();

  // Keep the 0.7.x account-level public key current as a compatibility
  // bridge. Existing direct-message E2EE continues to use this key, so the
  // stable 0.7.3 transport and ciphertext format are not disturbed.
  await publishCloudE2EEPublicKey(firebaseUser.uid,identity.publicJwk);

  // 0.8.0 additionally registers this installation as its own device.
  // If the new device collection is not available yet, messaging still works
  // through the compatibility key above; Settings will report the registry
  // error instead of breaking E2EE transport.
  try{
    await publishCloudE2EEDevice(firebaseUser.uid,identity);
    myRegisteredDevices=await getCloudUserDevices(firebaseUser.uid);
    deviceRegistryStatus="registered";
  }catch(err){
    deviceRegistryStatus=err?.message||String(err);
    console.warn("Device registry publication failed",err);
  }
  if(state.route==="settings") renderSettings();
}

function beginCloudMessageSubscription(conversationId,{force=false}={}){
  const wanted=String(conversationId);
  if(
    !force &&
    cloudMessageUnsub &&
    String(cloudMessageConversationId)===wanted
  ) return;

  stopCloudMessageSubscription();
  const c=state.conversations.find(x=>String(x.id)===wanted);
  if(!c?.cloud || !firebaseUser) return;

  cloudMessageConversationId=wanted;
  cloudMessageUnsub=subscribeConversationMessages(
    conversationId,
    firebaseUser.uid,
    async (rows,meta={})=>{
      const existing=state.messages[conversationId] || [];
      const peerKey=await peerPublicKeyForConversation(conversationId,{refresh:true});
      const remote=[];
      for(const m of rows){
        let text=m.text||"";
        if(m.e2ee){
          if(peerKey){try{text=await decryptCloudText(m,peerKey,conversationId);}catch{text="[Encrypted message — key unavailable]";}}
          else text="[Encrypted message — key unavailable]";
        }
        remote.push({id:m.id,mine:m.senderUid===firebaseUser.uid,sender:m.senderName||"",text,time:m.timeLabel||"",state:m.state||"sent",cloud:true,e2ee:!!m.e2ee,senderDeviceId:m.senderDeviceId||null});
      }

      let merged;

      if(meta.fromCache){
        /*
         * IMPORTANT OFFLINE RULE
         * ----------------------
         * Firestore may emit an empty or incomplete cache snapshot on an
         * offline cold start. That is NOT proof that the conversation has no
         * messages. Never let such a snapshot erase the encrypted local copy.
         *
         * Merge anything Firestore does know into the locally restored
         * history, but preserve every existing row that Firestore's cache
         * doesn't currently contain.
         */
        const byId=new Map(existing.map(m=>[m.id,m]));
        for(const m of remote){
          const prior=byId.get(m.id);
          byId.set(m.id, prior ? {...prior,...m} : m);
        }
        merged=[...byId.values()];
      }else{
        /*
         * A server-backed snapshot is authoritative for messages already
         * stored in Firestore. Preserve only local outbound work that has not
         * yet reached the server.
         */
        const remoteIds=new Set(remote.map(m=>m.id));
        const localPending=existing.filter(m=>
          m.cloud && m.mine &&
          ["queued","sending","failed"].includes(m.state) &&
          !remoteIds.has(m.id)
        );
        merged=[...remote,...localPending];
      }

      state.messages[conversationId]=merged;

      const last=merged.at(-1);
      if(last){
        c.preview=last.text;
        c.time=last.time;
      }

      /*
       * Local-first durability:
       * persist the merged result before any read-receipt network work.
       * A network/cache callback must never make local history less durable.
       */
      await cacheCloudHistory(conversationId,merged);
      await persistState();

      const unreadIncoming=merged.filter(m=>!m.mine && m.state!=="read");
      if(
        !meta.fromCache &&
        state.route==="chat" &&
        String(state.selectedId)===String(conversationId)
      ){
        for(const m of unreadIncoming){
          try{ await updateCloudMessageState(conversationId,m.id,"read"); }catch{}
        }
      }

      if(state.route==="chat" && String(state.selectedId)===String(conversationId)) render();
    },
    err=>{
      firebaseError=err?.message || String(err);
      if(state.route==="settings") renderSettings();
    }
  );
}
async function initializeFirebaseLayer(){
  if(!isFirebaseConfigured()) return;
  try{
    await initFirebase(user=>{
      firebaseUser=user;
      firebaseReady=true;
      if(user){
        publishMyE2EEKey().catch(err=>console.warn("Could not publish E2EE key",err));
        beginCloudConversationSubscription();
        ensureActiveCloudMessageSubscription(true);
        if(state.online) scheduleReconnectRecovery();
      }else{
        if(cloudConversationUnsub){cloudConversationUnsub();cloudConversationUnsub=null;}
        stopCloudMessageSubscription();
      }
      if(state.route==="settings" || state.route==="messages") render();
    });
    firebaseReady=true;
    firebaseUser=getFirebaseUser();
    if(firebaseUser) publishMyE2EEKey().catch(err=>console.warn("Could not publish E2EE key",err));
    ensureActiveCloudMessageSubscription(true);
    if(firebaseUser && state.online) scheduleReconnectRecovery();
  }catch(err){
    firebaseError=err?.message || String(err);
  }
}

async function initApp(){
  /*
   * Local-first boot:
   * 1) restore durable app state
   * 2) restore encrypted cloud history
   * 3) reconstruct any queued outbound messages
   * 4) render immediately
   * 5) only then initialize Firebase as a synchronization layer
   *
   * Firebase being offline, slow, uncached, or temporarily empty must never
   * prevent already-downloaded local messages from being shown.
   */
  await loadPersistedState();
  await loadCloudHistory();
  await restoreOutboxIntoState();

  hydrated=true;
  state.online=navigator.onLine;
  render();

  initializeFirebaseLayer();
  if(state.online) flushQueued();
}

function esc(s=""){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function initials(name){ return name.split(" ").slice(0,2).map(x=>x[0]).join("").toUpperCase(); }

function icon2d(name,size=22){
  const common=`width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"`;
  const icons={
    settings:`<svg ${common}><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" opacity=".12"/><path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm0 2.1a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4Z" fill="currentColor"/><path d="M12 4.6v2M12 17.4v2M4.6 12h2M17.4 12h2M6.7 6.7l1.4 1.4M15.9 15.9l1.4 1.4M17.3 6.7l-1.4 1.4M8.1 15.9l-1.4 1.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
    info:`<svg ${common}><rect x="3" y="3" width="18" height="18" rx="6" fill="currentColor" opacity=".12"/><circle cx="12" cy="8" r="1.2" fill="currentColor"/><path d="M12 11v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    plus:`<svg ${common}><rect x="3" y="3" width="18" height="18" rx="6" fill="currentColor" opacity=".12"/><path d="M12 7v10M7 12h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    photo:`<svg ${common}><rect x="3" y="4" width="18" height="16" rx="4" fill="currentColor" opacity=".12"/><circle cx="9" cy="9" r="2" fill="currentColor"/><path d="m5.5 17 4.2-4.4 2.7 2.7 2.1-2.1 4 3.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    file:`<svg ${common}><path d="M7 3h7l4 4v14H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" fill="currentColor" opacity=".12"/><path d="M14 3v5h5M8 12h8M8 16h6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    voice:`<svg ${common}><rect x="8" y="3" width="8" height="12" rx="4" fill="currentColor" opacity=".16"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    location:`<svg ${common}><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" fill="currentColor" opacity=".14"/><circle cx="12" cy="10" r="2.5" fill="currentColor"/></svg>`,
    contact:`<svg ${common}><rect x="4" y="3" width="16" height="18" rx="4" fill="currentColor" opacity=".12"/><circle cx="12" cy="9" r="3" fill="currentColor"/><path d="M7.5 17c.8-2.3 2.4-3.5 4.5-3.5s3.7 1.2 4.5 3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    checklist:`<svg ${common}><rect x="4" y="4" width="16" height="16" rx="4" fill="currentColor" opacity=".12"/><path d="m7.5 9.5 1.5 1.5 2.5-3M13.5 10h3M7.5 15.5 9 17l2.5-3M13.5 16h3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    schedule:`<svg ${common}><rect x="4" y="5" width="16" height="15" rx="4" fill="currentColor" opacity=".12"/><path d="M8 3v4M16 3v4M4 9h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="14" r="2.4" fill="currentColor"/></svg>`,
    saved:`<svg ${common}><path d="M7 3h10a2 2 0 0 1 2 2v16l-7-4-7 4V5a2 2 0 0 1 2-2Z" fill="currentColor" opacity=".14"/><path d="m12 7 1.2 2.4 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4L12 7Z" fill="currentColor"/></svg>`,
    chats:`<svg ${common}><path d="M5 5h14a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-8l-5 4v-4H5a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z" fill="currentColor" opacity=".18"/><path d="M7 10h10M7 13.5h7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
    groups:`<svg ${common}><circle cx="9" cy="9" r="3" fill="currentColor"/><circle cx="16.5" cy="10" r="2.4" fill="currentColor" opacity=".72"/><path d="M3.5 19c.8-3.3 2.8-5 5.5-5s4.7 1.7 5.5 5" fill="currentColor" opacity=".18"/><path d="M13 18.5c.6-2.5 2-3.8 4.2-3.8 1.6 0 2.9.8 3.8 2.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
    contacts:`<svg ${common}><circle cx="12" cy="8.5" r="3.5" fill="currentColor"/><path d="M5 20c1-4 3.3-6 7-6s6 2 7 6" fill="currentColor" opacity=".2"/></svg>`,
    back:`<svg ${common}><rect x="3" y="3" width="18" height="18" rx="6" fill="currentColor" opacity=".1"/><path d="m13.5 7-5 5 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    send:`<svg ${common}><path d="M4 5.5 20 12 4 18.5l2.4-5.2L14 12l-7.6-1.3L4 5.5Z" fill="currentColor" opacity=".18"/><path d="M5 6.5 19 12 5 17.5l1.9-4.2L14 12l-7.1-1.3L5 6.5Z" fill="currentColor"/></svg>`
  };
  return icons[name]||"";
}
function toolButton(icon,label){
  return `<button class="tool"><span class="tool-icon">${icon2d(icon,24)}</span><span>${esc(label)}</span></button>`;
}

function nowTime(){ return new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}); }
function currentConversation(){ return state.conversations.find(x=>x.id===state.selectedId); }
function isGroup(c=currentConversation()){ return c?.type==="group"; }

function shellTop(title,left=`<span class="topbar-spacer"></span>`,right=`<span class="topbar-spacer"></span>`){
  return `<header class="topbar">${left}<h1>${esc(title)}</h1>${right}</header>`;
}

function applyAppearance(){
  const root=document.documentElement;
  root.classList.remove("text-a","text-aplus","text-aplusplus");
  const textSize=state.settings.textSize || "normal";
  root.classList.add(textSize==="large" ? "text-aplus" : textSize==="xlarge" ? "text-aplusplus" : "text-a");
  const prefersDark=window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const effective=state.settings.appearance==="auto" ? (prefersDark?"dark":"light") : state.settings.appearance;
  root.dataset.theme=effective;
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute("content", effective==="dark" ? "#182127" : "#ffffff");
}

function isWideLayout(){
  return window.matchMedia && window.matchMedia("(min-width: 820px)").matches;
}
function renderConversationSidebar(){
  return `
    <aside class="tablet-sidebar">
      <div class="tablet-brand-row">
        <div>
          <div class="tablet-brand-name">FIDUNIO</div>
          <div class="tablet-brand-sub">Private Messaging</div>
        </div>
        <div class="tablet-brand-actions">
          <button class="icon-btn icon-2d" id="tabletSettingsBtn" aria-label="Settings">${icon2d("settings",23)}</button>
          <button class="icon-btn icon-2d" id="tabletNewBtn" aria-label="New conversation">${icon2d("plus",23)}</button>
        </div>
      </div>
      <div class="tablet-search-wrap">
        <input class="search" id="tabletSearchBox" placeholder="Search conversations" />
      </div>
      <div class="tablet-conversation-list" id="tabletConversationList"></div>
      <nav class="tablet-bottom-nav" aria-label="FIDUNIO sections">
        <button class="tablet-nav-item active" id="tabletMessagesNav">${icon2d("chats",22)}<span>Messages</span></button>
        <button class="tablet-nav-item" id="tabletGroupsNav">${icon2d("groups",22)}<span>Groups</span></button>
        <button class="tablet-nav-item" id="tabletContactsNav">${icon2d("contacts",22)}<span>Contacts</span></button>
        <button class="tablet-nav-item" id="tabletSettingsNav">${icon2d("settings",22)}<span>Settings</span></button>
      </nav>
    </aside>`;
}
function drawTabletConversationList(term=""){
  const list=document.querySelector("#tabletConversationList");
  if(!list) return;
  list.innerHTML=state.conversations
    .filter(c=>c.name.toLowerCase().includes(term.toLowerCase())||c.preview.toLowerCase().includes(term.toLowerCase()))
    .map(c=>`
      <button class="tablet-conversation ${String(c.id)===String(state.selectedId)?"active":""}" data-id="${c.id}">
        <div class="avatar ${c.type==="group"?"group-avatar":""}">${initials(c.name)}</div>
        <div class="tablet-conversation-main">
          <div class="tablet-row-top"><span class="name">${esc(c.name)}</span><span class="meta">${esc(c.time)}</span></div>
          <div class="preview">${c.type==="group"?"Group • ":""}${esc(c.preview)}</div>
        </div>
      </button>`).join("");
  list.querySelectorAll(".tablet-conversation").forEach(btn=>btn.onclick=()=>{
    const raw=btn.dataset.id;
    state.selectedId=/^\d+$/.test(raw)?Number(raw):raw;
    state.route="chat";
    const chosen=state.conversations.find(x=>String(x.id)===String(state.selectedId));
    if(chosen) chosen.unread=0;
    if(chosen?.cloud) beginCloudMessageSubscription(chosen.id,{force:true});
    else stopCloudMessageSubscription();
    render();
  });
}

function render(){
  persistSoon();
  document.querySelectorAll(".modal-backdrop").forEach(el=>el.remove());
  applyAppearance();
  if(!state.unlocked) return renderUnlock();
  const routes={
    messages:renderMessages, chat:renderChat, settings:renderSettings,
    newConversation:renderNewConversation, newGroup:renderNewGroup,
    groupName:renderGroupName, groupInfo:renderGroupInfo
  };
  (routes[state.route]||renderMessages)();
  if(state.modal) renderModal();
}

function renderUnlock(){
  app.innerHTML=`
    <main class="app-shell unlock">
      <section class="unlock-card">
        <div class="unlock-brand"><img class="brand-logo" src="fidunio-logo.png" alt="Fidunio logo"></div>
        <h1>Fidunio</h1>
        <p>Secure access prototype. Production will use passkeys/device authentication where supported.</p>
        <button class="primary" id="unlockBtn">Unlock with device</button>
        <button class="secondary" id="pinBtn">Use PIN instead</button>
        <div class="small-note">FIDUNIO ${esc(FIDUNIO_VERSION)} — biometric/PIN validation remains a prototype feature.</div>
      </section>
    </main>`;
  document.querySelector("#unlockBtn").onclick=()=>{state.unlocked=true;render()};
  document.querySelector("#pinBtn").onclick=()=>{state.unlocked=true;render()};
}

function renderMessages(){
  if(isWideLayout()){
    let chosen=state.conversations.find(c=>String(c.id)===String(state.selectedId));
    if(!chosen) chosen=state.conversations[0]||null;
    if(chosen){
      state.selectedId=chosen.id;
      state.route="chat";
      chosen.unread=0;
      if(chosen.cloud) beginCloudMessageSubscription(chosen.id,{force:true});
      else stopCloudMessageSubscription();
      return renderChat();
    }
  }

  app.innerHTML=`
    <main class="app-shell">
      ${shellTop("Messages",undefined,'<button class="icon-btn icon-2d" id="settingsBtn" aria-label="Settings">'+icon2d("settings",23)+'</button>')}
      <section class="content">
        <input class="search" id="searchBox" placeholder="Search conversations" />
        <div class="conversation-list" id="conversationList"></div>
      </section>
      <button class="fab icon-2d" id="newBtn" aria-label="New conversation">${icon2d("plus",26)}</button>
    </main>`;
  document.querySelector("#settingsBtn").onclick=()=>{state.route="settings";render()};
  document.querySelector("#newBtn").onclick=()=>{state.route="newConversation";render()};
  const list=document.querySelector("#conversationList");
  const draw=(term="")=>{
    list.innerHTML=state.conversations
      .filter(c=>c.name.toLowerCase().includes(term.toLowerCase())||c.preview.toLowerCase().includes(term.toLowerCase()))
      .map(c=>`
        <button class="conversation" data-id="${c.id}">
          <div class="avatar ${c.type==="group"?"group-avatar":""}">${initials(c.name)}</div>
          <div>
            <div class="name">${esc(c.name)}</div>
            <div class="preview">${c.type==="group"?"Group • ":""}${esc(c.preview)}</div>
          </div>
          <div class="meta">${esc(c.time)}${c.unread?`<div class="badge">${c.unread}</div>`:""}</div>
        </button>`).join("");
    list.querySelectorAll(".conversation").forEach(btn=>btn.onclick=()=>{
      const raw=btn.dataset.id;
      state.selectedId=/^\d+$/.test(raw)?Number(raw):raw;
      state.route="chat";
      const chosen=state.conversations.find(x=>String(x.id)===String(state.selectedId));
      if(chosen) chosen.unread=0;
      if(chosen?.cloud) beginCloudMessageSubscription(chosen.id,{force:true}); else stopCloudMessageSubscription();
      render();
    });
  };
  draw();
  document.querySelector("#searchBox").oninput=e=>draw(e.target.value);
}

function renderNewConversation(){
  const cloudEnabled=isFirebaseConfigured() && firebaseUser;
  app.innerHTML=`
    <main class="app-shell">
      ${shellTop("New Message",'<button class="back-btn" id="backBtn">‹</button>')}
      <section class="content">
        <div class="action-sheet">
          <button class="big-choice" id="newGroupBtn">
            <span class="choice-icon">👥</span>
            <span><strong>New Group</strong><span>Create a secure group conversation</span></span>
          </button>
        </div>

        <div class="card">
          <h2>FIDUNIO ID — ${esc(FIDUNIO_VERSION)} test</h2>
          ${cloudEnabled ? `
            <p class="small-note">Enter the other test account's Firebase UID. This creates a real Firestore one-to-one conversation.</p>
            <label class="form-label" for="peerUid">Recipient FIDUNIO ID</label>
            <input class="text-input" id="peerUid" autocomplete="off" placeholder="Paste recipient UID" />
            <button class="primary" id="cloudDirectBtn">Start Cloud Conversation</button>
            <p class="warning-note">New cloud direct messages use the ${esc(FIDUNIO_VERSION)} E2EE foundation. Use test messages only until identity verification and multi-device key handling are complete.</p>
          ` : `
            <p class="small-note">To start real two-device messaging, configure Firebase and sign in under Settings → Firebase Account.</p>
          `}
        </div>

        <div class="section-title">Sample local contacts</div>
        <div class="choice-list">
          ${contacts.map(p=>`
            <button class="member-option direct-contact" data-id="${p.id}">
              <div class="avatar">${initials(p.name)}</div>
              <div><strong>${esc(p.name)}</strong><div class="preview">Local prototype contact</div></div>
              <span>›</span>
            </button>`).join("")}
        </div>
      </section>
    </main>`;
  document.querySelector("#backBtn").onclick=()=>{stopCloudMessageSubscription();state.route="messages";render()};
  document.querySelector("#newGroupBtn").onclick=()=>{
    state.newGroupMembers=[];state.newGroupName="";state.route="newGroup";render();
  };
  const cloudBtn=document.querySelector("#cloudDirectBtn");
  if(cloudBtn) cloudBtn.onclick=async()=>{
    const peerUid=document.querySelector("#peerUid").value.trim();
    if(!peerUid) return alert("Paste the recipient FIDUNIO ID first.");
    if(peerUid===firebaseUser.uid) return alert("Use the FIDUNIO ID from the other test account.");
    cloudBtn.disabled=true;cloudBtn.textContent="Connecting…";
    try{
      const remote=await startDirectConversation(peerUid);
      mergeCloudConversation(remote);
      state.selectedId=remote.id;
      state.route="chat";
      beginCloudMessageSubscription(remote.id,{force:true});
      persistSoon();
      render();
    }catch(err){
      alert("Could not create the cloud conversation: "+(err?.message||err));
      cloudBtn.disabled=false;cloudBtn.textContent="Start Cloud Conversation";
    }
  };
  document.querySelectorAll(".direct-contact").forEach(btn=>btn.onclick=()=>alert(`These sample contacts remain local prototype data. Use FIDUNIO ID above for the ${FIDUNIO_VERSION} two-device test.`));
}
function renderNewGroup(){
  app.innerHTML=`
    <main class="app-shell">
      ${shellTop("New Group",'<button class="back-btn" id="backBtn">‹</button>','<button class="text-btn" id="nextBtn">Next</button>')}
      <section class="content">
        <input class="search" id="memberSearch" placeholder="Search people" />
        <div class="chip-row" id="selectedChips"></div>
        <div class="choice-list" id="memberChoices"></div>
      </section>
    </main>`;
  document.querySelector("#backBtn").onclick=()=>{state.route="newConversation";render()};
  const draw=(term="")=>{
    const selected=new Set(state.newGroupMembers);
    document.querySelector("#selectedChips").innerHTML=state.newGroupMembers.length
      ? contacts.filter(p=>selected.has(p.id)).map(p=>`<span class="person-chip">${esc(p.name)}</span>`).join("")
      : `<span class="small-note">Select at least 2 people for the group.</span>`;
    document.querySelector("#memberChoices").innerHTML=contacts
      .filter(p=>p.name.toLowerCase().includes(term.toLowerCase()))
      .map(p=>`
        <button class="member-option ${selected.has(p.id)?"selected":""}" data-id="${p.id}">
          <div class="avatar">${initials(p.name)}</div>
          <div><strong>${esc(p.name)}</strong><div class="preview">Secure contact</div></div>
          <div class="checkmark">${selected.has(p.id)?"✓":""}</div>
        </button>`).join("");
    document.querySelectorAll("#memberChoices .member-option").forEach(btn=>btn.onclick=()=>{
      const id=btn.dataset.id;
      state.newGroupMembers=selected.has(id)?state.newGroupMembers.filter(x=>x!==id):[...state.newGroupMembers,id];
      draw(document.querySelector("#memberSearch").value);
    });
    document.querySelector("#nextBtn").disabled=state.newGroupMembers.length<2;
  };
  draw();
  document.querySelector("#memberSearch").oninput=e=>draw(e.target.value);
  document.querySelector("#nextBtn").onclick=()=>{ if(state.newGroupMembers.length>=2){state.route="groupName";render();} };
}

function renderGroupName(){
  const selected=contacts.filter(p=>state.newGroupMembers.includes(p.id));
  app.innerHTML=`
    <main class="app-shell">
      ${shellTop("Group Details",'<button class="back-btn" id="backBtn">‹</button>')}
      <section class="content">
        <div class="card">
          <label class="form-label" for="groupNameInput">Group name</label>
          <input class="text-input" id="groupNameInput" maxlength="50" placeholder="Enter a group name" value="${esc(state.newGroupName)}" />
          <div class="section-title">Members</div>
          <div class="chip-row">${selected.map(p=>`<span class="person-chip">${esc(p.name)}</span>`).join("")}</div>
          <p class="small-note">New members see messages only from the time they join. Earlier history stays private unless an admin explicitly grants access.</p>
        </div>
        <button class="primary" id="createGroupBtn">Create Group</button>
      </section>
    </main>`;
  document.querySelector("#backBtn").onclick=()=>{state.route="newGroup";render()};
  const input=document.querySelector("#groupNameInput");
  const btn=document.querySelector("#createGroupBtn");
  const validate=()=>{state.newGroupName=input.value;btn.disabled=!input.value.trim()};
  input.oninput=validate;validate();
  btn.onclick=()=>{
    const id=Math.max(...state.conversations.map(c=>c.id))+1;
    const memberObjs=[
      {id:"me",name:"You",role:"Owner",joinedAt:"Created group",historyAccess:"all"},
      ...selected.map(p=>({id:p.id,name:p.name,role:"Member",joinedAt:"At group creation",historyAccess:"from_join"}))
    ];
    state.conversations.unshift({
      id,type:"group",name:state.newGroupName.trim(),unread:0,preview:"Group created",time:nowTime(),ownerId:"me",members:memberObjs
    });
    state.messages[id]=[
      {id:crypto.randomUUID(),system:true,text:`Group created with ${selected.length+1} members`,time:nowTime()}
    ];
    state.selectedId=id;state.route="chat";render();
  };
}

function renderChat(){
  const c=currentConversation();
  const msgs=state.messages[state.selectedId]||[];
  const chatMarkup=`
      <header class="topbar">
        <button class="back-btn icon-2d" id="backBtn" aria-label="Back">${icon2d("back",23)}</button>
        <div class="chat-header-title">
          <strong>${esc(c.name)}</strong>
          <span class="secure">● ${c.cloud?"Cloud":isGroup(c)?`${c.members.length} members • Secure`:"Secure"}</span>
        </div>
        <button class="icon-btn icon-2d" id="infoBtn" aria-label="Info">${icon2d("info",23)}</button>
      </header>
      ${state.online?"":'<div class="status-banner">Offline — messages will be queued and sent automatically when connection returns.</div>'}
      ${c.cloud?`<div class="warning-banner">FIDUNIO ${esc(FIDUNIO_VERSION)} E2EE + key verification foundation — test messages only until verified per-device fan-out and forward secrecy are complete.</div>`:""}
      ${c.cloud && currentConversationSecurityStatus(c)==="changed"
        ? '<div class="status-banner">Security warning — this contact\'s previously verified encryption key changed. Verify the new fingerprint before sending.</div>'
        : c.cloud && currentConversationSecurityStatus(c)==="changed-unverified"
          ? '<div class="info-banner">Encryption key changed since first seen. Open Conversation Security to review the current fingerprint.</div>'
          : c.cloud && currentConversationSecurityStatus(c)==="verified"
            ? '<div class="info-banner">Encryption key verified on this device.</div>'
            : ""}
      ${isGroup(c)?'<div class="info-banner">New members see conversation only from their join time unless an admin explicitly grants earlier history.</div>':""}
      <section class="chat" id="chatArea">${msgs.map(m=>renderBubble(m,c)).join("")}</section>
      <section class="composer-wrap">
        <div class="quick-row">${state.quickPhrases.map(q=>`<button class="quick-chip" data-quick="${esc(q)}">${esc(q)}</button>`).join("")}</div>
        <div class="compose-line">
          <button class="more-btn icon-2d" id="moreBtn" aria-label="More tools">${icon2d("plus",24)}</button>
          <textarea id="messageBox" rows="1" placeholder="Type a message…"></textarea>
          <button class="send-btn icon-2d" id="sendBtn" aria-label="Send">${icon2d("send",24)}</button>
        </div>
        <div class="tool-panel ${state.toolsOpen?"open":""}" id="toolPanel">
          ${toolButton("photo","Photo")}${toolButton("file","File")}
          ${toolButton("voice","Voice")}${toolButton("location","Location")}
          ${toolButton("contact","Contact")}${toolButton("checklist","Checklist")}
          ${toolButton("schedule","Schedule")}${toolButton("saved","Saved")}
        </div>
      </section>`;
  if(isWideLayout()){
    app.innerHTML=`<main class="app-shell tablet-shell">${renderConversationSidebar()}<section class="tablet-chat-pane">${chatMarkup}</section></main>`;
    drawTabletConversationList();
    const tSearch=document.querySelector("#tabletSearchBox");
    if(tSearch) tSearch.oninput=e=>drawTabletConversationList(e.target.value);
    const tSettings=document.querySelector("#tabletSettingsBtn");
    if(tSettings) tSettings.onclick=()=>{state.route="settings";render()};
    const tNew=document.querySelector("#tabletNewBtn");
    if(tNew) tNew.onclick=()=>{state.route="newConversation";render()};
    const tMessages=document.querySelector("#tabletMessagesNav");
    if(tMessages) tMessages.onclick=()=>{};
    const tGroups=document.querySelector("#tabletGroupsNav");
    if(tGroups) tGroups.onclick=()=>{state.selectedId=state.conversations.find(x=>x.type==="group")?.id||state.selectedId;state.route="chat";render()};
    const tContacts=document.querySelector("#tabletContactsNav");
    if(tContacts) tContacts.onclick=()=>{state.route="newConversation";render()};
    const tSettingsNav=document.querySelector("#tabletSettingsNav");
    if(tSettingsNav) tSettingsNav.onclick=()=>{state.route="settings";render()};
  }else{
    app.innerHTML=`<main class="app-shell">${chatMarkup}</main>`;
  }
  document.querySelector("#backBtn").onclick=()=>{state.route="messages";render()};
  document.querySelector("#infoBtn").onclick=async()=>{
    if(isGroup(c)){state.route="groupInfo";return render();}
    if(c?.cloud){
      await peerPublicKeyForConversation(c.id,{refresh:true});
      state.modal={type:"conversationSecurity",peerUid:c.peerUid,conversationId:c.id};
      return render();
    }
    alert("Conversation details remain a UX placeholder.");
  };
  document.querySelector("#moreBtn").onclick=()=>{state.toolsOpen=!state.toolsOpen;render()};
  document.querySelectorAll(".quick-chip").forEach(btn=>btn.onclick=()=>{
    const box=document.querySelector("#messageBox");box.value=btn.dataset.quick;box.focus();
  });
  document.querySelectorAll(".tool").forEach(btn=>btn.onclick=()=>alert(`${btn.textContent.trim()} is a UX placeholder in FIDUNIO ${FIDUNIO_VERSION}.`));
  const box=document.querySelector("#messageBox");
  box.addEventListener("input",()=>{box.style.height="46px";box.style.height=Math.min(box.scrollHeight,120)+"px"});
  document.querySelector("#sendBtn").onclick=sendCurrent;
  box.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendCurrent()}});
  requestAnimationFrame(()=>{const a=document.querySelector("#chatArea");a.scrollTop=a.scrollHeight;window.scrollTo(0,document.body.scrollHeight)});
}

function renderBubble(m,c){
  if(m.system) return `<div class="day-divider">${esc(m.text)} • ${esc(m.time)}</div>`;
  const label=m.state==="queued"?"Queued":m.state==="sending"?"Sending":m.state==="sent"?"Sent":
    m.state==="delivered"?"Delivered":m.state==="failed"?"Failed":"Read";
  const cls=m.state==="queued"?"state-queued":m.state==="failed"?"state-failed":"";
  return `<div class="msg-row ${m.mine?"mine":""}">
    ${c.type==="group"&&!m.mine&&m.sender?`<div class="sender-label">${esc(m.sender)}</div>`:""}
    <div class="bubble">
      <div class="msg-text">${esc(m.text)}</div>
      <div class="msg-meta"><span>${esc(m.time)}</span>${m.mine?`<span class="${cls}">${label}</span>`:""}</div>
    </div>
  </div>`;
}

async function sendCurrent(){
  const box=document.querySelector("#messageBox");
  const text=box.value.trim();
  if(!text) return;

  const conversationId=state.selectedId;
  const c=currentConversation();
  const cloud=!!c?.cloud;

  if(cloud && c?.peerUid){
    await peerPublicKeyForConversation(conversationId,{refresh:true});
    if(peerTrustStatus(c.peerUid)==="changed"){
      state.modal={type:"conversationSecurity",peerUid:c.peerUid,conversationId};
      render();
      return;
    }
  }

  const m={
    id:crypto.randomUUID(),
    mine:true,
    text,
    time:nowTime(),
    state:(state.online && (!cloud || firebaseUser))?"sending":"queued",
    cloud
  };

  if(!state.messages[conversationId]) state.messages[conversationId]=[];
  state.messages[conversationId].push(m);
  c.preview=text;
  c.time=m.time;

  // The Outbox is authoritative. Do not return from Send until the
  // encrypted queued record is durably committed to IndexedDB.
  await queueOutboxMessage(conversationId,m);
  await persistState();
  render();

  if(state.online){
    if(cloud){
      await flushQueued();
    }else{
      await removeOutboxMessage(m.id);
      simulateDelivery(conversationId,m.id);
    }
  }
}

function simulateDelivery(conversationId,id){
  setTimeout(()=>updateMessageState(conversationId,id,"sent"),700);
  setTimeout(()=>updateMessageState(conversationId,id,"delivered"),1500);
  setTimeout(()=>updateMessageState(conversationId,id,"read"),2600);
}
function updateMessageState(conversationId,id,newState){
  const arr=state.messages[conversationId]||[];
  const m=arr.find(x=>x.id===id);
  if(!m) return;
  m.state=newState;
  persistSoon();
  if(state.route==="chat"&&String(state.selectedId)===String(conversationId)) render();
}
async function flushQueued(){
  if(!state.online) return;

  let records=[];
  try{
    records=await getOutboxRecords();
  }catch(err){
    console.warn("Outbox read failed",err);
    return;
  }

  for(const [i,record] of records.entries()){
    let payload;
    try{
      payload=await decryptOutboxRecord(record);
    }catch(err){
      console.warn("Outbox decrypt failed; record preserved for recovery",record?.id,err);
      continue;
    }

    // Never delete an Outbox record merely because the normal message cache
    // is missing. Rebuild the visible message from the encrypted Outbox.
    const {c,m}=ensureQueuedMessageFromPayload(payload);
    const isCloud=payload.cloud || !!c?.cloud;

    if(isCloud){
      if(!firebaseUser){
        m.state="queued";
        await persistState();
        continue;
      }
      try{
        m.state="sending";
        await persistState();
        if(state.route==="chat"&&String(state.selectedId)===String(payload.conversationId)) render();

        const peerKey=await peerPublicKeyForConversation(payload.conversationId,{refresh:true});
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
        });

        m.state="sent";
        // Remove the Outbox item only after Firestore confirms the write.
        await removeOutboxMessage(payload.messageId);
        await persistState();
      }catch(err){
        // Preserve the Outbox record. A later foreground/online/auth event
        // can retry it without losing the message.
        m.state="failed";
        firebaseError=err?.message || String(err);
        await persistState();
      }
    }else{
      m.state="sending";
      await persistState();
      await removeOutboxMessage(payload.messageId);
      setTimeout(()=>updateMessageState(payload.conversationId,m.id,"sent"),500+i*150);
      setTimeout(()=>updateMessageState(payload.conversationId,m.id,"delivered"),1200+i*150);
      setTimeout(()=>updateMessageState(payload.conversationId,m.id,"read"),2200+i*150);
    }
  }

  render();
}
let reconnectRecoveryTimer1=null;
let reconnectRecoveryTimer2=null;
function scheduleReconnectRecovery(){
  if(reconnectRecoveryTimer1) clearTimeout(reconnectRecoveryTimer1);
  if(reconnectRecoveryTimer2) clearTimeout(reconnectRecoveryTimer2);

  // iOS/Safari may fire "online" slightly before Firebase can complete a
  // request. Flush now, then make two conservative retries. Outbox
  // idempotency keeps this safe; successful records are removed only after
  // Firestore confirms the write.
  flushQueued();
  reconnectRecoveryTimer1=setTimeout(()=>{
    if(state.online && firebaseUser) flushQueued();
  },1500);
  reconnectRecoveryTimer2=setTimeout(()=>{
    if(state.online && firebaseUser) flushQueued();
  },4000);
}
function recoverForegroundCloudSession(){
  state.online=navigator.onLine;
  // Lifecycle recovery is one of the few times we deliberately replace the
  // listener. Normal conversation metadata snapshots no longer restart it.
  ensureActiveCloudMessageSubscription(true);
  if(state.online) scheduleReconnectRecovery();
  render();
}
window.addEventListener("online",()=>{
  state.online=true;
  ensureActiveCloudMessageSubscription(true);
  render();
  scheduleReconnectRecovery();
});
window.addEventListener("offline",()=>{
  state.online=false;
  if(reconnectRecoveryTimer1) clearTimeout(reconnectRecoveryTimer1);
  if(reconnectRecoveryTimer2) clearTimeout(reconnectRecoveryTimer2);
  persistSoon();
  render();
});
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible") recoverForegroundCloudSession();
});

let lastWideLayout=isWideLayout();
window.addEventListener("resize",()=>{
  const nowWide=isWideLayout();
  if(nowWide!==lastWideLayout){
    lastWideLayout=nowWide;
    if(state.unlocked && (state.route==="chat" || state.route==="messages")) render();
  }
});

window.addEventListener("pageshow",recoverForegroundCloudSession);

function renderGroupInfo(){
  const c=currentConversation();
  if(!c||c.type!=="group"){state.route="chat";return render()}
  app.innerHTML=`
    <main class="app-shell">
      ${shellTop("Group Info",'<button class="back-btn" id="backBtn">‹</button>')}
      <section class="content">
        <div class="card" style="text-align:center">
          <div class="avatar group-avatar" style="margin:0 auto 10px">${initials(c.name)}</div>
          <h2 style="font-size:22px;margin:0">${esc(c.name)}</h2>
          <p class="small-note">${c.members.length} members • Secure group</p>
          <button class="secondary" id="renameBtn">Rename Group</button>
        </div>
        <div class="card">
          <h2>Members</h2>
          ${c.members.map(m=>`
            <div class="member-card">
              <div class="avatar">${initials(m.name)}</div>
              <div class="row-main">
                <strong>${esc(m.name)}</strong>
                <span>${esc(m.joinedAt)}</span>
                ${m.historyAccess==="from_join"?'<span class="history-lock">Earlier history hidden</span>':
                  m.historyAccess==="all"?'<span class="history-lock">Earlier history available</span>':""}
              </div>
              <div>${m.role!=="Member"?`<span class="role-tag">${esc(m.role)}</span>`:
                `<button class="row-action historyBtn" data-id="${m.id}">History</button>`}</div>
            </div>`).join("")}
          <button class="secondary" id="addMemberBtn">＋ Add Member</button>
        </div>
        <div class="card">
          <h2>Group Controls</h2>
          <div class="row"><div class="row-main"><strong>Mute notifications</strong><span>Silence alerts for this group</span></div><button class="toggle"></button></div>
          <div class="row"><div class="row-main"><strong>Search messages</strong><span>Find text in this conversation</span></div><button class="row-action placeholderBtn">Open</button></div>
          <div class="row"><div class="row-main"><strong>Shared photos & files</strong><span>View shared attachments</span></div><button class="row-action placeholderBtn">Open</button></div>
          <div class="row"><div class="row-main"><strong>Security information</strong><span>Member keys and group-key status</span></div><button class="row-action placeholderBtn">View</button></div>
        </div>
        <button class="danger-btn" id="leaveBtn">Leave Group</button>
      </section>
    </main>`;
  document.querySelector("#backBtn").onclick=()=>{state.route="chat";render()};
  document.querySelector("#renameBtn").onclick=()=>{
    const name=prompt("Rename group:",c.name);
    if(name?.trim()){c.name=name.trim();render()}
  };
  document.querySelector("#addMemberBtn").onclick=()=>openAddMemberModal();
  document.querySelectorAll(".historyBtn").forEach(btn=>btn.onclick=()=>openHistoryModal(btn.dataset.id));
  document.querySelectorAll(".placeholderBtn").forEach(btn=>btn.onclick=()=>alert("This control is represented for UX review and will be implemented in a later prototype."));
  document.querySelector(".toggle").onclick=e=>e.currentTarget.classList.toggle("on");
  document.querySelector("#leaveBtn").onclick=()=>alert(`Leave Group is a UX placeholder in FIDUNIO ${FIDUNIO_VERSION}.`);
}

function openAddMemberModal(){
  const c=currentConversation();
  const currentIds=new Set(c.members.map(m=>m.id));
  const available=contacts.filter(p=>!currentIds.has(p.id));
  state.modal={
    type:"addMember",
    options:available,
    selected:available[0]?.id||null
  };
  render();
}

function openHistoryModal(memberId){
  const c=currentConversation();
  const member=c.members.find(m=>m.id===memberId);
  if(!member)return;
  state.modal={type:"history",memberId,historyChoice:member.historyAccess==="all"?"all":"24h"};
  render();
}

function renderModal(){
  const modal=state.modal;
  const host=document.createElement("div");
  host.className="modal-backdrop";
  if(modal.type==="addMember"){
    host.innerHTML=`
      <div class="modal">
        <h2>Add Member</h2>
        <p>New members begin with access only from the time they join.</p>
        ${modal.options.length?`
          <div class="choice-list">
            ${modal.options.map(p=>`
              <label class="member-option">
                <div class="avatar">${initials(p.name)}</div>
                <div><strong>${esc(p.name)}</strong><div class="preview">No earlier history by default</div></div>
                <input type="radio" name="newMember" value="${p.id}" ${modal.selected===p.id?"checked":""}>
              </label>`).join("")}
          </div>
          <div class="modal-actions">
            <button class="modal-cancel" id="modalCancel">Cancel</button>
            <button class="modal-confirm" id="modalConfirm">Add Member</button>
          </div>`:
          `<p>No additional sample contacts are available in this prototype.</p><button class="secondary" id="modalCancel">Close</button>`}
      </div>`;
    document.body.appendChild(host);
    host.querySelectorAll('input[name="newMember"]').forEach(r=>r.onchange=()=>state.modal.selected=r.value);
    host.querySelector("#modalCancel").onclick=()=>{state.modal=null;host.remove();render()};
    const confirm=host.querySelector("#modalConfirm");
    if(confirm) confirm.onclick=()=>{
      const p=contacts.find(x=>x.id===state.modal.selected);
      if(p){
        const c=currentConversation();
        c.members.push({id:p.id,name:p.name,role:"Member",joinedAt:`Joined ${nowTime()}`,historyAccess:"from_join"});
        state.messages[c.id].push({id:crypto.randomUUID(),system:true,text:`${p.name} joined the group • Earlier messages hidden by default`,time:nowTime()});
        c.preview=`${p.name} joined the group`;c.time=nowTime();
      }
      state.modal=null;render();
    };
  } else if(modal.type==="conversationSecurity"){
    const c=state.conversations.find(x=>String(x.id)===String(modal.conversationId));
    const peerUid=modal.peerUid || c?.peerUid || null;
    const trust=peerTrustRecord(peerUid);
    const status=peerTrustStatus(peerUid);
    const fp=trust?.observedFingerprint||"";
    let peerDevices=[];
    let devicesError="";
    host.innerHTML=`
      <div class="modal">
        <h2>Conversation Security</h2>
        <p><strong>${esc(c?.name||"FIDUNIO contact")}</strong></p>
        <p class="small-note">Compare this fingerprint with your contact using a separate trusted channel, such as an in-person comparison or a call you already trust.</p>
        <label class="form-label">Current public-key fingerprint</label>
        <div class="uid-box">${esc(fp?formatFingerprint(fp):"Key unavailable")}</div>
        <div class="permission-box">
          <div class="row-main">
            <strong>Status</strong>
            <span>${status==="verified"?"Verified on this device":
              status==="changed"?"VERIFIED KEY CHANGED — sending is paused":
              status==="changed-unverified"?"Key changed since first seen":
              status==="unverified"?"Not yet verified":"Key unavailable"}</span>
          </div>
          ${trust?.verifiedFingerprint && trust.verifiedFingerprint!==trust.observedFingerprint ? `
            <div class="row-main">
              <strong>Previously verified</strong>
              <span class="fingerprint-small">${esc(formatFingerprint(trust.verifiedFingerprint))}</span>
            </div>`:""}
        </div>
        <div id="peerDeviceSummary"><p class="small-note">Checking registered devices…</p></div>
        <p class="warning-note">Verification is local to this installation in 0.8.1. It does not yet provide automatic QR/device linking or per-device recipient encryption.</p>
        <div class="modal-actions">
          <button class="modal-cancel" id="modalCancel">Close</button>
          ${fp && status!=="verified" ? '<button class="modal-confirm" id="verifyPeerBtn">Verify Current Key</button>' : ""}
        </div>
      </div>`;
    document.body.appendChild(host);
    host.querySelector("#modalCancel").onclick=()=>{state.modal=null;host.remove();render()};
    const verifyBtn=host.querySelector("#verifyPeerBtn");
    if(verifyBtn) verifyBtn.onclick=async()=>{
      await verifyCurrentPeerKey(peerUid);
      state.modal=null;
      host.remove();
      peerKeyCache.delete(peerUid);
      render();
      if(state.online) flushQueued();
    };
    if(peerUid){
      getCloudUserDevices(peerUid).then(async rows=>{
        peerDevices=rows||[];
        const summary=host.querySelector("#peerDeviceSummary");
        if(!summary) return;
        const matches=[];
        for(const d of peerDevices){
          try{
            const dfp=d.fingerprint || await publicKeyFingerprint(d.publicJwk);
            if(dfp===fp) matches.push(d);
          }catch{}
        }
        summary.innerHTML=`<p class="small-note">Registered devices for this contact: ${peerDevices.length}${matches.length?` • Current compatibility key matches ${matches.length} registered device${matches.length===1?"":"s"}.`:""}</p>`;
      }).catch(err=>{
        devicesError=err?.message||String(err);
        const summary=host.querySelector("#peerDeviceSummary");
        if(summary) summary.innerHTML=`<p class="small-note">Could not read contact device registry: ${esc(devicesError)}</p>`;
      });
    }
  } else if(modal.type==="history"){
    const c=currentConversation();
    const member=c.members.find(m=>m.id===modal.memberId);
    host.innerHTML=`
      <div class="modal">
        <h2>History Access</h2>
        <p>${esc(member.name)} normally sees messages only from the time they joined. As admin, you can explicitly grant earlier history.</p>
        <div class="permission-box">
          ${[
            ["24h","Last 24 hours"],
            ["7d","Last 7 days"],
            ["date","From selected date"],
            ["all","Entire available history"]
          ].map(([v,label])=>`
            <label class="radio-row">
              <input type="radio" name="history" value="${v}" ${modal.historyChoice===v?"checked":""}>
              <span><strong>${label}</strong>${v==="all"?'<div class="small-note">Shares all historical material available to the group.</div>':""}</span>
            </label>`).join("")}
        </div>
        <div class="modal-actions">
          <button class="modal-cancel" id="modalCancel">Cancel</button>
          <button class="modal-confirm" id="modalConfirm">Grant Access</button>
        </div>
      </div>`;
    document.body.appendChild(host);
    host.querySelectorAll('input[name="history"]').forEach(r=>r.onchange=()=>state.modal.historyChoice=r.value);
    host.querySelector("#modalCancel").onclick=()=>{state.modal=null;host.remove();render()};
    host.querySelector("#modalConfirm").onclick=()=>{
      const granted=state.modal.historyChoice;
      member.historyAccess=granted==="all"?"all":granted;
      state.modal=null;
      host.remove();
      render();
    };
  }
  host.onclick=e=>{if(e.target===host){state.modal=null;host.remove();render()}};
}

function renderSettings(){
  app.innerHTML=`
    <main class="app-shell">
      ${shellTop("Settings",'<button class="back-btn" id="backBtn">‹</button>')}
      <section class="content settings">
        <div class="card"><h2>Privacy & Access</h2>
          ${settingRow("Biometric / passkey unlock","autoLock")}
          ${settingRow("Notification message previews","previews")}
        </div>

        <div class="card">
          <h2>Text Size</h2>
          <div class="row-main">
            <strong>Reading size</strong>
            <span>Choose the text size used throughout Fidunio.</span>
          </div>
          <div class="text-size-options" role="group" aria-label="Text size">
            <button class="text-size-btn ${state.settings.textSize==="normal"?"active":""}" data-text-size="normal">A</button>
            <button class="text-size-btn ${state.settings.textSize==="large"?"active":""}" data-text-size="large">A+</button>
            <button class="text-size-btn ${state.settings.textSize==="xlarge"?"active":""}" data-text-size="xlarge">A++</button>
          </div>
          <p class="small-note">A is standard, A+ is large, and A++ is extra large. The setting applies throughout Fidunio.</p>
        </div>

        <div class="card">
          <h2>Appearance</h2>
          <div class="row-main">
            <strong>Day / Night display</strong>
            <span>Auto follows the device or browser appearance and updates when it changes.</span>
          </div>
          <div class="appearance-options">
            <button class="appearance-btn ${state.settings.appearance==="auto"?"active":""}" data-appearance="auto">Auto</button>
            <button class="appearance-btn ${state.settings.appearance==="light"?"active":""}" data-appearance="light">Light</button>
            <button class="appearance-btn ${state.settings.appearance==="dark"?"active":""}" data-appearance="dark">Dark</button>
          </div>
        </div>

        <div class="card"><h2>Data</h2>${settingRow("Large attachments on Wi-Fi only","wifiAttachments")}</div>

        <div class="card">
          <h2>Firebase Account</h2>
          ${!isFirebaseConfigured() ? `
            <p class="small-note"><strong>Not configured.</strong> Complete the current Firebase setup instructions, then verify the existing configured <code>firebase-config.js</code>.</p>
          ` : firebaseUser ? `
            <p class="small-note"><strong>Signed in:</strong> ${esc(firebaseUser.email||"Firebase user")}</p>
            <label class="form-label">Your FIDUNIO ID</label>
            <div class="uid-box">${esc(firebaseUser.uid)}</div>
            <p class="small-note">Copy this ID to the other test device/account. The other account enters it under New Message → FIDUNIO ID.</p>
            <button class="secondary" id="copyUidBtn">Copy FIDUNIO ID</button>
            <button class="danger-btn" id="firebaseSignOutBtn">Sign Out</button>
          ` : `
            <p class="small-note">Use two different email accounts for the two-device test.</p>
            <label class="form-label" for="fbName">Display name</label>
            <input class="text-input" id="fbName" maxlength="50" placeholder="Your display name" />
            <label class="form-label" for="fbEmail">Email</label>
            <input class="text-input" id="fbEmail" type="email" autocomplete="username" placeholder="name@example.com" />
            <label class="form-label" for="fbPassword">Password</label>
            <input class="text-input" id="fbPassword" type="password" autocomplete="current-password" placeholder="At least 6 characters" />
            <div class="auth-actions">
              <button class="primary" id="firebaseSignInBtn">Sign In</button>
              <button class="secondary" id="firebaseCreateBtn">Create Test Account</button>
            </div>
          `}
          ${firebaseError?`<p class="warning-note">${esc(firebaseError)}</p>`:""}
          <p class="warning-note">FIDUNIO ${esc(FIDUNIO_VERSION)} adds contact key verification and key-change detection to the E2EE/device-identity foundation. This is still a test build; do not use sensitive content yet.</p>
        </div>

        ${firebaseUser ? `
        <div class="card">
          <h2>Device Identity</h2>
          ${deviceSecurityInfo ? `
            <div class="row-main">
              <strong>This installation</strong>
              <span>Device ID: ${esc(shortDeviceId(deviceSecurityInfo.deviceId))}</span>
            </div>
            <label class="form-label">Public-key fingerprint</label>
            <div class="uid-box">${esc(formatFingerprint(deviceSecurityInfo.fingerprint))}</div>
            <p class="small-note">The private E2EE key remains local and non-exportable. This fingerprint identifies this installation's public key.</p>
            <p class="small-note">${deviceRegistryStatus==="registered"
              ? `Registered devices for this account: ${myRegisteredDevices.length}`
              : `Device registry: ${esc(deviceRegistryStatus||"initializing…")}`}</p>
          ` : `<p class="small-note">Device identity is initializing…</p>`}
          <p class="warning-note">0.8.0 creates the multi-device identity foundation. Direct-message encryption still uses the compatible 0.7.x account key until per-device recipient fan-out is implemented and tested.</p>
        </div>
        ` : ""}

        <div class="card">
          <h2>Prototype connectivity</h2>
          <p class="small-note">Use airplane mode to test the persistent Outbox. Local demo chats simulate delivery; cloud chats send through Firestore after Firebase is configured and you are signed in.</p>
        </div>

        <div class="card">
          <h2>About</h2>
          <div class="about-box">
            <div class="about-brand"><img class="brand-logo small" src="fidunio-logo.png" alt="Fidunio logo"></div>
            <div class="brand">FIDUNIO</div>
            <div>Private Messaging</div>
            <div class="version">Version ${FIDUNIO_VERSION}</div>
            <div class="small-note">Functional Prototype</div>
          </div>
        </div>

        <div class="version-footer">Fidunio v${FIDUNIO_VERSION}</div>
      </section>
    </main>`;
  document.querySelector("#backBtn").onclick=()=>{state.route="messages";render()};
  document.querySelectorAll(".toggle").forEach(btn=>btn.onclick=()=>{
    const key=btn.dataset.key;state.settings[key]=!state.settings[key];persistSoon();renderSettings();
  });
  document.querySelectorAll(".appearance-btn").forEach(btn=>btn.onclick=()=>{
    state.settings.appearance=btn.dataset.appearance;
    render();
  });
  document.querySelectorAll(".text-size-btn").forEach(btn=>btn.onclick=()=>{
    state.settings.textSize=btn.dataset.textSize;
    render();
  });

  const signInBtn=document.querySelector("#firebaseSignInBtn");
  if(signInBtn) signInBtn.onclick=async()=>{
    const email=document.querySelector("#fbEmail").value.trim();
    const password=document.querySelector("#fbPassword").value;
    firebaseError="";
    signInBtn.disabled=true;signInBtn.textContent="Signing in…";
    try{ await signInFidunio(email,password); }
    catch(err){firebaseError=err?.message||String(err);renderSettings();}
  };
  const createBtn=document.querySelector("#firebaseCreateBtn");
  if(createBtn) createBtn.onclick=async()=>{
    const displayName=document.querySelector("#fbName").value.trim();
    const email=document.querySelector("#fbEmail").value.trim();
    const password=document.querySelector("#fbPassword").value;
    if(!displayName) return alert("Enter a display name.");
    firebaseError="";
    createBtn.disabled=true;createBtn.textContent="Creating…";
    try{ await createFidunioAccount(email,password,displayName); }
    catch(err){firebaseError=err?.message||String(err);renderSettings();}
  };
  const signOutBtn=document.querySelector("#firebaseSignOutBtn");
  if(signOutBtn) signOutBtn.onclick=async()=>{await signOutFidunio();firebaseError="";renderSettings();};
  const copyBtn=document.querySelector("#copyUidBtn");
  if(copyBtn) copyBtn.onclick=async()=>{
    try{await navigator.clipboard.writeText(firebaseUser.uid);copyBtn.textContent="Copied";}catch{alert(firebaseUser.uid);}
  };
}
function settingRow(label,key){
  return `<div class="row"><span>${esc(label)}</span><button class="toggle ${state.settings[key]?"on":""}" data-key="${key}" aria-label="${esc(label)}"></button></div>`;
}


const appearanceMedia=window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
if(appearanceMedia){
  appearanceMedia.addEventListener?.("change",()=>{
    if(state.settings.appearance==="auto") render();
  });
}
if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js")
    .catch(err=>console.warn("Service worker registration failed",err)));
}
initApp();

