/* FIDUNIO local security helpers.
 * This module deliberately does NOT own an app lock state or render an overlay.
 * app.js state.unlocked remains the single authoritative LOCKED/UNLOCKED state.
 */
const CONFIG_KEY="fidunio-local-security-v1";
const AUTH_BYPASS_KEY="fidunio-auth-bypass-once";
const DEFAULT_TIMEOUT_MS=5*60*1000;
const PBKDF2_ITERATIONS=210000;

export const LOCK_TIMEOUTS=Object.freeze([
  {value:0,label:"Immediately"},
  {value:60*1000,label:"1 min"},
  {value:5*60*1000,label:"5 min"},
  {value:15*60*1000,label:"15 min"},
  {value:30*60*1000,label:"30 min"},
  {value:60*60*1000,label:"1 hr"},
  {value:-1,label:"Never"}
]);

function bytesToB64Url(bytes){
  let raw="";
  bytes.forEach(b=>raw+=String.fromCharCode(b));
  return btoa(raw).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
function b64UrlToBytes(value){
  const padded=String(value).replace(/-/g,"+").replace(/_/g,"/")+"===".slice((String(value).length+3)%4);
  const raw=atob(padded);
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
function randomBytes(length=32){
  return crypto.getRandomValues(new Uint8Array(length));
}
function loadConfig(){
  try{
    const parsed=JSON.parse(localStorage.getItem(CONFIG_KEY)||"{}");
    return {
      pin:parsed?.pin||null,
      timeoutMs:Number.isFinite(parsed?.timeoutMs)?parsed.timeoutMs:DEFAULT_TIMEOUT_MS,
      biometric:parsed?.biometric||null
    };
  }catch{
    return {pin:null,timeoutMs:DEFAULT_TIMEOUT_MS,biometric:null};
  }
}
function saveConfig(config){
  localStorage.setItem(CONFIG_KEY,JSON.stringify(config));
}
export function getLocalSecurityStatus(){
  const cfg=loadConfig();
  return {
    hasPin:!!cfg.pin,
    hasBiometric:!!cfg.biometric?.credentialId,
    timeoutMs:cfg.timeoutMs
  };
}
export function getLockTimeoutMs(){return loadConfig().timeoutMs;}
export function setLockTimeoutMs(value){
  const allowed=new Set(LOCK_TIMEOUTS.map(x=>x.value));
  const timeoutMs=Number(value);
  if(!allowed.has(timeoutMs)) throw new Error("Unsupported inactivity timeout.");
  const cfg=loadConfig();
  cfg.timeoutMs=timeoutMs;
  saveConfig(cfg);
  activityAt=Date.now();
  scheduleIdleCheck();
}

async function derivePin(pin,salt,iterations=PBKDF2_ITERATIONS){
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(pin),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt,iterations},key,256);
  return new Uint8Array(bits);
}
function validPin(pin){return /^\d{4,12}$/.test(String(pin||""));}
function equalBytes(a,b){
  if(a.length!==b.length)return false;
  let diff=0;
  for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
  return diff===0;
}
export async function setLocalPin(pin){
  pin=String(pin||"");
  if(!validPin(pin))throw new Error("PIN must contain 4 to 12 digits.");
  const salt=randomBytes(16);
  const hash=await derivePin(pin,salt);
  const cfg=loadConfig();
  cfg.pin={salt:bytesToB64Url(salt),hash:bytesToB64Url(hash),iterations:PBKDF2_ITERATIONS};
  saveConfig(cfg);
}
export async function verifyLocalPin(pin){
  const cfg=loadConfig();
  if(!cfg.pin||!validPin(pin))return false;
  try{
    const salt=b64UrlToBytes(cfg.pin.salt);
    const expected=b64UrlToBytes(cfg.pin.hash);
    const actual=await derivePin(String(pin),salt,Number(cfg.pin.iterations)||PBKDF2_ITERATIONS);
    return equalBytes(actual,expected);
  }catch{return false;}
}
export async function changeLocalPin(currentPin,newPin){
  if(!await verifyLocalPin(currentPin))throw new Error("Current PIN is incorrect.");
  await setLocalPin(newPin);
}
export async function removeLocalPin(currentPin){
  if(!await verifyLocalPin(currentPin))throw new Error("Current PIN is incorrect.");
  const cfg=loadConfig();
  cfg.pin=null;
  cfg.biometric=null;
  saveConfig(cfg);
}

