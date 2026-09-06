import assert from "node:assert/strict";
import {directSourcePurgeDecision,groupSourcePurgeDecision} from "./disappearing-purge-policy.js";

const t0=new Date("2026-09-06T12:00:00Z");
const before=new Date("2026-09-06T12:00:59Z");
const due=new Date("2026-09-06T12:01:00Z");

assert.deepEqual(directSourcePurgeDecision({message:{state:"read",readAt:t0},recipientUid:"B",now:due}),{eligible:false,reason:"not-disappearing",recipientUid:"B"});
assert.equal(directSourcePurgeDecision({message:{state:"sent",disappearAfterSeconds:60},recipientUid:"B",now:due}).reason,"recipient-unread");
assert.equal(directSourcePurgeDecision({message:{state:"read",readAt:t0,disappearAfterSeconds:60},recipientUid:"B",now:before}).eligible,false);
assert.equal(directSourcePurgeDecision({message:{state:"read",readAt:t0,disappearAfterSeconds:60},recipientUid:"B",now:due}).eligible,true);

let decision=groupSourcePurgeDecision({
  message:{senderUid:"A",disappearAfterSeconds:60},
  epochMemberUids:["A","B","C"],
  currentMemberUids:["A","B","C"],
  receipts:[{uid:"B",state:"read",readAt:t0},{uid:"C",state:"read",readAt:new Date("2026-09-06T12:00:30Z")}],
  now:due
});
assert.equal(decision.eligible,false,"later group recipient retains source during independent window");
assert.deepEqual(decision.waitingRecipientUids,["C"]);
assert.deepEqual(decision.expiredRecipientUids,["B"]);

decision=groupSourcePurgeDecision({
  message:{senderUid:"A",disappearAfterSeconds:60},
  epochMemberUids:["A","B","C"],
  currentMemberUids:["A","B"],
  receipts:[{uid:"B",state:"read",readAt:t0}],
  now:due
});
assert.equal(decision.eligible,true,"removed original recipient no longer blocks shared-source purge");
assert.deepEqual(decision.removedRecipientUids,["C"]);

decision=groupSourcePurgeDecision({
  message:{senderUid:"A",disappearAfterSeconds:60},
  epochMemberUids:["A","B"],
  currentMemberUids:["A","B","D"],
  receipts:[{uid:"B",state:"read",readAt:t0}],
  now:due
});
assert.equal(decision.eligible,true,"new member outside source epoch must not become a retroactive purge blocker");
assert.deepEqual(decision.applicableRecipientUids,["B"]);

decision=groupSourcePurgeDecision({
  message:{senderUid:"A",disappearAfterSeconds:60},
  epochMemberUids:["A","B"],
  currentMemberUids:["A"],
  receipts:[],
  now:t0
});
assert.equal(decision.eligible,true,"source is purge-eligible when no original recipient remains entitled");

console.log("Disappearing purge policy tests passed");
