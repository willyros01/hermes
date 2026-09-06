import assert from "node:assert/strict";
import {planGroupHistoryGrantSourcePurge} from "./disappearing-group-grant-trace-plan.js";

let passed=0;function check(name,fn){fn();passed++;console.log("PASS",name);}
function grant(grantId,totalCopies,copies){return{grant:{groupId:"g1",grantId,totalCopies},copies};}
function copy(grantId,id,at){return{groupId:"g1",grantId,sourceMessageId:id,sourceCreatedAt:new Date(at)};}

check("single-copy grant is deleted with source copy",()=>{
  const plan=planGroupHistoryGrantSourcePurge({groupId:"g1",sourceMessageId:"m1",grants:[grant("ga",1,[copy("ga","m1","2026-09-06T10:00:00Z")])]});
  assert.deepEqual(plan.copiesToDelete,[{grantId:"ga",sourceMessageId:"m1"}]);
  assert.deepEqual(plan.grantsToDelete,["ga"]);assert.deepEqual(plan.grantsToUpdate,[]);
});

check("multi-copy grant is reconciled and earliest retained source becomes metadata first",()=>{
  const plan=planGroupHistoryGrantSourcePurge({groupId:"g1",sourceMessageId:"m1",grants:[grant("ga",3,[
    copy("ga","m1","2026-09-06T10:00:00Z"),copy("ga","m3","2026-09-06T12:00:00Z"),copy("ga","m2","2026-09-06T11:00:00Z")
  ])]});
  assert.equal(plan.grantsToUpdate.length,1);assert.equal(plan.grantsToUpdate[0].totalCopies,2);assert.equal(plan.grantsToUpdate[0].firstSharedMessageId,"m2");
});

check("unrelated grants remain untouched",()=>{
  const plan=planGroupHistoryGrantSourcePurge({groupId:"g1",sourceMessageId:"m1",grants:[grant("ga",1,[copy("ga","other","2026-09-06T10:00:00Z")])]});
  assert.deepEqual(plan.copiesToDelete,[]);assert.deepEqual(plan.grantsToDelete,[]);assert.deepEqual(plan.grantsToUpdate,[]);
});

check("multiple affected grants produce deterministic plan",()=>{
  const plan=planGroupHistoryGrantSourcePurge({groupId:"g1",sourceMessageId:"m1",grants:[grant("z",1,[copy("z","m1","2026-09-06T10:00:00Z")]),grant("a",1,[copy("a","m1","2026-09-06T10:00:00Z")])]});
  assert.deepEqual(plan.grantsToDelete,["a","z"]);assert.deepEqual(plan.copiesToDelete.map(x=>x.grantId),["a","z"]);
});

check("metadata-copy count mismatch fails closed",()=>{
  assert.throws(()=>planGroupHistoryGrantSourcePurge({groupId:"g1",sourceMessageId:"m1",grants:[grant("ga",2,[copy("ga","m1","2026-09-06T10:00:00Z")])]}),e=>e?.code==="GRANT_TRACE_INCONSISTENT");
});

check("cross-group copy fails closed",()=>{
  const bad=copy("ga","m1","2026-09-06T10:00:00Z");bad.groupId="g2";
  assert.throws(()=>planGroupHistoryGrantSourcePurge({groupId:"g1",sourceMessageId:"m1",grants:[grant("ga",1,[bad])]}),e=>e?.code==="GRANT_TRACE_INCONSISTENT");
});

check("duplicate source copies fail closed",()=>{
  assert.throws(()=>planGroupHistoryGrantSourcePurge({groupId:"g1",sourceMessageId:"m1",grants:[grant("ga",2,[copy("ga","m1","2026-09-06T10:00:00Z"),copy("ga","m1","2026-09-06T11:00:00Z")])]}),e=>e?.code==="GRANT_TRACE_INCONSISTENT");
});

console.log(`\n${passed}/${passed} group disappearing grant trace plan assertions passed.`);
