import {
  isFirebaseConfigured,
  initFirebase,
  ensureFirebaseAuthSession,
  createFidunioAccount,
  signInFidunio,
  signOutFidunio,
  getFirebaseUser,
  startDirectConversation,
  subscribeMyConversations,
  subscribeUserDisplayNames,
  subscribeConversationMessages,
  sendCloudMessage,
  markCloudConversationRead,
  getCloudUserProfile,
  getCloudConversation,
  publishCloudE2EEPublicKey,
  publishCloudE2EEDevice,
  getCloudUserDevices,
  listCloudUsers,
  createCloudGroup,
  subscribeMyGroups,
  readCloudMessageIdsFromServer,
  readCloudGroupMessageIdsFromServer,
  uploadEncryptedAttachment,
  downloadEncryptedAttachment,
  deleteCloudDirectMessageForEveryone,
  deleteCloudGroupMessageForEveryone
} from "./firebase.js";
import {
  LOCK_TIMEOUTS,
  getLocalSecurityStatus,
  setLocalPin, verifyLocalPin, changeLocalPin, removeLocalPin,
  enrollBiometric, verifyBiometric, disableBiometric,
  setLockTimeoutMs, consumeSuccessfulAuthBypass, noteLocalUnlock,
  installInactivityMonitor
} from "./local-security.js";
import { mountNewMessageRecipientPicker } from "./new-message-owner.js";
import { mountSettingsLifecycle } from "./settings-lifecycle.js";
import { bindAuthenticatedAccountE2EE, getAccountE2EELifecycleState, resetAccountE2EEForSignOut } from "./e2ee-account-runtime.js";
import { prepareAccountDirectMessage,decryptAccountDirectMessage } from "./e2ee-account-message-runtime.js";
import { mountSixDigitPinInput } from "./pin-input.js";
import { queueGroupTextForApp,flushGroupOutboxForApp,openGroupForApp,closeGroupForApp,resetGroupAppIntegrationForSignOut,renameGroupForApp,addGroupMemberForApp,removeGroupMemberForApp,leaveGroupForApp,grantGroupHistoryForApp } from "./e2ee-account-group-app-integration.js";

const MESSAGE_DELETE_FOR_EVERYONE_ENABLED=true;
import { planPhysicalLocalMessagePurge } from "./disappearing-local-storage-plan.js";
import { planAuthoritativeMessageProjection } from "./disappearing-authoritative-projection.js";
import { planReconnectOutboxConvergence } from "./disappearing-reconnect-recovery.js";
import { DISAPPEARING_COMPOSE_PRESETS, composeDisappearLabel, stampOutgoingDisappearSelection } from "./disappearing-compose-policy.js";
import { createAttachmentSendService } from "./attachment-send-service.js";
import { createAttachmentReceiveService } from "./attachment-receive-service.js";
import { ATTACHMENT_LIMITS_V1, validateAttachmentSelection } from "./attachment-transport-policy.js";
import { awaitBoundedOutboxReconciliation,isOutboxReconciliationTimeout,planTimedOutOutboxRequeue,timeoutRequiresFailedState } from "./outbox-reconciliation-boundary.js";
import { normalizeNotificationRoute,notificationRouteFromUrl,urlWithoutNotificationRoute,FIDUNIO_NOTIFICATION_ROUTE_MESSAGE } from "./notification-routing.js";
import {recordNotificationDiagnostic} from "./notification-diagnostics.js";

/* FIDUNIO single-authority local lock integration */
const app = document.querySelector("#app");
const FIDUNIO_VERSION = globalThis.FIDUNIO_RELEASE?.version || "unknown";

const contacts=[]; // legacy group-info compatibility only; no prototype identities

let state = {
  unlocked:false,
  route:"messages",
  previousRoute:"messages",
  online:navigator.onLine,
  selectedId:null,
  toolsOpen:false,
  newGroupMembers:[],
  newGroupName:"",
  modal:null,
  quickPhrases:["Yes","No","OK","On my way","Running late","Call me"],
  conversations:[],
  messages:{},
  hiddenMessages:{},
  settings:{previews:false,autoLock:true,textSize:"normal",wifiAttachments:true,appearance:"auto",disappearingTextSeconds:null},
  peerTrust:{}
};

const DB_NAME = "fidunio-local";
const DB_VERSION = 2;
const STATE_KEY = "app-state";
let dbPromise = null;
let localKeyPromise = null;
let hydrated = false;
let persistTimer = null;
let localPurgeTail=Promise.resolve();
let reconnectRecoveryTail=Promise.resolve();
let firebaseReady = false;
let firebaseError = "";
let firebaseUser = null;
let pendingNotificationRoute=notificationRouteFromUrl(globalThis.location?.href||"");
let notificationRouteRunning=false;
void recordNotificationDiagnostic("app","module-start",{href:location.href,pendingNotificationRoute});
let cloudConversationUnsub = null;
let cloudConversationSyncPending = false;
let peerDisplayNameUnsub = ()=>{};
let peerDisplayNameKey = "";
let peerDisplayNames = {};
let cloudGroupUnsub = null;
let cloudGroupSyncPending = false;
let groupCandidates = [];
let cloudMessageUnsub = null;
let cloudMessageConversationId = null;
let deviceSecurityInfo = null;
let deviceRegistryStatus = "";
let myRegisteredDevices = [];
let localSecurityMessage = "";
let localSecurityMessageIsError = false;
let unlockError = "";
let messageSendInFlight=false;
let attachmentPickerActive=false;
const attachmentRuntime=new Map();
const localAttachmentPreviewUrls=new Set();
const attachmentReceiveService=createAttachmentReceiveService({downloadEncryptedAttachment});

function parseAttachmentDescriptor(text){
  if(typeof text!=="string"||!text.trimStart().startsWith("{"))return null;
  try{const descriptor=JSON.parse(text);return descriptor?.fidunioAttachment===1?descriptor:null;}catch{return null;}
}
function messagePreview(text){
  const descriptor=parseAttachmentDescriptor(text);
  if(!descriptor)return text||"";
  return descriptor.kind==="photo"||String(descriptor.type||"").startsWith("image/")?"📷 Photo":`📎 ${descriptor.name||"Attachment"}`;
}
function attachmentRuntimeKey(conversationId,messageId){return `${conversationId}:${messageId}`;}
function releaseAttachmentResult(result){
  if(!result?.url)return;
  if(result.localPreview){if(localAttachmentPreviewUrls.delete(result.url))URL.revokeObjectURL(result.url);}
  else attachmentReceiveService.release(result.url);
}
function loadAttachment(conversationId,message,descriptor,{retry=false}={}){
  const key=attachmentRuntimeKey(conversationId,message.id),existing=attachmentRuntime.get(key);
  if(existing&&!retry)return;
  if(existing?.result?.url)releaseAttachmentResult(existing.result);
  attachmentRuntime.set(key,{status:"loading",descriptor});
  attachmentReceiveService.receive(descriptor).then(result=>{
    attachmentRuntime.set(key,{status:"ready",descriptor,result});
    if(state.route==="chat"&&String(state.selectedId)===String(conversationId))render();
  }).catch(error=>{
    attachmentRuntime.set(key,{status:"error",descriptor,error});
    if(state.route==="chat"&&String(state.selectedId)===String(conversationId))render();
  });
}

