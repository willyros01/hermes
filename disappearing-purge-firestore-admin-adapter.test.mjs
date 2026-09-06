import assert from "node:assert/strict";
import {createDisappearingPurgeFirestoreAdminRepository,DISAPPEARING_PURGE_FIRESTORE_V1} from "./disappearing-purge-firestore-admin-adapter.mjs";

function version(n){return{seconds:n,nanoseconds:0};}
class Snap{
  constructor(ref,data,ver){this.ref=ref;this._data=data;this.exists=data!==undefined;this.updateTime=this.exists?version(ver):null;}
  data(){return this._data;}
}
class Ref{
  constructor(db,path){this.db=db;this.path=path;}
  async get(){return this.db.snap(this.path);}
  collection(name){return new Collection(this.db,`${this.path}/${name}`);}
}
class Collection{
  constructor(db,path){this.db=db;this.path=path;}
  async get(){const prefix=`${this.path}/`;const docs=[];for(const [path] of this.db.rows){if(path.startsWith(prefix)&&!path.slice(prefix.length).includes("/"))docs.push(this.db.snap(path));}docs.sort((a,b)=>a.ref.path.localeCompare(b.ref.path));return{docs};}
}
class FakeDb{
  constructor(seed){this.rows=new Map();this.versions=new Map();this.deleted=[];for(const [path,data,ver] of seed){this.rows.set(path,data);this.versions.set(path,ver);}}
  doc(path){return new Ref(this,path);}
  snap(path){return new Snap(this.doc(path),this.rows.get(path),this.versions.get(path)||0);}
  async runTransaction(work){const db=this;const tx={
    get(ref){return Promise.resolve(db.snap(ref.path));},
    delete(ref){db.deleted.push(ref.path);db.rows.delete(ref.path);db.versions.delete(ref.path);}
  };return work(tx);}
}

let passed=0;async function check(name,fn){await fn();passed++;console.log("PASS",name);}
const directSeed=[
  ["conversations/c1",{type:"direct",members:["a","b"]},1],
  ["conversations/c1/messages/m1",{senderUid:"a",state:"read",readAt:new Date("2026-09-06T12:00:00Z"),disappearAfterSeconds:3600},2]
];

await check("direct state derives recipient and opaque update-time basis",async()=>{
  const db=new FakeDb(directSeed),repo=createDisappearingPurgeFirestoreAdminRepository({db});
  const state=await repo.readDirectPurgeState({conversationId:"c1",messageId:"m1"});
  assert.equal(state.recipientUid,"b");assert.equal(state.message.senderUid,"a");assert.match(state.basis,/conversations\/c1/);assert.match(state.basis,/2:0/);
});

await check("direct commit revalidates basis and physically deletes source",async()=>{
  const db=new FakeDb(directSeed),repo=createDisappearingPurgeFirestoreAdminRepository({db});
  const state=await repo.readDirectPurgeState({conversationId:"c1",messageId:"m1"});
  const result=await repo.commitDirectPurge({conversationId:"c1",messageId:"m1",expectedBasis:state.basis});
  assert.deepEqual(result,{purged:true,alreadyAbsent:false,traceCount:1});assert.deepEqual(db.deleted,["conversations/c1/messages/m1"]);
});

await check("direct commit rejects stale message version without deletion",async()=>{
  const db=new FakeDb(directSeed),repo=createDisappearingPurgeFirestoreAdminRepository({db});
  const state=await repo.readDirectPurgeState({conversationId:"c1",messageId:"m1"});
  db.versions.set("conversations/c1/messages/m1",9);
  await assert.rejects(()=>repo.commitDirectPurge({conversationId:"c1",messageId:"m1",expectedBasis:state.basis}),e=>e?.code==="STALE_PURGE_BASIS");
  assert.equal(db.deleted.length,0);assert.equal(db.rows.has("conversations/c1/messages/m1"),true);
});

await check("direct commit is idempotent when source already absent",async()=>{
  const db=new FakeDb(directSeed),repo=createDisappearingPurgeFirestoreAdminRepository({db});
  const state=await repo.readDirectPurgeState({conversationId:"c1",messageId:"m1"});
  db.rows.delete("conversations/c1/messages/m1");db.versions.delete("conversations/c1/messages/m1");
  const result=await repo.commitDirectPurge({conversationId:"c1",messageId:"m1",expectedBasis:state.basis});
  assert.equal(result.purged,true);assert.equal(result.alreadyAbsent,true);assert.equal(db.deleted.length,0);
});

