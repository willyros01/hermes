/*
 * FIDUNIO authentication gate only.
 * Settings/Profile/Administration/Invitations are deliberately NOT owned here.
 * See CODING-GUIDELINES.md and settings-lifecycle.js.
 */
import {
  isFirebaseConfigured,
  initFirebase,
  getFirebaseUser,
  getFidunioAccessInfo,
  listCloudUsers,
  getCloudUserDevices,
  signInFidunio,
  signOutFidunio,
  sendFidunioPasswordReset
} from "./firebase.js";
import {validateFidunioInvitation,redeemInvitationForEnrollment} from "./invitation-owner.js";
import {markSuccessfulAuthBypass,getLocalSecurityStatus,verifyLocalPin,verifyBiometric,setLocalPin,saveLocalAccountE2EEIdentity,readLocalAccountE2EEIdentity,inspectLocalAccountE2EEIdentity} from "./local-security.js";
import {bindAuthenticatedAccountE2EE,unlockAccountE2EE,enrollAccountE2EE,recoverAccountE2EE,restoreLocalAccountE2EE,getAccountE2EERuntimeIdentity,resetAccountE2EEForSignOut} from "./e2ee-account-runtime.js";
import {mountSixDigitPinInput} from "./pin-input.js";
import {
  getAccountStorageStatus,
  inspectLegacyAccountIdentity,
  inspectQuarantinedAccountIdentity,
  recoverQuarantinedE2EEIdentity,
  activateAccountStorage
} from "./account-storage.js";

const VERSION=globalThis.FIDUNIO_RELEASE?.version||"";
let appStarted=false;

function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function inviteTokenFromUrl(){return new URL(location.href).searchParams.get("invite")||"";}
function clearInviteFromUrl(){const u=new URL(location.href);if(!u.searchParams.has("invite"))return;u.searchParams.delete("invite");history.replaceState(null,"",u.pathname+(u.search||"")+u.hash);}
function authShell(inner){document.querySelector("#app").innerHTML=`<main class="app-shell unlock"><section class="unlock-card" style="max-width:520px"><div class="unlock-brand"><img class="brand-logo" src="fidunio-logo.png" alt="Fidunio logo"></div><h1>FIDUNIO</h1><p>Private Messaging</p>${inner}<div class="small-note">FIDUNIO ${esc(VERSION)} • Invite-only access</div></section></main>`;}

async function sendPasswordReset(email){return sendFidunioPasswordReset(email);}
function canonicalJwk(jwk){return JSON.stringify({kty:jwk?.kty||"",crv:jwk?.crv||"",x:jwk?.x||"",y:jwk?.y||""});}
async function resolveIdentityOwnerUid(identity){
  if(!identity?.publicJwk&&!identity?.deviceId)return null;
  const current=await getFidunioAccessInfo();
  const others=await listCloudUsers();
  const profiles=[current.profile,...others].filter(Boolean);
  const wantedKey=identity.publicJwk?canonicalJwk(identity.publicJwk):null;
  const wantedDevice=String(identity.deviceId||"");
  const matches=new Set();
  for(const profile of profiles){
    if(wantedKey&&canonicalJwk(profile.e2eePublicJwk)===wantedKey)matches.add(profile.uid);
    try{
      const devices=await getCloudUserDevices(profile.uid);
      if(devices.some(d=>
        (wantedDevice&&String(d.deviceId||d.id||"")===wantedDevice)||
        (wantedKey&&canonicalJwk(d.publicJwk)===wantedKey)
      ))matches.add(profile.uid);
    }catch(err){console.warn("Could not inspect device registry for legacy identity ownership",profile.uid,err);}
  }
  return matches.size===1?[...matches][0]:null;
}
async function resolveLegacyOwnerUid(){
  const legacy=await inspectLegacyAccountIdentity();
  if(!legacy.hasLegacyData||(!legacy.publicJwk&&!legacy.deviceId))return null;
  return resolveIdentityOwnerUid(legacy);
}
async function recoverVerifiedQuarantinedIdentity(userUid){
  const legacy=await inspectQuarantinedAccountIdentity();
  if(!legacy.hasIdentity)return{recovered:false,reason:"no-quarantined-identity"};
  const ownerUid=await resolveIdentityOwnerUid(legacy);
  if(ownerUid!==userUid)return{recovered:false,reason:ownerUid?"belongs-to-other-account":"ownership-ambiguous"};
  return recoverQuarantinedE2EEIdentity(userUid,{legacyOwnerUid:ownerUid});
}

