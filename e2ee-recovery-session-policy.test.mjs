import {
  RECOVERY_SESSION_V1,
  createRecoverySession,
  normalizeForTime,
  assertRecoveryAttemptAllowed,
  beginRecoveryPinAttempt,
  registerFailedPinAttempt,
  consumeRecoverySession,
  resetAccountRecoveryFailuresAfterSuccess
} from "./e2ee-recovery-session-policy.mjs";

const rows=[];
async function test(name,fn){try{await fn();rows.push([name,true]);console.log("PASS",name);}catch(e){rows.push([name,false]);console.error("FAIL",name,e?.message||e);}}
async function expectFail(name,fn,code){await test(name,async()=>{try{await fn();throw new Error("unexpected success");}catch(e){if(e.message==="unexpected success")throw e;if(code&&e.code!==code)throw new Error(`expected ${code}, got ${e.code}`);}});}
const now=1_000_000,uid="recovery-user",keyId="recovery-key-0001",revision=7;
const makeSession=(id="session-1",at=now)=>createRecoverySession({sessionId:id,uid,keyId,identityRevisionAtStart:revision,nowMs:at});
const base=makeSession();

await test("session starts PENDING",()=>{if(base.status!=="PENDING")throw new Error("wrong initial status");});
await test("session contains no supplemental verifier state",()=>{if("failedSupplementalAttempts" in base||"authorizedAtMs" in base||"supplementalProof" in base)throw new Error("obsolete supplemental state present");});
await test("session lifetime is exactly 10 minutes",()=>{if(base.expiresAtMs-base.createdAtMs!==600000)throw new Error("wrong lifetime");});
await test("session starts with zero PIN failures",()=>{if(base.failedPinAttempts!==0)throw new Error("wrong counter");});
await test("valid pending attempt allowed",()=>assertRecoveryAttemptAllowed({session:base,uid,keyId,currentIdentityRevision:revision,accountConsecutivePinFailures:0,nowMs:now+1}));
await expectFail("wrong UID denied",()=>assertRecoveryAttemptAllowed({session:base,uid:"other",keyId,currentIdentityRevision:revision,accountConsecutivePinFailures:0,nowMs:now+1}),"RECOVERY_DENIED");
await expectFail("changed keyId marks session stale",()=>assertRecoveryAttemptAllowed({session:base,uid,keyId:"other-key",currentIdentityRevision:revision,accountConsecutivePinFailures:0,nowMs:now+1}),"RECOVERY_STALE");
await expectFail("changed revision marks session stale",()=>assertRecoveryAttemptAllowed({session:base,uid,keyId,currentIdentityRevision:revision+1,accountConsecutivePinFailures:0,nowMs:now+1}),"RECOVERY_STALE");
await expectFail("account hold blocks attempts at 10 failures",()=>assertRecoveryAttemptAllowed({session:base,uid,keyId,currentIdentityRevision:revision,accountConsecutivePinFailures:10,nowMs:now+1}),"ACCOUNT_HOLD");

const verifying=beginRecoveryPinAttempt({session:base,nowMs:now+2});
await test("PIN attempt moves PENDING to VERIFYING before crypto",()=>{if(verifying.status!=="VERIFYING"||verifying.failedPinAttempts!==0)throw new Error("verification reservation failed");});
await expectFail("VERIFYING session cannot start a parallel attempt",()=>beginRecoveryPinAttempt({session:verifying,nowMs:now+3}),"RECOVERY_DENIED");
await expectFail("VERIFYING session is not generally attempt-eligible",()=>assertRecoveryAttemptAllowed({session:verifying,uid,keyId,currentIdentityRevision:revision,accountConsecutivePinFailures:0,nowMs:now+3}),"RECOVERY_DENIED");

await test("wrong PIN returns VERIFYING session to PENDING and increments counters",()=>{const r=registerFailedPinAttempt({session:verifying,accountConsecutivePinFailures:2,nowMs:now+4});if(r.session.status!=="PENDING"||r.session.failedPinAttempts!==1||r.accountConsecutivePinFailures!==3||r.sessionLocked)throw new Error("wrong counters/state");});
let s=base,acct=0;
for(let i=1;i<=5;i++){
  const v=beginRecoveryPinAttempt({session:s,nowMs:now+i});
  const r=registerFailedPinAttempt({session:v,accountConsecutivePinFailures:acct,nowMs:now+i});
  s=r.session;acct=r.accountConsecutivePinFailures;
}
await test("fifth wrong PIN locks session",()=>{if(s.status!=="LOCKED"||s.failedPinAttempts!==5)throw new Error("not locked");});
await expectFail("locked session cannot continue",()=>assertRecoveryAttemptAllowed({session:s,uid,keyId,currentIdentityRevision:revision,accountConsecutivePinFailures:acct,nowMs:now+10}),"SESSION_LOCKED");
await test("account failure counter persists independently",()=>{if(acct!==5)throw new Error("wrong account counter");});

let s2=makeSession("session-2",now+100),acct2=9;
const v2=beginRecoveryPinAttempt({session:s2,nowMs:now+101});
const hold=registerFailedPinAttempt({session:v2,accountConsecutivePinFailures:acct2,nowMs:now+101});
await test("tenth account failure raises account hold flag",()=>{if(!hold.accountHold||hold.accountConsecutivePinFailures!==10)throw new Error("hold not raised");});
await test("session expires at boundary",()=>{const x=normalizeForTime(base,base.expiresAtMs);if(x.status!=="EXPIRED")throw new Error("not expired");});
await expectFail("expired session attempt denied",()=>assertRecoveryAttemptAllowed({session:base,uid,keyId,currentIdentityRevision:revision,accountConsecutivePinFailures:0,nowMs:base.expiresAtMs}),"SESSION_EXPIRED");

const consumed=consumeRecoverySession({session:verifying,nowMs:now+40});
await test("successful verification moves VERIFYING to CONSUMED",()=>{if(consumed.status!=="CONSUMED"||consumed.consumedAtMs!==now+40)throw new Error("not consumed");});
await expectFail("consumed session cannot be reused",()=>assertRecoveryAttemptAllowed({session:consumed,uid,keyId,currentIdentityRevision:revision,accountConsecutivePinFailures:0,nowMs:now+41}),"SESSION_CONSUMED");
await expectFail("PENDING session cannot be consumed before verification reservation",()=>consumeRecoverySession({session:base,nowMs:now+50}),"RECOVERY_DENIED");
await expectFail("PENDING session cannot register a failed PIN without verification reservation",()=>registerFailedPinAttempt({session:base,accountConsecutivePinFailures:0,nowMs:now+50}),"RECOVERY_DENIED");
await test("successful recovery resets account failure counter",()=>{if(resetAccountRecoveryFailuresAfterSuccess()!==0)throw new Error("counter not reset");});
await test("policy constants match binding spec",()=>{if(RECOVERY_SESSION_V1.maxPinFailuresPerSession!==5||RECOVERY_SESSION_V1.maxAccountConsecutivePinFailures!==10||RECOVERY_SESSION_V1.lifetimeMs!==600000)throw new Error("policy drift");});
await test("obsolete AUTHORIZED status is absent",()=>{if("AUTHORIZED" in RECOVERY_SESSION_V1.statuses)throw new Error("obsolete status present");});

const failed=rows.filter(([,ok])=>!ok);console.log(`\n${rows.length-failed.length}/${rows.length} recovery session assertions passed.`);if(failed.length)process.exitCode=1;
