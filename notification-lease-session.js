// Shared notification lease session orchestration (v2 staged rollout).
// Firebase SDK and native push capabilities are injected, never initialized here.
export const FIDUNIO_NOTIFICATION_LEASE_ROLLOUT=false;
export const NOTIFICATION_LOGOUT_BOUND_MS=5000;
const preferenceKey=uid=>"fidunio.notification.preference.v2."+uid;
export function createNotificationLeaseSession({storage,getInstallationId,getToken,claim,revoke,getPlatform,timeoutMs=NOTIFICATION_LOGOUT_BOUND_MS}={}){
  for(const [name,fn] of Object.entries({getInstallationId,getToken,claim,revoke,getPlatform}))if(typeof fn!=="function")throw new Error("Notification lease dependency missing: "+name);
  const prefs=storage;
  if(!prefs?.getItem||!prefs?.setItem)throw new Error("Persistent preferences required.");
  const preferred=uid=>prefs.getItem(preferenceKey(uid))==="on";
  const setPreference=(uid,enabled)=>prefs.setItem(preferenceKey(uid),enabled?"on":"off");
  let epoch=0,activeLease=null;
  async function activate(uid){
    if(!preferred(uid))return{activated:false,reason:"not-enabled"};
    const requestEpoch=++epoch;
    const token=String(await getToken()||"");
    if(token.length<20)throw new Error("Notification token unavailable.");
    const installationId=getInstallationId();
    const result=await claim({installationId,fcmToken:token,platform:getPlatform()});
    if(typeof result?.leaseId!=="string"||!result.leaseId)throw new Error("Notification lease identity missing.");
    if(requestEpoch!==epoch){
      void Promise.resolve().then(()=>revoke({installationId,fcmToken:token,leaseId:result.leaseId})).catch(()=>{});
      return{activated:false,reason:"superseded"};
    }
    activeLease={uid,installationId,fcmToken:token,leaseId:result.leaseId};
    return{activated:true,result};
  }
  async function logout(uid){
    ++epoch;
    const lease=activeLease?.uid===uid?activeLease:null;
    activeLease=null;
    if(!lease)return{revoked:false,reason:"no-current-lease"};
    try{
      const result=await Promise.race([
        Promise.resolve().then(()=>revoke({installationId:lease.installationId,fcmToken:lease.fcmToken,leaseId:lease.leaseId})),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error("revoke timeout")),timeoutMs))
      ]);
      return{revoked:result?.revoked===true,result};
    }catch{return{revoked:false,reason:"offline-or-timeout"};}
  }
  return Object.freeze({preferred,setPreference,activate,logout});
}
