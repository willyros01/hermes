import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  awaitBoundedOutboxReconciliation,
  createOutboxReconciliationBoundary,
  planAuthoritativeOutboxReconciliation,
  planTimedOutOutboxRequeue
} from "./outbox-reconciliation-boundary.js";

const held=new Promise(()=>{});
const timeoutResult=await awaitBoundedOutboxReconciliation(held,{timeoutMs:10});
assert.equal(timeoutResult.timedOut,true,"a stalled reconciliation must stop waiting at the bounded deadline");
assert.deepEqual(timeoutResult.value,[],"a stalled reconciliation must fail closed with no remote rows");

const boundary=createOutboxReconciliationBoundary({timeoutMs:25});
const one=await boundary.run(async()=>["server-row"]);
assert.equal(one.timedOut,false,"a prompt reconciliation should complete normally");
assert.deepEqual(one.value,["server-row"]);
assert.equal(boundary.isActive(),false,"the boundary must release after success");

const timed=await boundary.run(()=>new Promise(()=>{}));
assert.equal(timed.timedOut,true,"the reusable boundary must also release a stalled call");
assert.equal(boundary.isActive(),false,"the boundary must release after timeout");

const plan=planAuthoritativeOutboxReconciliation({
  outboxRecords:[
    {id:"retry-me",conversationId:"c",sendAttempted:false},
    {id:"fail-me",conversationId:"c",sendAttempted:true},
    {id:"keep-local",conversationId:"c",sendAttempted:false}
  ],
  remoteRows:[{id:"remote-only"}],
  localRows:[
    {id:"retry-me",state:"pending"},
    {id:"fail-me",state:"pending"},
    {id:"keep-local",state:"queued"}
  ]
});
assert.ok(plan.requeueIds.includes("retry-me"),"a stale pre-send pending row must be returned to the replay queue");
assert.ok(plan.failIds.includes("fail-me"),"an attempted-but-unconfirmed row must fail closed rather than replay");
assert.ok(!plan.requeueIds.includes("fail-me"),"an attempted row must never be requeued by reconciliation");

const timeoutPlan=planTimedOutOutboxRequeue({
  outboxRecords:[
    {id:"pre",conversationId:"c",sendAttempted:false},
    {id:"post",conversationId:"c",sendAttempted:true}
  ],
  messagesByConversation:{c:[
    {id:"pre",state:"pending"},
    {id:"post",state:"pending"}
  ]}
});
assert.deepEqual(timeoutPlan.requeueIds,["pre"],"timeout recovery may requeue only known pre-attempt work");
assert.deepEqual(timeoutPlan.failIds,["post"],"timeout recovery must fail attempted work closed");

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
assert.match(worker,/SHELL_REVISION="0\.9\.9\.13-group-sender-label"/,"the release must deterministically invalidate the prior shell cache");

console.log("Bounded Firebase Outbox reconciliation gate passed");