function setLocalSecurityMessage(message,isError=false){
  localSecurityMessage=String(message||"");
  localSecurityMessageIsError=!!isError;
}
function lockLocalApp(reason="manual"){
  void recordNotificationDiagnostic("app","lock",{reason,route:state.route,selectedId:state.selectedId,unlocked:state.unlocked});
  if(!state.unlocked)return;
  state.unlocked=false;
  state.toolsOpen=false;
  state.modal=null;
  unlockError="";
  render();
}
function unlockLocalApp(){
  void recordNotificationDiagnostic("app","unlock-start",{route:state.route,selectedId:state.selectedId,pendingNotificationRoute,hydrated,firebaseReady,hasFirebaseUser:!!firebaseUser});
  state.unlocked=true;
  unlockError="";
  noteLocalUnlock();
  render();
  void applyPendingNotificationRoute();
  void recordNotificationDiagnostic("app","unlock-complete",{route:state.route,selectedId:state.selectedId,pendingNotificationRoute,hydrated,firebaseReady,hasFirebaseUser:!!firebaseUser});
}

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
    hiddenMessages:state.hiddenMessages,
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
    if(saved.hiddenMessages&&typeof saved.hiddenMessages==="object")state.hiddenMessages=saved.hiddenMessages;
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
    disappearAfterSeconds:message.disappearAfterSeconds??null,
    disappearingPurgeVersion:message.disappearingPurgeVersion??null,
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
async function getOutboxMessage(id){
  const db=await openDb();
  return idbRequest(db.transaction("outbox","readonly").objectStore("outbox").get(id));
}
async function markOutboxSendAttempted(id){
  const db=await openDb();
  const tx=db.transaction("outbox","readwrite");
  const store=tx.objectStore("outbox");
  const record=await idbRequest(store.get(id));
  if(!record){tx.abort();throw new Error("Outbox record disappeared before send attempt marker.");}
  store.put({...record,sendAttempted:true});
  await txDone(tx);
}
async function decryptOutboxRecord(record){
  const payload=await decryptLocal(record.payload);
  return {
    ...payload,
    conversationId:payload.conversationId ?? payload.groupId ?? record.conversationId,
    groupId:payload.groupId ?? (payload.kind==="group-e2ee-v1"?(payload.conversationId ?? record.conversationId):undefined),
    messageId:payload.messageId ?? record.id,
    text:payload.text ?? "",
    time:payload.time ?? "",
    cloud:!!payload.cloud || payload.kind==="group-e2ee-v1",
    conversation:payload.conversation || null
  };
}
async function persistGroupOutboxPayload(payload){
  const db=await openDb(),conversationId=String(payload.groupId);
  const c=state.conversations.find(x=>String(x.id)===conversationId);
  const encrypted=await encryptLocal({...payload,conversationId,cloud:true,conversation:c?{id:c.id,name:c.name,type:"group",cloudGroup:true,preview:payload.text,time:payload.time,unread:0}:null});
  const tx=db.transaction("outbox","readwrite");
  tx.objectStore("outbox").put({id:payload.messageId,conversationId,createdAt:Date.now(),payload:encrypted});
  await txDone(tx);
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
      cloud:payload.cloud,
      disappearAfterSeconds:payload.disappearAfterSeconds??null,
      disappearingPurgeVersion:payload.disappearingPurgeVersion??null,
      serverBacked:false
    };
    state.messages[conversationId].push(m);
  }else if(!["sent","delivered","read"].includes(m.state)){
    m.state="queued";
    m.cloud=payload.cloud;
  }
  if(c){
    c.preview=messagePreview(payload.text) || c.preview;
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

function serializeLocalPurge(work){
  const run=localPurgeTail.then(work,work);
  localPurgeTail=run.catch(()=>{});
  return run;
}
async function purgeLocalDisappearingMessageTraces(uid,messageIds){
  const targetUid=String(uid||"").trim();
  const ids=[...new Set((messageIds||[]).map(x=>String(x||"").trim()).filter(Boolean))];
  if(!targetUid||!firebaseUser||String(firebaseUser.uid)!==targetUid)throw new Error("Active authenticated UID is required for local purge.");
  if(!ids.length)return{purgedMessageIds:[],outboxDeleted:0,historyUpdated:0};
  return serializeLocalPurge(async()=>{
    clearTimeout(persistTimer);persistTimer=null;
    const db=await openDb();
    const historyValues=await idbRequest(db.transaction("history","readonly").objectStore("history").getAll());
    const decoded=[];
    for(const value of historyValues){
      try{decoded.push(await decryptLocal(value));}catch(err){throw new Error("Local history decrypt failed during purge: "+String(err?.message||err));}
    }
    const plan=planPhysicalLocalMessagePurge({messagesByConversation:state.messages,historyRecords:decoded,outboxRecords:await getOutboxRecords(),purgeMessageIds:ids});
    state.messages=plan.messagesByConversation;
    const historyWrites=[];
    for(const record of plan.historyRecords){historyWrites.push({key:String(record.conversationId),value:await encryptLocal(record)});}
    const tx=db.transaction(["history","outbox"],"readwrite"),history=tx.objectStore("history"),outbox=tx.objectStore("outbox");
    for(const row of historyWrites)history.put(row.value,row.key);
    for(const id of plan.outboxDeleteIds)outbox.delete(id);
    await txDone(tx);
    let attachmentUrlsReleased=0;
    const targetIds=new Set(ids);
    for(const [key,runtime] of [...attachmentRuntime.entries()]){
      const messageId=String(key).slice(String(key).lastIndexOf(":")+1);
      if(!targetIds.has(messageId))continue;
      if(runtime?.result?.url){releaseAttachmentResult(runtime.result);attachmentUrlsReleased++;}
      attachmentRuntime.delete(key);
    }
    await persistState();
    return{purgedMessageIds:ids,outboxDeleted:plan.outboxDeleteIds.length,historyUpdated:historyWrites.length,attachmentUrlsReleased};
  });
}

function isMessageHidden(conversationId,messageId){return(state.hiddenMessages[String(conversationId)]||[]).includes(String(messageId));}
async function deleteMessageForMe(conversationId,messageId){
  if(!firebaseUser)throw new Error("A signed-in account is required to delete this message.");
  const cid=String(conversationId),id=String(messageId),hidden=new Set(state.hiddenMessages[cid]||[]);hidden.add(id);state.hiddenMessages[cid]=[...hidden];
  await purgeLocalDisappearingMessageTraces(firebaseUser.uid,[id]);
  const c=state.conversations.find(x=>String(x.id)===cid),last=state.messages[cid]?.at(-1);
  if(c){c.preview=messagePreview(last?.text);c.time=last?.time||"";}
  await persistState();
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
  if(item.peerUid&&peerDisplayNames[item.peerUid])item.name=peerDisplayNames[item.peerUid];
  if(existing) Object.assign(existing,item);
  else state.conversations.unshift(item);
  if(!state.messages[item.id]) state.messages[item.id]=[];
  return existing || item;
}

async function applyPendingNotificationRoute(){
  await recordNotificationDiagnostic("app","route-apply-enter",{notificationRouteRunning,pendingNotificationRoute,hydrated,unlocked:state.unlocked,firebaseReady,hasFirebaseUser:!!firebaseUser,currentRoute:state.route,selectedId:state.selectedId});
  if(notificationRouteRunning||!pendingNotificationRoute||!hydrated||!state.unlocked||!firebaseUser){await recordNotificationDiagnostic("app","route-apply-blocked",{notificationRouteRunning,hasPendingRoute:!!pendingNotificationRoute,hydrated,unlocked:state.unlocked,firebaseReady,hasFirebaseUser:!!firebaseUser,currentRoute:state.route,selectedId:state.selectedId});return false;}
  const route=pendingNotificationRoute;
  notificationRouteRunning=true;
  try{
    let c=state.conversations.find(x=>String(x.id)===String(route.conversationId));
    await recordNotificationDiagnostic("app","route-conversation-local-lookup",{route,found:!!c,conversation:c&&{id:c.id,type:c.type,cloud:c.cloud,cloudGroup:c.cloudGroup}});
    if(!c){
      const remote=await getCloudConversation(route.conversationId,firebaseUser.uid);
      await recordNotificationDiagnostic("app","route-conversation-remote-lookup",{route,uid:firebaseUser.uid,found:!!remote,conversation:remote});
      if(!remote){pendingNotificationRoute=null;history.replaceState(history.state,"",urlWithoutNotificationRoute(location.href));return false;}
      c=mergeCloudConversation(remote);
    }
    if(!c?.cloud||c?.cloudGroup||c?.type==="group"){pendingNotificationRoute=null;history.replaceState(history.state,"",urlWithoutNotificationRoute(location.href));return false;}
    state.selectedId=c.id;state.route="chat";state.modal=null;state.toolsOpen=false;c.unread=0;
    await recordNotificationDiagnostic("app","route-state-selected",{route,currentRoute:state.route,selectedId:state.selectedId});
    closeGroupForApp();beginCloudMessageSubscription(c.id,{force:true});
    pendingNotificationRoute=null;history.replaceState(history.state,"",urlWithoutNotificationRoute(location.href));
    await persistState();render();await recordNotificationDiagnostic("app","route-apply-success",{route,currentRoute:state.route,selectedId:state.selectedId,href:location.href});return true;
  }catch(err){console.warn("Notification route could not be applied yet",err);await recordNotificationDiagnostic("app","route-apply-error",{route,error:err,currentRoute:state.route,selectedId:state.selectedId});return false;}
  finally{notificationRouteRunning=false;}
}
function mergeCloudGroup(remote){
  const existing=state.conversations.find(c=>String(c.id)===String(remote.id));
  const item={...remote,type:"group",cloudGroup:true,unread:existing?.unread||0,preview:remote.preview||existing?.preview||"Encrypted group",time:remote.time||existing?.time||""};
  if(existing)Object.assign(existing,item);else state.conversations.unshift(item);
  if(!state.messages[item.id])state.messages[item.id]=[];
  return existing||item;
}
function beginCloudGroupSubscription(){
  if(cloudGroupUnsub){cloudGroupUnsub();cloudGroupUnsub=null;}
  if(!firebaseUser)return;
  cloudGroupSyncPending=true;
  cloudGroupUnsub=subscribeMyGroups(firebaseUser.uid,rows=>{cloudGroupSyncPending=false;rows.forEach(mergeCloudGroup);persistSoon();if(state.route==="messages"||state.route==="chat"||state.route==="groupInfo")render();},err=>{cloudGroupSyncPending=false;firebaseError=err?.message||String(err);if(state.route==="messages"||state.route==="chat"||state.route==="groupInfo")render();});
}
function stopPeerDisplayNameSubscription(){
  try{peerDisplayNameUnsub();}catch{}
  peerDisplayNameUnsub=()=>{};
  peerDisplayNameKey="";
  peerDisplayNames={};
}
function syncPeerDisplayNameSubscription(rows){
  const uids=[...new Set((rows||[]).map(r=>r?.peerUid).filter(Boolean))].sort();
  const key=uids.join("|");
  if(key===peerDisplayNameKey)return;
  stopPeerDisplayNameSubscription();
  peerDisplayNameKey=key;
  if(!uids.length)return;
  peerDisplayNameUnsub=subscribeUserDisplayNames(uids,names=>{
    peerDisplayNames=names||{};
    let changed=false;
    for(const c of state.conversations){
      const name=c?.peerUid?peerDisplayNames[c.peerUid]:null;
      if(name&&c.name!==name){c.name=name;changed=true;}
    }
    if(changed){persistSoon();if(state.route==="messages"||state.route==="chat")render();}
  },err=>console.warn("FIDUNIO peer display-name sync unavailable",err));
}
function stopCloudMessageSubscription(){
  if(cloudMessageUnsub){ cloudMessageUnsub(); cloudMessageUnsub=null; }
  cloudMessageConversationId=null;
}
function beginCloudConversationSubscription(){
  if(cloudConversationUnsub){cloudConversationUnsub();cloudConversationUnsub=null;}
  if(!firebaseUser) return;
  cloudConversationSyncPending=true;
  cloudConversationUnsub=subscribeMyConversations(firebaseUser.uid, rows=>{
    cloudConversationSyncPending=false;
    rows.forEach(mergeCloudConversation);
    syncPeerDisplayNameSubscription(rows);
    // A restored Firestore conversation may repair peerUid for an older
    // local record. Reattach the active chat listener after reconciliation.
    ensureActiveCloudMessageSubscription();
    persistSoon();
    if(state.route==="messages" || state.route==="chat") render();
  }, err=>{
    cloudConversationSyncPending=false;
    firebaseError=err?.message || String(err);
    if(state.route==="settings") renderSettings();
    else if(state.route==="messages"||state.route==="chat")render();
  });
}
function ensureActiveCloudMessageSubscription(force=false){
  if(!firebaseUser || state.route!=="chat") return;
  const c=state.conversations.find(x=>String(x.id)===String(state.selectedId));
  if(c?.cloudGroup){stopCloudMessageSubscription();beginCloudGroupMessageSubscription(c.id);}
  else if(c?.cloud){closeGroupForApp();beginCloudMessageSubscription(c.id,{force});}
}
function beginCloudGroupMessageSubscription(groupId){
  if(!firebaseUser)return;
  openGroupForApp(groupId,{
    isOpen:()=>state.route==="chat"&&String(state.selectedId)===String(groupId),
    onRows:async (rows,meta={})=>{
      rows=(rows||[]).filter(m=>!isMessageHidden(groupId,m.id));
      const existing=(state.messages[groupId]||[]).filter(m=>!isMessageHidden(groupId,m.id));
      const outboxIds=(await getOutboxRecords()).map(x=>x.id);
      const projection=planAuthoritativeMessageProjection({existingRows:existing,remoteRows:rows,snapshotMeta:meta,outboxMessageIds:outboxIds});
      if(projection.authoritative&&projection.purgeMessageIds.length)await purgeLocalDisappearingMessageTraces(firebaseUser.uid,projection.purgeMessageIds);
      state.messages[groupId]=[...projection.rows];
      const c=state.conversations.find(x=>String(x.id)===String(groupId)),last=state.messages[groupId].at(-1);
      if(c&&last){c.preview=messagePreview(last.text);c.time=last.time;}
      await cacheCloudHistory(groupId,state.messages[groupId]);await persistState();
      if(state.route==="chat"&&String(state.selectedId)===String(groupId))render();
    },
    onError:err=>{firebaseError=err?.message||String(err);}
  });
}

/* FIDUNIO direct-message E2EE foundation */
const E2EE_VERSION=1;
let deviceKeyPair=null;
let e2eePublishPromise=null;
const peerKeyCache=new Map();
function b64(bytes){ let s=""; const u8=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes); for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode(...u8.subarray(i,i+0x8000)); return btoa(s); }
function unb64(s){ const bin=atob(s),out=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i); return out; }
let deviceIdentityMaterialPromise=null;
async function ensureStableDeviceIdentityMaterial(){
  if(deviceIdentityMaterialPromise)return deviceIdentityMaterialPromise;
  deviceIdentityMaterialPromise=(async()=>{
    const db=await openDb();
    const store=db.transaction("meta","readonly").objectStore("meta");
    const keyReq=store.get("e2ee-device-keypair-v1");
    const identityReq=store.get("e2ee-device-identity-v1");
    const [existingKeyPair,existingIdentity]=await Promise.all([idbRequest(keyReq),idbRequest(identityReq)]);
    const hasKeyPair=!!(existingKeyPair?.privateKey&&existingKeyPair?.publicKey&&existingKeyPair?.publicJwk);
    const hasIdentity=!!existingIdentity?.deviceId;
    if(hasKeyPair!==hasIdentity){
      throw new Error("FIDUNIO E2EE identity is incomplete. A deliberate device reset is required; automatic key rotation is blocked.");
    }
    if(hasKeyPair){
      deviceKeyPair=existingKeyPair;
      return{keyPair:existingKeyPair,identity:existingIdentity};
    }
    const kp=await crypto.subtle.generateKey({name:"ECDH",namedCurve:"P-256"},false,["deriveBits"]);
    const publicJwk=await crypto.subtle.exportKey("jwk",kp.publicKey);
    const createdAt=Date.now();
    const keyPair={privateKey:kp.privateKey,publicKey:kp.publicKey,publicJwk,createdAt};
    const identity={
      deviceId:crypto.randomUUID ? crypto.randomUUID() : `dev-${createdAt}-${b64(crypto.getRandomValues(new Uint8Array(12))).replace(/[^a-zA-Z0-9]/g,"")}`,
      createdAt
    };
    const tx=db.transaction("meta","readwrite");
    const writeStore=tx.objectStore("meta");
    writeStore.put(keyPair,"e2ee-device-keypair-v1");
    writeStore.put(identity,"e2ee-device-identity-v1");
    await txDone(tx);
    deviceKeyPair=keyPair;
    return{keyPair,identity};
  })().catch(err=>{deviceIdentityMaterialPromise=null;throw err;});
  return deviceIdentityMaterialPromise;
}
async function getOrCreateDeviceKeyPair(){
  return (await ensureStableDeviceIdentityMaterial()).keyPair;
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
  const {keyPair:kp,identity}=await ensureStableDeviceIdentityMaterial();
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
  if(e2eePublishPromise)return e2eePublishPromise;
  const publishingUid=firebaseUser.uid;
  e2eePublishPromise=(async()=>{
    const identity=await getOrCreateDeviceIdentity();
    if(!firebaseUser||firebaseUser.uid!==publishingUid)return;

    // Compatibility publication updates the same authenticated account only.
    await publishCloudE2EEPublicKey(publishingUid,identity.publicJwk);

    // Device registration is idempotent because the stable deviceId is the
    // Firestore document ID. App restarts/updates update this record; they do
    // not create a replacement device identity.
    try{
      await publishCloudE2EEDevice(publishingUid,identity);
      myRegisteredDevices=await getCloudUserDevices(publishingUid);
      deviceRegistryStatus="registered";
    }catch(err){
      deviceRegistryStatus=err?.message||String(err);
      console.warn("Device registry publication failed",err);
    }
    if(state.route==="settings")renderSettings();
  })().finally(()=>{e2eePublishPromise=null;});
  return e2eePublishPromise;
}

