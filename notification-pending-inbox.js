import {normalizeNotificationRoute} from "./notification-routing.js";

const DB_NAME="fidunio-notification-pending-v1";
const DB_VERSION=1;
const STORE="routes";
const MAX_RECORDS=50;

export function groupPendingNotificationRoutes(rows){
  const groups=new Map();
  for(const row of rows||[]){
    const route=normalizeNotificationRoute(row);if(!route)continue;
    const key=route.conversationId,group=groups.get(key)||{route,messageIds:[]};
    group.route=route;group.messageIds.push(route.messageId);groups.set(key,group);
  }
  return [...groups.values()];
}

function openDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,DB_VERSION);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:"messageId"});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
function requestResult(request){return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
function transactionDone(transaction){return new Promise((resolve,reject)=>{transaction.oncomplete=resolve;transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error);});}

export async function storePendingNotificationRoute(value){
  const route=normalizeNotificationRoute(value);if(!route)return false;
  const db=await openDb();
  try{
    const write=db.transaction(STORE,"readwrite");write.objectStore(STORE).put({...route,storedAt:Date.now()});await transactionDone(write);
    const rows=await requestResult(db.transaction(STORE,"readonly").objectStore(STORE).getAll());
    const overflow=rows.sort((a,b)=>(Number(a.storedAt)||0)-(Number(b.storedAt)||0)).slice(0,Math.max(0,rows.length-MAX_RECORDS));
    if(overflow.length){const prune=db.transaction(STORE,"readwrite"),store=prune.objectStore(STORE);for(const row of overflow)store.delete(row.messageId);await transactionDone(prune);}
    return true;
  }finally{db.close();}
}

export async function listPendingNotificationRoutes(){
  const db=await openDb();
  try{
    const rows=await requestResult(db.transaction(STORE,"readonly").objectStore(STORE).getAll());
    return rows.map(row=>({...normalizeNotificationRoute(row),storedAt:Number(row.storedAt)||0})).filter(row=>row.type).sort((a,b)=>a.storedAt-b.storedAt);
  }finally{db.close();}
}

export async function consumePendingNotificationRoutes(messageIds){
  const ids=[...new Set((messageIds||[]).map(String).filter(Boolean))];if(!ids.length)return;
  const db=await openDb();
  try{const transaction=db.transaction(STORE,"readwrite"),store=transaction.objectStore(STORE);for(const id of ids)store.delete(id);await transactionDone(transaction);}finally{db.close();}
}
