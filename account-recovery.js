import {initFirebase,getFirebaseUser,signInFidunio,signOutFidunio,sendFidunioPasswordReset,getFidunioAccessInfo} from "./firebase.js";
import {bindAuthenticatedAccountE2EE,recoverAccountE2EEAuthorized,resetAccountE2EEForSignOut} from "./e2ee-account-runtime.js";
import {activateAccountStorage} from "./account-storage.js";
import {getLocalSecurityStatus,setLocalPin,verifyLocalPin,markSuccessfulAuthBypass} from "./local-security.js";
import {mountSixDigitPinInput} from "./pin-input.js";

const VERSION=globalThis.FIDUNIO_RELEASE?.version||"";
const token=new URL(location.href).searchParams.get("recovery")||"";
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function shell(inner){document.querySelector("#app").innerHTML=`<main class="app-shell unlock"><section class="unlock-card" style="max-width:560px"><div class="unlock-brand"><img class="brand-logo" src="fidunio-logo.png" alt="Fidunio logo"></div><h1>Account Recovery</h1>${inner}<div class="small-note">FIDUNIO ${esc(VERSION)} • Administrator-authorized recovery</div></section></main>`;}
function invalid(message="This recovery authorization is missing or invalid."){shell(`<p class="warning-note">${esc(message)}</p><a class="secondary" href="./" style="display:flex;text-decoration:none;align-items:center;justify-content:center">Return to FIDUNIO</a>`);}
async function waitForAuth(){return new Promise(resolve=>{let first=true;initFirebase(user=>{if(first){first=false;resolve(user||null);}}).catch(()=>resolve(null));});}
async function doReset(email,note,button){if(!email){note.innerHTML='<p class="warning-note">Enter the account email first.</p>';return;}button.disabled=true;button.textContent="Sending…";try{await sendFidunioPasswordReset(email);note.innerHTML='<p class="small-note">Password reset email sent. Use the email to choose a new password, then return to this recovery page and continue.</p>';}catch(err){note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;}finally{button.disabled=false;button.textContent="Send Password Reset Email";}}
async function recover(user,password,pin,note,button,pinInput){
  if(!/^\d{6}$/.test(pin))throw new Error("Enter your existing six-digit FIDUNIO PIN.");
  const info=await getFidunioAccessInfo();if(!info?.profile||info.user?.uid!==user.uid)throw new Error("This account is not enrolled in FIDUNIO.");
  await activateAccountStorage(user.uid,{});
  const bound=await bindAuthenticatedAccountE2EE(user.uid);if(!bound?.hasIdentity)throw new Error("This account does not have an enrolled secure messaging identity.");
  const security=getLocalSecurityStatus();if(security.hasPin&&!await verifyLocalPin(pin))throw new Error("The existing FIDUNIO PIN does not match this installation.");
  await recoverAccountE2EEAuthorized({uid:user.uid,newPassword:password,pin,token});
  if(!security.hasPin)await setLocalPin(pin);
  markSuccessfulAuthBypass();
  const url=new URL("./",location.href);location.replace(url.href);
}
function renderSignedOut(){
  shell(`<p class="small-note">A FIDUNIO administrator authorized recovery for one account. First reset that account's Firebase password, then sign in here with the new password. Your administrator never sees the password or PIN.</p><label class="form-label" for="recoveryEmail">Account email</label><input class="text-input" id="recoveryEmail" type="email" autocomplete="username" placeholder="name@example.com"><button class="secondary" id="sendResetBtn" style="margin-top:12px">Send Password Reset Email</button><label class="form-label" for="recoveryPassword">New password</label><input class="text-input" id="recoveryPassword" type="password" autocomplete="current-password" placeholder="Password chosen from reset email"><button class="primary" id="continueRecoveryBtn" style="margin-top:14px">Sign In & Continue</button><a class="secondary" href="./" style="display:flex;text-decoration:none;align-items:center;justify-content:center;margin-top:10px">Cancel</a><div id="recoveryNote"></div>`);
  const email=document.querySelector("#recoveryEmail"),password=document.querySelector("#recoveryPassword"),note=document.querySelector("#recoveryNote"),reset=document.querySelector("#sendResetBtn"),cont=document.querySelector("#continueRecoveryBtn");
  reset.onclick=()=>doReset(email.value.trim(),note,reset);
  cont.onclick=async()=>{cont.disabled=true;cont.textContent="Signing in…";try{const user=await signInFidunio(email.value.trim(),password.value);renderPin(user,password.value);}catch(err){resetAccountE2EEForSignOut();try{await signOutFidunio();}catch{}note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;cont.disabled=false;cont.textContent="Sign In & Continue";}};
}
function renderPin(user,password=""){
  shell(`<p class="small-note"><strong>${esc(user.email||"FIDUNIO account")}</strong></p><p class="small-note">Enter this account's existing six-digit FIDUNIO PIN. Recovery restores the same encrypted messaging identity; it does not create a replacement account or expose messages to the administrator.</p>${password?"":'<label class="form-label" for="signedInRecoveryPassword">Account password</label><input class="text-input" id="signedInRecoveryPassword" type="password" autocomplete="current-password" placeholder="Current password">'}<label class="form-label" id="recoveryPinLabel">Existing six-digit FIDUNIO PIN</label><div id="recoveryPinHost"></div><button class="primary" id="recoverBtn" style="margin-top:14px">Recover Account</button><button class="secondary" id="otherAccountBtn" style="margin-top:10px">Use Another Account</button><div id="recoveryNote"></div>`);
  const pinInput=mountSixDigitPinInput(document.querySelector("#recoveryPinHost"),{onComplete:()=>document.querySelector("#recoverBtn")?.click()}),btn=document.querySelector("#recoverBtn"),note=document.querySelector("#recoveryNote");
  btn.onclick=async()=>{const currentPassword=password||document.querySelector("#signedInRecoveryPassword")?.value||"";btn.disabled=true;btn.textContent="Recovering…";pinInput.setDisabled(true);try{const verified=await signInFidunio(user.email,currentPassword);if(verified.uid!==user.uid)throw new Error("Recovery account changed unexpectedly.");await recover(verified,currentPassword,pinInput.value(),note,btn,pinInput);}catch(err){note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;btn.disabled=false;btn.textContent="Recover Account";pinInput.setDisabled(false);pinInput.clear();pinInput.focus();}};
  document.querySelector("#otherAccountBtn").onclick=async()=>{resetAccountE2EEForSignOut();await signOutFidunio();renderSignedOut();};
  setTimeout(()=>password?pinInput.focus():document.querySelector("#signedInRecoveryPassword")?.focus(),0);
}
if(!/^[A-Za-z0-9_-]{32,128}$/.test(token))invalid();else{const user=await waitForAuth();if(user)renderPin(user);else renderSignedOut();}