function beginCloudMessageSubscription(conversationId,{force=false}={}){
  void recordNotificationDiagnostic("app","message-subscription-request",{conversationId,force,currentRoute:state.route,selectedId:state.selectedId,hasExisting:!!cloudMessageUnsub,existingConversationId:cloudMessageConversationId});
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
      void recordNotificationDiagnostic("app","message-snapshot-start",{conversationId,rowCount:rows?.length??null,meta,rows:(rows||[]).map(row=>({id:row.id,senderUid:row.senderUid,state:row.state,e2ee:row.e2ee,createdAt:row.createdAt?.toMillis?.()??row.createdAt??null,timeLabel:row.timeLabel,fieldNames:Object.keys(row),textLength:String(row.text||"").length,ciphertextLength:String(row.ciphertext||row.cipher||"").length})),currentRoute:state.route,selectedId:state.selectedId});
      rows=(rows||[]).filter(m=>!isMessageHidden(conversationId,m.id));
      const existing=(state.messages[conversationId]||[]).filter(m=>!isMessageHidden(conversationId,m.id));
      // Plain direct messages must reach display/receipt processing without
      // waiting for obsolete compatibility-key lookup. Load that key only if
      // this snapshot actually contains a legacy encrypted row.
      let peerKey=null;
      if(rows.some(m=>m.e2ee&&m.e2ee!==3)){
        try{peerKey=await peerPublicKeyForConversation(conversationId,{refresh:true});}catch{}
      }
      const remote=[];
      for(const m of rows){
        let text=m.text||"";
        if(m.e2ee===3){
          try{text=await decryptAccountDirectMessage({uid:firebaseUser.uid,peerUid:c.peerUid,conversationId,messageId:m.id,row:m});}
          catch{text="[Encrypted message — account encryption unavailable]";}
        }else if(m.e2ee){
          if(peerKey){try{text=await decryptCloudText(m,peerKey,conversationId);}catch{text="[Encrypted message — key unavailable]";}}
          else text="[Encrypted message — key unavailable]";
        }
        remote.push({id:m.id,mine:m.senderUid===firebaseUser.uid,sender:m.senderName||"",text,time:m.timeLabel||"",createdAt:m.createdAt?.toDate?.()||m.createdAt||null,state:m.state||"sent",cloud:true,e2ee:!!m.e2ee,senderDeviceId:m.senderDeviceId||null,disappearAfterSeconds:m.disappearAfterSeconds??null,disappearingPurgeVersion:m.disappearingPurgeVersion??null});
      }

      const outboxIds=(await getOutboxRecords()).map(x=>x.id);
      const projection=planAuthoritativeMessageProjection({existingRows:existing,remoteRows:remote,snapshotMeta:meta,outboxMessageIds:outboxIds});
      void recordNotificationDiagnostic("app","message-projection-planned",{conversationId,outboxIds,remoteIds:remote.map(row=>row.id),existingIds:existing.map(row=>row.id),projectedIds:projection.rows.map(row=>row.id),authoritative:projection.authoritative,purgeMessageIds:projection.purgeMessageIds,currentRoute:state.route,selectedId:state.selectedId});
      if(projection.authoritative&&projection.purgeMessageIds.length)await purgeLocalDisappearingMessageTraces(firebaseUser.uid,projection.purgeMessageIds);
      const merged=[...projection.rows];
      state.messages[conversationId]=merged;

      const last=merged.at(-1);
      if(last){
        c.preview=messagePreview(last.text);
        c.time=last.time;
      }

      /*
       * Local-first durability:
       * persist the merged result before any read-receipt network work.
       * A network/cache callback must never make local history less durable.
       */
      await cacheCloudHistory(conversationId,merged);
      void recordNotificationDiagnostic("app","message-history-cached",{conversationId,mergedCount:merged.length,currentRoute:state.route,selectedId:state.selectedId});
      await persistState();
      void recordNotificationDiagnostic("app","message-state-persisted",{conversationId,currentRoute:state.route,selectedId:state.selectedId});

      const unreadIncoming=merged.filter(m=>!m.mine && m.state!=="read");
      if(
        state.route==="chat" &&
        String(state.selectedId)===String(conversationId) &&
        unreadIncoming.length
      ){
        void recordNotificationDiagnostic("app","read-receipt-start",{conversationId,messageIds:unreadIncoming.map(row=>row.id),currentRoute:state.route,selectedId:state.selectedId});
        try{await markCloudConversationRead(conversationId);}
        catch(err){firebaseError=`Read receipt failed: ${err?.message||String(err)}`;}
        void recordNotificationDiagnostic("app","read-receipt-complete",{conversationId,messageIds:unreadIncoming.map(row=>row.id),firebaseError,currentRoute:state.route,selectedId:state.selectedId});
      }

      if(state.route==="chat" && String(state.selectedId)===String(conversationId)) render();
      void recordNotificationDiagnostic("app","message-snapshot-complete",{conversationId,currentRoute:state.route,selectedId:state.selectedId,rendered:state.route==="chat"&&String(state.selectedId)===String(conversationId)});
    },
    err=>{
      firebaseError=err?.message || String(err);
      if(state.route==="settings") renderSettings();
    }
  );
}
async function initializeFirebaseLayer(){
  void recordNotificationDiagnostic("app","firebase-initialize-enter",{configured:isFirebaseConfigured(),currentRoute:state.route,pendingNotificationRoute});
  if(!isFirebaseConfigured()) return;
  try{
    await initFirebase(user=>{
      firebaseUser=user;
      firebaseReady=true;
      void recordNotificationDiagnostic("app","firebase-auth-callback",{uid:user?.uid||null,currentRoute:state.route,selectedId:state.selectedId,pendingNotificationRoute});
      if(user){
        if(getAccountE2EELifecycleState().manager.state!=="READY")bindAuthenticatedAccountE2EE(user.uid).catch(err=>console.warn("Account E2EE identity lookup failed",err));
        publishMyE2EEKey().catch(err=>console.warn("Could not publish E2EE key",err));
        beginCloudConversationSubscription();
        beginCloudGroupSubscription();
        ensureActiveCloudMessageSubscription(true);
        void applyPendingNotificationRoute();
        if(state.online) scheduleReconnectRecovery();
      }else{
        attachmentReceiveService.releaseAll();
        for(const url of localAttachmentPreviewUrls)URL.revokeObjectURL(url);
        localAttachmentPreviewUrls.clear();
        attachmentRuntime.clear();
        resetGroupAppIntegrationForSignOut();
        resetAccountE2EEForSignOut();
        if(cloudConversationUnsub){cloudConversationUnsub();cloudConversationUnsub=null;}
        stopPeerDisplayNameSubscription();
        if(cloudGroupUnsub){cloudGroupUnsub();cloudGroupUnsub=null;}
        stopCloudMessageSubscription();
      }
      if(state.route==="settings" || state.route==="messages") render();
    });
    firebaseReady=true;
    firebaseUser=getFirebaseUser();
    void recordNotificationDiagnostic("app","firebase-initialize-complete",{uid:firebaseUser?.uid||null,currentRoute:state.route,selectedId:state.selectedId,pendingNotificationRoute});
    if(firebaseUser) publishMyE2EEKey().catch(err=>console.warn("Could not publish E2EE key",err));
    ensureActiveCloudMessageSubscription(true);
    void applyPendingNotificationRoute();
    if(firebaseUser && state.online) scheduleReconnectRecovery();
  }catch(err){
    firebaseError=err?.message || String(err);
  }
}

async function initApp(){
  await recordNotificationDiagnostic("app","init-enter",{href:location.href,pendingNotificationRoute});
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
  if(consumeSuccessfulAuthBypass()) state.unlocked=true;
  installInactivityMonitor({isUnlocked:()=>state.unlocked&&!attachmentPickerActive,onLock:reason=>lockLocalApp(reason)});
  if(state.unlocked) noteLocalUnlock();
  render();
  await recordNotificationDiagnostic("app","init-rendered",{route:state.route,selectedId:state.selectedId,unlocked:state.unlocked,hydrated,pendingNotificationRoute});

  initializeFirebaseLayer();
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
function currentConversation(){ return state.conversations.find(x=>String(x.id)===String(state.selectedId)); }
function isGroup(c=currentConversation()){ return c?.type==="group"; }

function shellTop(title,left=`<span class="topbar-spacer"></span>`,right=`<span class="topbar-spacer"></span>`){
  return `<header class="topbar">${left}<h1>${esc(title)}</h1>${right}</header>`;
}
function mainSignOutMarkup(){
  return '<button class="secondary" id="fidunioMainSignOutBtn" type="button" aria-label="Sign Out" style="width:auto;margin:0 6px;padding:8px 12px">Sign Out</button>';
}
function bindMainSignOut(){
  const btn=document.querySelector("#fidunioMainSignOutBtn");
  if(!btn)return;
  btn.onclick=async()=>{
    btn.disabled=true;btn.textContent="Signing Out…";
    try{await signOutFidunio();location.reload();}
    catch(err){btn.disabled=false;btn.textContent="Sign Out";alert(err?.message||String(err));}
  };
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
  return window.matchMedia && window.matchMedia("(min-width: 700px)").matches;
}
function renderConversationSidebar(active="messages"){
  return `
    <aside class="tablet-sidebar">
      <div class="tablet-brand-row">
        <div class="tablet-brand-primary">
          <div class="tablet-brand-copy">
            <div class="tablet-brand-name">FIDUNIO</div>
            <div class="tablet-brand-sub">Private Messaging</div>
          </div>
          <div class="tablet-brand-actions">
            <button class="icon-btn icon-2d" id="tabletSettingsBtn" aria-label="Settings">${icon2d("settings",23)}</button>
            <button class="icon-btn icon-2d" id="tabletNewBtn" aria-label="New conversation">${icon2d("plus",23)}</button>
          </div>
        </div>
        <div class="tablet-account-row">${mainSignOutMarkup()}</div>
      </div>
      <div class="tablet-search-wrap">
        <input class="search" id="tabletSearchBox" placeholder="Search conversations" />
      </div>
      <div class="tablet-conversation-list" id="tabletConversationList"></div>
      <nav class="tablet-bottom-nav" aria-label="FIDUNIO sections">
        <button class="tablet-nav-item ${active==="messages"?"active":""}" id="tabletMessagesNav">${icon2d("chats",22)}<span>Messages</span></button>
        <button class="tablet-nav-item ${active==="groups"?"active":""}" id="tabletGroupsNav">${icon2d("groups",22)}<span>Groups</span></button>
        <button class="tablet-nav-item" id="tabletContactsNav">${icon2d("contacts",22)}<span>Contacts</span></button>
        <button class="tablet-nav-item" id="tabletSettingsNav">${icon2d("settings",22)}<span>Settings</span></button>
      </nav>
    </aside>`;
}
function bindTabletNavigation(){
  document.querySelector("#tabletMessagesNav")?.addEventListener("click",()=>{state.route="messages";render();});
  document.querySelector("#tabletGroupsNav")?.addEventListener("click",()=>{state.route="groups";render();});
  document.querySelector("#tabletContactsNav")?.addEventListener("click",()=>{state.route="newConversation";render();});
  document.querySelector("#tabletSettingsNav")?.addEventListener("click",()=>{state.route="settings";render();});
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
    if(chosen?.cloudGroup){stopCloudMessageSubscription();beginCloudGroupMessageSubscription(chosen.id);}
    else if(chosen?.cloud){closeGroupForApp();beginCloudMessageSubscription(chosen.id,{force:true});}
    else{closeGroupForApp();stopCloudMessageSubscription();}
    render();
  });
}

function render(){
  void recordNotificationDiagnostic("app","render",{route:state.route,selectedId:state.selectedId,unlocked:state.unlocked,hydrated,firebaseReady,hasFirebaseUser:!!firebaseUser,pendingNotificationRoute,modalType:state.modal?.type||null});
  // Live cloud callbacks may arrive while the local lock screen is open.
  // Keep the mounted PIN slots and their focus/value intact during those renders.
  const unlockPinAlreadyMounted=!state.unlocked&&!!document.querySelector("#localUnlockPin .pin-code");
  persistSoon();
  document.querySelectorAll(".modal-backdrop").forEach(el=>el.remove());
  applyAppearance();
  document.body.dataset.route=state.unlocked ? (state.route||"") : "unlock";
  if(!state.unlocked){
    if(unlockPinAlreadyMounted)return;
    return renderUnlock();
  }
  const routes={
    messages:renderMessages, groups:renderGroups, chat:renderChat, settings:renderSettings,
    newConversation:renderNewConversation, newGroup:renderNewGroup,
    groupName:renderGroupName, groupInfo:renderGroupInfo
  };
  (routes[state.route]||renderMessages)();
  if(state.modal) renderModal();
}

