import {
  RECOVERY_SESSION_V1,
  createRecoverySession,
  normalizeForTime,
  assertRecoveryAttemptAllowed,
  registerFailedPinAttempt,
  registerFailedSupplementalAttempt,
  authorizeRecoverySession,
  consumeRecoverySession,
  resetAccountRecoveryFailuresAfterSuccess
} from "./e2ee-recovery-session-policy.mjs";

const rows=[];
async function test(name,fn){try{await fn();rows.push([name,true]);console.log("PASS",name);}catch(e){rows.push([name,false]);console.error("FAIL",name,e?.message||e);}}
async function expectFail(name,fn,code){await test(name,async()=>{try{await fn();throw new Error("unexpected success");}catch(e){if(e.message==="unexpected success")throw e;if(code&&e.code!==code)throw new Error(`expected ${code}, got ${e.code}`);}});}
const now=1_000_000,uid="recovery-user",keyId="recovery-key-0001",revision=7;
const base=createRecoverySession({sessionId:"session-1",uid,keyId,identityRevisionAtStart:revision,nowMs:now});

await test("session starts PENDING",()=>{if(base.status!=="PENDING")throw new Error("wrong initial status");});
await test("session lifetime is exactly 10 minutes",()=>{if(base.expiresAtMs-base.createdAtMs!==600000)throw new Error("wrong lifetime");});
await test("session starts with zero PIN failures",()=>{if(base.failedPinAttempts!==0)throw new Error("wrong counter");});
await test("valid pending attempt allowed",()=>assertRecoveryAttemptAllowed({session:base,uid,keyId,currentIdentityRevision:revision,accountConsecutivePinFailures:0,nowMs:now+1}));
await expectFail("wrong UID denied",()=>assertRecoveryAttemptAllowed({session:base,uid:"other",keyId,currentIdentityRevision:revision,accountConsecutivePinFailures:0,nowMs:now+1}),"RECOVERY_DENIED");
await expectFail("changed keyId marks session stale",()=>assertRecoveryAttemptAllowed({session:base,uid,keyId:"other-key",currentIdentityRevision:revision,accountConsecutivePinFailures:0,nowMs:now+1}),"RECOVERY_STALE");
await expectFail("changed revision marks session stale",()=>assertRecoveryAttemptAllowed({session:base,uid,keyId,currentIdentityRevision:revision+1,accountConsecutivePinFailures:0,nowMs:now+1}),"RECOVERY_STALE");
await expectFail("account hold blocks attempts at 10 failures",()=>assertRecoveryAttemptAllowed({session:base,uid,keyId,currentIdentityRevision:revision,accountConsecutivePinFailures:10,nowMs:now+1}),"ACCOUNT_HOLD");
await test("first wrong PIN increments session and account counters",()=>{const r=registerFailedPinAttempt({session:base,accountConsecutivePinFailures:2,nowMs:now+2});if(r.session.failedPinAttempts!==1||r.accountConsecutivePinFailures!==3||r.sessionLocked)throw new Error("wrong counters");});
let s=base,acct=0;
for(let i=1;i<=5;i++){const r=registerFailedPinAttempt({session:s,accountConsecutivePinFailures:acct,nowMs:now+i});s=r.session;acct=r.accountConsecutivePinFailures;}
await test("fifth wrong PIN locks session",()=>{if(s.status!=="LOCKED"||s.failedPinAttempts!==5)throw new Error("not locked");});
await expectFail("locked session cannot continue",()=>assertRecoveryAttemptAllowed({session:s,uid,keyId,currentIdentityRevision:revision,accountConsecutivePinFailures:acct,nowMs:now+10}),"SESSION_LOCKED");
await test("account failure counter persists independently",()=>{if(acct!==5)throw new Error("wrong account counter");});
let s2=createRecoverySession({sessionId:"session-2",uid,keyId,identityRevisionAtStart:revision,nowMs:now+100});let acct2=9;
const hold=registerFailedPinAttempt({session:s2,accountConsecutivePinFailures:acct2,nowMs:now+101});
await test("tenth account failure raises account hold flag",()=>{if(!hold.accountHold||hold.accountConsecutivePinFailures!==10)throw new Error("hold not raised");});
await test("session expires at boundary",()=>{const x=normalizeForTime(base,base.expiresAtMs);if(x.status!=="EXPIRED")throw new Error("not expired");});
await expectFail("expired session attempt denied",()=>assertRecoveryAttemptAllowed({session:base,uid,keyId,currentIdentityRevision:revision,accountConsecutivePinFailures:0,nowMs:base.expiresAtMs}),"SESSION_EXPIRED");
const supplemental=registerFailedSupplementalAttempt({session:base,nowMs:now+20});
await test("supplemental failure increments separate counter",()=>{if(supplemental.failedSupplementalAttempts!==1||supplemental.failedPinAttempts!==0)throw new Error("wrong supplemental counter");});
const authorized=authorizeRecoverySession({session:base,nowMs:now+30});
await test("authorization moves PENDING to AUTHORIZED",()=>{if(authorized.status!=="AUTHORIZED"||authorized.authorizedAtMs!==now+30)throw new Error("not authorized");});
await test("authorized session remains attempt-eligible",()=>assertRecoveryAttemptAllowed({session:authorized,uid,keyId,currentIdentityRevision:revision,accountConsecutivePinFailures:0,nowMs:now+31}));
const consumed=consumeRecoverySession({session:authorized,nowMs:now+40});
await test("consume moves AUTHORIZED to CONSUMED",()=>{if(consumed.status!=="CONSUMED"||consumed.consumedAtMs!==now+40)throw new Error("not consumed");});
await expectFail("consumed session cannot be reused",()=>assertRecoveryAttemptAllowed({session:consumed,uid,keyId,currentIdentityRevision:revision,accountConsecutivePinFailures:0,nowMs:now+41}),"SESSION_CONSUMED");
await expectFail("pending session cannot be consumed",()=>consumeRecoverySession({session:base,nowMs:now+50}),"RECOVERY_DENIED");
await expectFail("authorized session cannot be authorized twice",()=>authorizeRecoverySession({session:authorized,nowMs:now+50}),"RECOVERY_DENIED");
await test("successful recovery resets account failure counter",()=>{if(resetAccountRecoveryFailuresAfterSuccess()!==0)throw new Error("counter not reset");});
await test("policy constants match binding spec",()=>{if(RECOVERY_SESSION_V1.maxPinFailuresPerSession!==5||RECOVERY_SESSION_V1.maxAccountConsecutivePinFailures!==10||RECOVERY_SESSION_V1.lifetimeMs!==600000)throw new Error("policy drift");});

const failed=rows.filter(([,ok])=>!ok);console.log(`\n${rows.length-failed.length}/${rows.length} recovery session assertions passed.`);if(failed.length)process.exitCode=1;
