import assert from "node:assert/strict";
import {createNotificationLeaseFirestoreAdmin} from "./notification-lease-firestore-admin.mjs";
const docs=new Map();
let clock=1_900_000_000_000;
function ref(path){return {path,get:async()=>snap(path)};}
function snap(path){const v=docs.get(path);return {exists:v!==undefined,data:()=>v,id:path.split("/").at(-1)};}
const db={
  doc:ref,
  collection(path){return {where(field,op,value){assert.equal(field,"enabled");assert.equal(op,"==");assert.equal(value,true);return {async get(){return {docs:[...docs.entries()].filter(([key,row])=>key.startsWith(path+"/")&&key.split("/").length===path.split("/").length+1&&row.enabled).map(([key,row])=>({id:key.split("/").at(-1),data:()=>row}))};}};}};},
  async runTransaction(fn){
    const operations=[];
    const tx={get:async r=>snap(r.path),set(r,row){operations.push(()=>docs.set(r.path,row));},delete(r){operations.push(()=>docs.delete(r.path));},update(r,row){operations.push(()=>docs.set(r.path,{...docs.get(r.path),...row}));}};
    const result=await fn(tx);for(const op of operations)op();return result;
  }
};
const store=createNotificationLeaseFirestoreAdmin({db,now:()=>clock}),fcmToken="a".repeat(80);
await store.claim({uid:"A",installationId:"install-0001",fcmToken,platform:"ios-native"});
assert.equal((await store.eligible("A")).length,1);
await store.claim({uid:"B",installationId:"install-0001",fcmToken,platform:"ios-native"});
assert.equal((await store.eligible("A")).length,0,"old owner cannot receive notifications");
assert.equal((await store.eligible("B")).length,1);
const stale=await store.revoke({uid:"A",installationId:"install-0001",fcmToken});
assert.equal(stale.revoked,false,"old owner cannot revoke a newly transferred token");
assert.equal((await store.eligible("B")).length,1);
await store.revoke({uid:"B",installationId:"install-0001",fcmToken});
assert.equal((await store.eligible("B")).length,0);
await store.claim({uid:"B",installationId:"install-0001",fcmToken,platform:"ios-native"});
clock+=24*60*60*1000;
assert.equal((await store.eligible("B")).length,0,"expired leases cannot deliver");
console.log("PASS: atomic account handoff, stale revoke fencing, logout and expiry");
