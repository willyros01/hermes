import assert from "node:assert/strict";
import {createDisappearingPurgeExecutor} from "./disappearing-purge-executor.js";

const t0=new Date("2026-09-06T12:00:00.000Z");
const t2h=new Date("2026-09-06T14:00:00.000Z");
let passed=0;
async function check(name,fn){await fn();passed++;console.log("PASS",name);}
function repo(overrides={}){return{
  async readDirectPurgeState(){return{basis:"d1",recipientUid:"b",message:{state:"read",readAt:t0,disappearAfterSeconds:3600}};},
  async commitDirectPurge(){return{purged:true,traceCount:2};},
  async readGroupPurgeState(){return{basis:"g1",message:{senderUid:"a",disappearAfterSeconds:3600},epochMemberUids:["a","b","c"],currentMemberUids:["a","b","c"],receipts:[{uid:"b",state:"read",readAt:t0},{uid:"c",state:"read",readAt:t0}]};},
  async commitGroupPurge(){return{purged:true,traceCount:5};},
  ...overrides
};}

await check("direct eligible source commits once",async()=>{
  let commits=0;
  const r=repo({async commitDirectPurge(args){commits++;assert.equal(args.expectedBasis,"d1");assert.equal(args.evaluatedAt.getTime(),t2h.getTime());return{purged:true,traceCount:3};}});
  const x=createDisappearingPurgeExecutor({repository:r,serverNow:()=>t2h});
  const result=await x.purgeDirect({conversationId:"c1",messageId:"m1"});
  assert.equal(result.purged,true);assert.equal(result.traceCount,3);assert.equal(commits,1);
});

await check("direct unread source does not enter delete owner",async()=>{
  let commits=0;
  const r=repo({async readDirectPurgeState(){return{basis:"d2",recipientUid:"b",message:{state:"delivered",disappearAfterSeconds:60}};},async commitDirectPurge(){commits++;return{purged:true};}});
  const x=createDisappearingPurgeExecutor({repository:r,serverNow:()=>t2h});
  const result=await x.purgeDirect({conversationId:"c1",messageId:"m2"});
  assert.equal(result.purged,false);assert.equal(result.reason,"recipient-unread");assert.equal(commits,0);
});

await check("group waits for each still-entitled original recipient",async()=>{
  let commits=0;
  const r=repo({async readGroupPurgeState(){return{basis:"g2",message:{senderUid:"a",disappearAfterSeconds:3600},epochMemberUids:["a","b","c"],currentMemberUids:["a","b","c","later"],receipts:[{uid:"b",state:"read",readAt:t0},{uid:"c",state:"delivered"}]};},async commitGroupPurge(){commits++;return{purged:true};}});
  const x=createDisappearingPurgeExecutor({repository:r,serverNow:()=>t2h});
  const result=await x.purgeGroup({groupId:"g",messageId:"m"});
  assert.equal(result.purged,false);assert.deepEqual(result.decision.waitingRecipientUids,["c"]);assert.equal(commits,0);
});

await check("removed original recipient does not block group commit",async()=>{
  const r=repo({async readGroupPurgeState(){return{basis:"g3",message:{senderUid:"a",disappearAfterSeconds:3600},epochMemberUids:["a","b","c"],currentMemberUids:["a","b","later"],receipts:[{uid:"b",state:"read",readAt:t0}]};}});
  const x=createDisappearingPurgeExecutor({repository:r,serverNow:()=>t2h});
  const result=await x.purgeGroup({groupId:"g",messageId:"m"});
  assert.equal(result.purged,true);assert.deepEqual(result.decision.removedRecipientUids,["c"]);assert.deepEqual(result.decision.applicableRecipientUids,["b"]);
});

await check("stale repository basis fails closed and is not retried",async()=>{
  let commits=0;
  const r=repo({async commitDirectPurge(){commits++;throw new Error("STALE_PURGE_BASIS");}});
  const x=createDisappearingPurgeExecutor({repository:r,serverNow:()=>t2h});
  await assert.rejects(()=>x.purgeDirect({conversationId:"c1",messageId:"m1"}),/STALE_PURGE_BASIS/);assert.equal(commits,1);
});

await check("one executor serializes direct and group purge attempts",async()=>{
  let release,groupReadStarted=false;
  const hold=new Promise(resolve=>{release=resolve;});
  const r=repo({
    async readDirectPurgeState(){await hold;return{basis:"d4",recipientUid:"b",message:{state:"read",readAt:t0,disappearAfterSeconds:3600}};},
    async readGroupPurgeState(){groupReadStarted=true;return{basis:"g4",message:{senderUid:"a",disappearAfterSeconds:3600},epochMemberUids:["a","b"],currentMemberUids:["a","b"],receipts:[{uid:"b",state:"read",readAt:t0}]};}
  });
  const x=createDisappearingPurgeExecutor({repository:r,serverNow:()=>t2h});
  const first=x.purgeDirect({conversationId:"c1",messageId:"m1"});
  const second=x.purgeGroup({groupId:"g",messageId:"m2"});
  await new Promise(resolve=>setTimeout(resolve,0));assert.equal(groupReadStarted,false);
  release();await first;await second;assert.equal(groupReadStarted,true);
});

await check("executor requires explicit server time authority",async()=>{
  assert.throws(()=>createDisappearingPurgeExecutor({repository:repo()}),/server-side time provider/);
});

console.log(`\n${passed}/${passed} disappearing purge executor assertions passed.`);
