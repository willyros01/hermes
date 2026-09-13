import assert from "node:assert/strict";
import {createAdminRecoveryAuthorizationCore} from "./functions/recovery/admin-recovery-authorization-core.mjs";
let now=1800000000000,seq=0;
const profiles=new Map([["owner",{systemRole:"owner",active:true}],["admin",{systemRole:"admin",active:true}],["user",{systemRole:"user",active:true}],["user2",{systemRole:"user",active:true}],["off",{systemRole:"user",active:false,status:"deactivated"}]]),rows=new Map();
const authorizationRepo={
 async createAuthorization(r){rows.set(r.authorizationId,{...r});return r;},
 async listForTarget(uid){return[...rows.values()].filter(r=>r.targetUid===uid);},
 async readAuthorization(id){return rows.get(id)||null;},
 async reserveAuthorization({authorizationId,targetUid,nowMs}){const r=rows.get(authorizationId);if(!r||r.targetUid!==targetUid||r.status!=="PENDING"||r.expiresAtMs<=nowMs)throw Object.assign(new Error("denied"),{code:"RECOVERY_AUTH_DENIED"});r.status="STARTING";return{...r};},
 async markStarted({authorizationId,sessionId,startedAtMs}){const r=rows.get(authorizationId);r.status="STARTED";r.sessionId=sessionId;r.startedAtMs=startedAtMs;return{...r};},
 async markCompleted({authorizationId,completedAtMs}){const r=rows.get(authorizationId);r.status="COMPLETED";r.completedAtMs=completedAtMs;return{...r};},
 async markFailed({authorizationId}){const r=rows.get(authorizationId);if(r)r.status="FAILED";return r;},
 async revokeAuthorization({authorizationId,revokedAtMs,revokedByUid}){const r=rows.get(authorizationId);if(!r||!["PENDING","STARTED"].includes(r.status))throw new Error("not revocable");r.status="REVOKED";r.revokedAtMs=revokedAtMs;r.revokedByUid=revokedByUid;return{...r};}
};
const recoveryCore={async startE2EERecoveryV1({authUid}){return{sessionId:`s-${authUid}-${++seq}`,expiresAtMs:now+600000,status:"PENDING"};},async completeE2EERecoveryV1({authUid,data}){assert.equal(data.pin,"123456");return{recoveryUnlockKey:"A".repeat(43),keyId:`k-${authUid}`,identityRevision:2};}};
const core=createAdminRecoveryAuthorizationCore({profileRepo:{readProfile:async uid=>profiles.get(uid)||null},authorizationRepo,recoveryCore,now:()=>now,newToken:()=>`t_${"x".repeat(42)}${++seq}`});
const created=await core.createAdminRecoveryAuthorizationV1({authUid:"admin",data:{targetUid:"user"}});assert.equal(created.status,"PENDING");assert.equal(created.expiresAtMs-created.createdAtMs,1800000);
await assert.rejects(()=>core.startAdminAuthorizedRecoveryV1({authUid:"user2",data:{token:created.token}}));
const started=await core.startAdminAuthorizedRecoveryV1({authUid:"user",data:{token:created.token}});const done=await core.completeAdminAuthorizedRecoveryV1({authUid:"user",data:{authorizationId:created.authorizationId,sessionId:started.sessionId,pin:"123456"}});assert.equal(done.keyId,"k-user");assert.equal(rows.get(created.authorizationId).status,"COMPLETED");
await assert.rejects(()=>core.createAdminRecoveryAuthorizationV1({authUid:"user",data:{targetUid:"user2"}}));await assert.rejects(()=>core.createAdminRecoveryAuthorizationV1({authUid:"admin",data:{targetUid:"owner"}}));await assert.rejects(()=>core.createAdminRecoveryAuthorizationV1({authUid:"admin",data:{targetUid:"off"}}));
const ownerAuth=await core.createAdminRecoveryAuthorizationV1({authUid:"owner",data:{targetUid:"admin"}});assert.equal(ownerAuth.targetUid,"admin");const revoked=await core.revokeAdminRecoveryAuthorizationV1({authUid:"owner",data:{authorizationId:ownerAuth.authorizationId}});assert.equal(revoked.status,"REVOKED");
const exp=await core.createAdminRecoveryAuthorizationV1({authUid:"admin",data:{targetUid:"user2"}});now+=31*60*1000;const listed=await core.listAdminRecoveryAuthorizationsV1({authUid:"admin",data:{targetUid:"user2"}});assert.equal(listed.authorizations.find(x=>x.authorizationId===exp.authorizationId).status,"EXPIRED");
console.log("Admin-authorized recovery tests pass");
