const DB_NAME="fidunio-local";
const DB_VERSION=2;
const STATE_KEY="app-state";
const PROTOTYPE_CONVERSATIONS=new Map([["1","Maria Santos"],["2","John Cruz"],["3","Family Group"]]);
function idbRequest(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function txDone(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error("IndexedDB transaction failed"));tx.onabort=()=>reject(tx.error||new Error("IndexedDB transaction aborted"));});}
function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains("meta"))db.createObjectStore("meta");if(!db.objectStoreNames.contains("outbox"))db.createObjectStore("outbox",{keyPath:"id"});if(!db.objectStoreNames.contains("history"))db.createObjectStore("history");};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function bytesToB64(bytes){let s="";bytes.forEach(b=>s+=String.fromCharCode(b));return btoa(s);}
function b64ToBytes(s){const raw=atob(s);return Uint8Array.from(raw,c=>c.charCodeAt(0));}
async function getOrCreateLocalKey(db){let key=await idbRequest(db.transaction("meta","readonly").objectStore("meta").get("local-key"));if(key)return key;key=await crypto.subtle.generateKey({name:"AES-GCM",length:256},false,["encrypt","decrypt"]);const tx=db.transaction("meta","readwrite");tx.objectStore("meta").put(key,"local-key");await txDone(tx);return key;}
async function decryptState(record,key){const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64ToBytes(record.iv)},key,b64ToBytes(record.ciphertext));return JSON.parse(new TextDecoder().decode(plain));}
async function encryptState(value,key){const iv=crypto.getRandomValues(new Uint8Array(12));const data=new TextEncoder().encode(JSON.stringify(value));const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,data);return{iv:bytesToB64(iv),ciphertext:bytesToB64(new Uint8Array(cipher))};}
function isKnownPrototypeConversation(c){if(!c||c.cloud||c.cloudGroup)return false;return PROTOTYPE_CONVERSATIONS.get(String(c.id))===String(c.name||"");}
async function migratePrototypeData(){const db=await openDb(),key=await getOrCreateLocalKey(db);let saved=null;try{const record=await idbRequest(db.transaction("meta","readonly").objectStore("meta").get(STATE_KEY));if(record)saved=await decryptState(record,key);}catch(err){console.warn("FIDUNIO prototype cleanup could not read prior state",err);}const next=saved&&typeof saved==="object"?{...saved}:{};const conversations=Array.isArray(next.conversations)?next.conversations:[];next.conversations=conversations.filter(c=>!isKnownPrototypeConversation(c));next.messages={...(next.messages&&typeof next.messages==="object"?next.messages:{})};for(const id of PROTOTYPE_CONVERSATIONS.keys())delete next.messages[id];if(next.selectedId!=null&&!next.conversations.some(c=>String(c.id)===String(next.selectedId)))next.selectedId=next.conversations[0]?.id??null;const encrypted=await encryptState(next,key);const metaTx=db.transaction("meta","readwrite");metaTx.objectStore("meta").put(encrypted,STATE_KEY);await txDone(metaTx);try{const rows=await idbRequest(db.transaction("outbox","readonly").objectStore("outbox").getAll());const ids=rows.filter(row=>PROTOTYPE_CONVERSATIONS.has(String(row?.conversationId))).map(row=>row.id);if(ids.length){const tx=db.transaction("outbox","readwrite"),store=tx.objectStore("outbox");for(const id of ids)store.delete(id);await txDone(tx);}}catch(err){console.warn("FIDUNIO prototype Outbox cleanup skipped",err);}try{const tx=db.transaction("history","readwrite"),store=tx.objectStore("history");for(const id of PROTOTYPE_CONVERSATIONS.keys())store.delete(id);await txDone(tx);}catch(err){console.warn("FIDUNIO prototype history cleanup skipped",err);}}
function scrubPrototypeUi(){document.querySelectorAll(".direct-contact").forEach(el=>el.remove());document.querySelectorAll(".section-title").forEach(el=>{if(el.textContent.trim()!=="Sample local contacts")return;const next=el.nextElementSibling;el.remove();if(next?.classList.contains("choice-list")&&!next.children.length)next.remove();});}
const observer=new MutationObserver(()=>scrubPrototypeUi());observer.observe(document.documentElement,{subtree:true,childList:true});
try{await migratePrototypeData();}catch(err){console.warn("FIDUNIO prototype cleanup failed safely; continuing startup",err);}
await import("./new-message-polish.js");
const {startAccountGuard}=await import("./account-guard.js");
await startAccountGuard();
const {runAuthGate}=await import("./auth-ui-clean.js");
await runAuthGate();
await import("./profile-sync.js");
await import("./main-screen-polish.js");
scrubPrototypeUi();
