import assert from "node:assert/strict";
import {planLocalDisappearingConvergence,applyLocalDisappearingProjection,DISAPPEARING_LOCAL_CONVERGENCE_V1} from "./disappearing-local-convergence.js";

let passed=0;function check(name,fn){fn();passed++;console.log("PASS",name);}
check("server-backed disappearing source absent from authoritative snapshot is purged",()=>{
  const plan=planLocalDisappearingConvergence({localMessages:[{id:"m1",cloud:true,state:"read",serverBacked:true,disappearAfterSeconds:60}],authoritativeRemoteIds:[],outboxMessageIds:["m1"]});
  assert.deepEqual(plan.purgeMessageIds,["m1"]);assert.deepEqual(plan.purgeOutboxMessageIds,["m1"]);
});
check("authoritative remote presence retains disappearing source",()=>{
  const plan=planLocalDisappearingConvergence({localMessages:[{id:"m1",serverBacked:true,disappearAfterSeconds:60}],authoritativeRemoteIds:["m1"],outboxMessageIds:["m1"]});
  assert.deepEqual(plan.purgeMessageIds,[]);assert.deepEqual(plan.purgeOutboxMessageIds,[]);
});
check("cache-only or never-server-backed pending work is never treated as expired",()=>{
  const plan=planLocalDisappearingConvergence({localMessages:[{id:"queued",state:"queued",serverBacked:false,disappearAfterSeconds:30},{id:"cached",state:"read",disappearAfterSeconds:30}],authoritativeRemoteIds:[],outboxMessageIds:["queued","cached"]});
  assert.deepEqual(plan.purgeMessageIds,[]);
});
check("ordinary non-disappearing history is not removed merely because remote snapshot lacks it",()=>{
  const plan=planLocalDisappearingConvergence({localMessages:[{id:"ordinary",serverBacked:true,disappearAfterSeconds:null}],authoritativeRemoteIds:[]});
  assert.deepEqual(plan.purgeMessageIds,[]);
});
check("invalid disappearing metadata cannot authorize local purge",()=>{
  const plan=planLocalDisappearingConvergence({localMessages:[{id:"bad",serverBacked:true,disappearAfterSeconds:31536001}],authoritativeRemoteIds:[]});
  assert.deepEqual(plan.purgeMessageIds,[]);
});
check("projection physically omits planned local IDs without tombstone rows",()=>{
  const rows=applyLocalDisappearingProjection([{id:"gone",text:"secret"},{id:"keep",text:"ok"}],["gone"]);assert.deepEqual(rows,[{id:"keep",text:"ok"}]);
});
check("contract rejects cache and device-clock authority",()=>{
  assert.equal(DISAPPEARING_LOCAL_CONVERGENCE_V1.requiresServerBackedAbsence,true);
  assert.equal(DISAPPEARING_LOCAL_CONVERGENCE_V1.cacheOnlyAbsenceIsAuthority,false);
  assert.equal(DISAPPEARING_LOCAL_CONVERGENCE_V1.clientClockIsAuthority,false);
  assert.equal(DISAPPEARING_LOCAL_CONVERGENCE_V1.createsTombstones,false);
});
console.log(`\n${passed}/${passed} local disappearing convergence assertions passed.`);
