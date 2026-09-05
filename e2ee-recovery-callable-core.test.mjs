import { randomBytes } from "node:crypto";
import { createRecoveryCallableCore } from "./e2ee-recovery-callable-core.mjs";
import { protectRecoveryUnlockKey } from "./e2ee-recovery-server-crypto.mjs";

const rows=[];
async function test(name,fn){try{await fn();rows.push([name,true]);console.log("PASS",name);}catch(e){rows.push([name,false]);console.error("FAIL",name,e?.message||e);}}
async function expectFail(name,fn,code){await test(name,async()=>{try{await fn();throw new Error("unexpected success");}catch(e){if(e.message==="unexpected success")throw e;if(code&&e.code!==code)throw new Error(`expected ${code}, got ${e.code}`);}});}

const uid="recovery-user",keyId="recovery-key-0001",revision=4,pin="012345",nowBase=2_000_000;
const masterSource=randomBytes(32),ruk=randomBytes(32);
const protectedKey=protectRecoveryUnlockKey({masterSecret:masterSource,uid,keyId,pin,recoveryUnlockKey:ruk});

function harness({supplementalOk=true,accountFailures=0,identityOverride=null}={}){
  let clock=nowBase;
  const sessions=new Map();
  let failures=accountFailures;
  let identity=identityOverride||{keyId,revision,recoveryWrapper:protectedKey};
  const events=[];
  const identityRepo={async readIdentity(requestUid){events.push(["readIdentity",requestUid]);return requestUid===uid?identity:null;}};
  const sessionRepo={
    async createSession(s){events.push(["createSession",s.sessionId]);if(sessions.has(s.sessionId))throw new Error("session exists");sessions.set(s.sessionId,s);},
    async readSession(id){events.push(["readSession",id]);return sessions.get(id)||null;},
    async readAccountFailureCount(requestUid){events.push(["readFailures",requestUid]);return requestUid===uid?failures:0;},
    async saveFailedPinAttempt({session,accountConsecutivePinFailures,accountHold}){events.push(["failedPin",accountConsecutivePinFailures,accountHold]);sessions.set(session.sessionId,session);failures=accountConsecutivePinFailures;},
    async saveFailedSupplementalAttempt(session){events.push(["failedSupplemental"]);sessions.set(session.sessionId,session);},
    async saveAuthorizedSession(session){events.push(["authorized"]);sessions.set(session.sessionId,session);},
    async consumeSession({session,accountConsecutivePinFailures}){events.push(["consumed"]);sessions.set(session.sessionId,session);failures=accountConsecutivePinFailures;}
  };
  const core=createRecoveryCallableCore({
    masterSecretProvider:async()=>masterSource,
    identityRepo,
    sessionRepo,
    supplementalVerifier:async({proof})=>supplementalOk&&proof==="ok",
    now:()=>clock,
    newSessionId:()=>"session-fixed"
  });
  return{core,sessions,events,get failures(){return failures;},setClock:v=>clock=v,setIdentity:v=>identity=v};
}

