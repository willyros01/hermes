import { randomBytes } from "node:crypto";
import {
  deriveRecoveryWrappingKey,
  protectRecoveryUnlockKey,
  recoverRecoveryUnlockKey,
  recoveryKdfContext,
  recoveryAad,
  sameSecret
} from "./e2ee-recovery-server-crypto.mjs";

const rows=[];
async function test(name,fn){try{await fn();rows.push([name,true]);console.log("PASS",name);}catch(e){rows.push([name,false]);console.error("FAIL",name,e?.message||e);}}
async function expectFail(name,fn){await test(name,async()=>{let ok=false;try{await fn();}catch{ok=true;}if(!ok)throw new Error("unexpected success");});}
const master=randomBytes(32),otherMaster=randomBytes(32),ruk=randomBytes(32),uid="recovery-user",keyId="recovery-key-0001",pin="012345";
const protectedKey=protectRecoveryUnlockKey({masterSecret:master,uid,keyId,pin,recoveryUnlockKey:ruk});

await test("round trip returns same RUK",()=>{const got=recoverRecoveryUnlockKey({masterSecret:master,uid,keyId,pin,protectedRecoveryKey:protectedKey});if(!sameSecret(got,ruk))throw new Error("RUK mismatch");});
await test("leading-zero PIN preserved in KDF context",()=>{const s=recoveryKdfContext({uid,keyId,pin}).toString("utf8");if(!s.includes('"012345"'))throw new Error("PIN changed");});
await test("AAD binds uid and keyId",()=>{const s=recoveryAad({uid,keyId}).toString("utf8");if(!s.includes(uid)||!s.includes(keyId))throw new Error("AAD missing binding");});
await test("same inputs derive same wrapping key",()=>{const a=deriveRecoveryWrappingKey({masterSecret:master,uid,keyId,pin});const b=deriveRecoveryWrappingKey({masterSecret:master,uid,keyId,pin});if(!sameSecret(a,b))throw new Error("KDF nondeterministic");});
await test("different PIN derives different key",()=>{const a=deriveRecoveryWrappingKey({masterSecret:master,uid,keyId,pin});const b=deriveRecoveryWrappingKey({masterSecret:master,uid,keyId,pin:"654321"});if(sameSecret(a,b))throw new Error("PIN not bound");});
await test("different UID derives different key",()=>{const a=deriveRecoveryWrappingKey({masterSecret:master,uid,keyId,pin});const b=deriveRecoveryWrappingKey({masterSecret:master,uid:"other-user",keyId,pin});if(sameSecret(a,b))throw new Error("UID not bound");});
await test("different keyId derives different key",()=>{const a=deriveRecoveryWrappingKey({masterSecret:master,uid,keyId,pin});const b=deriveRecoveryWrappingKey({masterSecret:master,uid,keyId:"other-key-0001",pin});if(sameSecret(a,b))throw new Error("keyId not bound");});
await test("different master derives different key",()=>{const a=deriveRecoveryWrappingKey({masterSecret:master,uid,keyId,pin});const b=deriveRecoveryWrappingKey({masterSecret:otherMaster,uid,keyId,pin});if(sameSecret(a,b))throw new Error("master not bound");});
await expectFail("wrong PIN cannot recover RUK",()=>recoverRecoveryUnlockKey({masterSecret:master,uid,keyId,pin:"654321",protectedRecoveryKey:protectedKey}));
await expectFail("wrong UID cannot recover RUK",()=>recoverRecoveryUnlockKey({masterSecret:master,uid:"other-user",keyId,pin,protectedRecoveryKey:protectedKey}));
await expectFail("wrong keyId cannot recover RUK",()=>recoverRecoveryUnlockKey({masterSecret:master,uid,keyId:"other-key-0001",pin,protectedRecoveryKey:protectedKey}));
await expectFail("wrong master cannot recover RUK",()=>recoverRecoveryUnlockKey({masterSecret:otherMaster,uid,keyId,pin,protectedRecoveryKey:protectedKey}));
await expectFail("malformed PIN rejected",()=>protectRecoveryUnlockKey({masterSecret:master,uid,keyId,pin:"12345",recoveryUnlockKey:ruk}));
await expectFail("short RUK rejected",()=>protectRecoveryUnlockKey({masterSecret:master,uid,keyId,pin,recoveryUnlockKey:randomBytes(31)}));
await expectFail("short master rejected",()=>protectRecoveryUnlockKey({masterSecret:randomBytes(31),uid,keyId,pin,recoveryUnlockKey:ruk}));
await expectFail("tampered wrappedRecoveryKey rejected",()=>{const p={...protectedKey,wrappedRecoveryKey:protectedKey.wrappedRecoveryKey.slice(0,-1)+(protectedKey.wrappedRecoveryKey.endsWith("A")?"B":"A")};return recoverRecoveryUnlockKey({masterSecret:master,uid,keyId,pin,protectedRecoveryKey:p});});
await expectFail("tampered IV rejected",()=>{const p={...protectedKey,recoveryKeyIv:protectedKey.recoveryKeyIv.slice(0,-1)+(protectedKey.recoveryKeyIv.endsWith("A")?"B":"A")};return recoverRecoveryUnlockKey({masterSecret:master,uid,keyId,pin,protectedRecoveryKey:p});});
await expectFail("wrong authority version rejected",()=>recoverRecoveryUnlockKey({masterSecret:master,uid,keyId,pin,protectedRecoveryKey:{...protectedKey,recoveryAuthorityVersion:2}}));
await expectFail("wrong wrapping algorithm rejected",()=>recoverRecoveryUnlockKey({masterSecret:master,uid,keyId,pin,protectedRecoveryKey:{...protectedKey,recoveryKeyWrappingAlgorithm:"WRONG"}}));
await test("fresh wraps use different IV/ciphertext",()=>{const p2=protectRecoveryUnlockKey({masterSecret:master,uid,keyId,pin,recoveryUnlockKey:ruk});if(p2.recoveryKeyIv===protectedKey.recoveryKeyIv||p2.wrappedRecoveryKey===protectedKey.wrappedRecoveryKey)throw new Error("random IV not effective");});

const failed=rows.filter(([,ok])=>!ok);console.log(`\n${rows.length-failed.length}/${rows.length} recovery crypto assertions passed.`);if(failed.length)process.exitCode=1;
