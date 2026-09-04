/* FIDUNIO 0.9.4 local application lock.
 * Local PIN verifier uses PBKDF2-SHA-256; raw PIN is never stored.
 * Optional WebAuthn platform credential invokes device user verification
 * (Face ID / Touch ID / Windows Hello / Android device authentication where supported).
 * This is a local UI lock, separate from Firebase account authentication.
 */
const KEY="fidunio-local-lock-v1";
const DEFAULT_TIMEOUT=5*60*1000;
const ITERATIONS=210000;
let cfg=readCfg();
let lastActive=Date.now();
let backgroundAt=0;
let timer=null;
let suppressUntil=0;
let unlockBypass=false;
let biometricAvailable=false;

function readCfg(){try{return JSON.parse(localStorage.getItem(KEY)||"null")||{enabled:false,timeoutMs:DEFAULT_TIMEOUT,pin:null,credentialId:null};}catch{return{enabled:false,timeoutMs:DEFAULT_TIMEOUT,pin:null,credentialId:null};}}
function saveCfg(){localStorage.setItem(KEY,JSON.stringify(cfg));}
function b64(bytes){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);}
function unb64(s){const r=atob(s);return Uint8Array.from(r,c=>c.charCodeAt(0));}
function randomBytes(n){return crypto.getRandomValues(new Uint8Array(n));}
async function derive(pin,salt){const material=await crypto.subtle.importKey("raw",new TextEncoder().encode(pin),"PBKDF2",false,["deriveBits"]);const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt,iterations:ITERATIONS},material,256);return new Uint8Array(bits);}
async function makeVerifier(pin){const salt=randomBytes(16);return{salt:b64(salt),hash:b64(await derive(pin,salt))};}
async function verifyPin(pin){if(!cfg.pin)return false;const got=await derive(pin,unb64(cfg.pin.salt));const want=unb64(cfg.pin.hash);if(got.length!==want.length)return false;let diff=0;for(let i=0;i<got.length;i++)diff|=got[i]^want[i];return diff===0;}
function appVisible(){return !document.querySelector("#fidunioLocalLockOverlay")&&!document.querySelector(".app-shell.unlock");}
function timeoutLabel(ms){if(ms===null)return"Never";if(ms===0)return"Immediately";const m=Math.round(ms/60000);return m<60?`${m} min`:`${m/60} hr`;}
function options(){return[[0,"Immediately"],[60000,"1 min"],[300000,"5 min"],[900000,"15 min"],[1800000,"30 min"],[3600000,"1 hr"],[null,"Never"]];}
function settingsCard(){return[...document.querySelectorAll(".content.settings .card")].find(c=>c.querySelector("h2")?.textContent?.trim()==="Privacy & Access")||null;}

function schedule(){clearTimeout(timer);if(!cfg.enabled||!cfg.pin||cfg.timeoutMs===null||!appVisible())return;const remain=Math.max(0,cfg.timeoutMs-(Date.now()-lastActive));timer=setTimeout(()=>lock("inactivity"),remain+25);}
function activity(){if(!appVisible())return;lastActive=Date.now();schedule();}
["pointerdown","keydown","touchstart"].forEach(type=>document.addEventListener(type,activity,{capture:true,passive:true}));
document.addEventListener("visibilitychange",()=>{if(document.hidden){backgroundAt=Date.now();return;}if(!cfg.enabled||!cfg.pin||cfg.timeoutMs===null)return;if(Date.now()<suppressUntil){activity();return;}const elapsed=backgroundAt?Date.now()-backgroundAt:Date.now()-lastActive;if(cfg.timeoutMs===0||elapsed>=cfg.timeoutMs)lock("background");else activity();});
window.addEventListener("pageshow",()=>{if(cfg.enabled&&cfg.pin&&cfg.timeoutMs===0&&Date.now()>=suppressUntil&&appVisible())lock("background");});