await expectFail("enroll requires authentication",()=>harness().core.enrollRecoveryV1({authUid:"",appCheckValid:true,data:{keyId,pin,recoveryUnlockKey:ruk.toString("base64url")}}),"INVALID_INPUT");
await expectFail("enroll requires App Check",()=>harness().core.enrollRecoveryV1({authUid:uid,appCheckValid:false,data:{keyId,pin,recoveryUnlockKey:ruk.toString("base64url")}}),"APP_CHECK_REQUIRED");
await test("enroll protects RUK without returning plaintext",async()=>{const h=harness();const r=await h.core.enrollRecoveryV1({authUid:uid,appCheckValid:true,data:{keyId,pin,recoveryUnlockKey:ruk.toString("base64url")}});if(!r.wrappedRecoveryKey||!r.recoveryKeyIv||r.recoveryUnlockKey)throw new Error("bad enrollment response");});
await test("master provider buffer is not mutated by enroll",async()=>{const before=Buffer.from(masterSource);const h=harness();await h.core.enrollRecoveryV1({authUid:uid,appCheckValid:true,data:{keyId,pin,recoveryUnlockKey:ruk.toString("base64url")}});if(!before.equals(masterSource))throw new Error("provider master mutated");});
await expectFail("start requires App Check",()=>harness().core.startE2EERecoveryV1({authUid:uid,appCheckValid:false}),"APP_CHECK_REQUIRED");
await test("start binds session to authoritative keyId and revision",async()=>{const h=harness();const r=await h.core.startE2EERecoveryV1({authUid:uid,appCheckValid:true});const s=h.sessions.get(r.sessionId);if(s.uid!==uid||s.keyId!==keyId||s.identityRevisionAtStart!==revision||s.status!=="PENDING")throw new Error("bad session binding");});
await expectFail("start blocks account at 10 failures",()=>harness({accountFailures:10}).core.startE2EERecoveryV1({authUid:uid,appCheckValid:true}),"ACCOUNT_HOLD");
await expectFail("start fails when identity missing",()=>harness({identityOverride:{}}).core.startE2EERecoveryV1({authUid:uid,appCheckValid:true}),"IDENTITY_MISSING");
await test("complete with correct proof and PIN returns same RUK",async()=>{const h=harness();await h.core.startE2EERecoveryV1({authUid:uid,appCheckValid:true});const r=await h.core.completeE2EERecoveryV1({authUid:uid,appCheckValid:true,data:{sessionId:"session-fixed",pin,supplementalProof:"ok"}});if(r.recoveryUnlockKey!==ruk.toString("base64url")||r.keyId!==keyId||r.identityRevision!==revision)throw new Error("wrong recovery result");});
await test("successful complete consumes session before result and resets account failures",async()=>{const h=harness({accountFailures:4});await h.core.startE2EERecoveryV1({authUid:uid,appCheckValid:true});await h.core.completeE2EERecoveryV1({authUid:uid,appCheckValid:true,data:{sessionId:"session-fixed",pin,supplementalProof:"ok"}});if(h.sessions.get("session-fixed").status!=="CONSUMED"||h.failures!==0||!h.events.some(e=>e[0]==="consumed"))throw new Error("not consumed/reset");});
await expectFail("consumed session cannot release RUK twice",async()=>{const h=harness();await h.core.startE2EERecoveryV1({authUid:uid,appCheckValid:true});await h.core.completeE2EERecoveryV1({authUid:uid,appCheckValid:true,data:{sessionId:"session-fixed",pin,supplementalProof:"ok"}});await h.core.completeE2EERecoveryV1({authUid:uid,appCheckValid:true,data:{sessionId:"session-fixed",pin,supplementalProof:"ok"}});},"SESSION_CONSUMED");
await expectFail("wrong PIN returns generic recovery denial",async()=>{const h=harness();await h.core.startE2EERecoveryV1({authUid:uid,appCheckValid:true});await h.core.completeE2EERecoveryV1({authUid:uid,appCheckValid:true,data:{sessionId:"session-fixed",pin:"654321",supplementalProof:"ok"}});},"RECOVERY_DENIED");
await test("wrong PIN increments both counters and does not consume",async()=>{const h=harness({accountFailures:2});await h.core.startE2EERecoveryV1({authUid:uid,appCheckValid:true});try{await h.core.completeE2EERecoveryV1({authUid:uid,appCheckValid:true,data:{sessionId:"session-fixed",pin:"654321",supplementalProof:"ok"}});}catch{}const s=h.sessions.get("session-fixed");if(s.failedPinAttempts!==1||h.failures!==3||s.status==="CONSUMED")throw new Error("wrong failure state");});
await expectFail("supplemental failure denies before PIN unwrap",async()=>{const h=harness({supplementalOk:false});await h.core.startE2EERecoveryV1({authUid:uid,appCheckValid:true});await h.core.completeE2EERecoveryV1({authUid:uid,appCheckValid:true,data:{sessionId:"session-fixed",pin,supplementalProof:"bad"}});},"RECOVERY_DENIED");
await test("supplemental failure increments only supplemental counter",async()=>{const h=harness({supplementalOk:false});await h.core.startE2EERecoveryV1({authUid:uid,appCheckValid:true});try{await h.core.completeE2EERecoveryV1({authUid:uid,appCheckValid:true,data:{sessionId:"session-fixed",pin,supplementalProof:"bad"}});}catch{}const s=h.sessions.get("session-fixed");if(s.failedSupplementalAttempts!==1||s.failedPinAttempts!==0||h.failures!==0)throw new Error("wrong supplemental state");});
await expectFail("changed identity revision aborts recovery",async()=>{const h=harness();await h.core.startE2EERecoveryV1({authUid:uid,appCheckValid:true});h.setIdentity({keyId,revision:revision+1,recoveryWrapper:protectedKey});await h.core.completeE2EERecoveryV1({authUid:uid,appCheckValid:true,data:{sessionId:"session-fixed",pin,supplementalProof:"ok"}});},"RECOVERY_STALE");
await expectFail("changed identity keyId aborts recovery",async()=>{const h=harness();await h.core.startE2EERecoveryV1({authUid:uid,appCheckValid:true});h.setIdentity({keyId:"different-key-0001",revision,recoveryWrapper:protectedKey});await h.core.completeE2EERecoveryV1({authUid:uid,appCheckValid:true,data:{sessionId:"session-fixed",pin,supplementalProof:"ok"}});},"RECOVERY_STALE");
await expectFail("expired session cannot complete",async()=>{const h=harness();const r=await h.core.startE2EERecoveryV1({authUid:uid,appCheckValid:true});h.setClock(h.sessions.get(r.sessionId).expiresAtMs);await h.core.completeE2EERecoveryV1({authUid:uid,appCheckValid:true,data:{sessionId:r.sessionId,pin,supplementalProof:"ok"}});},"SESSION_EXPIRED");
await expectFail("complete requires App Check",async()=>{const h=harness();await h.core.startE2EERecoveryV1({authUid:uid,appCheckValid:true});await h.core.completeE2EERecoveryV1({authUid:uid,appCheckValid:false,data:{sessionId:"session-fixed",pin,supplementalProof:"ok"}});},"APP_CHECK_REQUIRED");
await test("master provider buffer is not mutated by complete",async()=>{const before=Buffer.from(masterSource);const h=harness();await h.core.startE2EERecoveryV1({authUid:uid,appCheckValid:true});await h.core.completeE2EERecoveryV1({authUid:uid,appCheckValid:true,data:{sessionId:"session-fixed",pin,supplementalProof:"ok"}});if(!before.equals(masterSource))throw new Error("provider master mutated");});

const failed=rows.filter(([,ok])=>!ok);console.log(`\n${rows.length-failed.length}/${rows.length} recovery callable-core assertions passed.`);if(failed.length)process.exitCode=1;