async function startApp(){
  if(appStarted)return;
  const user=getFirebaseUser();
  if(!user)throw new Error("Authenticated account is required before FIDUNIO can start.");
  const storageStatus=await getAccountStorageStatus();
  let legacyOwnerUid=null;
  if(!storageStatus.activeUid){
    try{legacyOwnerUid=await resolveLegacyOwnerUid();}
    catch(err){console.warn("FIDUNIO could not uniquely identify legacy local-data ownership; legacy data will be quarantined",err);}
  }
  await activateAccountStorage(user.uid,{legacyOwnerUid});
  // Stable-identity invariant: ordinary startup never overwrites the active E2EE identity from quarantine.
  appStarted=true;
  clearInviteFromUrl();
  await import("./app.js");
}

async function unlockAccountForMessaging(user,password,pin,{hasIdentity}={}){
  if(!/^\d{6}$/.test(pin))throw new Error("Enter your six-digit FIDUNIO PIN.");
  if(hasIdentity){
    try{await unlockAccountE2EE({uid:user.uid,password,pin});}
    catch(unlockError){
      try{await recoverAccountE2EE({uid:user.uid,newPassword:password,pin});}
      catch{throw unlockError;}
    }
  }
  else await enrollAccountE2EE({uid:user.uid,password,pin});
  const identity=getAccountE2EERuntimeIdentity();
  const local=getLocalSecurityStatus();
  if(local.hasPin&&!await verifyLocalPin(pin))throw new Error("This device uses a different FIDUNIO PIN.");
  if(!local.hasPin)await setLocalPin(pin);
  await saveLocalAccountE2EEIdentity(identity);
  markSuccessfulAuthBypass();
}

async function renderSessionUnlock(user,{hasIdentity,identity,password=""}={}){
  const saved=identity?await readLocalAccountE2EEIdentity(user.uid,identity):null;
  const security=getLocalSecurityStatus();
  if(saved){
    authShell(`<p class="small-note">Welcome back, ${esc(user.email||"FIDUNIO user")}.</p>${security.hasBiometric?'<button class="primary" id="sessionDeviceBtn">Unlock with device</button>':""}<label class="form-label" id="sessionPinLabel">FIDUNIO PIN</label><div id="sessionPinHost"></div><button class="${security.hasBiometric?"secondary":"primary"}" id="sessionUnlockBtn" style="margin-top:14px">Unlock with PIN</button><button class="secondary" id="sessionSignOutBtn" style="margin-top:10px">Use Another Account</button><div id="sessionNote"></div>`);
  }else{
    const passwordField=password?"":'<label class="form-label" for="sessionPassword">Password</label><input class="text-input" id="sessionPassword" type="password" autocomplete="current-password" placeholder="Password">';
    authShell(`<p class="small-note">${hasIdentity?"Resynchronize secure messaging for":"Set up secure messaging for"} ${esc(user.email||"this device")}.</p>${passwordField}<label class="form-label" id="sessionPinLabel">${hasIdentity?"Enter your existing":"Choose your"} six-digit PIN</label><div id="sessionPinHost"></div><button class="primary" id="sessionUnlockBtn" style="margin-top:14px">${hasIdentity?"Restore Messaging":"Continue"}</button><button class="secondary" id="sessionSignOutBtn" style="margin-top:10px">Use Another Account</button><div id="sessionNote"></div>`);
  }
  const pinInput=mountSixDigitPinInput(document.querySelector("#sessionPinHost"),{onComplete:()=>document.querySelector("#sessionUnlockBtn")?.click()});
  document.querySelector("#sessionUnlockBtn").onclick=async()=>{
    const btn=document.querySelector("#sessionUnlockBtn"),note=document.querySelector("#sessionNote");
    btn.disabled=true;btn.textContent="Unlocking…";pinInput.setDisabled(true);
    try{
      if(saved){
        if(!await verifyLocalPin(pinInput.value()))throw new Error("Incorrect PIN.");
        restoreLocalAccountE2EE(saved);markSuccessfulAuthBypass();
      }else await unlockAccountForMessaging(user,password||document.querySelector("#sessionPassword")?.value||"",pinInput.value(),{hasIdentity});
      await startApp();
    }catch(err){
      note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;
      btn.disabled=false;btn.textContent="Unlock Messaging";pinInput.setDisabled(false);pinInput.clear();pinInput.focus();
    }
  };
  const deviceBtn=document.querySelector("#sessionDeviceBtn");
  if(deviceBtn)deviceBtn.onclick=async()=>{
    deviceBtn.disabled=true;deviceBtn.textContent="Waiting for device…";
    if(await verifyBiometric()){restoreLocalAccountE2EE(saved);markSuccessfulAuthBypass();await startApp();return;}
    document.querySelector("#sessionNote").innerHTML='<p class="warning-note">Device unlock was cancelled or unavailable. Use your PIN instead.</p>';
    deviceBtn.disabled=false;deviceBtn.textContent="Unlock with device";
  };
  document.querySelector("#sessionSignOutBtn").onclick=async()=>{
    resetAccountE2EEForSignOut();
    await signOutFidunio();
    renderGate("signin");
  };
  setTimeout(()=>saved||password?pinInput.focus():document.querySelector("#sessionPassword")?.focus(),0);
}

