/* 2026-11-24 (owner): lock grace period. Leaving FIDUNIO counts as inactivity:
 * coming back before the chosen time stays unlocked; after it, locks before use.
 * "Immediately" locks the moment FIDUNIO leaves. "Never" was removed. */
import assert from "node:assert/strict";

/* Minimal in-memory IndexedDB (only what local-security.js uses). */
const stores=new Map([["meta",new Map()]]);
const later=(fn)=>queueMicrotask(fn);
const db={objectStoreNames:{contains:(n)=>stores.has(n)},createObjectStore:(n)=>stores.set(n,new Map()),close(){},
  transaction(){const tx={oncomplete:null,onerror:null,onabort:null,objectStore:(n)=>({
    get(k){const r={};later(()=>{r.result=structuredClone(stores.get(n).get(k));r.onsuccess?.();});return r;},
    put(v,k){stores.get(n).set(k,structuredClone(v));const r={};later(()=>{r.onsuccess?.();later(()=>tx.oncomplete?.());});return r;},
    delete(k){stores.get(n).delete(k);const r={};later(()=>{r.onsuccess?.();later(()=>tx.oncomplete?.());});return r;}})};return tx;}};
globalThis.indexedDB={open(){const r={result:db};later(()=>r.onsuccess?.());return r;}};
stores.get("meta").set("local-security-v1",{pin:null,timeoutMs:-1,biometric:null});

/* Fake page lifecycle. */
const listeners={};const on=(t)=>(name,fn)=>(listeners[t+name]??=[]).push(fn);
globalThis.window={addEventListener:on("w:"),isSecureContext:false};
globalThis.document={visibilityState:"visible",addEventListener:on("d:")};
globalThis.sessionStorage={getItem(){return null},setItem(){},removeItem(){}};
let now=1_000_000;Date.now=()=>now;
const fire=(key)=>(listeners[key]||[]).forEach(f=>f());
const leave=()=>{document.visibilityState="hidden";fire("d:visibilitychange");fire("w:pagehide");};
const back=()=>{document.visibilityState="visible";fire("d:visibilitychange");fire("w:pageshow");};

const sec=await import("./local-security.js");
assert.ok(!sec.LOCK_TIMEOUTS.some(x=>x.label==="Never"),"Never is no longer offered");
assert.equal(sec.getLockTimeoutMs(),60*60*1000,"a stored Never becomes 1 hr");
await assert.rejects(sec.setLockTimeoutMs(-1),/Unsupported/,"Never can no longer be chosen");

let unlocked=true,locks=[];
sec.installInactivityMonitor({isUnlocked:()=>unlocked,onLock:(why)=>{unlocked=false;locks.push(why);}});
const unlockNow=()=>{unlocked=true;sec.noteLocalUnlock();};

await sec.setLockTimeoutMs(5*60*1000);
unlockNow();
leave();assert.equal(unlocked,true,"5 min: leaving does not lock at once");
now+=3*60*1000;back();assert.equal(unlocked,true,"5 min: back after 3 min stays unlocked");
leave();now+=3*60*1000;back();assert.equal(unlocked,false,"5 min: 6 min since last touch locks on return");
unlockNow();leave();now+=10*60*1000;back();assert.equal(unlocked,false,"5 min: back after 10 min locks");

await sec.setLockTimeoutMs(0);
unlockNow();leave();assert.equal(unlocked,false,"Immediately: locks the moment FIDUNIO leaves");
now+=1000;back();assert.equal(unlocked,false,"Immediately: still locked on return");unlockNow();assert.equal(unlocked,true,"Immediately: unlocking after return works");

await sec.setLockTimeoutMs(60*1000);
unlockNow();leave();now+=59*1000;back();assert.equal(unlocked,true,"1 min: back after 59 s stays unlocked");
leave();now+=2*1000;back();assert.equal(unlocked,false,"1 min: total 61 s since last touch locks");
assert.ok(locks.every(w=>w==="background"));
/* Native app pause/resume (iPhone): same rules without any page visibility change. */
await sec.setLockTimeoutMs(5*60*1000);
unlockNow();fire("d:pause");now+=2*60*1000;fire("d:resume");assert.equal(unlocked,true,"native: back after 2 min stays unlocked");
fire("d:pause");now+=4*60*1000;fire("d:resume");assert.equal(unlocked,false,"native: 6 min since last touch locks on resume");
await sec.setLockTimeoutMs(0);
unlockNow();fire("d:pause");assert.equal(unlocked,false,"native Immediately: locks on pause");
console.log("Lock grace period gate passed");
process.exit(0);
