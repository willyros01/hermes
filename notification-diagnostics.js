const DB_NAME="fidunio-notification-diagnostics-v1";
const DB_VERSION=1;
const STORE="events";
const SECRET_KEY=/(^|_)(pin|password|privatekey|recoverykey|recoverysecret|accesstoken|refreshtoken|fcmtoken|vapidprivatekey)($|_)/i;
let writeTail=Promise.resolve();

function openDiagnosticDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,DB_VERSION);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE)){const store=db.createObjectStore(STORE,{keyPath:"id",autoIncrement:true});store.createIndex("at","at");}};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
function requestResult(request){return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
function diagnosticValue(value,key="",depth=0,seen=new WeakSet()){
  if(SECRET_KEY.test(String(key))){const text=String(value??"");return{securitySecretRedacted:true,present:value!=null,length:text.length,suffix:text.slice(-4)};}
  if(value==null||typeof value==="string"||typeof value==="number"||typeof value==="boolean")return value;
  if(typeof value==="bigint")return String(value);
  if(typeof value==="function")return `[function ${value.name||"anonymous"}]`;
  if(depth>7)return "[depth-limit]";
  if(value instanceof Error)return{name:value.name,message:value.message,stack:value.stack||""};
  if(typeof value==="object"){
    if(seen.has(value))return "[circular]";seen.add(value);
    if(Array.isArray(value))return value.slice(0,100).map((item,index)=>diagnosticValue(item,String(index),depth+1,seen));
    const out={};for(const name of Object.keys(value).slice(0,150)){try{out[name]=diagnosticValue(value[name],name,depth+1,seen);}catch(error){out[name]=`[unreadable: ${error?.message||error}]`;}}return out;
  }
  return String(value);
}
function environment(){return{href:globalThis.location?.href||"",visibility:globalThis.document?.visibilityState||"worker",online:globalThis.navigator?.onLine??null,userAgent:globalThis.navigator?.userAgent||"",standalone:globalThis.matchMedia?.("(display-mode: standalone)")?.matches??null,timeOrigin:globalThis.performance?.timeOrigin??null,monotonicMs:globalThis.performance?.now?.()??null};}
export function recordNotificationDiagnostic(source,event,detail={}){
  const entry={at:new Date().toISOString(),source:String(source),event:String(event),environment:environment(),detail:diagnosticValue(detail)};
  const write=async()=>{try{const db=await openDiagnosticDb();const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).add(entry);await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});db.close();return true;}catch(error){console.warn("Notification diagnostic write failed",error);return false;}};
  const result=writeTail.then(write,write);writeTail=result.catch(()=>false);return result;
}
export async function readNotificationDiagnostics(){await writeTail.catch(()=>{});const db=await openDiagnosticDb();const rows=await requestResult(db.transaction(STORE,"readonly").objectStore(STORE).getAll());db.close();return rows;}
export async function clearNotificationDiagnostics(){await writeTail.catch(()=>{});const db=await openDiagnosticDb();const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).clear();await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});db.close();}