async function enterAfterPasswordSignIn(user,bound,password){
  if(bound.state?.state==="READY"){markSuccessfulAuthBypass();await startApp();return;}
  const saved=bound.identity?await readLocalAccountE2EEIdentity(user.uid,bound.identity):null;
  if(!saved){
    const local=bound.identity?await inspectLocalAccountE2EEIdentity(user.uid,bound.identity):null;
    if(local?.exists&&local.keyMatches&&!local.revisionMatches){await renderSessionUnlock(user,{hasIdentity:true,identity:bound.identity,password});return;}
    throw new Error("Secure messaging is not available on this device. Rejoin or recover this installation.");
  }
  restoreLocalAccountE2EE(saved);
  markSuccessfulAuthBypass();
  await startApp();
}

function renderGate(mode=inviteTokenFromUrl()?"join":"signin",message=""){
  const loginIcon='<span class="auth-choice-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></svg></span>';
  const joinIcon='<span class="auth-choice-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M16 11h6"/></svg></span>';
  authShell(`<div class="auth-actions" role="tablist" aria-label="Account access"><button class="auth-choice ${mode==="signin"?"is-selected":""}" id="signInTab" role="tab" aria-selected="${mode==="signin"}" aria-controls="authBody" type="button">${loginIcon}<span>Sign In</span></button><button class="auth-choice ${mode==="join"?"is-selected":""}" id="joinTab" role="tab" aria-selected="${mode==="join"}" aria-controls="authBody" type="button">${joinIcon}<span>Join FIDUNIO</span></button></div><div id="authBody" role="tabpanel" aria-live="polite"></div>${message?`<p class="warning-note">${esc(message)}</p>`:""}`);
  document.querySelector("#signInTab").onclick=()=>renderGate("signin");
  document.querySelector("#joinTab").onclick=()=>renderGate("join");
  if(mode==="join")renderJoin(inviteTokenFromUrl());else renderSignIn();
}

function renderSignIn(){
  const body=document.querySelector("#authBody");
  body.innerHTML=`<label class="form-label" for="loginEmail">Email</label><input class="text-input" id="loginEmail" type="email" autocomplete="username" placeholder="name@example.com"><label class="form-label" for="loginPassword">Password</label><input class="text-input" id="loginPassword" type="password" autocomplete="current-password" placeholder="Password"><button class="primary" id="loginBtn" style="margin-top:14px">Sign In</button><button class="secondary" id="forgotBtn" style="margin-top:10px">Forgot Password</button><div id="loginNote"></div>`;
  document.querySelector("#loginBtn").onclick=async()=>{
    const btn=document.querySelector("#loginBtn");btn.disabled=true;btn.textContent="Signing in…";
    const password=document.querySelector("#loginPassword").value;
    try{
      const user=await signInFidunio(document.querySelector("#loginEmail").value.trim(),password);
      const bound=await bindAuthenticatedAccountE2EE(user.uid);
      await enterAfterPasswordSignIn(user,bound,password);
    }
    catch(err){resetAccountE2EEForSignOut();try{await signOutFidunio();}catch{}renderGate("signin",err?.message||String(err));}
  };
  document.querySelector("#forgotBtn").onclick=async()=>{
    const email=document.querySelector("#loginEmail").value.trim(),note=document.querySelector("#loginNote"),btn=document.querySelector("#forgotBtn");
    if(!email){note.innerHTML='<p class="warning-note">Enter your email address first.</p>';return;}
    btn.disabled=true;
    try{await sendPasswordReset(email);note.innerHTML='<p class="small-note">Password reset email sent. Check your inbox.</p>';}
    catch(err){note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;}
    finally{btn.disabled=false;}
  };
}