const groupSeed=[
  ["groups/g1",{memberUids:["a","b","later"],keyEpoch:3},10],
  ["groups/g1/messages/m1",{senderUid:"a",keyEpoch:2,disappearAfterSeconds:60},11],
  ["groups/g1/epochs/2",{memberKeyIds:{a:"ka",b:"kb",c:"kc"}},12],
  ["groups/g1/messages/m1/receipts/b",{uid:"b",state:"read",readAt:new Date("2026-09-06T12:00:00Z")},13],
  ["groups/g1/messages/m1/receipts/c",{uid:"c",state:"read",readAt:new Date("2026-09-06T12:01:00Z")},14],
  ["groups/g1/historyGrants/gr1",{groupId:"g1",grantId:"gr1",totalCopies:2},15],
  ["groups/g1/historyGrants/gr1/messages/m1",{groupId:"g1",grantId:"gr1",sourceMessageId:"m1",sourceCreatedAt:new Date("2026-09-06T10:00:00Z")},16],
  ["groups/g1/historyGrants/gr1/messages/m2",{groupId:"g1",grantId:"gr1",sourceMessageId:"m2",sourceCreatedAt:new Date("2026-09-06T11:00:00Z")},17]
];

await check("group state derives source-epoch membership current entitlement receipts and grant trace plan",async()=>{
  const db=new FakeDb(groupSeed),repo=createDisappearingPurgeFirestoreAdminRepository({db});
  const state=await repo.readGroupPurgeState({groupId:"g1",messageId:"m1"});
  assert.deepEqual(state.epochMemberUids,["a","b","c"]);assert.deepEqual(state.currentMemberUids,["a","b","later"]);assert.deepEqual(state.receipts.map(x=>x.uid).sort(),["b","c"]);assert.match(state.basis,/receipts\/b/);assert.match(state.basis,/historyGrants\/gr1\/messages\/m1/);
  assert.deepEqual(state.grantTracePlan.copiesToDelete,[{grantId:"gr1",sourceMessageId:"m1"}]);
  assert.equal(state.grantTracePlan.grantsToUpdate[0].grantId,"gr1");assert.equal(state.grantTracePlan.grantsToUpdate[0].totalCopies,1);assert.equal(state.grantTracePlan.grantsToUpdate[0].firstSharedMessageId,"m2");
});

await check("incomplete building grant metadata blocks group purge planning",async()=>{
  const seed=groupSeed.map(row=>[...row]);
  seed.find(row=>row[0]==="groups/g1/historyGrants/gr1")[1]={groupId:"g1",grantId:"gr1",totalCopies:3};
  const repo=createDisappearingPurgeFirestoreAdminRepository({db:new FakeDb(seed)});
  await assert.rejects(()=>repo.readGroupPurgeState({groupId:"g1",messageId:"m1"}),e=>e?.code==="GRANT_TRACE_INCONSISTENT");
});

await check("group source deletion remains explicitly fail-closed until trace cleanup commit exists",async()=>{
  const db=new FakeDb([]),repo=createDisappearingPurgeFirestoreAdminRepository({db});
  await assert.rejects(()=>repo.commitGroupPurge({groupId:"g1",messageId:"m1",expectedBasis:"basis"}),e=>e?.code==="GROUP_PURGE_TRACE_DELETE_NOT_READY");
  assert.equal(DISAPPEARING_PURGE_FIRESTORE_V1.groupPhysicalDeleteReady,false);assert.equal(DISAPPEARING_PURGE_FIRESTORE_V1.clientDeleteRulesRequired,false);
  assert.equal(DISAPPEARING_PURGE_FIRESTORE_V1.groupHistoryGrantCopyPath,"groups/{groupId}/historyGrants/{grantId}/messages/{sourceMessageId}");
});

await check("adapter requires Admin Firestore capability but imports no Firebase SDK",async()=>{
  assert.throws(()=>createDisappearingPurgeFirestoreAdminRepository({db:{}}),/Admin Firestore/);
  const source=await import("node:fs/promises").then(fs=>fs.readFile(new URL("./disappearing-purge-firestore-admin-adapter.mjs",import.meta.url),"utf8"));
  assert.equal(/from\s+["']firebase-admin|from\s+["']firebase\/|initializeApp\(/.test(source),false);
});

console.log(`\n${passed}/${passed} disappearing purge Firestore admin adapter assertions passed.`);