function removeOverlay(){document.querySelector("#fidunioLocalLockOverlay")?.remove();lastActive=Date.now();schedule();}
function lock(reason="inactivity"){
  if(!cfg.enabled||!cfg.pin||!appVisible())return;
  clearTimeout(timer);
  let host=document.querySelector("#fidunioLocalLockOverlay");if(host)return;
  host=document.createElement("div");host.id="fidunioLocalLockOverlay";host.className="modal-backdrop";host.style.zIndex="100000";
  host.innerHTML=`<main class="app-shell unlock" style="width:min(100%,760px);margin:auto"><section class="unlock-card"><div class="unlock-brand"><img class="brand-logo" src="fidunio-logo.png" alt="Fidunio logo"></div><h1>FIDUNIO Locked</h1><p>Your Firebase session remains signed in. Unlock this installation to view messages.</p>${cfg.credentialId?'<button class="primary" id="localBiometricUnlock">Unlock with device</button>':""}<button class="${cfg.credentialId?"secondary":"primary"}" id="localPinUnlock">Use PIN</button><div class="small-note">Local app lock • '+(reason==="manual"?"Locked manually":"Locked after inactivity")+'</div></section></main>`;
  document.body.appendChild(host);
  host.querySelector("#localPinUnlock").onclick=async()=>{if(await unlockWithPin())removeOverlay();};
  const bio=host.querySelector("#localBiometricUnlock");if(bio)bio.onclick=async()=>{bio.disabled=true;try{if(await unlockWithBiometric())removeOverlay();}finally{if(document.body.contains(bio))bio.disabled=false;}};
}

async function platformAuthenticatorAvailable(){try{return !!(globalThis.PublicKeyCredential&&PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());}catch{return false;}}
async function enrollBiometric(){
  if(!cfg.pin)return alert("Set a local PIN first. The PIN remains the recovery unlock method.");
  if(!await platformAuthenticatorAvailable())return alert("Device biometric/passkey authentication is not available in this browser.");
  try{
    const userId=randomBytes(32);
    const credential=await navigator.credentials.create({publicKey:{challenge:randomBytes(32),rp:{name:"FIDUNIO"},user:{id:userId,name:"fidunio-local",displayName:"FIDUNIO local unlock"},pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],authenticatorSelection:{authenticatorAttachment:"platform",residentKey:"discouraged",userVerification:"required"},timeout:60000,attestation:"none"}});
    if(!credential)return;
    cfg.credentialId=b64(new Uint8Array(credential.rawId));saveCfg();renderControls();alert("Device unlock is enabled for this FIDUNIO installation.");
  }catch(err){if(err?.name!=="NotAllowedError")alert("Could not enable device unlock: "+(err?.message||err));}
}
async function unlockWithBiometric(){
  if(!cfg.credentialId)return false;
  try{
    const credential=await navigator.credentials.get({publicKey:{challenge:randomBytes(32),allowCredentials:[{type:"public-key",id:unb64(cfg.credentialId),transports:["internal"]}],userVerification:"required",timeout:60000}});
    return !!credential;
  }catch(err){if(err?.name!=="NotAllowedError")alert("Device unlock failed: "+(err?.message||err));return false;}
}
function disableBiometric(){if(!cfg.credentialId)return;cfg.credentialId=null;saveCfg();renderControls();}

