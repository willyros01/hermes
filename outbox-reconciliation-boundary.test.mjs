import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  OUTBOX_RECONCILIATION_TIMEOUT_CODE,
  OUTBOX_RECONCILIATION_TIMEOUT_MS,
  awaitBoundedOutboxReconciliation,
  isOutboxReconciliationTimeout,
  planTimedOutOutboxRequeue,
  timeoutRequiresFailedState
} from "./outbox-reconciliation-boundary.js";

assert.equal(OUTBOX_RECONCILIATION_TIMEOUT_MS,12000,"the live Firebase wait must be bounded and user-visible");

{
  let timerCallback=null,cleared=false;
  const value=await awaitBoundedOutboxReconciliation(Promise.resolve("ready"),{
    setTimer(callback){timerCallback=callback;return 7;},
    clearTimer(id){assert.equal(id,7);cleared=true;}
  });
  assert.equal(value,"ready");
  assert.equal(cleared,true,"successful reconciliation must clear its timeout");
  timerCallback?.();
}

{
  let fireTimeout;
  const bounded=awaitBoundedOutboxReconciliation(new Promise(()=>{}),{stage:"send-confirmation",setTimer(callback){fireTimeout=callback;return 10;},clearTimer(){}});
  fireTimeout();
  await assert.rejects(bounded,error=>{
    assert.equal(timeoutRequiresFailedState(error),true);
    assert.match(error.message,/preserved as Failed/i);
    assert.match(error.message,/will not automatically retry/i);
    return true;
  });
}

assert.deepEqual(planTimedOutOutboxRequeue({
  outboxRecords:[
    {id:"never-attempted",payload:"encrypted"},
    {id:"already-attempted",payload:"encrypted",sendAttempted:true},
    {id:"queued-already",payload:"encrypted"}
  ],
  messagesByConversation:{dm:[
    {id:"never-attempted",state:"sending"},
    {id:"already-attempted",state:"sending"},
    {id:"queued-already",state:"queued"},
    {id:"not-in-outbox",state:"sending"}
  ]}
}),["never-attempted"],"only an unattempted Outbox-backed Sending row may return to Queued");

{
  let fireTimeout;
  const bounded=awaitBoundedOutboxReconciliation(new Promise(()=>{}),{timeoutMs:5,setTimer(callback){fireTimeout=callback;return 8;},clearTimer(){}});
  fireTimeout();
  await assert.rejects(bounded,error=>{
    assert.equal(error.code,OUTBOX_RECONCILIATION_TIMEOUT_CODE);
    assert.equal(isOutboxReconciliationTimeout(error),true);
    assert.match(error.message,/remains safely queued/i);
    return true;
  });
}

{
  const failure=Object.assign(new Error("permission denied"),{code:"permission-denied"});
  await assert.rejects(awaitBoundedOutboxReconciliation(Promise.reject(failure),{setTimer(){return 9;},clearTimer(){}}),error=>error===failure);
  assert.equal(isOutboxReconciliationTimeout(failure),false,"ordinary Firebase failures must not be mislabeled as timeouts");
}

const app=readFileSync(new URL("./app.js",import.meta.url),"utf8");
const workflow=readFileSync(new URL("./.github/workflows/rebuild-baseline-security.yml",import.meta.url),"utf8");
assert.match(app,/awaitBoundedOutboxReconciliation\(reconcileOutboxBeforeReplay\(\)\)/,"the existing serialized reconciliation owner must use the bounded wait");
assert.match(app,/planTimedOutOutboxRequeue\(\{outboxRecords:records,messagesByConversation:state\.messages\}\)/,"the app owner must use the pure fail-closed requeue decision");
assert.match(app,/m\.state="queued"/,"a stalled pre-send row must return to Queued");
assert.match(app,/notifyUser:true/,"an explicit user send must surface the Firebase timeout");
assert.match(app,/ensureFirebaseAuthSession\(\),\{stage:"auth-session"\}/,"every serialized cloud send cycle must first establish Firebase authentication");
assert.match(app,/outboxCyclePending=true/,"duplicate lifecycle recovery triggers must be coalesced");
assert.match(app,/while\(outboxCyclePending\)/,"the owner must perform only a required coalesced follow-up cycle");
assert.doesNotMatch(app,/outboxCycleTail\.then\(work,work\)/,"recovery triggers must not accumulate as an unbounded serialized backlog");
assert.match(app,/stage:"send-confirmation"/,"Firestore send acknowledgment must be bounded after the durable attempt marker");
assert.match(app,/sendAttempted\|\|timeoutRequiresFailedState\(err\)/,"pre-attempt timeout must queue while post-attempt ambiguity fails closed");
assert.match(app,/let outboxCycleTail=Promise\.resolve\(\)/,"the complete reconcile/encrypt/send cycle must have one serialized tail");
assert.match(app,/outboxCycleTail=\(async\(\)=>\{[\s\S]*?reconcileOutboxBeforeReplay\(\)[\s\S]*?flushQueued/s,"reconciliation and flush must remain inside the same serialized application cycle");
assert.match(app,/m\.state=record\.sendAttempted===true\?"failed":"queued"/,"a disallowed attempted row must remain Failed and must never return to the replay queue");
assert.doesNotMatch(app,/if\(state\.online\) flushQueued\(\)/,"key verification and lifecycle callers must not bypass authoritative serialized reconciliation");
assert.match(app,/if\(state\.online\) flushQueuedAfterAuthoritativeReconcile\(\{notifyUser:true\}\)/,"key verification must re-enter the one authoritative Outbox path");
assert.match(workflow,/npm run test:outbox-reconciliation-boundary/,"the permanent baseline must run this regression gate");

const worker=readFileSync(new URL("./service-worker.js",import.meta.url),"utf8");
assert.match(worker,/\.\/outbox-reconciliation-boundary\.js/,"the bounded send dependency must be part of the deterministic offline shell");
assert.match(worker,/SHELL_REVISION="0\.9\.9\.9t-storage-fetch"/,"the release must deterministically invalidate the prior shell cache");

console.log("Bounded Firebase Outbox reconciliation gate passed");
