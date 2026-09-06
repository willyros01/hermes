import assert from "node:assert/strict";
import fs from "node:fs";
import {planReconnectOutboxConvergence,DISAPPEARING_RECONNECT_RECOVERY_V1} from "./disappearing-reconnect-recovery.js";

const messages={
  direct:[
    {id:"accepted",mine:true,state:"sending",disappearAfterSeconds:60,serverBacked:false},
    {id:"purged",mine:true,state:"sent",disappearAfterSeconds:60,serverBacked:true},
    {id:"queued",mine:true,state:"queued",disappearAfterSeconds:60,serverBacked:false},
    {id:"ambiguous-crash",mine:true,state:"failed",disappearAfterSeconds:60,serverBacked:false},
    {id:"ordinary-missing",mine:true,state:"sent",serverBacked:true}
  ]
};
const outbox=[
  {id:"accepted",messageId:"accepted",conversationId:"direct",sendAttempted:true},
  {id:"purged",messageId:"purged",conversationId:"direct",sendAttempted:true},
  {id:"queued",messageId:"queued",conversationId:"direct",sendAttempted:false},
  {id:"ambiguous-crash",messageId:"ambiguous-crash",conversationId:"direct",sendAttempted:true},
  {id:"ordinary-missing",messageId:"ordinary-missing",conversationId:"direct",sendAttempted:true}
];
let plan=planReconnectOutboxConvergence({messagesByConversation:messages,outboxRecords:outbox,authoritativeRemoteIdsByConversation:{direct:["accepted"]}});
assert.deepEqual(plan.acceptedOutboxDeleteIds,["accepted"]);
assert.deepEqual(plan.purgeMessageIds,["purged"]);
assert.deepEqual(plan.replayMessageIds,["queued"]);
assert.deepEqual(plan.blockedMessageIds,["ambiguous-crash","ordinary-missing"]);

// Missing server authority always blocks, even for a never-attempted row.
plan=planReconnectOutboxConvergence({messagesByConversation:messages,outboxRecords:[{id:"queued",conversationId:"direct",sendAttempted:false}],authoritativeRemoteIdsByConversation:{}});
assert.deepEqual(plan.blockedMessageIds,["queued"]);
assert.equal(plan.replayMessageIds.length,0);

// Exact crash boundary: once the durable attempt marker exists, authoritative
// absence can never trigger automatic replay. No tombstone/accepted-ID registry
// is needed to make the conservative decision.
plan=planReconnectOutboxConvergence({messagesByConversation:messages,outboxRecords:[{id:"ambiguous-crash",conversationId:"direct",sendAttempted:true}],authoritativeRemoteIdsByConversation:{direct:[]}});
assert.deepEqual(plan.blockedMessageIds,["ambiguous-crash"]);
assert.equal(plan.replayMessageIds.length,0);

assert.equal(DISAPPEARING_RECONNECT_RECOVERY_V1.requiresServerReadBeforeReplay,true);
assert.equal(DISAPPEARING_RECONNECT_RECOVERY_V1.cacheOnlyAuthority,false);
assert.equal(DISAPPEARING_RECONNECT_RECOVERY_V1.clientClockIsAuthority,false);
assert.equal(DISAPPEARING_RECONNECT_RECOVERY_V1.createsTombstones,false);
assert.equal(DISAPPEARING_RECONNECT_RECOVERY_V1.retainsServerAcceptedIdRegistry,false);
assert.equal(DISAPPEARING_RECONNECT_RECOVERY_V1.attemptedAuthoritativeAbsenceFailsClosed,true);
assert.equal(DISAPPEARING_RECONNECT_RECOVERY_V1.automaticRetryAfterAmbiguousAttempt,false);
assert.equal(DISAPPEARING_RECONNECT_RECOVERY_V1.postCommitPreObservationCrashGapClosed,true);

const app=fs.readFileSync("app.js","utf8");
assert.match(app,/reconcileOutboxBeforeReplay/);
assert.match(app,/flushQueuedAfterAuthoritativeReconcile/);
assert.match(app,/markOutboxSendAttempted/);
assert.match(app,/sendAttempted:record\.sendAttempted===true/);
assert.match(app,/await markOutboxSendAttempted\(payload\.messageId\)/);
assert.match(app,/for\(const id of plan\.blockedMessageIds\)[\s\S]*row\.state="failed"/);
assert.doesNotMatch(app,/initializeFirebaseLayer\(\);\s*if\(state\.online\) flushQueued\(\);/);
assert.match(app,/scheduleReconnectRecovery\(\)[\s\S]*flushQueuedAfterAuthoritativeReconcile/);
const firebase=fs.readFileSync("firebase.js","utf8");
assert.match(firebase,/readCloudMessageIdsFromServer/);
assert.match(firebase,/readCloudGroupMessageIdsFromServer/);
assert.match(firebase,/getDocsFromServer/);
console.log("PASS restart/reconnect fail-closed replay barrier including post-commit/pre-observation crash gap");
