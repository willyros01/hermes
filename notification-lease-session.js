// Shared notification lease session orchestration (iOS device-acceptance rollout).
// Firebase SDK and native push capabilities are injected, never initialized here.
// This module is the single client owner of this installation's retained notification lease.
export const FIDUNIO_NOTIFICATION_LEASE_ROLLOUT=true;
// Bound for ONE revoke attempt. A logout makes at most NOTIFICATION_REVOKE_ATTEMPTS attempts with a
// short backoff between them, so the worst case is fixed and a revoke can never hang indefinitely.
export const NOTIFICATION_LOGOUT_BOUND_MS=5000;
export const NOTIFICATION_REVOKE_ATTEMPTS=3;
export const NOTIFICATION_REVOKE_BACKOFF_MS=400;
const preferenceKey=uid=>"fidunio.notification.preference.v2."+uid;
const defaultSleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function createNotificationLeaseSession({storage,getInstallationId,getToken,claim,revoke,getPlatform,timeoutMs=NOTIFICATION_LOGOUT_BOUND_MS,attempts=NOTIFICATION_REVOKE_ATTEMPTS,backoffMs=NOTIFICATION_REVOKE_BACKOFF_MS,sleep=defaultSleep}={}){
  for(const [name,fn] of Object.entries({getInstallationId,getToken,claim,revoke,getPlatform}))if(typeof fn!=="function")throw new Error("Notification lease dependency missing: "+name);
  if(!Number.isInteger(attempts)||attempts<1||attempts>5)throw new Error("Notification revoke attempts must be 1-5.");
  const prefs=storage;
  if(!prefs?.getItem||!prefs?.setItem)throw new Error("Persistent preferences required.");
  const preferred=uid=>prefs.getItem(preferenceKey(uid))==="on";
  const setPreference=(uid,enabled)=>prefs.setItem(preferenceKey(uid),enabled?"on":"off");
  const leaseKey="fidunio.notification.active-lease.v2."+getInstallationId();
  const senderNameKey="fidunio.notification.sender-name.v2."+getInstallationId();
  const showSenderName=()=>prefs.getItem(senderNameKey)==="on";
  const setShowSenderName=enabled=>prefs.setItem(senderNameKey,enabled?"on":"off");
  function readLease(){try{const row=JSON.parse(prefs.getItem(leaseKey)||"null");return row&&typeof row.leaseId==="string"&&typeof row.fcmToken==="string"&&typeof row.uid==="string"?row:null;}catch{return null;}}
  function saveLease(row){if(row)prefs.setItem(leaseKey,JSON.stringify(row));else prefs.removeItem?.(leaseKey);}
  let activeLease=readLease(),tail=Promise.resolve();
  function serialize(fn){const next=tail.then(fn);tail=next.catch(()=>{});return next;}
  // Bounded revoke of the exact retained lease. `stopped` is true only when the server has confirmed
  // that this lease can no longer deliver: either it revoked it, or it answered that the lease is no
  // longer the token owner (superseded by a later claim). Only then is the retained record cleared;
  // on timeout/offline it stays persisted so the next opportunity can finish the revocation.
  async function revokeRetained(lease){
    for(let attempt=1;attempt<=attempts;attempt++){
      let timer;
      try{
        const result=await Promise.race([
          Promise.resolve().then(()=>revoke({installationId:lease.installationId,fcmToken:lease.fcmToken,leaseId:lease.leaseId})),
          new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error("revoke timeout")),timeoutMs);})
        ]);
        activeLease=null;saveLease(null);
        if(result?.revoked===true)return{revoked:true,stopped:true,attempts:attempt,result};
        return{revoked:false,stopped:true,reason:"superseded",attempts:attempt,result};
      }catch{}
      finally{clearTimeout(timer);}
      if(attempt<attempts)await sleep(backoffMs*attempt);
    }
    return{revoked:false,stopped:false,reason:"offline-or-timeout",attempts};
  }
  function activate(uid){
    return serialize(async()=>{
    if(!preferred(uid)){
      // Notifications are off for this account. If an earlier turn-off or sign-out could not reach
      // the server, its lease is still retained here: finish revoking it now (bounded).
      if(activeLease?.uid===uid)return{activated:false,reason:"not-enabled",revocation:await revokeRetained(activeLease)};
      return{activated:false,reason:"not-enabled"};
    }
    const token=String(await getToken()||"");
    if(token.length<20)throw new Error("Notification token unavailable.");
    const installationId=getInstallationId();
    const result=await claim({installationId,fcmToken:token,platform:getPlatform(),showSenderName:showSenderName()});
    if(typeof result?.leaseId!=="string"||!result.leaseId)throw new Error("Notification lease identity missing.");
    activeLease={uid,installationId,fcmToken:token,leaseId:result.leaseId};
    saveLease(activeLease);
    return{activated:true,result};
    });
  }
  function logout(uid){
    return serialize(async()=>{
    const lease=activeLease?.uid===uid?activeLease:null;
    if(!lease)return{revoked:false,stopped:true,reason:"no-current-lease"};
    return revokeRetained(lease);
    });
  }
  const retainedLease=()=>activeLease?Object.freeze({...activeLease}):null;
  return Object.freeze({preferred,setPreference,showSenderName,setShowSenderName,activate,logout,retainedLease});
}
