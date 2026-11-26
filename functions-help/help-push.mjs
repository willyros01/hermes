/* FIDUNIO HELP push delivery: Firebase Cloud Messaging for iPhone, Android and
 * web; Amazon Device Messaging for Fire tablets. The notification says only
 * "HELP from <name>" — never the message, location or Wi-Fi name. */
const ADM_OAUTH="https://api.amazon.com/auth/O2/token";
const ADM_SEND="https://api.amazon.com/messaging/registrations/";
const BODY=/^(TEST — )?(HELP — .{1,80}|HELP from .{1,80}( \(reminder [1-5]\))?|.{1,80} is coming|.{1,80} is (safe|OK) now|.{1,80}: sorry, it was a mistake)$/;

export function helpFcmMessage(tokens,data){
  if(!BODY.test(String(data?.notificationBody||"")))throw new Error("Unapproved HELP notification body.");
  const urgent=data.kind==="alert";
  return{
    tokens,
    data:{type:"help-alert",alertId:String(data.alertId),kind:String(data.kind),notificationBody:String(data.notificationBody)},
    /* HELP alarm (owner, 25 Nov): the alert rings with the app's own alarm sound; updates stay ordinary. */
    android:{priority:"high",notification:{title:"FIDUNIO HELP",body:data.notificationBody,channelId:urgent?"fidunio-help-alarm":"fidunio-help-update",sound:urgent?"help_alarm":"default",tag:"help-"+data.alertId}},
    webpush:{headers:{Urgency:"high"}},
    apns:{headers:{"apns-priority":"10"},payload:{aps:{alert:{title:"FIDUNIO HELP",body:data.notificationBody},sound:urgent?"help_alarm.caf":"default",
      "interruption-level":urgent?"time-sensitive":"active","relevance-score":urgent?1:0.5,"thread-id":"help-"+data.alertId}}}
  };
}

export function createHelpPush({messaging,getAdmCredentials,fetcher=globalThis.fetch,logger=console}={}){
  if(typeof messaging?.sendEachForMulticast!=="function")throw new Error("Firebase Messaging is required.");
  let admToken="",admExpires=0;
  async function admBearer(){
    if(admToken&&Date.now()<admExpires-60000)return admToken;
    const {clientId,clientSecret}=getAdmCredentials?.()||{};
    if(!clientId||!clientSecret)throw new Error("ADM credentials missing.");
    const r=await fetcher(ADM_OAUTH,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
      body:new URLSearchParams({grant_type:"client_credentials",scope:"messaging:push",client_id:clientId,client_secret:clientSecret}).toString(),signal:AbortSignal.timeout(12000)});
    if(!r.ok)throw new Error("ADM OAuth refused "+r.status);
    const j=await r.json();admToken=String(j.access_token||"");admExpires=Date.now()+Number(j.expires_in||0)*1000;
    if(admToken.length<10)throw new Error("ADM OAuth invalid");
    return admToken;
  }
  async function sendToDevices({uid,devices,data}){
    let sent=0,failed=0;
    const fcm=devices.filter(d=>d.platform!=="android-adm").map(d=>d.fcmToken);
    const adm=devices.filter(d=>d.platform==="android-adm").map(d=>d.fcmToken);
    if(fcm.length){
      const r=await messaging.sendEachForMulticast(helpFcmMessage(fcm,data));
      sent+=Number(r?.successCount||0);failed+=Number(r?.failureCount||0);
    }
    for(const token of adm){
      try{
        const res=await fetcher(ADM_SEND+encodeURIComponent(token)+"/messages",{method:"POST",
          headers:{Authorization:"Bearer "+await admBearer(),"Content-Type":"application/json",Accept:"application/json",
            "X-Amzn-Type-Version":"com.amazon.device.messaging.ADMMessage@1.0","X-Amzn-Accept-Type":"com.amazon.device.messaging.ADMSendResult@1.0"},
          body:JSON.stringify({data:{type:"help-alert",alertId:String(data.alertId),kind:String(data.kind),notificationBody:String(data.notificationBody)},expiresAfter:3600,priority:"high"}),
          signal:AbortSignal.timeout(12000)});
        if(res.ok)sent++;else failed++;
      }catch(error){failed++;logger.warn?.("FIDUNIO HELP ADM send failed",{uid,error:String(error?.message||error)});}
    }
    return{sent,failed};
  }
  return Object.freeze({sendToDevices});
}
