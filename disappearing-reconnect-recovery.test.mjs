import assert from "node:assert/strict";
import fs from "node:fs";
import {planReconnectOutboxConvergence,DISAPPEARING_RECONNECT_RECOVERY_V1} from "./disappearing-reconnect-recovery.js";

const messages={
  direct:[
    {id:"accepted",mine:true,state:"sending",disappearAfterSeconds:60,serverBacked:false},
    {id:"purged",mine:true,state:"sent",disappearAfterSeconds:60,serverBacked:true},
    {id:"queued",mine:true,state:"queued",disappearAfterSeconds:60,serverBacked:false},
    {id:"ordinary-missing",mine:true,state:"sent",serverBacked:true}
  ]
};
const outbox=["accepted","purged","queued","ordinary-missing"].map(id=>({id,messageId:id,conversationId:"direct"}));
let plan=planReconnectOutboxConvergence({messagesByConversation:messages,outboxRecords:outbox,authoritativeRemoteIdsByConversation:{direct:["accepted"]}});
assert.deepEqual(plan.acceptedOutboxDeleteIds,["accepted"]);
assert.deepEqual(plan.purgeMessageIds,["purged"]);
assert.deepEqual(plan.replayMessageIds,["queued"]);
assert.deepEqual(plan.blockedMessageIds,["ordinary-missing"]);

plan=planReconnectOutboxConvergence({messagesByConversation:messages,outboxRecords:[{id:"queued",conversationId:"direct"}],authoritativeRemoteIdsByConversation:{}});
assert.deepEqual(plan.blockedMessageIds,["queued"]);
assert.equal(plan.replayMessageIds.length,0);

assert.equal(DISAPPEARING_RECONNECT_RECOVERY_V1.requiresServerReadBeforeReplay,true);
assert.equal(DISAPPEARING_RECONNECT_RECOVERY_V1.cacheOnlyAuthority,false);
assert.equal(DISAPPEARING_RECONNECT_RECOVERY_V1.clientClockIsAuthority,false);
assert.equal(DISAPPEARING_RECONNECT_RECOVERY_V1.createsTombstones,false);
assert.equal(DISAPPEARING_RECONNECT_RECOVERY_V1.postCommitPreObservationCrashGapClosed,false);

const app=fs.readFileSync("app.js","utf8");
assert.match(app,/reconcileOutboxBeforeReplay/);
assert.match(app,/flushQueuedAfterAuthoritativeReconcile/);
assert.doesNotMatch(app,/initializeFirebaseLayer\(\);\s*if\(state\.online\) flushQueued\(\);/);
assert.match(app,/scheduleReconnectRecovery\(\)[\s\S]*flushQueuedAfterAuthoritativeReconcile/);
const firebase=fs.readFileSync("firebase.js","utf8");
assert.match(firebase,/readCloudMessageIdsFromServer/);
assert.match(firebase,/readCloudGroupMessageIdsFromServer/);
assert.match(firebase,/getDocsFromServer/);
console.log("PASS restart/reconnect replay barrier for accepted, purged, queued and blocked Outbox rows");