function renderUnlock(){
  const security=getLocalSecurityStatus();
  if(!security.available){
    app.innerHTML=`
      <main class="app-shell unlock">
        <section class="unlock-card">
          <div class="unlock-brand"><img class="brand-logo" src="fidunio-logo.png" alt="Fidunio logo"></div>
          <h1>FIDUNIO remains locked</h1>
          <p class="warning-note">Your local PIN storage could not be read. Your PIN has not been reset. Close FIDUNIO completely, then open it again.</p>
          <div class="small-note">${esc(security.error||"Local PIN storage is unavailable.")}</div>
        </section>
      </main>`;
    return;
  }
  if(!security.hasPin){
    app.innerHTML=`
      <main class="app-shell unlock">
        <section class="unlock-card">
          <div class="unlock-brand"><img class="brand-logo" src="fidunio-logo.png" alt="Fidunio logo"></div>
          <h1>Fidunio</h1>
          <p>This installation does not have a local PIN yet. Continue to FIDUNIO, then set one in Settings → Privacy & Access.</p>
          <button class="primary" id="continueBtn">Continue to FIDUNIO</button>
          <div class="small-note">FIDUNIO ${esc(FIDUNIO_VERSION)}</div>
        </section>
      </main>`;
    document.querySelector("#continueBtn").onclick=unlockLocalApp;
    return;
  }
  app.innerHTML=`
    <main class="app-shell unlock">
      <section class="unlock-card">
        <div class="unlock-brand"><img class="brand-logo" src="fidunio-logo.png" alt="Fidunio logo"></div>
        <h1>Unlock FIDUNIO</h1>
        ${security.hasBiometric?'<button class="primary" id="deviceUnlockBtn">Unlock with device</button>':""}
        <label class="form-label" id="localUnlockPinLabel">FIDUNIO PIN</label>
        <div id="localUnlockPin"></div>
        <button class="${security.hasBiometric?"secondary":"primary"}" id="localPinUnlockBtn" style="margin-top:12px">Unlock with PIN</button>
        ${unlockError?`<p class="warning-note">${esc(unlockError)}</p>`:""}
        <div class="small-note">FIDUNIO ${esc(FIDUNIO_VERSION)} • Local unlock keeps your Firebase session signed in.</div>
      </section>
    </main>`;
  const pinButton=document.querySelector("#localPinUnlockBtn");
  let pinInput;
  const tryPin=async()=>{
    pinButton.disabled=true;
    pinInput.setDisabled(true);
    pinButton.textContent="Checking…";
    if(await verifyLocalPin(pinInput.value())){unlockLocalApp();return;}
    unlockError="Incorrect PIN.";
    renderUnlock();
  };
  pinInput=mountSixDigitPinInput(document.querySelector("#localUnlockPin"),{onComplete:tryPin});
  pinButton.onclick=tryPin;
  const deviceButton=document.querySelector("#deviceUnlockBtn");
  if(deviceButton)deviceButton.onclick=async()=>{
    deviceButton.disabled=true;
    deviceButton.textContent="Waiting for device…";
    if(await verifyBiometric()){unlockLocalApp();return;}
    unlockError="Device unlock was cancelled or unavailable. Use your PIN instead.";
    renderUnlock();
  };
  setTimeout(()=>pinInput.focus(),0);
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
    state.selectedId=null;
    stopCloudMessageSubscription();
    const syncPending=cloudConversationSyncPending||cloudGroupSyncPending;
    const emptyTitle=syncPending?"Loading conversations…":"No conversations yet";
    const emptyCopy=syncPending?"Connecting securely to Firebase.":firebaseError?`Conversation synchronization failed: ${esc(firebaseError)}`:"Start a private conversation with another FIDUNIO user.";
    app.innerHTML=`<main class="app-shell tablet-shell">${renderConversationSidebar()}<section class="tablet-chat-pane"><div class="content"><div class="card" style="text-align:center;margin-top:24px"><h2>${emptyTitle}</h2><p class="small-note">${emptyCopy}</p>${syncPending?"":'<button class="primary" id="emptyNewBtn">New Message</button>'}</div></div></section></main>`;
    drawTabletConversationList();
    const tSearch=document.querySelector("#tabletSearchBox");
    if(tSearch)tSearch.oninput=e=>drawTabletConversationList(e.target.value);
    document.querySelector("#tabletSettingsBtn")?.addEventListener("click",()=>{state.route="settings";render()});
    document.querySelector("#tabletNewBtn")?.addEventListener("click",()=>{state.route="newConversation";render()});
    document.querySelector("#tabletContactsNav")?.addEventListener("click",()=>{state.route="newConversation";render()});
    document.querySelector("#tabletSettingsNav")?.addEventListener("click",()=>{state.route="settings";render()});
    bindTabletNavigation();
    document.querySelector("#emptyNewBtn")?.addEventListener("click",()=>{state.route="newConversation";render()});
    bindMainSignOut();
    return;
  }

  app.innerHTML=`
    <main class="app-shell">
      ${shellTop("Messages",undefined,'<button class="icon-btn icon-2d" id="settingsBtn" aria-label="Settings">'+icon2d("settings",23)+'</button>'+mainSignOutMarkup())}
      <section class="content">
        <input class="search" id="searchBox" placeholder="Search conversations" />
        <div class="conversation-list" id="conversationList"></div>
      </section>
      <button class="fab icon-2d" id="newBtn" aria-label="New conversation">${icon2d("plus",26)}</button>
    </main>`;
  document.querySelector("#settingsBtn").onclick=()=>{state.route="settings";render()};
  document.querySelector("#newBtn").onclick=()=>{state.route="newConversation";render()};
  bindMainSignOut();
  const list=document.querySelector("#conversationList");
  const draw=(term="")=>{
    const rows=state.conversations.filter(c=>(c.name||"").toLowerCase().includes(term.toLowerCase())||(c.preview||"").toLowerCase().includes(term.toLowerCase()));
    list.innerHTML=rows.length?rows.map(c=>`
        <button class="conversation" data-id="${c.id}">
          <div class="avatar ${c.type==="group"?"group-avatar":""}">${initials(c.name||"FIDUNIO")}</div>
          <div>
            <div class="name">${esc(c.name||"FIDUNIO contact")}</div>
            <div class="preview">${c.type==="group"?"Group • ":""}${esc(c.preview||"")}</div>
          </div>
          <div class="meta">${esc(c.time||"")}${c.unread?`<div class="badge">${c.unread}</div>`:""}</div>
        </button>`).join(""):`<div class="card" style="text-align:center"><h2>${term?"No matching conversations":"No conversations yet"}</h2><p class="small-note">${term?"Try another search.":"Start a private conversation with another FIDUNIO user."}</p></div>`;
    list.querySelectorAll(".conversation").forEach(btn=>btn.onclick=()=>{
      const raw=btn.dataset.id;
      state.selectedId=/^\d+$/.test(raw)?Number(raw):raw;
      state.route="chat";
      const chosen=state.conversations.find(x=>String(x.id)===String(state.selectedId));
      if(chosen)chosen.unread=0;
      if(chosen?.cloudGroup){stopCloudMessageSubscription();beginCloudGroupMessageSubscription(chosen.id);}
      else if(chosen?.cloud){closeGroupForApp();beginCloudMessageSubscription(chosen.id,{force:true});}
      else{closeGroupForApp();stopCloudMessageSubscription();}
      render();
    });
  };
  draw();
  document.querySelector("#searchBox").oninput=e=>draw(e.target.value);
}

function renderGroups(){
  const groups=state.conversations.filter(c=>c.type==="group"||c.cloudGroup);
  const rows=groups.length?groups.map(c=>`<button class="conversation group-list-row" data-id="${esc(c.id)}"><div class="avatar group-avatar">${initials(c.name||"Group")}</div><div><div class="name">${esc(c.name||"FIDUNIO Group")}</div><div class="preview">${esc(c.preview||"No messages yet")}</div></div><div class="meta">${esc(c.time||"")}</div></button>`).join(""):'<div class="card" style="text-align:center"><h2>No groups yet</h2><p class="small-note">Create a group and choose its members.</p></div>';
  const content=`<header class="topbar"><span class="topbar-spacer"></span><h1>Groups</h1><button class="icon-btn icon-2d" id="newGroupFromList" aria-label="New Group">${icon2d("plus",23)}</button></header><section class="content"><div class="conversation-list">${rows}</div><button class="primary" id="newGroupButton">New Group</button></section>`;
  app.innerHTML=isWideLayout()?`<main class="app-shell tablet-shell">${renderConversationSidebar("groups")}<section class="tablet-chat-pane">${content}</section></main>`:`<main class="app-shell">${content}</main>`;
  const start=()=>{state.newGroupMembers=[];state.newGroupName="";state.route="newGroup";render();};
  document.querySelector("#newGroupButton").onclick=start;
  document.querySelector("#newGroupFromList").onclick=start;
  document.querySelectorAll(".group-list-row").forEach(btn=>btn.onclick=()=>{state.selectedId=btn.dataset.id;state.route="chat";beginCloudGroupMessageSubscription(state.selectedId);render();});
  if(isWideLayout()){drawTabletConversationList();bindTabletNavigation();bindMainSignOut();}
}

function renderNewConversation(){
  const cloudEnabled=isFirebaseConfigured() && firebaseUser;
  app.innerHTML=`
    <main class="app-shell">
      ${shellTop("New Message",'<button class="back-btn" id="backBtn">‹</button>')}
      <section class="content">
        <div class="action-sheet">
          <button class="big-choice" id="newGroupBtn"><span class="choice-icon">👥</span><span><strong>New Group</strong><span>Create a group and choose its members</span></span></button>
        </div>
        <div class="card">
          <h2>Choose a Person</h2>
          <div id="fidunioRecipientPickerHost"></div>
          ${cloudEnabled?`<p class="small-note">Select a FIDUNIO user by display name.</p><label class="form-label" for="peerUid">Recipient FIDUNIO ID</label><input class="text-input" id="peerUid" autocomplete="off" placeholder="Recipient UID" /><button class="primary" id="cloudDirectBtn">Start Conversation</button><p class="warning-note">Private one-to-one messages are end-to-end encrypted.</p>`:`<p class="small-note">Sign in to FIDUNIO before starting a conversation.</p>`}
        </div>
      </section>
    </main>`;
  document.querySelector("#backBtn").onclick=()=>{stopCloudMessageSubscription();state.route="messages";render()};
  document.querySelector("#newGroupBtn").onclick=()=>{state.newGroupMembers=[];state.newGroupName="";state.route="newGroup";render()};
  const cloudBtn=document.querySelector("#cloudDirectBtn");
  if(cloudBtn)cloudBtn.onclick=async()=>{
    const peerUid=document.querySelector("#peerUid").value.trim();
    if(!peerUid)return alert("Choose a FIDUNIO user first.");
    if(peerUid===firebaseUser.uid)return alert("Choose another FIDUNIO user.");
    cloudBtn.disabled=true;cloudBtn.textContent="Connecting…";
    try{
      const remote=await startDirectConversation(peerUid);
      mergeCloudConversation(remote);
      state.selectedId=remote.id;state.route="chat";
      beginCloudMessageSubscription(remote.id,{force:true});persistSoon();render();
    }catch(err){alert("Could not create the conversation: "+(err?.message||err));cloudBtn.disabled=false;cloudBtn.textContent="Start Conversation";}
  };
  if(cloudEnabled&&cloudBtn){
    mountNewMessageRecipientPicker({
      host:document.querySelector("#fidunioRecipientPickerHost"),
      uidInput:document.querySelector("#peerUid"),
      startButton:cloudBtn
    }).catch(err=>console.warn("New Message recipient picker unavailable",err));
  }
}

function renderNewGroup(){
  if(!firebaseUser){alert("Sign in to a FIDUNIO account before creating a real group.");state.route="newConversation";return render();}
  app.innerHTML=`<main class="app-shell">${shellTop("New Group",'<button class="back-btn" id="backBtn">‹</button>','<button class="text-btn" id="nextBtn">Next</button>')}<section class="content"><input class="search" id="memberSearch" placeholder="Search FIDUNIO users" /><div class="chip-row" id="selectedChips"></div><div class="choice-list" id="memberChoices"><p class="small-note">Loading FIDUNIO users…</p></div></section></main>`;
  document.querySelector("#backBtn").onclick=()=>{state.route="newConversation";render()};
  const draw=(term="")=>{const selected=new Set(state.newGroupMembers),choices=document.querySelector("#memberChoices"),chips=document.querySelector("#selectedChips");if(!choices||!chips)return;chips.innerHTML=state.newGroupMembers.length?groupCandidates.filter(p=>selected.has(p.uid)).map(p=>`<span class="person-chip">${esc(p.displayName||p.email||p.uid)}</span>`).join(""):'<span class="small-note">Select at least 2 people for the group.</span>';choices.innerHTML=groupCandidates.filter(p=>String(p.displayName||p.email||p.uid).toLowerCase().includes(term.toLowerCase())).map(p=>`<button class="member-option ${selected.has(p.uid)?"selected":""}" data-id="${p.uid}"><div class="avatar">${initials(p.displayName||p.email||"U")}</div><div><strong>${esc(p.displayName||p.email||"FIDUNIO user")}</strong><div class="preview">FIDUNIO account</div></div><div class="checkmark">${selected.has(p.uid)?"✓":""}</div></button>`).join("")||'<p class="small-note">No matching FIDUNIO users.</p>';document.querySelectorAll("#memberChoices .member-option").forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id;state.newGroupMembers=selected.has(id)?state.newGroupMembers.filter(x=>x!==id):[...state.newGroupMembers,id];draw(document.querySelector("#memberSearch").value);});document.querySelector("#nextBtn").disabled=state.newGroupMembers.length<2;};
  draw();listCloudUsers().then(rows=>{groupCandidates=rows||[];draw(document.querySelector("#memberSearch")?.value||"");}).catch(err=>{firebaseError=err?.message||String(err);document.querySelector("#memberChoices").innerHTML=`<p class="warning-note">${esc(firebaseError)}</p>`;});document.querySelector("#memberSearch").oninput=e=>draw(e.target.value);document.querySelector("#nextBtn").onclick=()=>{if(state.newGroupMembers.length>=2){state.route="groupName";render();}};
}

function renderGroupName(){
  const selected=groupCandidates.filter(p=>state.newGroupMembers.includes(p.uid));
  app.innerHTML=`<main class="app-shell">${shellTop("Group Details",'<button class="back-btn" id="backBtn">‹</button>')}<section class="content"><div class="card"><label class="form-label" for="groupNameInput">Group name</label><input class="text-input" id="groupNameInput" maxlength="120" placeholder="Enter a group name" value="${esc(state.newGroupName)}" /><div class="section-title">Members</div><div class="chip-row">${selected.map(p=>`<span class="person-chip">${esc(p.displayName||p.email||p.uid)}</span>`).join("")}</div><p class="small-note">New members begin at join time. Group messages use account-authoritative end-to-end encryption.</p></div><button class="primary" id="createGroupBtn">Create Group</button></section></main>`;
  document.querySelector("#backBtn").onclick=()=>{state.route="newGroup";render()};const input=document.querySelector("#groupNameInput"),btn=document.querySelector("#createGroupBtn");const validate=()=>{state.newGroupName=input.value;btn.disabled=!input.value.trim()||state.newGroupMembers.length<2;};input.oninput=validate;validate();btn.onclick=async()=>{btn.disabled=true;btn.textContent="Creating…";try{const group=await createCloudGroup(state.newGroupName.trim(),state.newGroupMembers);mergeCloudGroup(group);state.selectedId=group.id;state.newGroupMembers=[];state.newGroupName="";state.route="chat";await persistState();beginCloudGroupMessageSubscription(group.id);render();}catch(err){alert("Could not create group: "+(err?.message||err));btn.disabled=false;btn.textContent="Create Group";}};
}

