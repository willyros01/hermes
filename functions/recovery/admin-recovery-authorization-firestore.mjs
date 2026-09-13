function fail(code,message){const error=new Error(message);error.code=code;return error;}
function text(value,name){const v=String(value??"").trim();if(!v)throw fail("INVALID_INPUT",`${name} is required.`);return v;}
function dataOf(snap){return snap?.exists?snap.data():null;}

export function createAdminRecoveryAuthorizationFirestoreRepository({db}={}){
  if(!db||typeof db.doc!=="function"||typeof db.runTransaction!=="function")throw new Error("Admin Firestore database is required.");
  const ref=id=>db.doc(`accountRecoveryAuthorizations/${text(id,"authorizationId")}`);
  const profileRepo=Object.freeze({async readProfile(uid){const snap=await db.doc(`users/${text(uid,"uid")}`).get();return dataOf(snap);}});
  const authorizationRepo=Object.freeze({
    async createAuthorization(row){return db.runTransaction(async tx=>{const r=ref(row?.authorizationId),snap=await tx.get(r);if(snap.exists)throw fail("RECOVERY_AUTH_CONFLICT","Recovery authorization already exists.");tx.set(r,{...row});return row;});},
    async listForTarget(targetUid){const snap=await db.collection("accountRecoveryAuthorizations").where("targetUid","==",text(targetUid,"targetUid")).limit(25).get();return snap.docs.map(d=>({authorizationId:d.id,...d.data()}));},
    async readAuthorization(authorizationId){return dataOf(await ref(authorizationId).get());},
    async reserveAuthorization({authorizationId,targetUid,nowMs}){return db.runTransaction(async tx=>{const r=ref(authorizationId),snap=await tx.get(r),row=dataOf(snap);if(!row||row.targetUid!==text(targetUid,"targetUid")||row.status!=="PENDING"||Number(row.expiresAtMs||0)<=Number(nowMs))throw fail("RECOVERY_AUTH_DENIED","Recovery authorization failed.");tx.update(r,{status:"STARTING",reservedAtMs:Number(nowMs)});return{...row,status:"STARTING",reservedAtMs:Number(nowMs)};});},
    async markStarted({authorizationId,sessionId,startedAtMs}){return db.runTransaction(async tx=>{const r=ref(authorizationId),snap=await tx.get(r),row=dataOf(snap);if(!row||row.status!=="STARTING")throw fail("RECOVERY_AUTH_CONFLICT","Recovery authorization is not reserved.");tx.update(r,{status:"STARTED",sessionId:text(sessionId,"sessionId"),startedAtMs:Number(startedAtMs)});return{...row,status:"STARTED",sessionId,startedAtMs:Number(startedAtMs)};});},
    async markCompleted({authorizationId,sessionId,completedAtMs}){return db.runTransaction(async tx=>{const r=ref(authorizationId),snap=await tx.get(r),row=dataOf(snap);if(!row||row.status!=="STARTED"||row.sessionId!==text(sessionId,"sessionId"))throw fail("RECOVERY_AUTH_CONFLICT","Recovery authorization session changed.");tx.update(r,{status:"COMPLETED",completedAtMs:Number(completedAtMs)});return{...row,status:"COMPLETED",completedAtMs:Number(completedAtMs)};});},
    async markFailed({authorizationId,failedAtMs}){const r=ref(authorizationId),snap=await r.get(),row=dataOf(snap);if(!row||row.status!=="STARTING")return row;await r.update({status:"FAILED",failedAtMs:Number(failedAtMs)});return{...row,status:"FAILED",failedAtMs:Number(failedAtMs)};},
    async revokeAuthorization({authorizationId,revokedAtMs,revokedByUid}){return db.runTransaction(async tx=>{const r=ref(authorizationId),snap=await tx.get(r),row=dataOf(snap);if(!row||!["PENDING","STARTED"].includes(row.status))throw fail("RECOVERY_AUTH_DENIED","Recovery authorization is no longer revocable.");tx.update(r,{status:"REVOKED",revokedAtMs:Number(revokedAtMs),revokedByUid:text(revokedByUid,"revokedByUid")});return{...row,status:"REVOKED",revokedAtMs:Number(revokedAtMs),revokedByUid};});}
  });
  return Object.freeze({profileRepo,authorizationRepo});
}
