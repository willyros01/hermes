// Amazon Device Messaging sender for FIDUNIO's authenticated, leased Fire installations.
// Backend-only. Never embed OAuth credentials in the Android APK.
const OAUTH_URL="https://api.amazon.com/auth/O2/token";
const SEND_URL="https://api.amazon.com/messaging/registrations/";
const MAX_TOKEN_LENGTH=4096;

function assertToken(value){
  const token=String(value||"").trim();
  if(token.length<20||token.length>MAX_TOKEN_LENGTH)throw new Error("Invalid ADM token.");
  return token;
}
function assertData(value){
  if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Invalid ADM payload.");
  if(!["direct-message","group-message"].includes(value.type))throw new Error("Invalid ADM notification type.");
  for(const name of ["conversationId","messageId"]){
    if(!/^[A-Za-z0-9_.-]{1,256}$/.test(String(value[name]||"")))throw new Error("Invalid ADM "+name);
  }
  const body=String(value.notificationBody||"");
  if(body!=="New message"&&!(body.startsWith("New message from ")&&body.length<=97))
    throw new Error("ADM payload must use the approved private notification body.");
  return {type:value.type,conversationId:String(value.conversationId),
    messageId:String(value.messageId),notificationBody:body};
}
export function createAmazonADMDelivery({getCredentials,fetcher=globalThis.fetch,
  now=()=>Date.now()}={}){
  if(typeof getCredentials!=="function"||typeof fetcher!=="function")
    throw new Error("ADM credential source and HTTP transport are required.");
  let cachedToken="",expiresAt=0;
  async function accessToken(){
    if(cachedToken&&now()<expiresAt-60000)return cachedToken;
    const {clientId,clientSecret}=getCredentials()||{};
    if(typeof clientId!=="string"||clientId.length<10||
       typeof clientSecret!=="string"||clientSecret.length<10)
      throw new Error("FIDUNIO ADM server OAuth credentials are not installed.");
    const params=new URLSearchParams({grant_type:"client_credentials",scope:"messaging:push",
      client_id:clientId,client_secret:clientSecret});
    const r=await fetcher(OAUTH_URL,{method:"POST",
      headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
      body:params.toString(),signal:AbortSignal.timeout(12000)});
    if(!r.ok)throw new Error("ADM OAuth refused (HTTP "+r.status+").");
    const json=await r.json();
    if(json.token_type?.toLowerCase()!=="bearer"||typeof json.access_token!=="string"
       ||json.access_token.length<10)throw new Error("ADM OAuth returned invalid credentials.");
    const expires=Number(json.expires_in||0);
    if(!Number.isFinite(expires)||expires<120)throw new Error("ADM OAuth expiration invalid.");
    cachedToken=json.access_token;
    expiresAt=now()+expires*1000;
    return cachedToken;
  }
  async function send({token,data}={}){
    const registration=assertToken(token);
    const payload=assertData(data);
    const bearer=await accessToken();
    const res=await fetcher(SEND_URL+encodeURIComponent(registration)+"/messages",{
      method:"POST",
      headers:{Authorization:"Bearer "+bearer,"Content-Type":"application/json",
        Accept:"application/json","X-Amzn-Type-Version":"com.amazon.device.messaging.ADMMessage@1.0",
        "X-Amzn-Accept-Type":"com.amazon.device.messaging.ADMSendResult@1.0"},
      body:JSON.stringify({data:payload,expiresAfter:1800,priority:"normal"}),
      signal:AbortSignal.timeout(12000)
    });
    if(res.ok)return {success:true,invalid:false};
    const response=await res.json().catch(()=>({}));
    return {success:false,invalid:res.status===400&&response.reason==="Unregistered",
      status:res.status};
  }
  return Object.freeze({send});
}
