/*
 * FIDUNIO account-local storage owner.
 *
 * MANDATORY OWNERSHIP CONTRACT (CODING-GUIDELINES.md)
 * Owner: this module owns activation/switching of account-local IndexedDB data.
 * Scope: account-owned records in fidunio-local only; local PIN/config and local-key
 * remain installation-wide and are never moved here.
 * Lifecycle trigger: authenticated UID is known, before app.js is imported.
 * Serialized write path: every activation/switch runs through one module mutex.
 *
 * This module does NOT initialize Firebase, reload the page, or mutate UI.
 */
const LIVE_DB="fidunio-local";
const LIVE_VERSION=2;
const VAULT_DB="fidunio-account-vault-v2";
const VAULT_VERSION=1;
const ACTIVE_UID_KEY="account-storage-active-uid-v2";
const TRANSITION_KEY="account-storage-transition-v2";
const QUARANTINE_KEY="__legacy-unassigned-v2";
const ACCOUNT_META_KEYS=["app-state","e2ee-device-keypair-v1","e2ee-device-identity-v1"];
let storageTail=Promise.resolve();

function idbRequest(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function txDone(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error("IndexedDB transaction failed"));tx.onabort=()=>reject(tx.error||new Error("IndexedDB transaction aborted"));});}
function openLive(){return new Promise((resolve,reject)=>{const req=indexedDB.open(LIVE_DB,LIVE_VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains("meta"))db.createObjectStore("meta");if(!db.objectStoreNames.contains("outbox"))db.createObjectStore("outbox",{keyPath:"id"});if(!db.objectStoreNames.contains("history"))db.createObjectStore("history");};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function openVault(){return new Promise((resolve,reject)=>{const req=indexedDB.open(VAULT_DB,VAULT_VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains("snapshots"))db.createObjectStore("snapshots");};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}

async function readMeta(db,key){return idbRequest(db.transaction("meta","readonly").objectStore("meta").get(key));}
async function writeMeta(db,key,value){const tx=db.transaction("meta","readwrite");tx.objectStore("meta").put(value,key);await txDone(tx);}
async function deleteMeta(db,key){const tx=db.transaction("meta","readwrite");tx.objectStore("meta").delete(key);await txDone(tx);}

async function readLiveSnapshot(db){
  const meta={};
  for(const key of ACCOUNT_META_KEYS){const value=await readMeta(db,key);if(value!==undefined)meta[key]=value;}
  const outbox=await idbRequest(db.transaction("outbox","readonly").objectStore("outbox").getAll());
  const htx=db.transaction("history","readonly"),hstore=htx.objectStore("history");
  const [historyKeys,historyValues]=await Promise.all([idbRequest(hstore.getAllKeys()),idbRequest(hstore.getAll())]);
  return{meta,outbox,history:historyKeys.map((key,i)=>({key,value:historyValues[i]})),savedAt:Date.now()};
}
function snapshotHasData(snapshot){return !!(snapshot&&(Object.keys(snapshot.meta||{}).length||(snapshot.outbox||[]).length||(snapshot.history||[]).length));}
async function clearLiveAccountData(db){
  for(const key of ACCOUNT_META_KEYS)await deleteMeta(db,key);
  let tx=db.transaction("outbox","readwrite");tx.objectStore("outbox").clear();await txDone(tx);
  tx=db.transaction("history","readwrite");tx.objectStore("history").clear();await txDone(tx);
}
async function restoreLiveSnapshot(db,snapshot){
  await clearLiveAccountData(db);
  if(!snapshot)return;
  for(const [key,value] of Object.entries(snapshot.meta||{}))await writeMeta(db,key,value);
  if((snapshot.outbox||[]).length){const tx=db.transaction("outbox","readwrite"),store=tx.objectStore("outbox");for(const row of snapshot.outbox)store.put(row);await txDone(tx);}
  if((snapshot.history||[]).length){const tx=db.transaction("history","readwrite"),store=tx.objectStore("history");for(const row of snapshot.history)store.put(row.value,row.key);await txDone(tx);}
}
async function saveVault(uid,snapshot){const db=await openVault();const tx=db.transaction("snapshots","readwrite");tx.objectStore("snapshots").put(snapshot,String(uid));await txDone(tx);db.close();}
async function loadVault(uid){const db=await openVault();const value=await idbRequest(db.transaction("snapshots","readonly").objectStore("snapshots").get(String(uid)));db.close();return value||null;}

export async function getAccountStorageStatus(){
  const db=await openLive();
  const activeUid=await readMeta(db,ACTIVE_UID_KEY)||null;
  const transition=await readMeta(db,TRANSITION_KEY)||null;
  db.close();
  return{activeUid,transition};
}

export async function inspectLegacyAccountIdentity(){
  const db=await openLive();
  const activeUid=await readMeta(db,ACTIVE_UID_KEY)||null;
  if(activeUid){db.close();return{activeUid,publicJwk:null,deviceId:null,hasLegacyData:false};}
  const keypair=await readMeta(db,"e2ee-device-keypair-v1");
  const identity=await readMeta(db,"e2ee-device-identity-v1");
  const snapshot=await readLiveSnapshot(db);
  db.close();
  return{activeUid:null,publicJwk:keypair?.publicJwk||null,deviceId:identity?.deviceId||null,hasLegacyData:snapshotHasData(snapshot)};
}

function serializeStorage(work){
  const run=storageTail.then(()=>work());
  storageTail=run.catch(err=>{console.warn("FIDUNIO account storage transition failed",err);});
  return run;
}

export function activateAccountStorage(uid,{legacyOwnerUid=null}={}){
  const targetUid=String(uid||"").trim();
  if(!targetUid)return Promise.reject(new Error("Authenticated UID is required before local storage activation."));
  return serializeStorage(async()=>{
    const live=await openLive();
    const currentUid=await readMeta(live,ACTIVE_UID_KEY)||null;
    if(currentUid===targetUid){live.close();return{activeUid:targetUid,switched:false};}

    const transition={fromUid:currentUid,toUid:targetUid,startedAt:Date.now()};
    await writeMeta(live,TRANSITION_KEY,transition);

    try{
      if(currentUid){
        const currentSnapshot=await readLiveSnapshot(live);
        await saveVault(currentUid,currentSnapshot);
      }else{
        const legacySnapshot=await readLiveSnapshot(live);
        if(snapshotHasData(legacySnapshot)){
          if(legacyOwnerUid){await saveVault(String(legacyOwnerUid),legacySnapshot);}
          else{await saveVault(QUARANTINE_KEY,legacySnapshot);}
        }
      }

      const keepLegacyInPlace=!currentUid&&legacyOwnerUid&&String(legacyOwnerUid)===targetUid;
      if(!keepLegacyInPlace){
        const targetSnapshot=await loadVault(targetUid);
        await restoreLiveSnapshot(live,targetSnapshot);
      }

      await writeMeta(live,ACTIVE_UID_KEY,targetUid);
      await deleteMeta(live,TRANSITION_KEY);
      live.close();
      return{activeUid:targetUid,switched:true,legacyAssignedTo:legacyOwnerUid||null,legacyQuarantined:!currentUid&&!legacyOwnerUid};
    }catch(err){
      try{await deleteMeta(live,TRANSITION_KEY);}catch{}
      live.close();
      throw err;
    }
  });
}
