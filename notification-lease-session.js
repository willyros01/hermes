// Shared notification lease session orchestration (iOS device-acceptance rollout).
// Firebase SDK and native push capabilities are injected, never initialized here.
export const FIDUNIO_NOTIFICATION_LEASE_ROLLOUT=true;
export const NOTIFICATION_LOGOUT_BOUND_MS=5000;
const preferenceKey=uid=>"fidunio.notification.preference.v2."+uid;
export function createNotificationLeaseSession({storage,getInstallationId,getToken,claim,revoke,getPlatform,timeoutMs=NOTIFICATION_LOGOUT_BOUND_MS}={}){
  for(const [name,fn] of Object.entries({getInstallationId,getToken,claim,revoke,getPlatform}))if(typeof fn!=="function")throw new Error("Notification lease dependency missing: "+name);
  const prefs=storage;
  if(!prefs?.getItem||!prefs?.setItem)throw new Error("Persistent preferences required.");
  const preferred=uid=>prefs.getItem(preferenceKey(uid))==="on";
  const setPreference=(uid,enabled)=>prefs.setItem(preferenceKey(uid),enabled?"on":"off");
  const leaseKey="fidunio.notification.active-lease.v2."+getInstallationId();
  function readLease(){try{const row=JSON.parse(prefs.getItem(leaseKey)||"null");return row&&typeof row.leaseId==="string"&&typeof row.fcmToken==="string"&&typeof row.uid==="string"?row:null;}catch{return null;}}
  function saveLease(row){if(row)prefs.setItem(leaseKey,JSON.stringify(row));else prefs.removeItem?.(leaseKey);}
  let activeLease=readLease(),tail=Promise.resolve();
  function serialize(fn){const next=tail.then(fn);tail=next.catch(()=>{});return next;}
  function activate(uid){
    return serialize(async()=>{
    if(!preferred(uid))return{activated:false,reason:"not-enabled"};
    const token=String(await getToken()||"");
    if(token.length<20)throw new Error("Notification token unavailable.");
    const installationId=getInstallationId();
    const result=await claim({installationId,fcmToken:token,platform:getPlatform()});
    if(typeof result?.leaseId!=="string"||!result.leaseId)throw new Error("Notification lease identity missing.");
    activeLease={uid,installationId,fcmToken:token,leaseId:result.leaseId};
    saveLease(activeLease);
    return{activated:true,result};
    });
  }
  function logout(uid){
    return serialize(async()=>{
    const lease=activeLease?.uid===uid?activeLease:null;
    if(!lease)return{revoked:false,reason:"no-current-lease"};
    try{
      const result=await Promise.race([
        Promise.resolve().then(()=>revoke({installationId:lease.installationId,fcmToken:lease.fcmToken,leaseId:lease.leaseId})),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error("revoke timeout")),timeoutMs))
      ]);
      if(result?.revoked===true){activeLease=null;saveLease(null);return{revoked:true,result};}
      return{revoked:false,reason:"unconfirmed",result};
    }catch{return{revoked:false,reason:"offline-or-timeout"};}
    });
  }
  return Object.freeze({preferred,setPreference,activate,logout});
}
