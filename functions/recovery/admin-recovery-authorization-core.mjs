import {createHash,randomBytes} from "node:crypto";

export const ADMIN_RECOVERY_AUTH_V1=Object.freeze({version:1,lifetimeMs:30*60*1000,statuses:Object.freeze(["PENDING","STARTED","COMPLETED","REVOKED","FAILED"])});

function fail(code,message,cause){const error=new Error(message);error.code=code;if(cause)error.cause=cause;return error;}
function text(value,name){const v=String(value??"").trim();if(!v)throw fail("INVALID_INPUT",`${name} is required.`);return v;}
function roleOf(profile){return String(profile?.systemRole||"user");}
function activeProfile(profile){return !!profile&&profile.active!==false&&!['suspended','deactivated'].includes(String(profile.status||"active"));}
function tokenHash(token){const clean=text(token,"recovery token");if(!/^[A-Za-z0-9_-]{32,128}$/.test(clean))throw fail("RECOVERY_AUTH_DENIED","Recovery authorization failed.");return createHash("sha256").update(clean).digest("hex");}
function canAuthorize(callerUid,caller,targetUid,target){const callerRole=roleOf(caller),targetRole=roleOf(target);if(!["owner","admin"].includes(callerRole))return false;if(callerUid===targetUid||targetRole==="owner")return false;if(targetRole==="admin"&&callerRole!=="owner")return false;return activeProfile(target);}
function publicRow(row,nowMs){const expired=row.status==="PENDING"&&Number(row.expiresAtMs||0)<=nowMs;return{authorizationId:row.authorizationId,targetUid:row.targetUid,initiatedByUid:row.initiatedByUid,initiatedByRole:row.initiatedByRole,status:expired?"EXPIRED":row.status,createdAtMs:row.createdAtMs,expiresAtMs:row.expiresAtMs,startedAtMs:row.startedAtMs||null,completedAtMs:row.completedAtMs||null,revokedAtMs:row.revokedAtMs||null};}

export function createAdminRecoveryAuthorizationCore({profileRepo,authorizationRepo,recoveryCore,now=()=>Date.now(),newToken=()=>randomBytes(32).toString("base64url")}={}){
  for(const [label,repo,names] of [
    ["profileRepo",profileRepo,["readProfile"]],
    ["authorizationRepo",authorizationRepo,["createAuthorization","listForTarget","readAuthorization","reserveAuthorization","markStarted","markCompleted","markFailed","revokeAuthorization"]]
  ])for(const name of names)if(typeof repo?.[name]!=="function")throw new Error(`Missing ${label} method: ${name}`);
  if(typeof recoveryCore?.startE2EERecoveryV1!=="function"||typeof recoveryCore?.completeE2EERecoveryV1!=="function")throw new Error("Existing recovery core is required.");

  async function createAdminRecoveryAuthorizationV1({authUid,data}){
    const callerUid=text(authUid,"authUid"),targetUid=text(data?.targetUid,"targetUid");
    const [caller,target]=await Promise.all([profileRepo.readProfile(callerUid),profileRepo.readProfile(targetUid)]);
    if(!canAuthorize(callerUid,caller,targetUid,target))throw fail("RECOVERY_ADMIN_DENIED","Account recovery cannot be authorized by this account.");
    const rawToken=newToken(),authorizationId=tokenHash(rawToken),createdAtMs=now(),expiresAtMs=createdAtMs+ADMIN_RECOVERY_AUTH_V1.lifetimeMs;
    const row={authorizationVersion:1,authorizationId,targetUid,initiatedByUid:callerUid,initiatedByRole:roleOf(caller),status:"PENDING",createdAtMs,expiresAtMs,startedAtMs:null,completedAtMs:null,revokedAtMs:null,sessionId:null};
    await authorizationRepo.createAuthorization(row);
    return{...publicRow(row,createdAtMs),token:rawToken,targetEmail:String(target?.email||""),targetDisplayName:String(target?.displayName||target?.email||"FIDUNIO user")};
  }

  async function listAdminRecoveryAuthorizationsV1({authUid,data}){
    const callerUid=text(authUid,"authUid"),targetUid=text(data?.targetUid,"targetUid");
    const [caller,target]=await Promise.all([profileRepo.readProfile(callerUid),profileRepo.readProfile(targetUid)]);
    if(!canAuthorize(callerUid,caller,targetUid,target))throw fail("RECOVERY_ADMIN_DENIED","Recovery records are not available to this account.");
    const rows=await authorizationRepo.listForTarget(targetUid);
    return{authorizations:rows.map(row=>publicRow(row,now())).sort((a,b)=>b.createdAtMs-a.createdAtMs).slice(0,10)};
  }

  async function revokeAdminRecoveryAuthorizationV1({authUid,data}){
    const callerUid=text(authUid,"authUid"),authorizationId=text(data?.authorizationId,"authorizationId"),row=await authorizationRepo.readAuthorization(authorizationId);
    if(!row)throw fail("RECOVERY_AUTH_DENIED","Recovery authorization failed.");
    const [caller,target]=await Promise.all([profileRepo.readProfile(callerUid),profileRepo.readProfile(row.targetUid)]);
    const callerRole=roleOf(caller),allowed=canAuthorize(callerUid,caller,row.targetUid,target)&&(callerUid===row.initiatedByUid||callerRole==="owner");
    if(!allowed)throw fail("RECOVERY_ADMIN_DENIED","Recovery authorization cannot be revoked by this account.");
    const updated=await authorizationRepo.revokeAuthorization({authorizationId,revokedAtMs:now(),revokedByUid:callerUid});
    return publicRow(updated,now());
  }

  async function startAdminAuthorizedRecoveryV1({authUid,appCheckValid,data}){
    const uid=text(authUid,"authUid"),hash=tokenHash(data?.token),startedAtMs=now();
    const reserved=await authorizationRepo.reserveAuthorization({authorizationId:hash,targetUid:uid,nowMs:startedAtMs});
    try{
      const session=await recoveryCore.startE2EERecoveryV1({authUid:uid,appCheckValid,data:{}});
      await authorizationRepo.markStarted({authorizationId:hash,sessionId:session.sessionId,startedAtMs});
      return{authorizationId:hash,...session};
    }catch(error){await authorizationRepo.markFailed({authorizationId:hash,failedAtMs:now()}).catch(()=>{});throw error;}
  }

  async function completeAdminAuthorizedRecoveryV1({authUid,appCheckValid,data}){
    const uid=text(authUid,"authUid"),authorizationId=text(data?.authorizationId,"authorizationId"),sessionId=text(data?.sessionId,"sessionId"),row=await authorizationRepo.readAuthorization(authorizationId);
    if(!row||row.targetUid!==uid||row.status!=="STARTED"||row.sessionId!==sessionId)throw fail("RECOVERY_AUTH_DENIED","Recovery authorization failed.");
    const result=await recoveryCore.completeE2EERecoveryV1({authUid:uid,appCheckValid,data:{sessionId,pin:data?.pin}});
    await authorizationRepo.markCompleted({authorizationId,sessionId,completedAtMs:now()});
    return result;
  }

  return Object.freeze({createAdminRecoveryAuthorizationV1,listAdminRecoveryAuthorizationsV1,revokeAdminRecoveryAuthorizationV1,startAdminAuthorizedRecoveryV1,completeAdminAuthorizedRecoveryV1});
}