async function renderJoin(initialToken=""){
  const body=document.querySelector("#authBody");
  body.innerHTML=`<label class="form-label" for="inviteCode">Invitation code</label><input class="text-input" id="inviteCode" autocomplete="off" placeholder="Invitation code" value="${esc(initialToken)}"><label class="form-label" for="joinName">Display name</label><input class="text-input" id="joinName" maxlength="80" placeholder="Your display name"><label class="form-label" for="joinEmail">Email</label><input class="text-input" id="joinEmail" type="email" autocomplete="username" placeholder="name@example.com"><label class="form-label" for="joinPassword">Password</label><input class="text-input" id="joinPassword" type="password" autocomplete="new-password" placeholder="At least 6 characters"><label class="form-label" id="joinPinLabel">Choose a six-digit PIN</label><div id="joinPinHost"></div><button class="primary" id="redeemBtn" style="margin-top:14px">Join FIDUNIO</button><div id="joinNote"></div>`;
  const pinInput=mountSixDigitPinInput(document.querySelector("#joinPinHost"),{onComplete:()=>document.querySelector("#redeemBtn")?.focus()});
  document.querySelector("#redeemBtn").onclick=async()=>{
    const btn=document.querySelector("#redeemBtn"),note=document.querySelector("#joinNote"),token=document.querySelector("#inviteCode").value.trim(),name=document.querySelector("#joinName").value.trim(),email=document.querySelector("#joinEmail").value.trim(),password=document.querySelector("#joinPassword").value,pin=pinInput.value();
    if(!/^\d{6}$/.test(pin)){note.innerHTML='<p class="warning-note">Enter a six-digit FIDUNIO PIN.</p>';pinInput.focus();return;}
    btn.disabled=true;pinInput.setDisabled(true);btn.textContent="Creating account…";
    try{
      await validateFidunioInvitation(token);
      const user=await redeemInvitationForEnrollment(token,email,password,name);
      const bound=await bindAuthenticatedAccountE2EE(user.uid);
      await unlockAccountForMessaging(user,password,pin,{hasIdentity:bound.hasIdentity});
      await startApp();
    }catch(err){
      note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;
      btn.disabled=false;pinInput.setDisabled(false);btn.textContent="Join FIDUNIO";
    }
  };
}

export async function runAuthGate(){
  if(!isFirebaseConfigured()){authShell('<p class="warning-note">FIDUNIO cannot start because Firebase is not configured.</p>');return;}
  // firebase.js owns the complete Firebase startup lifecycle. App Check is
  // initialized there before Auth/Firestore services are exposed.
  await new Promise(resolve=>{
    let first=true;
    initFirebase(user=>{
      if(first){first=false;resolve(user);return;}
      if(appStarted&&!user)location.reload();
    }).catch(err=>{authShell(`<p class="warning-note">${esc(err?.message||String(err))}</p>`);resolve(null);});
  });
  const user=getFirebaseUser();
  if(user){
    try{
      const info=await getFidunioAccessInfo();
      if(!info.profile){renderGate("join","This login is not enrolled in FIDUNIO. Use a valid invitation.");return;}
      const bound=await bindAuthenticatedAccountE2EE(user.uid);
      if(bound.state?.state==="READY")await startApp();
      else await renderSessionUnlock(user,bound);
    }
    catch(err){renderGate("signin",err?.message||String(err));}
  }else renderGate();
}