function renderChat(){
  const c=currentConversation();
  if(!c){state.selectedId=null;state.route="messages";return renderMessages();}
  const msgs=state.messages[state.selectedId]||[];
  const chatMarkup=`
      <header class="topbar">
        <button class="back-btn icon-2d" id="backBtn" aria-label="Back">${icon2d("back",23)}</button>
        <div class="chat-header-title">
          <strong>${esc(c.name)}</strong>
          <span class="secure">● ${c.cloud?"Cloud":isGroup(c)?`${c.members.length} members • Secure`:"Secure"}</span>
        </div>
        ${(isGroup(c)||c?.cloud)?`<button class="icon-btn icon-2d" id="infoBtn" aria-label="Info">${icon2d("info",23)}</button>`:`<span class="topbar-spacer"></span>`}
        ${isWideLayout()?"":mainSignOutMarkup()}
      </header>
      ${state.online?"":'<div class="status-banner">Offline — messages will be queued and sent automatically when connection returns.</div>'}
      ${firebaseError?`<div class="status-banner" role="alert">Firebase connection problem: ${esc(firebaseError)}</div>`:""}
      ${isGroup(c)?'<div class="info-banner">New members see conversation only from their join time unless an admin explicitly grants earlier history.</div>':""}
      <section class="chat" id="chatArea">${renderConversationMessages(msgs,c)}</section>
      <section class="composer-wrap">
        <div class="quick-row">${state.quickPhrases.map(q=>`<button class="quick-chip" data-quick="${esc(q)}">${esc(q)}</button>`).join("")}</div>
        <div class="small-note" style="display:flex;align-items:center;gap:8px;margin:0 4px 6px"><label for="disappearSelect">Disappearing:</label><select id="disappearSelect" aria-label="Disappearing message duration">${DISAPPEARING_COMPOSE_PRESETS.map(p=>`<option value="${p.value??"off"}" ${(state.settings.disappearingTextSeconds??null)===p.value?"selected":""}>${esc(p.label)}</option>`).join("")}</select><span>${esc(composeDisappearLabel(state.settings.disappearingTextSeconds))}</span></div>
        <div class="compose-line">
          <button class="more-btn icon-2d" id="moreBtn" aria-label="More tools">${icon2d("plus",24)}</button>
          <textarea id="messageBox" rows="1" placeholder="Type a message…"></textarea>
          <button class="send-btn icon-2d" id="sendBtn" aria-label="Send">${icon2d("send",24)}</button>
        </div>
        <div class="tool-panel ${state.toolsOpen?"open":""}" id="toolPanel">
          ${toolButton("photo","Photo")}${toolButton("file","File")}
          ${toolButton("voice","Audio")}${toolButton("video","Video")}
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
    bindTabletNavigation();
  }else{
    app.innerHTML=`<main class="app-shell">${chatMarkup}</main>`;
  }
  bindMainSignOut();
  document.querySelector("#backBtn").onclick=()=>{state.route="messages";render()};
  const infoBtn=document.querySelector("#infoBtn");
  if(infoBtn)infoBtn.onclick=async()=>{
    if(isGroup(c)){state.route="groupInfo";return render();}
    state.modal={type:"directChatInfo",conversationId:c.id};
    return render();
  };
  document.querySelector("#moreBtn").onclick=()=>{state.toolsOpen=!state.toolsOpen;render()};
  const disappearSelect=document.querySelector("#disappearSelect");
  if(disappearSelect)disappearSelect.onchange=()=>{state.settings.disappearingTextSeconds=disappearSelect.value==="off"?null:Number(disappearSelect.value);persistSoon();render();};
  document.querySelectorAll(".quick-chip").forEach(btn=>btn.onclick=()=>{
    const box=document.querySelector("#messageBox");box.value=btn.dataset.quick;box.focus();
  });
  document.querySelectorAll(".tool").forEach(btn=>btn.onclick=()=>{const label=btn.textContent.trim();if(label==="Photo"||label==="Video"||label==="Audio"){state.modal={type:label==="Photo"?"photoSource":label==="Video"?"videoSource":"audioSource"};return render();}const map={File:["file","*/*",false]};const action=map[label];if(action)chooseAndSendAttachment(...action);});
  const box=document.querySelector("#messageBox");
  box.addEventListener("input",()=>{box.style.height="46px";box.style.height=Math.min(box.scrollHeight,120)+"px";if(!isWideLayout())syncPhoneChatComposerInset({scrollBottom:true});});
  document.querySelector("#sendBtn").onclick=async event=>{
    const button=event.currentTarget;button.disabled=true;
    try{await sendCurrent();}catch(err){alert(err?.message||String(err));}finally{if(button.isConnected)button.disabled=false;}
  };
  box.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();document.querySelector("#sendBtn")?.click();}});
  bindPendingMessageActions();
  document.querySelectorAll(".attachment-retry").forEach(btn=>btn.onclick=event=>{
    event.preventDefault();event.stopPropagation();
    const message=(state.messages[btn.dataset.conversationId]||[]).find(row=>String(row.id)===String(btn.dataset.messageId));
    const descriptor=parseAttachmentDescriptor(message?.text);
    if(message&&descriptor)loadAttachment(btn.dataset.conversationId,message,descriptor,{retry:true});
    render();
  });
  requestAnimationFrame(()=>{if(isWideLayout()){const a=document.querySelector("#chatArea");a.scrollTop=a.scrollHeight;window.scrollTo(0,document.body.scrollHeight);return;}syncPhoneChatComposerInset({scrollBottom:true});});
}

function syncPhoneChatComposerInset({scrollBottom=false}={}){
  const chat=document.querySelector("#chatArea"),composer=document.querySelector(".composer-wrap");
  if(!chat||!composer||isWideLayout())return;
  const inset=Math.ceil(composer.getBoundingClientRect().height)+14;
  chat.style.paddingBottom=`${inset}px`;
  if(scrollBottom)window.scrollTo(0,Math.max(document.documentElement.scrollHeight,document.body.scrollHeight));
}

function groupSenderDisplayName(m,c){
  if(c?.type!=="group"&&!c?.cloudGroup)return "";
  const senderUid=String(m?.senderUid||(m?.mine?firebaseUser?.uid:"")||"");
  const member=(Array.isArray(c?.members)?c.members:[]).find(row=>String(row?.id||row?.uid||"")===senderUid);
  return member?.name||m?.sender||(m?.mine?"You":"FIDUNIO member");
}

function messageCalendarDate(value){
  const d=value instanceof Date?value:value?.toDate?.()||new Date(value);
  return d instanceof Date&&!Number.isNaN(d.getTime())?d:null;
}
function messageDayKey(value){
  const d=messageCalendarDate(value);
  return d?`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`:"";
}
function messageDayLabel(value){
  const d=messageCalendarDate(value);
  return d?new Intl.DateTimeFormat("en-US",{month:"long",day:"numeric",year:"numeric"}).format(d):"";
}
function messageDisplayTime(m){
  const explicit=String(m?.time||"").trim();
  if(explicit)return explicit;
  const d=messageCalendarDate(m?.createdAt);
  return d?new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit"}).format(d):"";
}
function renderConversationMessages(msgs,c){
  let priorDay="";
  return msgs.map(m=>{
    const day=m?.system?"":messageDayKey(m?.createdAt);
    const separator=day&&day!==priorDay?`<div class="chat-date-separator"><span>${esc(messageDayLabel(m.createdAt))}</span></div>`:"";
    if(day)priorDay=day;
    return separator+renderBubble(m,c);
  }).join("");
}

function renderBubble(m,c){
  if(m.system) return `<div class="day-divider">${esc(m.text)} • ${esc(m.time)}</div>`;
  const label=m.state==="queued"?"Queued":m.state==="sending"?"Sending":m.state==="sent"?"Sent":
    m.state==="delivered"?"Delivered":m.state==="failed"?"Failed":"Read";
  const cls=m.state==="queued"?"state-queued":m.state==="failed"?"state-failed":"";
  const hasMessageAction=!m.system;
  const descriptor=parseAttachmentDescriptor(m.text);
  let messageContent=`<div class="msg-text">${esc(m.text)}</div>`;
  if(descriptor){
    const key=attachmentRuntimeKey(c.id,m.id),runtime=attachmentRuntime.get(key);
    if(m.state==="failed"){
      messageContent=`<div class="attachment-card attachment-error">${descriptor.kind==="video"?"Video":descriptor.kind==="photo"?"Photo":"Attachment"} was not sent.<span class="attachment-error-detail">Press and hold this message to delete it, then try sending again.</span></div>`;
    }else if((m.state==="sending"||m.state==="queued")&&!runtime){
      messageContent=`<div class="attachment-card attachment-loading">Sending ${descriptor.kind==="photo"?"photo":"attachment"}…</div>`;
    }else{
      if(!runtime)queueMicrotask(()=>loadAttachment(c.id,m,descriptor));
      if(runtime?.status==="ready"){
        const result=runtime.result,isImage=result.kind==="photo"||String(result.type||"").startsWith("image/");
        messageContent=isImage
          ?`<a class="attachment-image-link" href="${esc(result.url)}" target="_blank" rel="noopener" aria-label="Open ${esc(result.name)}"><img class="message-photo" src="${esc(result.url)}" alt="${esc(result.name)}"></a>`
          :`<a class="attachment-card attachment-file" href="${esc(result.url)}" download="${esc(result.name)}">📎 ${esc(result.name)}</a>`;
      }else if(runtime?.status==="error"){
        messageContent=`<div class="attachment-card attachment-error">${descriptor.kind==="photo"?"Photo":"Attachment"} could not be opened.<span class="attachment-error-detail">${esc(runtime.error?.message||"Unknown attachment error")}</span><button class="attachment-retry" type="button" data-conversation-id="${esc(c.id)}" data-message-id="${esc(m.id)}">Try Again</button></div>`;
      }else messageContent=`<div class="attachment-card attachment-loading">Loading ${descriptor.kind==="photo"?"photo":"attachment"}…</div>`;
    }
  }
  const groupSender=groupSenderDisplayName(m,c);
  const displayTime=messageDisplayTime(m);
  return `<div class="msg-row ${m.mine?"mine":""} ${hasMessageAction?"pending-message-action":""}" ${hasMessageAction?`data-message-id="${esc(m.id)}" data-conversation-id="${esc(c.id)}" role="button" tabindex="0" aria-label="${label} message. Press and hold for actions."`:""}>
    ${groupSender?`<div class="sender-label"><span class="sender-name">${esc(groupSender)}</span><span class="sender-time">${esc(displayTime)}</span></div>`:""}
    <div class="bubble">
      ${messageContent}
      <div class="msg-meta"><span>${esc(m.time)}</span>${m.mine?`<span class="${cls}">${label}</span>`:""}</div>
    </div>
  </div>`;
}

function bindPendingMessageActions(){
  document.querySelectorAll(".pending-message-action").forEach(row=>{
    let timer=null,startX=0,startY=0;
    const clear=()=>{if(timer){clearTimeout(timer);timer=null;}};
    const open=()=>{clear();state.modal={type:"pendingMessage",messageId:row.dataset.messageId,conversationId:row.dataset.conversationId};render();};
    row.oncontextmenu=e=>{e.preventDefault();open();};
    row.onpointerdown=e=>{if(e.button!==0)return;startX=e.clientX;startY=e.clientY;clear();timer=setTimeout(open,650);};
    row.onpointermove=e=>{if(Math.abs(e.clientX-startX)>10||Math.abs(e.clientY-startY)>10)clear();};
    row.onpointerup=clear;row.onpointercancel=clear;row.onpointerleave=clear;
    row.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}};
  });
}

async function sendSelectedAttachmentFile(kind,file){
  const c=currentConversation();if(!firebaseUser||(!c?.cloud&&!c?.cloudGroup))return alert("Attachments require a signed-in cloud conversation.");
  if(!file)return;
  const messageId=crypto.randomUUID(),attachmentId=crypto.randomUUID(),originalName=file.name||`${kind}-${Date.now()}`,originalType=file.type||"application/octet-stream";
  try{validateAttachmentSelection({kind,name:originalName,type:originalType,size:file.size});}
  catch(err){const limit=Math.round((ATTACHMENT_LIMITS_V1[kind]||0)/(1024*1024));const label=kind==="video"?"Video":kind==="audio"?"Audio":kind==="photo"?"Photo":"Attachment";alert(`${label} could not be selected: ${err?.message||err}${limit?` Maximum size is ${limit} MB.`:""}`);return;}
  const previewUrl=URL.createObjectURL(file),previewText=JSON.stringify({fidunioAttachment:1,attachmentId,kind,name:originalName,type:originalType,size:file.size});
  const stagedMessage=stampOutgoingDisappearSelection({id:messageId,mine:true,text:previewText,time:nowTime(),createdAt:new Date(),state:"sending",cloud:true,attachment:{kind,name:originalName,type:originalType,size:file.size}},state.settings.disappearingTextSeconds??null);
  localAttachmentPreviewUrls.add(previewUrl);attachmentRuntime.set(attachmentRuntimeKey(c.id,messageId),{status:"ready",descriptor:parseAttachmentDescriptor(previewText),result:{url:previewUrl,name:originalName,type:originalType,size:file.size,kind,localPreview:true}});
  if(!state.messages[c.id])state.messages[c.id]=[];state.messages[c.id].push(stagedMessage);c.preview=messagePreview(previewText);c.time=stagedMessage.time;render();
  try{
    const bytes=new Uint8Array(await file.arrayBuffer());
    const descriptor={attachmentId,messageId,kind,name:originalName,type:originalType,size:file.size,bytes,uid:firebaseUser.uid,conversationId:String(c.id),recipientUid:c.peerUid||null,groupId:c.cloudGroup?String(c.id):null,disappearAfterSeconds:state.settings.disappearingTextSeconds??null};
    const svc=createAttachmentSendService({stageEncryptedOutbox:async row=>{stagedMessage.text=JSON.stringify({fidunioAttachment:1,attachmentId:row.attachmentId,kind:row.attachmentKind,name:row.manifest.name,type:row.manifest.type,size:row.manifest.size,key:row.attachmentKey,storagePaths:row.storagePaths});stagedMessage.disappearAfterSeconds=row.disappearAfterSeconds;await persistState();render();},uploadEncryptedAttachment,commitAttachmentMessage:async row=>{if(c.cloudGroup)await queueGroupTextForApp({groupId:c.id,messageId:row.messageId,text:stagedMessage.text,time:stagedMessage.time,disappearAfterSeconds:row.disappearAfterSeconds,persistEncryptedOutbox:persistGroupOutboxPayload});else await queueOutboxMessage(c.id,stagedMessage);await flushQueuedAfterAuthoritativeReconcile();},removeEncryptedOutbox:async()=>{}});
    await svc.send(descriptor);
  }catch(err){stagedMessage.state="failed";await persistState();render();alert("Attachment could not be sent: "+(err?.message||err));}
}

async function chooseAndSendAttachment(kind,accept,capture){
  const c=currentConversation();if(!firebaseUser||(!c?.cloud&&!c?.cloudGroup))return alert("Attachments require a signed-in cloud conversation.");
  const input=document.createElement("input");input.type="file";input.accept=accept;if(capture)input.setAttribute("capture","environment");
  const closePicker=()=>{attachmentPickerActive=false;input.remove();};
  input.oncancel=closePicker;
  input.onchange=async()=>{const file=input.files?.[0];closePicker();if(file)await sendSelectedAttachmentFile(kind,file);};
  input.hidden=true;input.setAttribute("aria-hidden","true");document.body.appendChild(input);attachmentPickerActive=true;input.click();
}

async function sendCurrent(){
  if(messageSendInFlight)return;
  const box=document.querySelector("#messageBox");
  const text=box.value.trim();
  if(!text) return;
  messageSendInFlight=true;
  box.value="";
  box.style.height="46px";

  let stagedMessage=null;
  try{
    const conversationId=state.selectedId;
    const c=currentConversation();
    const cloud=!!c?.cloud;
    const cloudGroup=!!c?.cloudGroup;

  if(cloud && c?.peerUid && !firebaseUser){throw new Error("Sign in before sending an encrypted message.");}

  const m=stagedMessage=stampOutgoingDisappearSelection({
    id:crypto.randomUUID(),
    mine:true,
    text,
    time:nowTime(),
    createdAt:new Date(),
    state:(state.online && (!cloud || firebaseUser))?"sending":"queued",
    cloud
  },state.settings.disappearingTextSeconds);

  if(!state.messages[conversationId]) state.messages[conversationId]=[];
  state.messages[conversationId].push(m);
  c.preview=messagePreview(text);
  c.time=m.time;
  render();

  // The Outbox is authoritative. Group plaintext enters only the encrypted local Outbox.
  if(cloudGroup){
    m.cloud=true;m.group=true;
    await queueGroupTextForApp({groupId:conversationId,messageId:m.id,text,time:m.time,disappearAfterSeconds:m.disappearAfterSeconds??null,persistEncryptedOutbox:persistGroupOutboxPayload});
  }else await queueOutboxMessage(conversationId,m);
  await persistState();
  render();

    if(state.online){
      if(cloud || cloudGroup){
        await flushQueuedAfterAuthoritativeReconcile({notifyUser:true});
      }else{
        m.state="failed";
        await persistState();
        render();
      }
    }
  }catch(err){
    if(stagedMessage){
      stagedMessage.state="failed";
      persistSoon();
      render();
    }else{
      const currentBox=document.querySelector("#messageBox");
      if(currentBox&&!currentBox.value)currentBox.value=text;
    }
    throw err;
  }finally{
    messageSendInFlight=false;
  }
}

function serializeReconnectRecovery(work){
  const run=reconnectRecoveryTail.then(work,work);
  reconnectRecoveryTail=run.catch(()=>{});
  return run;
}
let outboxCycleTail=Promise.resolve();
let outboxCycleRunning=false;
let outboxCyclePending=false;
let outboxCycleNotify=false;
const outboxCancellationRequests=new Set();
async function cancelPendingOutboxMessage(messageId,conversationId){
  const id=String(messageId||"");
  if(!id||!firebaseUser)throw new Error("A signed-in account is required to delete this message.");
  outboxCancellationRequests.add(id);
  try{
    await outboxCycleTail.catch(()=>{});
    const record=await getOutboxMessage(id);
    if(!record){await deleteMessageForMe(conversationId,id);return;}
    const payload=await decryptOutboxRecord(record);
    if(String(payload.conversationId)!==String(conversationId))throw new Error("Message ownership could not be confirmed.");
    await purgeLocalDisappearingMessageTraces(firebaseUser.uid,[id]);
    const c=state.conversations.find(x=>String(x.id)===String(conversationId));
    const last=state.messages[conversationId]?.at(-1);
    if(c&&last){c.preview=messagePreview(last.text);c.time=last.time||"";}
    await persistState();
  }finally{outboxCancellationRequests.delete(id);}
}
async function reconcileOutboxBeforeReplay(){
  if(!state.online||!firebaseUser)return{acceptedOutboxDeleteIds:[],purgeMessageIds:[],replayMessageIds:[],blockedMessageIds:[]};
  return serializeReconnectRecovery(async()=>{
    const records=await getOutboxRecords();
    const decoded=[];
    const authoritativeRemoteIdsByConversation={};
    const authorityKind=new Map();
    for(const record of records){
      let payload;
      try{payload=await decryptOutboxRecord(record);}catch(err){console.warn("Reconnect Outbox decrypt failed; replay blocked",record?.id,err);continue;}
      const conversationId=String(payload.conversationId||"");
      const isGroup=payload.kind==="group-e2ee-v1";
      const isCloud=isGroup||payload.cloud===true;
      if(!isCloud||!conversationId)continue;
      decoded.push({id:record.id,messageId:payload.messageId||record.id,conversationId,groupId:isGroup?conversationId:null,sendAttempted:record.sendAttempted===true});
      authorityKind.set(conversationId,isGroup?"group":"direct");
    }
    for(const [conversationId,kind] of authorityKind){
      authoritativeRemoteIdsByConversation[conversationId]=kind==="group"
        ?await readCloudGroupMessageIdsFromServer(conversationId)
        :await readCloudMessageIdsFromServer(conversationId,firebaseUser.uid);
    }
    const plan=planReconnectOutboxConvergence({messagesByConversation:state.messages,outboxRecords:decoded,authoritativeRemoteIdsByConversation});
    for(const id of plan.acceptedOutboxDeleteIds){
      for(const list of Object.values(state.messages)){
        const row=Array.isArray(list)?list.find(x=>String(x?.id)===String(id)):null;
        if(row){row.serverBacked=true;if(["queued","sending","failed"].includes(row.state))row.state="sent";}
      }
      await removeOutboxMessage(id);
    }
    if(plan.purgeMessageIds.length)await purgeLocalDisappearingMessageTraces(firebaseUser.uid,plan.purgeMessageIds);
    for(const id of plan.blockedMessageIds){
      for(const list of Object.values(state.messages)){
        const row=Array.isArray(list)?list.find(x=>String(x?.id)===String(id)):null;
        if(row&&["queued","sending","failed"].includes(row.state))row.state="failed";
      }
    }
    await persistState();
    return plan;
  });
}
async function requeueUnattemptedSendingOutboxMessages(){
  const records=await getOutboxRecords();
  const requeueIds=new Set(planTimedOutOutboxRequeue({outboxRecords:records,messagesByConversation:state.messages}));
  for(const list of Object.values(state.messages)){
    for(const m of Array.isArray(list)?list:[]){
      if(requeueIds.has(String(m.id)))m.state="queued";
    }
  }
  await persistState();
  render();
}
async function flushQueuedAfterAuthoritativeReconcile({notifyUser=false}={}){
  if(!state.online||!firebaseUser)return;
  outboxCyclePending=true;
  outboxCycleNotify=outboxCycleNotify||notifyUser;
  if(outboxCycleRunning)return outboxCycleTail;
  outboxCycleRunning=true;
  outboxCycleTail=(async()=>{
    while(outboxCyclePending){
      outboxCyclePending=false;
      const cycleNotify=outboxCycleNotify;
      outboxCycleNotify=false;
      try{
        await awaitBoundedOutboxReconciliation(ensureFirebaseAuthSession(),{stage:"auth-session"});
        const plan=await awaitBoundedOutboxReconciliation(reconcileOutboxBeforeReplay());
        await flushQueued({allowedCloudMessageIds:new Set(plan.replayMessageIds),notifyUser:cycleNotify});
        firebaseError="";
      }catch(err){
        firebaseError=err?.message||String(err);
        console.warn("Authoritative reconnect reconciliation failed; cloud Outbox replay blocked",err);
        if(isOutboxReconciliationTimeout(err)){
          await requeueUnattemptedSendingOutboxMessages();
          if(cycleNotify)alert(firebaseError);
        }else if(cycleNotify){
          render();
          alert(firebaseError);
        }
      }
    }
  })().finally(()=>{outboxCycleRunning=false;});
  return outboxCycleTail;
}
async function flushQueued({allowedCloudMessageIds=null,notifyUser=false}={}){
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
    if(outboxCancellationRequests.has(String(payload.messageId))){m.state="queued";await persistState();continue;}
    const isGroupPayload=payload.kind==="group-e2ee-v1";
    const isCloud=payload.cloud || !!c?.cloud || isGroupPayload;
    if(isCloud&&allowedCloudMessageIds instanceof Set&&!allowedCloudMessageIds.has(String(payload.messageId))){
      m.state=record.sendAttempted===true?"failed":"queued";
      await persistState();
      continue;
    }

    if(isGroupPayload){
      if(!firebaseUser){m.state="queued";await persistState();continue;}
      try{
        m.state="sending";await persistState();
        if(outboxCancellationRequests.has(String(payload.messageId))){m.state="queued";await persistState();continue;}
        await markOutboxSendAttempted(payload.messageId);
        await flushGroupOutboxForApp(payload,{removeEncryptedOutbox:removeOutboxMessage});
        m.state="sent";await persistState();
      }catch(err){m.state="failed";firebaseError=err?.message||String(err);await persistState();}
      if(state.route==="chat"&&String(state.selectedId)===String(payload.conversationId))render();
      continue;
    }
    if(isCloud){
      if(!firebaseUser){
        m.state="queued";
        await persistState();
        continue;
      }
      let sendAttempted=record.sendAttempted===true;
      try{
        m.state="sending";
        await persistState();
        if(state.route==="chat"&&String(state.selectedId)===String(payload.conversationId)) render();

        if(outboxCancellationRequests.has(String(payload.messageId))){m.state="queued";await persistState();continue;}
        await markOutboxSendAttempted(payload.messageId);
        sendAttempted=true;
        if(outboxCancellationRequests.has(String(payload.messageId))){m.state="queued";await persistState();continue;}
        const peerUid=await awaitBoundedOutboxReconciliation(resolvePeerUidForConversation(payload.conversationId),{stage:"peer-resolution"});
        if(!peerUid)throw new Error("Recipient account identity is unavailable.");
        const encrypted=await awaitBoundedOutboxReconciliation(prepareAccountDirectMessage({uid:firebaseUser.uid,peerUid,conversationId:payload.conversationId,messageId:payload.messageId,text:payload.text,disappearingPurgeVersion:payload.disappearingPurgeVersion??null}),{stage:"envelope-preparation"});
        await awaitBoundedOutboxReconciliation(sendCloudMessage(payload.conversationId,{id:payload.messageId,text:"",...encrypted,timeLabel:payload.time,state:"sent",disappearAfterSeconds:payload.disappearAfterSeconds??null}),{stage:"send-confirmation"});

        m.state="sent";
        // Remove the Outbox item only after Firestore confirms the write.
        await removeOutboxMessage(payload.messageId);
        await persistState();
      }catch(err){
        // Preserve the Outbox. Only work that never crossed the durable
        // attempt boundary may return to Queued; ambiguous attempted work
        // remains Failed until authoritative reconciliation resolves it.
        m.state=(sendAttempted||timeoutRequiresFailedState(err))?"failed":"queued";
        firebaseError=err?.message || String(err);
        await persistState();
        if(notifyUser)alert(firebaseError);
      }
    }else{
      m.state="failed";
      await persistState();
    }
  }

  render();
}
let reconnectRecoveryTimer1=null;
let reconnectRecoveryTimer2=null;
function scheduleReconnectRecovery(){
  if(reconnectRecoveryTimer1) clearTimeout(reconnectRecoveryTimer1);
  if(reconnectRecoveryTimer2) clearTimeout(reconnectRecoveryTimer2);

  // Every cloud replay first performs an explicit server read. Known
  // server-accepted rows have their stale Outbox copy removed; known
  // server-backed disappearing rows that are now absent are purged before
  // any retry. Cache-only state never authorizes replay or purge.
  flushQueuedAfterAuthoritativeReconcile();
  reconnectRecoveryTimer1=setTimeout(()=>{
    if(state.online && firebaseUser) flushQueuedAfterAuthoritativeReconcile();
  },1500);
  reconnectRecoveryTimer2=setTimeout(()=>{
    if(state.online && firebaseUser) flushQueuedAfterAuthoritativeReconcile();
  },4000);
}
function recoverForegroundCloudSession(){
  state.online=navigator.onLine;
  void applyPendingNotificationRoute();
  // Lifecycle recovery is one of the few times we deliberately replace the
  // listener. Normal conversation metadata snapshots no longer restart it.
  ensureActiveCloudMessageSubscription(true);
  if(state.online) scheduleReconnectRecovery();
  render();
}
window.addEventListener("online",()=>{
  void recordNotificationDiagnostic("app","online",{route:state.route,selectedId:state.selectedId,pendingNotificationRoute});
  state.online=true;
  ensureActiveCloudMessageSubscription(true);
  render();
  scheduleReconnectRecovery();
});
window.addEventListener("offline",()=>{
  void recordNotificationDiagnostic("app","offline",{route:state.route,selectedId:state.selectedId,pendingNotificationRoute});
  state.online=false;
  if(reconnectRecoveryTimer1) clearTimeout(reconnectRecoveryTimer1);
  if(reconnectRecoveryTimer2) clearTimeout(reconnectRecoveryTimer2);
  persistSoon();
  render();
});
document.addEventListener("visibilitychange",()=>{
  void recordNotificationDiagnostic("app","visibilitychange",{visibilityState:document.visibilityState,route:state.route,selectedId:state.selectedId,pendingNotificationRoute});
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

window.addEventListener("pageshow",event=>{void recordNotificationDiagnostic("app","pageshow",{persisted:event.persisted,route:state.route,selectedId:state.selectedId,pendingNotificationRoute});recoverForegroundCloudSession();});

function renderGroupInfo(){
  const c=currentConversation();
  if(!c||c.type!=="group"){state.route="chat";return render()}
  const myUid=firebaseUser?.uid||"",isAdmin=Array.isArray(c.adminUids)&&c.adminUids.includes(myUid),isOwner=c.ownerUid===myUid;
  app.innerHTML=`
    <main class="app-shell group-info-shell">
      ${shellTop("Group Info",'<button class="back-btn" id="backBtn">‹</button>')}
      <section class="content">
        <div class="card" style="text-align:center">
<div class="avatar group-avatar" style="margin:0 auto 10px">${initials(c.name)}</div>
<h2 style="font-size:22px;margin:0">${esc(c.name)}</h2>
<p class="small-note">${c.members.length} members • Secure group</p>
${isAdmin?'<button class="secondary" id="renameBtn">Rename Group</button>':''}
        </div>
        <div class="card">
<h2>Members</h2>
${c.members.map(m=>`
  <div class="member-card">
    <div class="avatar">${initials(m.name)}</div>
    <div class="row-main">
      <strong>${esc(m.name)}</strong>
      <span>${esc(m.joinedAt)}</span>
      ${m.historyAccess==="from_join"?'<span class="history-lock">Earlier history hidden</span>':m.historyAccess==="all"?'<span class="history-lock">Earlier history available</span>':""}${isAdmin&&m.id!==myUid?`<button class="row-action historyGrantBtn" data-id="${m.id}">Grant earlier history</button>`:""}
    </div>
    <div>${m.role!=="Member"?`<span class="role-tag">${esc(m.role)}</span>`:""}${isAdmin&&m.id!==c.ownerUid&&m.id!==myUid?` <button class="row-action removeMemberBtn" data-id="${m.id}">Remove</button>`:""}</div>
  </div>`).join("")}
${isAdmin?'<button class="secondary" id="addMemberBtn">＋ Add Member</button>':''}
        </div>
        <div class="card">
<h2>Group Controls</h2>
<div class="row"><div class="row-main"><strong>History policy</strong><span>New members see messages only from the time they join. An administrator may deliberately grant earlier history from the beginning or a selected date.</span></div><span class="role-tag">From join</span></div>
<div class="row"><div class="row-main"><strong>Encryption</strong><span>Account-authoritative group E2EE with membership-bound key epochs.</span></div><span class="role-tag">E2EE</span></div>
        </div>
        ${isOwner?'<p class="small-note">The group owner cannot leave until ownership transfer is deliberately implemented.</p>':'<button class="danger-btn" id="leaveBtn">Leave Group</button>'}
      </section>
    </main>`;
  document.querySelector("#backBtn").onclick=()=>{state.route="chat";render()};
  const rename=document.querySelector("#renameBtn");if(rename)rename.onclick=async()=>{const name=prompt("Rename group:",c.name);if(!name?.trim()||name.trim()===c.name)return;rename.disabled=true;try{await renameGroupForApp(c.id,name.trim());}catch(err){firebaseError=err?.message||String(err);alert(firebaseError);}finally{render();}};
  const add=document.querySelector("#addMemberBtn");if(add)add.onclick=()=>openAddMemberModal();
  document.querySelectorAll(".historyGrantBtn").forEach(btn=>btn.onclick=()=>{const member=c.members.find(m=>String(m.id)===String(btn.dataset.id));if(!member)return;state.modal={type:"history",memberId:member.id,historyChoice:"beginning",historyDate:""};render();});
  document.querySelectorAll(".removeMemberBtn").forEach(btn=>btn.onclick=async()=>{const member=c.members.find(m=>String(m.id)===String(btn.dataset.id));if(!member||!confirm(`Remove ${member.name} from this group?`))return;btn.disabled=true;try{await removeGroupMemberForApp(c.id,member.id);}catch(err){firebaseError=err?.message||String(err);alert(firebaseError);}finally{render();}});
  const leave=document.querySelector("#leaveBtn");if(leave)leave.onclick=async()=>{if(!confirm(`Leave ${c.name}? You will lose access to future messages.`))return;leave.disabled=true;try{await leaveGroupForApp(c.id);state.route="messages";state.selectedId=null;}catch(err){firebaseError=err?.message||String(err);alert(firebaseError);}finally{render();}};
}

function openAddMemberModal(){
  const c=currentConversation();if(!c)return;
  state.modal={type:"addMember",options:[],selected:null,loading:true};render();
  const currentIds=new Set(c.members.map(m=>String(m.id)));
  listCloudUsers().then(rows=>{if(!state.modal||state.modal.type!=="addMember")return;const available=(rows||[]).filter(p=>!currentIds.has(String(p.uid))).map(p=>({id:p.uid,name:p.displayName||p.email||p.uid}));state.modal={type:"addMember",options:available,selected:available[0]?.id||null,loading:false};render();}).catch(err=>{firebaseError=err?.message||String(err);if(state.modal?.type==="addMember"){state.modal={type:"addMember",options:[],selected:null,loading:false,error:firebaseError};render();}});
}

function renderModal(){
  const modal=state.modal;
  const host=document.createElement("div");
  host.className="modal-backdrop";
  if(modal.type==="photoSource"){
    host.innerHTML=`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="photoSourceTitle">
        <h2 id="photoSourceTitle">Send a Picture</h2>
        <p>Choose where your picture comes from.</p>
        <div class="modal-actions">
          <button class="modal-confirm" id="photoLibraryBtn">Photo Library</button>
          <button class="modal-confirm" id="photoCameraBtn">Take a Picture</button>
          <button class="modal-cancel" id="modalCancel">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(host);
    const choose=capture=>{state.modal=null;host.remove();chooseAndSendAttachment("photo","image/*",capture);};
    host.querySelector("#photoLibraryBtn").onclick=()=>choose(false);
    host.querySelector("#photoCameraBtn").onclick=()=>choose(true);
    host.querySelector("#modalCancel").onclick=()=>{state.modal=null;host.remove();render();};
  } else if(modal.type==="videoSource"){
    host.innerHTML=`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="videoSourceTitle">
        <h2 id="videoSourceTitle">Send a Video</h2>
        <p>Choose where your video comes from.</p>
        <div class="modal-actions">
          <button class="modal-confirm" id="videoLibraryBtn">Photo Library</button>
          <button class="modal-confirm" id="videoCameraBtn">Camera</button>
          <button class="modal-cancel" id="modalCancel">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(host);
    const choose=capture=>{state.modal=null;host.remove();chooseAndSendAttachment("video","video/*",capture);};
    host.querySelector("#videoLibraryBtn").onclick=()=>choose(false);
    host.querySelector("#videoCameraBtn").onclick=()=>choose(true);
    host.querySelector("#modalCancel").onclick=()=>{state.modal=null;host.remove();render();};
  } else if(modal.type==="audioSource"){
    host.innerHTML=`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="audioSourceTitle">
        <h2 id="audioSourceTitle">Send Audio</h2>
        <p>Record a new voice message or choose a saved audio file.</p>
        <div class="modal-actions">
          <button class="modal-confirm" id="audioRecordBtn">Record Audio</button>
          <button class="modal-confirm" id="audioFileBtn">Choose Audio File</button>
          <button class="modal-cancel" id="modalCancel">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(host);
    host.querySelector("#audioRecordBtn").onclick=()=>{state.modal={type:"audioRecorder"};host.remove();render();};
    host.querySelector("#audioFileBtn").onclick=()=>{state.modal=null;host.remove();chooseAndSendAttachment("audio","audio/*",false);};
    host.querySelector("#modalCancel").onclick=()=>{state.modal=null;host.remove();render();};
  } else if(modal.type==="audioRecorder"){
    host.innerHTML=`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="audioRecorderTitle">
        <h2 id="audioRecorderTitle">Record Audio</h2>
        <p id="audioRecorderStatus">Ready to record from the microphone.</p>
        <div class="modal-actions">
          <button class="modal-confirm" id="audioStartBtn">Start Recording</button>
          <button class="modal-confirm" id="audioStopBtn" hidden>Stop &amp; Send</button>
          <button class="modal-cancel" id="modalCancel">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(host);
    const status=host.querySelector("#audioRecorderStatus"),startBtn=host.querySelector("#audioStartBtn"),stopBtn=host.querySelector("#audioStopBtn"),cancelBtn=host.querySelector("#modalCancel");
    let stream=null,recorder=null,chunks=[],discard=false;
    const stopTracks=()=>{for(const track of stream?.getTracks?.()||[])track.stop();stream=null;};
    const exitToSource=()=>{state.modal={type:"audioSource"};host.remove();render();};
    cancelBtn.onclick=()=>{discard=true;if(recorder&&recorder.state!=="inactive")recorder.stop();else stopTracks();state.modal=null;host.remove();render();};
    startBtn.onclick=async()=>{
      if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined"){alert("Audio recording is not available in this browser. Choose Audio File instead.");return exitToSource();}
      startBtn.disabled=true;status.textContent="Requesting microphone access…";
      try{
        stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
        const candidates=["audio/mp4","audio/webm;codecs=opus","audio/webm"];
        const mime=candidates.find(type=>MediaRecorder.isTypeSupported?.(type))||"";
        recorder=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);
        chunks=[];discard=false;
        recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
        recorder.onerror=e=>{stopTracks();alert("Audio recording failed: "+(e.error?.message||"Recorder error"));if(host.isConnected)exitToSource();};
        recorder.onstop=async()=>{
          stopTracks();
          if(discard||!chunks.length)return;
          const reportedType=recorder.mimeType||mime||chunks[0]?.type||"audio/mp4";
          const type=String(reportedType).split(";",1)[0].trim().toLowerCase();
          const ext=type.includes("mp4")?"m4a":type.includes("ogg")?"ogg":"webm";
          const blob=new Blob(chunks,{type});
          const file=new File([blob],`fidunio-audio-${Date.now()}.${ext}`,{type,lastModified:Date.now()});
          state.modal=null;if(host.isConnected)host.remove();render();
          await sendSelectedAttachmentFile("audio",file);
        };
        recorder.start();status.textContent="Recording…";startBtn.hidden=true;stopBtn.hidden=false;
      }catch(err){stopTracks();startBtn.disabled=false;status.textContent="Microphone access was not started.";alert("Could not start audio recording: "+(err?.message||err));}
    };
    stopBtn.onclick=()=>{if(!recorder||recorder.state==="inactive")return;stopBtn.disabled=true;status.textContent="Finishing recording…";recorder.stop();};
  } else if(modal.type==="pendingMessage"){
    const message=state.messages[modal.conversationId]?.find(x=>String(x.id)===String(modal.messageId));
    const isPending=message&&["queued","sending","failed"].includes(message.state);
    const conversation=state.conversations.find(x=>String(x.id)===String(modal.conversationId));
    const canDeleteForEveryone=MESSAGE_DELETE_FOR_EVERYONE_ENABLED&&message?.mine&&!isPending&&["sent","delivered","read"].includes(message.state)&&!!(conversation?.cloud||conversation?.cloudGroup);
    host.innerHTML=`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="pendingMessageTitle">
        <h2 id="pendingMessageTitle">Message actions</h2>
        <p>${isPending?"This message has not completed sending. Delete it and permanently stop future retries?":"Delete only from this device, or remove it for everyone?"}</p>
        <div class="modal-actions ${isPending?"":"message-delete-actions"}">
          ${isPending?'<button class="modal-delete" id="modalDeletePending">Delete Message</button>':'<button class="modal-delete" id="modalDeleteForMe">Delete for Me</button>'}
          ${canDeleteForEveryone?'<button class="modal-delete" id="modalDeleteForEveryone">Delete for Everyone</button>':""}
          <button class="modal-cancel" id="modalCancel">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(host);
    host.querySelector("#modalCancel").onclick=()=>{state.modal=null;host.remove();render();};
    const perform=async(button,work)=>{
      button.disabled=true;
      try{
        await work();
        state.modal=null;host.remove();render();
      }
      catch(err){button.disabled=false;alert(err?.message||String(err));}
    };
    const pendingBtn=host.querySelector("#modalDeletePending");if(pendingBtn)pendingBtn.onclick=()=>perform(pendingBtn,()=>cancelPendingOutboxMessage(modal.messageId,modal.conversationId));
    const meBtn=host.querySelector("#modalDeleteForMe");if(meBtn)meBtn.onclick=()=>perform(meBtn,()=>deleteMessageForMe(modal.conversationId,modal.messageId));
    const everyoneBtn=host.querySelector("#modalDeleteForEveryone");if(everyoneBtn)everyoneBtn.onclick=()=>perform(everyoneBtn,async()=>{if(conversation?.cloudGroup)await deleteCloudGroupMessageForEveryone(modal.conversationId,modal.messageId);else await deleteCloudDirectMessageForEveryone(modal.conversationId,modal.messageId);await purgeLocalDisappearingMessageTraces(firebaseUser.uid,[modal.messageId]);});
  } else if(modal.type==="addMember"){
    host.innerHTML=`
      <div class="modal">
        <h2>Add Member</h2>
        <p>New members begin with access only from the time they join.</p>
        ${modal.loading?'<p class="small-note">Loading FIDUNIO users…</p>':modal.error?`<p class="warning-note">${esc(modal.error)}</p>`:modal.options.length?`
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
          `<p>No additional FIDUNIO accounts are available to add.</p><button class="secondary" id="modalCancel">Close</button>`}
      </div>`;
    document.body.appendChild(host);
    host.querySelectorAll('input[name="newMember"]').forEach(r=>r.onchange=()=>state.modal.selected=r.value);
    host.querySelector("#modalCancel").onclick=()=>{state.modal=null;host.remove();render()};
    const confirm=host.querySelector("#modalConfirm");
    if(confirm) confirm.onclick=async()=>{
      const modalNow=state.modal,p=modalNow?.options?.find(x=>String(x.id)===String(modalNow.selected)),c=currentConversation();
      if(!p||!c)return;
      confirm.disabled=true;
      try{await addGroupMemberForApp(c.id,p.id);state.modal=null;host.remove();render();}
      catch(err){firebaseError=err?.message||String(err);confirm.disabled=false;alert(firebaseError);}
    };
  } else if(modal.type==="directChatInfo"){
    const c=state.conversations.find(x=>String(x.id)===String(modal.conversationId));
    host.innerHTML=`
      <div class="modal">
        <h2>Chat Info</h2>
        <p><strong>${esc(c?.name||"FIDUNIO contact")}</strong></p>
        <p class="small-note">One-to-one FIDUNIO conversation.</p>
        <button class="secondary" id="modalCancel">Close</button>
      </div>`;
    document.body.appendChild(host);
    host.querySelector("#modalCancel").onclick=()=>{state.modal=null;host.remove();render()};
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
              status==="changed"?"COMPATIBILITY DEVICE KEY CHANGED — account E2EE sending is not paused":
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
        <p class="warning-note">This compatibility device-key verification is local to this installation and is separate from account-authoritative E2EE. It does not provide automatic QR/device linking.</p>
        <div class="modal-actions">
          <button class="modal-cancel" id="modalCancel">Close</button>
          ${fp && status!=="verified" ? '<button class="modal-confirm" id="verifyPeerBtn">Verify Current Device Key</button>' : ""}
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
      if(state.online) flushQueuedAfterAuthoritativeReconcile({notifyUser:true});
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
          <label class="radio-row"><input type="radio" name="history" value="beginning" ${modal.historyChoice==="beginning"?"checked":""}><span><strong>From beginning</strong><div class="small-note">Share all retained earlier history that is still available.</div></span></label>
          <label class="radio-row"><input type="radio" name="history" value="date" ${modal.historyChoice==="date"?"checked":""}><span><strong>From selected date</strong><div class="small-note">Only retained messages on or after this date are eligible.</div></span></label>
          <label class="form-label" for="historyDate">Selected date</label><input class="text-input" id="historyDate" type="date" value="${esc(modal.historyDate||"")}" ${modal.historyChoice==="date"?"":"disabled"}>
        </div>
        <div class="modal-actions">
          <button class="modal-cancel" id="modalCancel">Cancel</button>
          <button class="modal-confirm" id="modalConfirm">Grant Access</button>
        </div>
      </div>`;
    document.body.appendChild(host);
    host.querySelectorAll('input[name="history"]').forEach(r=>r.onchange=()=>{state.modal.historyChoice=r.value;const d=host.querySelector("#historyDate");if(d)d.disabled=r.value!=="date";});
    const historyDate=host.querySelector("#historyDate");if(historyDate)historyDate.onchange=()=>state.modal.historyDate=historyDate.value;
    host.querySelector("#modalCancel").onclick=()=>{state.modal=null;host.remove();render()};
    host.querySelector("#modalConfirm").onclick=async()=>{
      const modalNow=state.modal;if(!modalNow||modalNow.type!=="history")return;
      let boundary;if(modalNow.historyChoice==="beginning")boundary={kind:"beginning"};else{if(!modalNow.historyDate)return alert("Choose the first date to share.");const at=new Date(`${modalNow.historyDate}T00:00:00`);if(Number.isNaN(at.getTime()))return alert("Choose a valid date.");boundary={kind:"timestamp",at};}
      const confirmBtn=host.querySelector("#modalConfirm");confirmBtn.disabled=true;
      try{const result=await grantGroupHistoryForApp(c.id,member.id,boundary);state.modal=null;host.remove();alert(`Earlier history granted (${result.totalCopies} message${result.totalCopies===1?"":"s"}).`);render();}
      catch(err){firebaseError=err?.message||String(err);confirmBtn.disabled=false;alert(firebaseError);}
    };
  }
  host.onclick=e=>{if(e.target===host){state.modal=null;host.remove();render()}};
}