export async function platformAuthenticatorAvailable(){
  try{
    return !!(window.isSecureContext&&window.PublicKeyCredential&&navigator.credentials&&
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
  }catch{return false;}
}
export async function enrollBiometric(){
  const cfg=loadConfig();
  if(!cfg.pin)throw new Error("Set a local PIN before enabling device unlock.");
  if(!await platformAuthenticatorAvailable())throw new Error("Device biometric/passkey unlock is not available in this browser.");
  const userId=cfg.biometric?.userId?b64UrlToBytes(cfg.biometric.userId):randomBytes(32);
  const credential=await navigator.credentials.create({publicKey:{
    challenge:randomBytes(32),
    rp:{name:"FIDUNIO"},
    user:{id:userId,name:"fidunio-local",displayName:"FIDUNIO local unlock"},
    pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],
    authenticatorSelection:{authenticatorAttachment:"platform",residentKey:"preferred",userVerification:"required"},
    timeout:60000,
    attestation:"none"
  }});
  if(!credential?.rawId)throw new Error("Device unlock enrollment was not completed.");
  cfg.biometric={credentialId:bytesToB64Url(new Uint8Array(credential.rawId)),userId:bytesToB64Url(userId)};
  saveConfig(cfg);
}
export async function verifyBiometric(){
  const cfg=loadConfig();
  if(!cfg.biometric?.credentialId)return false;
  if(!await platformAuthenticatorAvailable())return false;
  try{
    const assertion=await navigator.credentials.get({publicKey:{
      challenge:randomBytes(32),
      allowCredentials:[{type:"public-key",id:b64UrlToBytes(cfg.biometric.credentialId),transports:["internal"]}],
      userVerification:"required",
      timeout:60000
    }});
    return !!assertion;
  }catch{return false;}
}
export function disableBiometric(){
  const cfg=loadConfig();
  cfg.biometric=null;
  saveConfig(cfg);
}

export function markSuccessfulAuthBypass(){
  try{sessionStorage.setItem(AUTH_BYPASS_KEY,"1");}catch{}
}
export function consumeSuccessfulAuthBypass(){
  try{
    const yes=sessionStorage.getItem(AUTH_BYPASS_KEY)==="1";
    sessionStorage.removeItem(AUTH_BYPASS_KEY);
    return yes;
  }catch{return false;}
}

let monitor=null;
let activityAt=Date.now();
let hiddenAt=null;
let idleTimer=null;
function scheduleIdleCheck(){
  clearTimeout(idleTimer);
  if(!monitor||!monitor.isUnlocked())return;
  const timeout=getLockTimeoutMs();
  if(timeout<0||timeout===0)return;
  const remaining=Math.max(0,timeout-(Date.now()-activityAt));
  idleTimer=setTimeout(()=>{
    if(!monitor||!monitor.isUnlocked())return;
    if(Date.now()-activityAt>=getLockTimeoutMs())monitor.onLock("inactivity");
    else scheduleIdleCheck();
  },Math.min(remaining+25,2147483000));
}
function noteActivity(){
  if(!monitor?.isUnlocked())return;
  activityAt=Date.now();
  scheduleIdleCheck();
}
export function noteLocalUnlock(){
  activityAt=Date.now();
  hiddenAt=null;
  scheduleIdleCheck();
}
export function installInactivityMonitor({isUnlocked,onLock}){
  if(monitor)return;
  monitor={isUnlocked,onLock};
  const activityEvents=["pointerdown","keydown","touchstart"];
  activityEvents.forEach(name=>window.addEventListener(name,noteActivity,{passive:true}));
  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="hidden"){
      hiddenAt=Date.now();
      if(isUnlocked()&&getLockTimeoutMs()===0)onLock("background");
      return;
    }
    if(!isUnlocked())return;
    const timeout=getLockTimeoutMs();
    if(timeout>=0&&hiddenAt!=null&&Date.now()-hiddenAt>=timeout){onLock("background");return;}
    activityAt=Date.now();
    hiddenAt=null;
    scheduleIdleCheck();
  });
  window.addEventListener("pageshow",()=>{
    if(!isUnlocked())return;
    const timeout=getLockTimeoutMs();
    if(timeout>=0&&hiddenAt!=null&&Date.now()-hiddenAt>=timeout){onLock("background");return;}
    scheduleIdleCheck();
  });
  scheduleIdleCheck();
}
