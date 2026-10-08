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
  async function activate(uid){
    if(!preferred(uid))return{activated:false,reason:"not-enabled"};
    const token=String(await getToken()||"");
    if(token.length<20)throw new Error("Notification token unavailable.");
    const result=await claim({installationId:getInstallationId(),fcmToken:token,platform:getPlatform()});
    return{activated:true,result};
  }
  async function logout(uid){
    if(!preferred(uid))return{revoked:false,reason:"not-enabled"};
    let token="";
    try{token=String(await Promise.race([Promise.resolve().then(getToken),new Promise((_,reject)=>setTimeout(()=>reject(new Error("token timeout")),timeoutMs))])||"");}
    catch{return{revoked:false,reason:"offline-or-timeout"};}
    if(token.length<20)return{revoked:false,reason:"missing-token"};
    try{
      const result=await Promise.race([
        Promise.resolve().then(()=>revoke({installationId:getInstallationId(),fcmToken:token})),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error("revoke timeout")),timeoutMs))
      ]);
      return{revoked:true,result};
    }catch{return{revoked:false,reason:"offline-or-timeout"};}
  }
  return Object.freeze({preferred,setPreference,activate,logout});
}
