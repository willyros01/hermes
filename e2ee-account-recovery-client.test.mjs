import assert from "node:assert/strict";
if(typeof globalThis.btoa!=="function")globalThis.btoa=s=>Buffer.from(s,"binary").toString("base64");
if(typeof globalThis.atob!=="function")globalThis.atob=s=>Buffer.from(s,"base64").toString("binary");
const {createAccountE2EERecoveryClient}=await import("./e2ee-account-recovery-client.js");
const ruk=Uint8Array.from({length:32},(_,i)=>i+1);let enrollPayload,startCalls=0,completePayload;
const client=createAccountE2EERecoveryClient({
  enroll:async data=>{enrollPayload=data;return{recoveryAuthorityVersion:1,recoveryKeyWrappingAlgorithm:"HMAC-SHA256+A256GCM",recoveryKeyIv:"abc",wrappedRecoveryKey:"def"};},
  start:async()=>{startCalls++;return{sessionId:"session-1",expiresAtMs:123,status:"PENDING"};},
  complete:async data=>{completePayload=data;return{recoveryUnlockKey:Buffer.from(ruk).toString("base64url"),keyId:"key-1",identityRevision:7};}
});
const protectedResult=await client.protectRecoveryKey({keyId:"key-1",pin:"012345",recoveryUnlockKey:ruk});
assert.equal(enrollPayload.keyId,"key-1");assert.equal(enrollPayload.pin,"012345");assert.equal(Buffer.from(enrollPayload.recoveryUnlockKey,"base64url").length,32);assert.equal(protectedResult.recoveryAuthorityVersion,1);
const recovered=await client.recoverKey({pin:"012345"});assert.equal(startCalls,1);assert.deepEqual(completePayload,{sessionId:"session-1",pin:"012345"});assert.deepEqual([...recovered.recoveryUnlockKey],[...ruk]);assert.equal(recovered.keyId,"key-1");
await assert.rejects(()=>client.protectRecoveryKey({keyId:"k",pin:"012345",recoveryUnlockKey:new Uint8Array(31)}),/32 bytes/);
console.log("Account E2EE recovery client boundary tests passed");