function renderControls(){
  const c=settingsCard();if(!c)return;
  /* Remove the old prototype biometric toggle so there is only one authoritative lock UI. */
  [...c.querySelectorAll(".row")].forEach(r=>{if(r.textContent?.includes("Biometric / passkey unlock"))r.remove();});
  let host=c.querySelector("#fidunioLocalLockControls");if(!host){host=document.createElement("div");host.id="fidunioLocalLockControls";c.prepend(host);}
  host.innerHTML=`<div class="row-main"><strong>Local app lock</strong><span>${cfg.pin?"PIN is set for this installation.":"Set a PIN to protect FIDUNIO when this device is unattended."}</span></div><div class="auth-actions" style="margin-top:10px"><button class="secondary" id="localPinBtn">${cfg.pin?"Change PIN":"Set PIN"}</button>${cfg.pin?'<button class="secondary" id="lockNowBtn">Lock Now</button>':""}</div>${cfg.pin?`<label class="form-label" for="lockTimeout">Lock after inactivity</label><select class="text-input" id="lockTimeout">${options().map(([v,l])=>`<option value="${v===null?"never":v}" ${(v===null?cfg.timeoutMs===null:cfg.timeoutMs===v)?"selected":""}>${l}</option>`).join("")}</select><p class="small-note">Current timeout: ${timeoutLabel(cfg.timeoutMs)}. The PIN is stored only as a derived verifier, never as the raw PIN.</p><div class="row-main" style="margin-top:14px"><strong>Device unlock</strong><span>${cfg.credentialId?"Enabled on this installation.":biometricAvailable?"Face ID / Touch ID or another platform authenticator is available.":"Platform biometric/passkey authentication is unavailable in this browser."}</span></div>${biometricAvailable?`<button class="secondary" id="biometricSetupBtn" style="margin-top:10px">${cfg.credentialId?"Disable Device Unlock":"Enable Device Unlock"}</button>`:""}`:""}`;
  host.querySelector("#localPinBtn").onclick=setupPin;const now=host.querySelector("#lockNowBtn");if(now)now.onclick=()=>lock("manual");const sel=host.querySelector("#lockTimeout");if(sel)sel.onchange=()=>{cfg.timeoutMs=sel.value==="never"?null:Number(sel.value);saveCfg();activity();renderControls();};const bio=host.querySelector("#biometricSetupBtn");if(bio)bio.onclick=cfg.credentialId?disableBiometric:enrollBiometric;
}
async function setupPin(){const first=prompt(cfg.pin?"Enter a new 4–12 digit FIDUNIO PIN:":"Create a 4–12 digit FIDUNIO PIN:");if(first===null)return;if(!/^\d{4,12}$/.test(first))return alert("PIN must contain 4 to 12 digits.");const second=prompt("Confirm the new PIN:");if(second!==first)return alert("PINs did not match. No change was made.");cfg.pin=await makeVerifier(first);cfg.enabled=true;if(cfg.timeoutMs===undefined)cfg.timeoutMs=DEFAULT_TIMEOUT;saveCfg();activity();renderControls();alert("FIDUNIO local PIN is set on this installation.");}
async function unlockWithPin(){if(!cfg.enabled||!cfg.pin)return false;const pin=prompt("Enter your FIDUNIO PIN:");if(pin===null)return false;const ok=await verifyPin(pin);if(!ok){alert("Incorrect PIN.");return false;}lastActive=Date.now();schedule();return true;}

/* Gate the legacy prototype unlock buttons without changing the validated app.js messaging path. */
document.addEventListener("click",async event=>{
  const btn=event.target?.closest?.("#unlockBtn,#pinBtn");if(!btn||unlockBypass||!cfg.enabled||!cfg.pin)return;
  event.preventDefault();event.stopImmediatePropagation();
  let ok=false;
  if(btn.id==="unlockBtn"&&cfg.credentialId)ok=await unlockWithBiometric();
  if(!ok)ok=await unlockWithPin();
  if(ok){unlockBypass=true;lastActive=Date.now();btn.click();queueMicrotask(()=>{unlockBypass=false;schedule();});}
},true);

/* Existing auth bridge may deliberately bypass one immediate local re-lock after successful account authentication. */
globalThis.FIDUNIO_LOCAL_LOCK={lock,hasPin:()=>!!cfg.pin,bypassImmediateLock(ms=10000){suppressUntil=Date.now()+ms;lastActive=Date.now();schedule();}};

let queued=false;function polish(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;renderControls();});}
new MutationObserver(polish).observe(document.documentElement,{subtree:true,childList:true});
platformAuthenticatorAvailable().then(v=>{biometricAvailable=v;renderControls();});
polish();
