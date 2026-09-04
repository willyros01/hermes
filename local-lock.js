/* FIDUNIO 0.9.4 local application lock.
 * PIN verifier is local-only and derived with PBKDF2-SHA-256.
 * Raw PIN is never stored. WebAuthn/platform biometric enrollment follows
 * after this PIN/inactivity foundation is validated on the target devices.
 */
const KEY="fidunio-local-lock-v1";
const DEFAULT_TIMEOUT=5*60*1000;
const ITERATIONS=210000;
let cfg=readCfg();
let lastActive=Date.now();
let backgroundAt=0;
let timer=null;
let suppressUntil=0;

function readCfg(){try{return JSON.parse(localStorage.getItem(KEY)||"null")||{enabled:false,timeoutMs:DEFAULT_TIMEOUT,pin:null};}catch{return{enabled:false,timeoutMs:DEFAULT_TIMEOUT,pin:null};}}
function saveCfg(){localStorage.setItem(KEY,JSON.stringify(cfg));}
function b64(bytes){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);}
function unb64(s){const r=atob(s);return Uint8Array.from(r,c=>c.charCodeAt(0));}
async function derive(pin,salt){const material=await crypto.subtle.importKey("raw",new TextEncoder().encode(pin),"PBKDF2",false,["deriveBits"]);const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt,iterations:ITERATIONS},material,256);return new Uint8Array(bits);}
async function makeVerifier(pin){const salt=crypto.getRandomValues(new Uint8Array(16));return{salt:b64(salt),hash:b64(await derive(pin,salt))};}
async function verifyPin(pin){if(!cfg.pin)return false;const got=await derive(pin,unb64(cfg.pin.salt));const want=unb64(cfg.pin.hash);if(got.length!==want.length)return false;let diff=0;for(let i=0;i<got.length;i++)diff|=got[i]^want[i];return diff===0;}
function appState(){return globalThis.FIDUNIO_LOCAL_LOCK_BRIDGE||null;}
function isUnlocked(){return appState()?.isUnlocked?.()===true;}
function lock(reason="inactivity"){if(!cfg.enabled||!cfg.pin||!isUnlocked())return;appState()?.lock?.(reason);}
function schedule(){clearTimeout(timer);if(!cfg.enabled||!cfg.pin||cfg.timeoutMs===null||!isUnlocked())return;const remain=Math.max(0,cfg.timeoutMs-(Date.now()-lastActive));timer=setTimeout(()=>lock("inactivity"),remain+20);}
function activity(){if(!isUnlocked())return;lastActive=Date.now();schedule();}
["pointerdown","keydown","touchstart"].forEach(type=>document.addEventListener(type,activity,{capture:true,passive:true}));
document.addEventListener("visibilitychange",()=>{if(document.hidden){backgroundAt=Date.now();return;}if(!cfg.enabled||!cfg.pin||cfg.timeoutMs===null)return;if(Date.now()<suppressUntil){activity();return;}const elapsed=backgroundAt?Date.now()-backgroundAt:Date.now()-lastActive;if(cfg.timeoutMs===0||elapsed>=cfg.timeoutMs)lock("background");else activity();});
window.addEventListener("pageshow",()=>{if(cfg.enabled&&cfg.pin&&cfg.timeoutMs===0&&Date.now()>=suppressUntil)lock("background");});

function timeoutLabel(ms){if(ms===null)return"Never";if(ms===0)return"Immediately";const m=Math.round(ms/60000);return m<60?`${m} min`:`${m/60} hr`;}
function options(){return[[0,"Immediately"],[60000,"1 min"],[300000,"5 min"],[900000,"15 min"],[1800000,"30 min"],[3600000,"1 hr"],[null,"Never"]];}
function card(){return document.querySelector(".content.settings .card h2")?.closest?.(".card")&&[...document.querySelectorAll(".content.settings .card")].find(c=>c.querySelector("h2")?.textContent?.trim()==="Privacy & Access");}
function renderControls(){const c=card();if(!c)return;let host=c.querySelector("#fidunioLocalLockControls");if(!host){host=document.createElement("div");host.id="fidunioLocalLockControls";c.prepend(host);}host.innerHTML=`<div class="row-main"><strong>Local app lock</strong><span>${cfg.pin?"PIN is set for this installation.":"Set a PIN to protect FIDUNIO when this device is unattended."}</span></div><div class="auth-actions" style="margin-top:10px"><button class="secondary" id="localPinBtn">${cfg.pin?"Change PIN":"Set PIN"}</button>${cfg.pin?'<button class="secondary" id="lockNowBtn">Lock Now</button>':""}</div>${cfg.pin?`<label class="form-label" for="lockTimeout">Lock after inactivity</label><select class="text-input" id="lockTimeout">${options().map(([v,l])=>`<option value="${v===null?"never":v}" ${(v===null?cfg.timeoutMs===null:cfg.timeoutMs===v)?"selected":""}>${l}</option>`).join("")}</select><p class="small-note">Current timeout: ${timeoutLabel(cfg.timeoutMs)}. PIN is stored only as a derived verifier, never as the raw PIN.</p>`:""}`;
 c.querySelector("#localPinBtn").onclick=setupPin;const now=c.querySelector("#lockNowBtn");if(now)now.onclick=()=>lock("manual");const sel=c.querySelector("#lockTimeout");if(sel)sel.onchange=()=>{cfg.timeoutMs=sel.value==="never"?null:Number(sel.value);saveCfg();activity();renderControls();};}
async function setupPin(){const first=prompt(cfg.pin?"Enter a new 4–12 digit FIDUNIO PIN:":"Create a 4–12 digit FIDUNIO PIN:");if(first===null)return;if(!/^\d{4,12}$/.test(first))return alert("PIN must contain 4 to 12 digits.");const second=prompt("Confirm the new PIN:");if(second!==first)return alert("PINs did not match. No change was made.");cfg.pin=await makeVerifier(first);cfg.enabled=true;if(cfg.timeoutMs===undefined)cfg.timeoutMs=DEFAULT_TIMEOUT;saveCfg();activity();renderControls();alert("FIDUNIO local PIN is set on this installation.");}

export async function unlockWithPin(){if(!cfg.enabled||!cfg.pin)return false;const pin=prompt("Enter your FIDUNIO PIN:");if(pin===null)return false;const ok=await verifyPin(pin);if(!ok){alert("Incorrect PIN.");return false;}lastActive=Date.now();schedule();return true;}
export function hasLocalPin(){return !!(cfg.enabled&&cfg.pin);}
export function noteUnlocked(){lastActive=Date.now();schedule();}
export function bypassImmediateLock(ms=10000){suppressUntil=Date.now()+ms;lastActive=Date.now();schedule();}
export async function platformAuthenticatorAvailable(){try{return !!(globalThis.PublicKeyCredential&&PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());}catch{return false;}}

let queued=false;function polish(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;renderControls();});}
new MutationObserver(polish).observe(document.documentElement,{subtree:true,childList:true});polish();