function renderSettings(){
  app.innerHTML=`
    <main class="app-shell">
      ${shellTop("Settings",'<button class="back-btn" id="backBtn">‹</button>')}
      <section class="content settings">
        <div class="card" id="localSecurityCard"><h2>Privacy & Access</h2>
          ${(()=>{const security=getLocalSecurityStatus();return `
            <div class="row-main"><strong>FIDUNIO PIN</strong><span>${security.hasPin?"Configured":"Complete Security setup below"}${security.hasBiometric?" • Device unlock enabled":""}</span></div>
            <label class="form-label" for="lockTimeoutSelect">Lock after inactivity</label>
            <select class="text-input" id="lockTimeoutSelect">${LOCK_TIMEOUTS.map(x=>`<option value="${x.value}" ${security.timeoutMs===x.value?"selected":""}>${esc(x.label)}</option>`).join("")}</select>
            ${security.hasPin?`
              <button class="secondary" id="${security.hasBiometric?"disableBiometricBtn":"enableBiometricBtn"}" style="margin-top:10px">${security.hasBiometric?"Disable Device Unlock":"Enable Device Unlock"}</button>
              <button class="secondary" id="lockNowBtn" style="margin-top:10px">Lock Now</button>
            `:'<p class="small-note">Create your one six-digit FIDUNIO PIN in the Security section.</p>'}
            <p class="small-note">Your PIN is never stored. Device unlock uses the secure capability provided by your browser and device.</p>
            ${localSecurityMessage?`<p class="${localSecurityMessageIsError?"warning-note":"small-note"}">${esc(localSecurityMessage)}</p>`:""}
          `})()}
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
          <h2>Account</h2>
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
          <p class="small-note">Your account signs you in securely. Message encryption is managed automatically.</p>
        </div>

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

  const timeoutSelect=document.querySelector("#lockTimeoutSelect");
  if(timeoutSelect)timeoutSelect.onchange=async()=>{
    timeoutSelect.disabled=true;
    try{await setLockTimeoutMs(Number(timeoutSelect.value));setLocalSecurityMessage("Inactivity lock updated.");renderSettings();}
    catch(err){setLocalSecurityMessage(err?.message||String(err),true);renderSettings();}
  };
  const setPinBtn=document.querySelector("#setLocalPinBtn");
  if(setPinBtn)setPinBtn.onclick=async()=>{
    const pin=document.querySelector("#newLocalPin").value,confirm=document.querySelector("#confirmLocalPin").value;
    if(pin!==confirm){setLocalSecurityMessage("PIN entries do not match.",true);renderSettings();return;}
    setPinBtn.disabled=true;setPinBtn.textContent="Setting…";
    try{await setLocalPin(pin);setLocalSecurityMessage("Local PIN is set on this installation.");renderSettings();}
    catch(err){setLocalSecurityMessage(err?.message||String(err),true);renderSettings();}
  };
  const changePinBtn=document.querySelector("#changeLocalPinBtn");
  if(changePinBtn)changePinBtn.onclick=async()=>{
    const current=document.querySelector("#currentLocalPin").value,next=document.querySelector("#replacementLocalPin").value,confirm=document.querySelector("#replacementLocalPin2").value;
    if(next!==confirm){setLocalSecurityMessage("New PIN entries do not match.",true);renderSettings();return;}
    changePinBtn.disabled=true;changePinBtn.textContent="Changing…";
    try{await changeLocalPin(current,next);setLocalSecurityMessage("Local PIN changed.");renderSettings();}
    catch(err){setLocalSecurityMessage(err?.message||String(err),true);renderSettings();}
  };
  const removePinBtn=document.querySelector("#removeLocalPinBtn");
  if(removePinBtn)removePinBtn.onclick=async()=>{
    const current=document.querySelector("#currentLocalPin").value;
    try{await removeLocalPin(current);setLocalSecurityMessage("Local PIN and device unlock removed.");renderSettings();}
    catch(err){setLocalSecurityMessage(err?.message||String(err),true);renderSettings();}
  };
  const enableBiometricBtn=document.querySelector("#enableBiometricBtn");
  if(enableBiometricBtn)enableBiometricBtn.onclick=async()=>{
    enableBiometricBtn.disabled=true;enableBiometricBtn.textContent="Waiting for device…";
    try{await enrollBiometric();setLocalSecurityMessage("Device unlock enabled.");renderSettings();}
    catch(err){setLocalSecurityMessage(err?.message||String(err),true);renderSettings();}
  };
  const disableBiometricBtn=document.querySelector("#disableBiometricBtn");
  if(disableBiometricBtn)disableBiometricBtn.onclick=async()=>{
    disableBiometricBtn.disabled=true;
    try{await disableBiometric();setLocalSecurityMessage("Device unlock disabled. PIN remains available.");renderSettings();}
    catch(err){setLocalSecurityMessage(err?.message||String(err),true);renderSettings();}
  };
  const lockNowBtn=document.querySelector("#lockNowBtn");
  if(lockNowBtn)lockNowBtn.onclick=()=>lockLocalApp("manual");

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
  mountSettingsLifecycle();
}
function settingRow(label,key){
  return `<div class="row"><span>${esc(label)}</span><button class="toggle ${state.settings[key]?"on":""}" data-key="${key}" aria-label="${esc(label)}"></button></div>`;
}


const appearanceMedia=window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
if(appearanceMedia){
  const followSystemAppearance=()=>{
    if(state.settings.appearance==="auto") render();
  };
  if(typeof appearanceMedia.addEventListener==="function")appearanceMedia.addEventListener("change",followSystemAppearance);
  else appearanceMedia.addListener?.(followSystemAppearance);
}
if("serviceWorker" in navigator){
  navigator.serviceWorker.addEventListener("message",event=>{
    void recordNotificationDiagnostic("app","service-worker-message",{data:event.data,currentRoute:state.route,selectedId:state.selectedId,pendingNotificationRoute});
    if(event.data?.type!==FIDUNIO_NOTIFICATION_ROUTE_MESSAGE)return;
    const route=normalizeNotificationRoute(event.data?.route);if(!route)return;
    pendingNotificationRoute=route;void applyPendingNotificationRoute();
  });
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js",{type:"module"})
    .catch(err=>console.warn("Service worker registration failed",err)));
}
initApp();
