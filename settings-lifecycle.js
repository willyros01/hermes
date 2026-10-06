/*
 * FIDUNIO Settings lifecycle owner.
 *
 * MANDATORY OWNERSHIP CONTRACT (CODING-GUIDELINES.md):
 * Resource owner: this module owns Settings structural layout and the late-added
 * Profile, User Administration, and Invitations sections.
 * Scope: only .content.settings, its named section hosts, and Settings-owned modals.
 * Lifecycle trigger: app.js calls mountSettingsLifecycle() after every renderSettings().
 * Serialized write path: all account/admin/invitation mutations pass through
 * serializeSettingsMutation(). Reads are generation-gated so stale async work
 * cannot write into a replaced Settings DOM.
 */
import {
  getFidunioAccessInfo,
  claimLegacyOwner,
  updateFidunioProfile,
  changeFidunioPassword,
  listFidunioUsersForAdmin,
  updateFidunioUserLifecycle,
  getFidunioNotificationCapability,
  getFidunioMessagingToken,
  deleteFidunioMessagingToken,
  getCloudNotificationDevice,
  upsertCloudNotificationDevice,
  deleteCloudNotificationDevice,
  listCloudUsers,
  getCloudUserProfile,
  submitFidunioAbuseReport,
  listFidunioAbuseReportsForAdmin,
  resolveFidunioAbuseReport,
  listFidunioBlockedUsers,
  blockFidunioUser,
  unblockFidunioUser,
  requestFidunioAccountDeletion,
  getFidunioAccountDeletionRequest,
  cancelFidunioAccountDeletionRequest,
  listFidunioAccountDeletionRequestsForAdmin,
  updateFidunioAccountDeletionRequestForAdmin,
  transferCloudSystemOwnership,
} from "./firebase.js";
import {createNotificationRegistrationOwner} from "./notification-registration.js";
import {FIDUNIO_WEB_PUSH_PUBLIC_VAPID_KEY} from "./notification-config.js";
import {createInvitationForEnrollment,listPendingInvitationsForAdmin,revokeInvitationForAdmin} from "./invitation-owner.js";
import {createAdminRecoveryAuthorization,listAdminRecoveryAuthorizations,revokeAdminRecoveryAuthorization} from "./admin-recovery-client.js";
import {mountInstallGuidance} from "./install-guidance.js";
import {prepareSelfAccountDeletion} from "./account-deletion-service.js";
import {completeSelfAccountDeletion} from "./account-deletion-finalize-client.js";
import { getAccountE2EELifecycleState,enrollAccountE2EE,unlockAccountE2EE,recoverAccountE2EE,changeAccountPasswordWithE2EE } from "./e2ee-account-runtime.js";
import {getLocalSecurityStatus,setLocalPin,verifyLocalPin} from "./local-security.js";
import {mountSixDigitPinInput} from "./pin-input.js";
import {fidunioPublicUrl} from "./platform-runtime.js";
import {FIDUNIO_LEGAL_POLICY} from "./legal-policy.js";
import {
  getNotificationPlatformCapabilities,
  getNativeNotificationCapability,
  requestNativeNotificationPermission,
  getNativeMessagingToken,
  deleteNativeMessagingToken,
  subscribeNativeMessagingTokens,
} from "./notification-platform-adapter.js";

let mutationTail=Promise.resolve();
let generation=0;
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function initials(name){return String(name||"U").trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()||"").join("")||"U";}
function prettyRole(role){return role==="owner"?"Owner":role==="admin"?"Administrator":"User";}
function prettyAbuseCategory(category){return({"harassment":"Harassment or bullying","objectionable-content":"Objectionable content","spam-scam":"Spam or scam","impersonation":"Impersonation","other":"Other"})[String(category||"")]||"Report";}
function profileStatus(p){if(p?.active===false)return p?.status||"deactivated";return p?.status||"active";}
function dateText(v){const d=v?.toDate?.()||v;if(!d)return"—";try{return new Date(d).toLocaleString();}catch{return String(d);}}
function guideUrl(){return fidunioPublicUrl("./quick-start.html").href;}
function inviteSubject(){return "You're invited to join FIDUNIO";}
function inviteMessage(invite){const inviter=invite.invitedByName||"A FIDUNIO administrator",role=invite.role==="admin"?"Admin":"User";return `You're invited to FIDUNIO — Private Messaging\n\n${inviter} has invited you to join FIDUNIO, an invitation-only private messaging app for one-to-one and group conversations.\n\nYour role: ${role}\nInvitation expires: ${invite.expiresAt.toLocaleString()}\n\nJOIN FIDUNIO\n${invite.link}\n\nThis invitation is personal and can be used only once. After your account is created, the invitation becomes invalid. Please do not forward the invitation link.\n\nQUICK START GUIDE\n${guideUrl()}\n\nThe guide explains account setup, privacy and security basics, messaging, device identity, and PIN/biometric unlocking.\n\nFIDUNIO • Private Messaging`;}
function recoveryLink(token){const url=fidunioPublicUrl("./account-recovery.html");url.searchParams.set("recovery",token);return url.href;}
function recoverySubject(){return "FIDUNIO account recovery authorization";}
function recoveryMessage(result){return `FIDUNIO Account Recovery\n\nAn administrator has authorized account recovery for ${result.targetDisplayName||result.targetEmail||"your FIDUNIO account"}.\n\nThis authorization expires ${new Date(result.expiresAtMs).toLocaleString()} and can be used only once.\n\nRECOVER ACCOUNT\n${recoveryLink(result.token)}\n\nUse the recovery page to reset/sign in with your own account password and enter your existing six-digit FIDUNIO PIN. Your administrator does not receive your password, PIN, encryption key, messages, or attachments.\n\nFIDUNIO • Private Messaging`;}

function serializeSettingsMutation(label,work){
  const run=mutationTail.then(()=>work());
  mutationTail=run.catch(err=>{console.warn(`Settings mutation failed: ${label}`,err);});
  return run;
}

const GROUPS=[
  {id:"general",label:"General",icon:"⚙︎",subtitle:"Appearance, text size, and account information.",cards:["Appearance","Text Size","Account"]},
  {id:"privacy",label:"Security",icon:"🔒",subtitle:"Your FIDUNIO PIN, Face ID or biometric unlock, and end-to-end encryption.",cards:["Privacy & Access"]},
  {id:"notifications",label:"Notifications",icon:"●",subtitle:"Control private message-arrival notifications on this installation."},
  {id:"safety",label:"Safety",icon:"!",subtitle:"Report abusive behavior or objectionable content to FIDUNIO administrators."},
  {id:"profile",label:"Profile",icon:"●",subtitle:"Your personal information and how you appear to other FIDUNIO users."},
  {id:"users",label:"User Administration",icon:"◉",subtitle:"Manage account status, roles, expiration, and authorized recovery."},
  {id:"invites",label:"Invitations",icon:"✉︎",subtitle:"Create and manage FIDUNIO invitations."},
  {id:"install",label:"Install",icon:"▣",subtitle:"Optional browser and Home Screen installation guidance."},
  {id:"data",label:"Data",icon:"▤",subtitle:"Local data and storage controls.",cards:["Data"]},
  {id:"legal",label:"Legal & Support",icon:"ⓘ",subtitle:"Privacy, terms, support, safety, and account rights."},
  {id:"about",label:"About",icon:"ⓘ",subtitle:"FIDUNIO information and version details.",cards:["About"]}
];
const PANEL_ORDER=["profile","general","privacy","notifications","safety","users","invites","install","data","legal","about"];
let activeGroup="profile";
let mountedAccountVaultOwner=null;

function directCards(settings){return[...settings.querySelectorAll(":scope > .card")];}
function cardByTitle(settings,title){return directCards(settings).find(card=>card.querySelector("h2")?.textContent?.trim()===title)||null;}
function updateSelection(shell){
  shell.querySelectorAll(".fidunio-settings-nav-btn").forEach(btn=>{
    const active=btn.dataset.group===activeGroup;
    btn.classList.toggle("is-active",active);
    btn.setAttribute("aria-current",active?"page":"false");
  });
  shell.querySelectorAll(".fidunio-settings-panel").forEach(panel=>panel.classList.toggle("is-active",panel.dataset.group===activeGroup));
}
function createShell(settings){
  const shell=document.createElement("div");
  shell.id="fidunioSettingsShell";
  shell.innerHTML='<aside id="fidunioSettingsNav" aria-label="Settings sections"><h2>Settings</h2><div class="fidunio-settings-nav-list"></div></aside><div class="fidunio-settings-panels"></div>';
  const nav=shell.querySelector(".fidunio-settings-nav-list");
  for(const group of GROUPS){
    const btn=document.createElement("button");
    btn.type="button";btn.className="fidunio-settings-nav-btn";btn.dataset.group=group.id;
    btn.innerHTML=`<span class="fidunio-settings-nav-icon" aria-hidden="true">${group.icon}</span><span>${group.label}</span><span class="fidunio-settings-nav-arrow" aria-hidden="true">›</span>`;
    btn.onclick=()=>{activeGroup=group.id;updateSelection(shell);shell.querySelector(`#fidunioSettingsPanel-${group.id}`)?.scrollIntoView({block:"start"});};
    nav.appendChild(btn);
  }
  const panels=shell.querySelector(".fidunio-settings-panels");
  for(const id of PANEL_ORDER){
    const group=GROUPS.find(g=>g.id===id);
    const panel=document.createElement("section");
    panel.id=`fidunioSettingsPanel-${group.id}`;panel.className="fidunio-settings-panel";panel.dataset.group=group.id;
    panel.innerHTML=`<h2 class="fidunio-settings-panel-title">${esc(group.label)}</h2><p class="fidunio-settings-panel-subtitle">${esc(group.subtitle)}</p><div class="fidunio-settings-section-host" id="fidunioSettingsHost-${group.id}" data-settings-owner="${group.id}"></div>`;
    panels.appendChild(panel);
  }
  settings.prepend(shell);
  updateSelection(shell);
  return shell;
}
function collapseTechnicalCard(card,title){
  if(!card||card.dataset.fidunioCollapsed==="1")return;
  const heading=card.querySelector("h2");if(!heading)return;
  card.dataset.fidunioCollapsed="1";
  const details=document.createElement("div");details.className="fidunio-tech-details";details.hidden=true;
  while(heading.nextSibling)details.appendChild(heading.nextSibling);
  const toggle=document.createElement("button");toggle.className="secondary";toggle.type="button";toggle.textContent=`Show ${title}`;toggle.setAttribute("aria-expanded","false");
  const copy=document.createElement("button");copy.className="secondary";copy.type="button";copy.textContent="Copy Details";copy.style.marginTop="10px";copy.hidden=true;
  toggle.onclick=()=>{const open=details.hidden;details.hidden=!open;copy.hidden=!open;toggle.textContent=`${open?"Hide":"Show"} ${title}`;toggle.setAttribute("aria-expanded",String(open));};
  copy.onclick=()=>{const value=details.innerText.trim();if(!value)return;navigator.clipboard?.writeText(value).then(()=>{const old=copy.textContent;copy.textContent="Copied";setTimeout(()=>copy.textContent=old,1200);}).catch(()=>prompt("Copy details:",value));};
  card.append(toggle,details,copy);
}
function placeBaseCards(settings,shell){
  const prototype=cardByTitle(settings,"Prototype connectivity");if(prototype)prototype.remove();
  for(const group of GROUPS){
    const host=shell.querySelector(`#fidunioSettingsHost-${group.id}`);if(!host)continue;
    for(const title of group.cards||[]){const card=cardByTitle(settings,title);if(card)host.appendChild(card);}
  }
  const general=shell.querySelector("#fidunioSettingsHost-general");
  for(const card of directCards(settings))general?.appendChild(card);
  const footer=settings.querySelector(":scope > .version-footer");if(footer){footer.id="fidunioSettingsFooter";settings.appendChild(footer);}
}
function host(shell,id){return shell.querySelector(`#fidunioSettingsHost-${id}`);}
function current(g,shell){return g===generation&&shell?.isConnected&&document.querySelector("#fidunioSettingsShell")===shell;}

async function saveProfile(values){return updateFidunioProfile(values);}
async function changePassword(uid,currentPassword,newPassword,pin){return changeAccountPasswordWithE2EE({uid,currentPassword,newPassword,pin});}
function renderProfile(profileHost,info){
  const p=info.profile;
  profileHost.innerHTML=`<div class="card" id="fidunioProfileCard"><h2>Profile</h2><div style="text-align:center;margin-bottom:12px">${p.photoURL?`<img src="${esc(p.photoURL)}" alt="Profile" style="width:72px;height:72px;border-radius:50%;object-fit:cover">`:`<div class="avatar" style="width:72px;height:72px;margin:auto;font-size:24px">${esc(initials(p.displayName||"U"))}</div>`}<div class="small-note">System role: ${esc(prettyRole(info.role))}</div></div><label class="form-label" for="profileName">Display name</label><input class="text-input" id="profileName" maxlength="80" value="${esc(p.displayName||info.user.displayName||"")}"><label class="form-label" for="profileEmail">Email address</label><input class="text-input" id="profileEmail" type="email" value="${esc(info.user.email||p.email||"")}"><label class="form-label" for="profilePhone">Telephone number</label><input class="text-input" id="profilePhone" type="tel" autocomplete="tel" value="${esc(p.telephone||"")}" placeholder="Optional"><label class="form-label" for="profilePhoto">Profile picture URL</label><input class="text-input" id="profilePhoto" type="url" value="${esc(p.photoURL||"")}" placeholder="https://…"><label class="form-label" for="profileCurrentPassword">Current password</label><input class="text-input" id="profileCurrentPassword" type="password" autocomplete="current-password" placeholder="Required only to change your email"><button class="primary" id="saveProfileBtn" style="margin-top:14px">Save Profile</button><div id="profileNote"></div><hr style="margin:22px 0"><h2>Change Password</h2><label class="form-label" for="passwordCurrentPassword">Current password</label><input class="text-input" id="passwordCurrentPassword" type="password" autocomplete="current-password" placeholder="Enter your current password"><label class="form-label" for="newPassword">New password</label><input class="text-input" id="newPassword" type="password" autocomplete="new-password" placeholder="At least 6 characters"><label class="form-label" for="newPassword2">Confirm new password</label><input class="text-input" id="newPassword2" type="password" autocomplete="new-password" placeholder="Repeat new password"><label class="form-label" for="passwordE2EEPin">FIDUNIO PIN</label><input class="text-input" id="passwordE2EEPin" type="password" inputmode="numeric" autocomplete="off" maxlength="6" pattern="[0-9]*" placeholder="Your six-digit FIDUNIO PIN"><button class="secondary" id="changePasswordBtn" style="margin-top:14px">Change Password</button><div id="passwordNote"></div></div>`;
  const card=profileHost.querySelector("#fidunioProfileCard");
  card.querySelector("#saveProfileBtn").onclick=async()=>{
    const btn=card.querySelector("#saveProfileBtn"),note=card.querySelector("#profileNote");btn.disabled=true;btn.textContent="Saving…";
    try{await serializeSettingsMutation("save profile",()=>saveProfile({displayName:card.querySelector("#profileName").value,email:card.querySelector("#profileEmail").value,telephone:card.querySelector("#profilePhone").value,photoURL:card.querySelector("#profilePhoto").value,currentPassword:card.querySelector("#profileCurrentPassword").value}));note.innerHTML='<p class="small-note">Profile updated.</p>';}
    catch(err){note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;}
    finally{btn.disabled=false;btn.textContent="Save Profile";}
  };
  card.querySelector("#changePasswordBtn").onclick=async()=>{
    const btn=card.querySelector("#changePasswordBtn"),note=card.querySelector("#passwordNote"),currentPassword=card.querySelector("#passwordCurrentPassword").value,next=card.querySelector("#newPassword").value,confirm=card.querySelector("#newPassword2").value;
    if(next!==confirm){note.innerHTML='<p class="warning-note">The new passwords do not match.</p>';return;}
    btn.disabled=true;btn.textContent="Changing…";
    try{await serializeSettingsMutation("change password",()=>changePassword(info.user.uid,currentPassword,next,card.querySelector("#passwordE2EEPin").value));card.querySelector("#passwordCurrentPassword").value="";card.querySelector("#newPassword").value="";card.querySelector("#newPassword2").value="";card.querySelector("#passwordE2EEPin").value="";note.innerHTML='<p class="small-note">Password changed successfully.</p>';}
    catch(err){note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;}
    finally{btn.disabled=false;btn.textContent="Change Password";}
  };
}

async function listUsers(){return listFidunioUsersForAdmin();}
async function updateLifecycle(target,status,expiryDays=undefined){return updateFidunioUserLifecycle(target?.uid,status,expiryDays);}
function canManageUser(u,info){const role=info.profile.systemRole,isSelf=u.uid===info.user.uid;return !isSelf&&u.systemRole!=="owner"&&(u.systemRole!=="admin"||role==="owner");}
function userRow(u,info){
  const status=profileStatus(u),manageable=canManageUser(u,info),name=u.displayName||u.email||"FIDUNIO user";
  return `<div class="admin-user-row" data-uid="${esc(u.uid)}"><div class="admin-user-person"><div class="admin-avatar">${esc(initials(name))}</div><div><strong>${esc(name)}</strong><span>${esc(u.email||"")}</span></div></div><div class="admin-role">${esc((u.systemRole||"user").toUpperCase())}</div><div><span class="admin-status admin-status-${esc(status)}">${esc(status.toUpperCase())}</span></div><div class="admin-expiry">${esc(u.expiresAt?dateText(u.expiresAt):"No expiration")}</div><div class="admin-actions-cell">${manageable?`<button class="admin-more" type="button" data-uid="${esc(u.uid)}" aria-label="Actions for ${esc(name)}">•••</button><div class="admin-menu" data-menu-uid="${esc(u.uid)}"><button data-admin-action="${status==="active"?"suspended":"active"}">${status==="active"?"Suspend":"Restore"}</button><button data-admin-action="deactivated">Deactivate</button><div class="admin-menu-sep"></div><span>Expiration</span><button data-expiry="never">Never</button><button data-expiry="7">7 days</button><button data-expiry="30">30 days</button><button data-expiry="90">90 days</button><div class="admin-menu-sep"></div><span>Recovery</span><button data-recovery-action="start">Start Account Recovery</button></div>`:`<span class="admin-protected">${u.uid===info.user.uid?"Current":u.systemRole==="owner"?"Protected":"Owner only"}</span>`}</div></div>`;
}
function closeRecoveryResult(){document.querySelector("#fidunioRecoveryResultModal")?.remove();}
async function openRecoveryResult(result,user){
  closeRecoveryResult();const modal=document.createElement("div");modal.id="fidunioRecoveryResultModal";modal.className="modal-backdrop";const link=recoveryLink(result.token),message=recoveryMessage(result);
  modal.innerHTML=`<div class="modal" style="max-width:680px"><h2>Account Recovery Authorized</h2><p class="small-note"><strong>${esc(user.displayName||user.email||"FIDUNIO user")}</strong> has a single-use recovery authorization valid until ${esc(new Date(result.expiresAtMs).toLocaleString())}.</p><div class="uid-box" style="word-break:break-all">${esc(link)}</div><p class="small-note">The user privately resets/signs in with the account password and enters the existing six-digit FIDUNIO PIN. You cannot see those credentials.</p><div class="auth-actions" style="margin-top:12px"><button class="secondary" id="copyRecoveryBtn">Copy Recovery</button><button class="secondary" id="emailRecoveryBtn">Email Recovery</button>${navigator.share?'<button class="secondary" id="shareRecoveryBtn">Share…</button>':""}<button class="danger-btn" id="revokeRecoveryBtn">Revoke Authorization</button></div><div class="modal-actions"><button class="modal-cancel" id="closeRecoveryResultBtn">Close</button></div><div id="recoveryResultNote"></div></div>`;document.body.appendChild(modal);
  modal.onclick=e=>{if(e.target===modal)closeRecoveryResult();};modal.querySelector("#closeRecoveryResultBtn").onclick=closeRecoveryResult;
  modal.querySelector("#copyRecoveryBtn").onclick=async e=>{try{await navigator.clipboard.writeText(message);e.currentTarget.textContent="Copied";}catch{prompt("Copy FIDUNIO recovery authorization:",message);}};
  modal.querySelector("#emailRecoveryBtn").onclick=e=>{e.preventDefault();location.href=`mailto:${encodeURIComponent(user.email||"")}?subject=${encodeURIComponent(recoverySubject())}&body=${encodeURIComponent(message)}`;};
  const share=modal.querySelector("#shareRecoveryBtn");if(share)share.onclick=()=>navigator.share({title:recoverySubject(),text:message}).catch(()=>{});
  modal.querySelector("#revokeRecoveryBtn").onclick=async()=>{const btn=modal.querySelector("#revokeRecoveryBtn"),note=modal.querySelector("#recoveryResultNote");if(!confirm("Revoke this recovery authorization? The link will stop working."))return;btn.disabled=true;btn.textContent="Revoking…";try{await serializeSettingsMutation("revoke account recovery",()=>revokeAdminRecoveryAuthorization(result.authorizationId));note.innerHTML='<p class="small-note">Recovery authorization revoked.</p>';btn.textContent="Revoked";}catch(err){note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;btn.disabled=false;btn.textContent="Revoke Authorization";}};
}
function closeAdminModal(){document.querySelector("#fidunioAdminModal")?.remove();}
async function renderAdminModal(modal,info){
  const users=await listUsers();if(!modal.isConnected)return;
  const body=modal.querySelector(".modal");
  body.innerHTML=`<div class="admin-modal-head"><div><h2>User Administration</h2><p class="small-note">Manage user access, status, expiration, and administrator-authorized account recovery. Invitation management is kept separately under Invitations.</p></div><button class="secondary" id="adminRefreshBtn" style="width:auto">Refresh</button></div><div class="admin-section-label">Users (${users.length})</div><div class="admin-user-table"><div class="admin-user-header"><span>User</span><span>Role</span><span>Status</span><span>Expires</span><span></span></div>${users.map(u=>userRow(u,info)).join("")}</div><p class="small-note" style="margin-top:10px">Recovery authorization never exposes a user's password, PIN, encryption key, messages, or attachments to the administrator.</p><div class="modal-actions"><button class="modal-cancel" id="adminCloseBtn">Close</button></div>`;
  if(info.role==="owner"){
    const targets=users.filter(u=>u.uid!==info.user.uid&&u.systemRole==="admin"&&u.active!==false&&!["suspended","deactivated"].includes(String(u.status||"active")));
    const box=document.createElement("div");box.className="permission-box";box.id="fidunioOwnershipTransferBox";box.style.marginBottom="14px";
    box.innerHTML='<strong>System Ownership</strong><p class="small-note">Transfer the FIDUNIO Owner role before deleting the current Owner account.</p><select class="text-input" id="ownershipTarget"><option value="">Choose an active Administrator</option></select><button class="secondary" id="transferOwnershipBtn" style="margin-top:10px">Transfer System Ownership</button>';
    const select=box.querySelector("#ownershipTarget");for(const u of targets){const option=document.createElement("option");option.value=u.uid;option.textContent=u.displayName||u.email||u.uid;select.appendChild(option);}
    const transfer=box.querySelector("#transferOwnershipBtn");transfer.disabled=targets.length===0;
    transfer.onclick=async()=>{const target=select.value;if(!target)return;if(!confirm("Transfer FIDUNIO system ownership to this Administrator? Your account will become an Administrator."))return;transfer.disabled=true;transfer.textContent="Transferring…";try{await serializeSettingsMutation("transfer system ownership",()=>transferCloudSystemOwnership(target));closeAdminModal();mountSettingsLifecycle();}catch(err){alert(err?.message||String(err));transfer.disabled=false;transfer.textContent="Transfer System Ownership";}};
    body.querySelector(".admin-section-label")?.before(box);
  }
  body.querySelector("#adminCloseBtn").onclick=closeAdminModal;
  body.querySelector("#adminRefreshBtn").onclick=()=>renderAdminModal(modal,info);
  const closeMenus=()=>body.querySelectorAll(".admin-menu.open").forEach(m=>m.classList.remove("open"));
  body.querySelectorAll(".admin-more").forEach(btn=>btn.onclick=e=>{e.stopPropagation();const menu=body.querySelector(`.admin-menu[data-menu-uid="${CSS.escape(btn.dataset.uid)}"]`),open=menu.classList.contains("open");closeMenus();if(!open)menu.classList.add("open");});
  body.querySelectorAll(".admin-menu button[data-admin-action]").forEach(btn=>btn.onclick=async e=>{e.stopPropagation();const menu=btn.closest(".admin-menu"),u=users.find(x=>x.uid===menu.dataset.menuUid),action=btn.dataset.adminAction;if(action==="deactivated"&&!confirm(`Deactivate ${u.displayName||u.email||"this account"}?`))return;btn.disabled=true;try{await serializeSettingsMutation("update user lifecycle",()=>updateLifecycle(u,action));await renderAdminModal(modal,info);}catch(err){alert(err?.message||String(err));btn.disabled=false;}});
  body.querySelectorAll(".admin-menu button[data-expiry]").forEach(btn=>btn.onclick=async e=>{e.stopPropagation();const menu=btn.closest(".admin-menu"),u=users.find(x=>x.uid===menu.dataset.menuUid),days=btn.dataset.expiry==="never"?null:Number(btn.dataset.expiry);btn.disabled=true;try{await serializeSettingsMutation("update user expiration",()=>updateLifecycle(u,profileStatus(u),days));await renderAdminModal(modal,info);}catch(err){alert(err?.message||String(err));btn.disabled=false;}});
  body.querySelectorAll(".admin-menu button[data-recovery-action]").forEach(btn=>btn.onclick=async e=>{e.stopPropagation();const menu=btn.closest(".admin-menu"),u=users.find(x=>x.uid===menu.dataset.menuUid);if(!u||!confirm(`Authorize account recovery for ${u.displayName||u.email||"this account"}?\n\nThe authorization expires in 30 minutes and can be used once.`))return;btn.disabled=true;btn.textContent="Authorizing…";try{const result=await serializeSettingsMutation("authorize account recovery",()=>createAdminRecoveryAuthorization(u.uid));closeMenus();await openRecoveryResult(result,u);}catch(err){alert(err?.message||String(err));btn.disabled=false;btn.textContent="Start Account Recovery";}});
  modal.onclick=e=>{if(e.target===modal)closeAdminModal();else if(!e.target.closest(".admin-more,.admin-menu"))closeMenus();};
}
function openAdmin(info){
  closeAdminModal();const modal=document.createElement("div");modal.id="fidunioAdminModal";modal.className="modal-backdrop";modal.innerHTML='<div class="modal fidunio-admin-modal"><h2>User Administration</h2><p class="small-note">Loading users…</p></div>';document.body.appendChild(modal);
  renderAdminModal(modal,info).catch(err=>{if(!modal.isConnected)return;modal.querySelector(".modal").innerHTML=`<h2>User Administration</h2><p class="warning-note">${esc(err?.message||String(err))}</p><button class="secondary" id="adminCloseBtn">Close</button>`;modal.querySelector("#adminCloseBtn").onclick=closeAdminModal;});
}
async function renderAccountDeletion(profileHost,usersHost,info){
  const card=document.createElement("div");card.className="card";card.id="fidunioDeleteAccountCard";
  card.innerHTML='<h2>Delete My Account</h2><p class="warning-note"><strong>Permanent account deletion.</strong> This is not suspension or sign-out. FIDUNIO verifies your password and PIN, removes your sent messages, safely leaves groups, removes personal account/security records, and deletes the Firebase Authentication account.</p><p class="small-note">Groups you own must be permanently deleted first so FIDUNIO does not silently destroy other members\' shared group history. After cleanup begins it cannot be undone.</p><div id="deleteAccountStatus"><p class="small-note">Checking deletion status…</p></div>';
  profileHost.appendChild(card);
  const statusHost=card.querySelector("#deleteAccountStatus");

  const finishDeletion=async(note)=>{
    note.innerHTML='<p class="small-note">Completing account deletion…</p>';
    const result=await completeSelfAccountDeletion();
    alert(result?.localCleanupWarning?("Your FIDUNIO account has been deleted.\n\n"+result.localCleanupWarning):"Your FIDUNIO account has been deleted.");
    location.reload();
  };

  const paint=async()=>{
    const request=await getFidunioAccountDeletionRequest();
    if(!card.isConnected)return;
    if(request?.status==="pending"){
      const prepared=request.cleanupStatus==="complete";
      statusHost.innerHTML=`<p class="small-note"><strong>Status:</strong> ${prepared?"Cleanup complete — ready for final deletion":"Deletion requested"}</p>${!prepared?'<p class="small-note">Preparation removes your sent messages and safely leaves groups. This destructive cleanup cannot be reversed.</p><button class="secondary" id="continueDeletionPreparationBtn">Continue Deletion Preparation</button><button class="secondary" id="cancelDeletionRequestBtn" style="margin-top:10px">Cancel Before Cleanup</button>':'<button class="primary" id="finishDeletionBtn">Finish Permanent Account Deletion</button>'}<div id="deletePreparationNote" aria-live="polite"></div>`;
      const prepNote=statusHost.querySelector("#deletePreparationNote");
      const prep=statusHost.querySelector("#continueDeletionPreparationBtn");
      if(prep)prep.onclick=async()=>{
        if(!confirm("Continue permanent account deletion preparation? Your sent messages will be removed and groups you do not own will be left. This cleanup cannot be undone."))return;
        prep.disabled=true;prep.textContent="Preparing…";
        try{
          await prepareSelfAccountDeletion({onProgress:step=>{if(prepNote?.isConnected)prepNote.innerHTML=`<p class="small-note">${esc(step.stage==="leave-group"?"Safely leaving group…":String(step.stage||"").includes("messages")?"Removing your sent messages…":"Preparing account deletion…")}</p>`;}});
          await finishDeletion(prepNote);
        }catch(err){prepNote.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;prep.disabled=false;prep.textContent="Continue Deletion Preparation";}
      };
      const finish=statusHost.querySelector("#finishDeletionBtn");
      if(finish)finish.onclick=async()=>{if(!confirm("Permanently delete your FIDUNIO account now? This cannot be undone."))return;finish.disabled=true;try{await finishDeletion(prepNote);}catch(err){prepNote.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;finish.disabled=false;}};
      const cancel=statusHost.querySelector("#cancelDeletionRequestBtn");
      if(cancel)cancel.onclick=async()=>{if(!confirm("Cancel the deletion request before destructive cleanup starts?"))return;cancel.disabled=true;try{await serializeSettingsMutation("cancel account deletion",()=>cancelFidunioAccountDeletionRequest());await paint();}catch(err){alert(err?.message||String(err));cancel.disabled=false;}};
      return;
    }
    if(request?.status==="processing"){
      statusHost.innerHTML='<p class="warning-note">Account deletion processing was interrupted or is still finishing. You can safely retry the final server cleanup.</p><button class="primary" id="retryFinalDeletionBtn">Retry Final Account Deletion</button><div id="deleteProcessingNote" aria-live="polite"></div>';
      const retry=statusHost.querySelector("#retryFinalDeletionBtn"),retryNote=statusHost.querySelector("#deleteProcessingNote");
      retry.onclick=async()=>{retry.disabled=true;retry.textContent="Retrying…";try{await finishDeletion(retryNote);}catch(err){retryNote.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;retry.disabled=false;retry.textContent="Retry Final Account Deletion";}};
      return;
    }
    statusHost.innerHTML='<label class="form-label" for="deleteAccountPassword">Current password</label><input class="text-input" id="deleteAccountPassword" type="password" autocomplete="current-password" placeholder="Current password"><label class="form-label" for="deleteAccountPin">FIDUNIO PIN</label><input class="text-input" id="deleteAccountPin" type="password" inputmode="numeric" autocomplete="off" maxlength="6" pattern="[0-9]*" placeholder="Six-digit PIN"><button class="secondary" id="requestDeletionBtn" style="margin-top:14px">Delete My Account</button><div id="deleteAccountNote" aria-live="polite"></div>';
    const button=statusHost.querySelector("#requestDeletionBtn"),note=statusHost.querySelector("#deleteAccountNote");
    button.onclick=async()=>{
      const password=statusHost.querySelector("#deleteAccountPassword").value,pin=statusHost.querySelector("#deleteAccountPin").value;
      if(pin.length!==6){note.innerHTML='<p class="warning-note">Enter your six-digit FIDUNIO PIN.</p>';return;}
      if(!confirm("Request permanent deletion of your FIDUNIO account? You can cancel only before destructive cleanup begins."))return;
      button.disabled=true;button.textContent="Verifying…";
      try{
        if(!await verifyLocalPin(pin))throw new Error("Incorrect FIDUNIO PIN.");
        await serializeSettingsMutation("request account deletion",()=>requestFidunioAccountDeletion(password));
        statusHost.querySelector("#deleteAccountPassword").value="";
        statusHost.querySelector("#deleteAccountPin").value="";
        note.innerHTML='<p class="small-note">Account verified. Starting controlled cleanup…</p>';
        await prepareSelfAccountDeletion({onProgress:step=>{if(note?.isConnected)note.innerHTML=`<p class="small-note">${esc(step.stage==="leave-group"?"Safely leaving group…":String(step.stage||"").includes("messages")?"Removing your sent messages…":"Preparing account deletion…")}</p>`;}});
        await finishDeletion(note);
      }catch(err){note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;button.disabled=false;button.textContent="Delete My Account";}
    };
  };
  try{await paint();}catch(err){statusHost.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;}

  if(["owner","admin"].includes(info.role)&&usersHost){
    const admin=document.createElement("div");admin.className="card";admin.id="fidunioDeletionAdminCard";
    admin.innerHTML='<h2>Account Deletion Requests</h2><p class="small-note">Read-only operational queue for incomplete deletion requests. Users complete their own deletion from Settings; administrators do not mark a request completed manually.</p><div id="deletionAdminList"><p class="small-note">Loading requests…</p></div>';
    usersHost.appendChild(admin);const list=admin.querySelector("#deletionAdminList");
    try{
      const rows=await listFidunioAccountDeletionRequestsForAdmin();
      if(!admin.isConnected)return;
      list.innerHTML=rows.length?rows.map(row=>`<div class="admin-invite-row"><div><strong>${esc(row.displayName||row.contactEmail||row.uid)}</strong><span>${esc(row.contactEmail||"")} • ${esc(row.status||"unknown")} • cleanup: ${esc(row.cleanupStatus||"unknown")} • ${esc(dateText(row.requestedAt))}</span></div></div>`).join(""):'<p class="small-note">No account deletion requests.</p>';
    }catch(err){list.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;}
  }
}

async function renderSafety(safetyHost,info){
  safetyHost.innerHTML='<div class="card" id="fidunioSafetyFilterCard"><h2>Message Safety Filter</h2><p class="small-note"><strong>On.</strong> FIDUNIO checks outgoing text on this device before encryption for a narrow set of high-confidence abusive or threatening phrases. Message text is not sent to a moderation service. The filter cannot inspect encrypted attachment contents, so Report Abuse and Blocked Users remain available for other cases.</p></div><div class="card" id="fidunioAbuseReportCard"><h2>Report Abuse</h2><p class="small-note">Report harassment, objectionable content, scams, impersonation, or other abusive behavior. FIDUNIO administrators receive the report, not the contents of unrelated conversations.</p><label class="form-label" for="abuseReason">Reason</label><select class="text-input" id="abuseReason"><option value="">Choose a reason</option><option value="harassment">Harassment or bullying</option><option value="objectionable-content">Objectionable content</option><option value="spam-scam">Spam or scam</option><option value="impersonation">Impersonation</option><option value="other">Other</option></select><label class="form-label" for="abuseTarget">Person involved (optional)</label><select class="text-input" id="abuseTarget"><option value="">No specific user</option></select><label class="form-label" for="abuseDetails">Details (optional)</label><textarea class="text-input" id="abuseDetails" maxlength="1000" rows="5" placeholder="Briefly describe what happened. Do not paste passwords, PINs, or private recovery information."></textarea><button class="primary" id="submitAbuseReportBtn" style="margin-top:14px">Send Report</button><div id="abuseReportNote" aria-live="polite"></div></div>';
  const card=safetyHost.querySelector("#fidunioAbuseReportCard"),target=card.querySelector("#abuseTarget"),note=card.querySelector("#abuseReportNote"),button=card.querySelector("#submitAbuseReportBtn");
  try{
    const users=await listCloudUsers();
    if(card.isConnected)for(const user of users){const option=document.createElement("option");option.value=user.uid;option.textContent=user.displayName||user.email||"FIDUNIO user";target.appendChild(option);}
  }catch(error){console.warn("FIDUNIO abuse-report user list unavailable",error);}
  button.onclick=async()=>{
    button.disabled=true;button.textContent="Sending…";note.textContent="";
    try{
      const result=await serializeSettingsMutation("report abuse",()=>submitFidunioAbuseReport({category:card.querySelector("#abuseReason").value,targetUid:target.value,details:card.querySelector("#abuseDetails").value}));
      card.querySelector("#abuseReason").value="";target.value="";card.querySelector("#abuseDetails").value="";
      note.innerHTML=`<p class="small-note">Report sent. Reference: <strong>${esc(result.id)}</strong>. A FIDUNIO administrator can review it.</p>`;
    }catch(err){note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;}
    finally{button.disabled=false;button.textContent="Send Report";}
  };
  const blockCard=document.createElement("div");blockCard.className="card";blockCard.id="fidunioBlockedUsersCard";blockCard.innerHTML='<h2>Blocked Users</h2><p class="small-note">Blocking stops new direct conversations, direct messages, and direct-message reactions in both directions. Group membership is separate; report abuse or ask a group administrator to remove an abusive member from a group.</p><label class="form-label" for="blockUserSelect">User to block</label><select class="text-input" id="blockUserSelect"><option value="">Choose a user</option></select><button class="secondary" id="blockUserBtn" style="margin-top:12px">Block User</button><div id="blockedUsersList" style="margin-top:14px"><p class="small-note">Loading blocked users…</p></div><div id="blockUserNote" aria-live="polite"></div>';safetyHost.appendChild(blockCard);
  const blockSelect=blockCard.querySelector("#blockUserSelect"),blockedList=blockCard.querySelector("#blockedUsersList"),blockNote=blockCard.querySelector("#blockUserNote"),blockButton=blockCard.querySelector("#blockUserBtn");
  let safetyUsers=[];
  try{safetyUsers=await listCloudUsers();if(blockCard.isConnected)for(const user of safetyUsers){const option=document.createElement("option");option.value=user.uid;option.textContent=user.displayName||user.email||"FIDUNIO user";blockSelect.appendChild(option);}}catch(error){blockNote.innerHTML=`<p class="warning-note">${esc(error?.message||String(error))}</p>`;}
  const renderBlocks=async()=>{const rows=await listFidunioBlockedUsers();const names=new Map(safetyUsers.map(user=>[user.uid,user.displayName||user.email||"FIDUNIO user"]));blockedList.innerHTML=rows.length?rows.map(row=>`<div class="admin-invite-row"><div><strong>${esc(names.get(row.blockedUid)||"Blocked user")}</strong></div><button class="row-action unblockUserBtn" type="button" data-uid="${esc(row.blockedUid)}">Unblock</button></div>`).join(""):'<p class="small-note">No blocked users.</p>';blockedList.querySelectorAll(".unblockUserBtn").forEach(btn=>btn.onclick=async()=>{btn.disabled=true;try{await serializeSettingsMutation("unblock user",()=>unblockFidunioUser(btn.dataset.uid));await renderBlocks();}catch(err){blockNote.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;btn.disabled=false;}});};
  try{await renderBlocks();}catch(error){blockedList.innerHTML=`<p class="warning-note">${esc(error?.message||String(error))}</p>`;}
  blockButton.onclick=async()=>{const uid=blockSelect.value;if(!uid){blockNote.innerHTML='<p class="warning-note">Choose a FIDUNIO user to block.</p>';return;}if(!confirm("Block this user? New direct contact will be stopped in both directions until you unblock them."))return;blockButton.disabled=true;try{await serializeSettingsMutation("block user",()=>blockFidunioUser(uid));blockSelect.value="";await renderBlocks();blockNote.innerHTML='<p class="small-note">User blocked.</p>';}catch(err){blockNote.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;}finally{blockButton.disabled=false;}};

  if(["owner","admin"].includes(info.role)){
    const admin=document.createElement("div");admin.className="card";admin.id="fidunioAbuseAdminCard";admin.innerHTML='<h2>Abuse Reports</h2><p class="small-note">Administrator moderation queue.</p><div id="abuseAdminList"><p class="small-note">Loading reports…</p></div>';safetyHost.appendChild(admin);
    const list=admin.querySelector("#abuseAdminList");
    try{
      const reports=await listFidunioAbuseReportsForAdmin();
      if(!admin.isConnected)return;
      const participantUids=[...new Set(reports.flatMap(r=>[r.reporterUid,r.targetUid]).map(x=>String(x||"").trim()).filter(Boolean))];
      const participantProfiles=new Map();
      await Promise.all(participantUids.map(async uid=>{
        try{const profile=await getCloudUserProfile(uid);participantProfiles.set(uid,profile?.displayName||profile?.email||"FIDUNIO user");}
        catch{participantProfiles.set(uid,"FIDUNIO user");}
      }));
      const displayName=uid=>participantProfiles.get(String(uid||""))||"FIDUNIO user";
      list.innerHTML=reports.length?reports.map(r=>`<div class="admin-invite-row"><div><strong>${esc(prettyAbuseCategory(r.category))}</strong><span>${esc(displayName(r.reporterUid))} ${r.targetUid?`→ ${esc(displayName(r.targetUid))}`:""} • ${esc(dateText(r.createdAt))}</span>${r.details?`<p class="small-note" style="margin:6px 0 0">${esc(r.details)}</p>`:""}</div><div>${r.status==="open"?`<button class="row-action abuseResolveBtn" type="button" data-id="${esc(r.id)}">Resolve</button><button class="row-action abuseDismissBtn" type="button" data-id="${esc(r.id)}">Dismiss</button>`:`<span class="small-note">${esc(r.status)}</span>`}</div></div>`).join(""):'<p class="small-note">No abuse reports.</p>';
      const act=async(btn,status)=>{btn.disabled=true;try{await serializeSettingsMutation("resolve abuse report",()=>resolveFidunioAbuseReport(btn.dataset.id,status,""));await renderSafety(safetyHost,info);}catch(err){alert(err?.message||String(err));btn.disabled=false;}};
      list.querySelectorAll(".abuseResolveBtn").forEach(btn=>btn.onclick=()=>act(btn,"resolved"));
      list.querySelectorAll(".abuseDismissBtn").forEach(btn=>btn.onclick=()=>act(btn,"dismissed"));
    }catch(err){list.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;}
  }
}

function renderUserAdmin(usersHost,info){
  if(!["owner","admin"].includes(info.role)){usersHost.innerHTML='<div class="card" id="fidunioUserAdminCard"><h2>User Administration</h2><p class="small-note">Administrator access is required.</p></div>';return;}
  usersHost.innerHTML='<div class="card" id="fidunioUserAdminCard"><h2>User Administration</h2><p class="small-note">Compact user list for access, suspension, restoration, expiration, and account recovery.</p><button class="primary" type="button" id="manageUsersBtn">Manage Users & Access</button></div>';
  usersHost.querySelector("#manageUsersBtn").onclick=e=>{e.preventDefault();e.stopPropagation();openAdmin(info);};
}

async function pendingInvites(){return listPendingInvitationsForAdmin();}
async function revokeInvite(id){return revokeInvitationForAdmin(id);}
async function refreshPending(card){
  const box=card.querySelector("#pendingInviteList");if(!box)return;box.innerHTML='<p class="small-note">Loading invitations…</p>';
  try{const rows=await pendingInvites();if(!box.isConnected)return;box.innerHTML=rows.length?rows.map(i=>`<div class="admin-invite-row"><div><strong>${esc(prettyRole(i.role))} invitation</strong><span>${esc(i.invitedByName||"Administrator")} • Expires ${esc(dateText(i.expiresAt))}</span></div><button class="row-action invitationRevokeBtn" type="button" data-id="${esc(i.id)}">Revoke</button></div>`).join(""):'<p class="small-note">No pending invitations.</p>';box.querySelectorAll(".invitationRevokeBtn").forEach(btn=>btn.onclick=async e=>{e.preventDefault();e.stopPropagation();btn.disabled=true;btn.textContent="Revoking…";try{await revokeInvite(btn.dataset.id);await refreshPending(card);}catch(err){btn.disabled=false;btn.textContent="Revoke";alert(err?.message||String(err));}});}catch(err){box.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;}
}
function renderInviteResult(card,invite){
  const result=card.querySelector("#inviteResult");if(!result)return;
  result.innerHTML=`<div class="permission-box" style="margin-top:14px"><strong>Single-use ${esc(prettyRole(invite.role))} invitation</strong><div class="uid-box" style="margin-top:8px;word-break:break-all">${esc(invite.link)}</div><p class="small-note" style="margin:10px 0 0">Expires ${esc(invite.expiresAt.toLocaleString())}. The shared message includes FIDUNIO information and the Quick Start Guide.</p><div class="auth-actions" style="margin-top:10px"><button class="secondary" id="copyInviteBtn">Copy Invitation</button><button class="secondary" id="emailInviteBtn">Email Invitation</button>${navigator.share?'<button class="secondary" id="shareInviteBtn">Share…</button>':""}</div><a class="secondary" href="${esc(guideUrl())}" target="_blank" rel="noopener" style="display:flex;text-decoration:none;margin-top:10px;align-items:center;justify-content:center">View Quick Start Guide</a></div>`;
  result.querySelector("#copyInviteBtn").onclick=async e=>{const text=inviteMessage(invite);try{await navigator.clipboard.writeText(text);e.currentTarget.textContent="Copied";}catch{prompt("Copy FIDUNIO invitation:",text);}};
  result.querySelector("#emailInviteBtn").onclick=e=>{e.preventDefault();e.stopPropagation();location.href=`mailto:?subject=${encodeURIComponent(inviteSubject())}&body=${encodeURIComponent(inviteMessage(invite))}`;};
  const share=result.querySelector("#shareInviteBtn");if(share)share.onclick=e=>{e.preventDefault();e.stopPropagation();navigator.share({title:inviteSubject(),text:inviteMessage(invite)}).catch(()=>{});};
  refreshPending(card);
}
function closeInviteModal(){document.querySelector("#fidunioInviteModal")?.remove();}
function openInviteModal(card){
  closeInviteModal();const modal=document.createElement("div");modal.id="fidunioInviteModal";modal.className="modal-backdrop";modal.innerHTML=`<div class="modal" style="max-width:640px"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><h2 style="margin:0">Create Invitation</h2><button class="text-btn" id="inviteModalX" aria-label="Close" style="font-size:28px;line-height:1">×</button></div><p class="small-note">Choose the new user's role and how long the invitation should remain valid.</p><label class="form-label" for="modalInviteRole">New user's role</label><select class="text-input" id="modalInviteRole"><option value="user">User</option><option value="admin">Admin</option></select><label class="form-label" for="modalInviteDays">Expires</label><select class="text-input" id="modalInviteDays"><option value="1">1 day</option><option value="7" selected>7 days</option><option value="30">30 days</option></select><div class="permission-box" style="margin-top:14px"><p class="small-note" style="margin:0">ⓘ The recipient gets the Join link plus a public Quick Start Guide link.</p></div><div class="modal-actions"><button class="modal-cancel" id="inviteModalCancel">Cancel</button><button class="modal-confirm" id="inviteModalCreate">Create Invitation</button></div><div id="inviteModalNote"></div></div>`;document.body.appendChild(modal);
  modal.onclick=e=>{if(e.target===modal)closeInviteModal();};modal.querySelector("#inviteModalX").onclick=closeInviteModal;modal.querySelector("#inviteModalCancel").onclick=closeInviteModal;
  modal.querySelector("#inviteModalCreate").onclick=async()=>{const btn=modal.querySelector("#inviteModalCreate"),note=modal.querySelector("#inviteModalNote");btn.disabled=true;btn.textContent="Creating…";try{const invite=await createInvitationForEnrollment(modal.querySelector("#modalInviteRole").value,Number(modal.querySelector("#modalInviteDays").value));renderInviteResult(card,invite);closeInviteModal();}catch(err){note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;btn.disabled=false;btn.textContent="Create Invitation";}};
}
function renderInvitations(invitesHost,info){
  if(!info.system){
    invitesHost.innerHTML='<div class="card" id="fidunioInvitationAdmin"><h2>FIDUNIO Administration</h2><p class="small-note">Initialize the invite-only access system. The first successful claim becomes the permanent FIDUNIO Owner.</p><button class="primary" id="claimOwnerBtn">Claim FIDUNIO Owner</button><p class="warning-note">Use this only on the Alpha/primary administrative account.</p></div>';
    const card=invitesHost.querySelector("#fidunioInvitationAdmin");card.querySelector("#claimOwnerBtn").onclick=async()=>{const btn=card.querySelector("#claimOwnerBtn");btn.disabled=true;btn.textContent="Claiming…";try{await serializeSettingsMutation("claim owner",()=>claimLegacyOwner());mountSettingsLifecycle();}catch(err){card.querySelector(".warning-note").textContent=err?.message||String(err);btn.disabled=false;btn.textContent="Claim FIDUNIO Owner";}};return;
  }
  if(!["owner","admin"].includes(info.role)){invitesHost.innerHTML='<div class="card" id="fidunioInvitationAdmin"><h2>Invitations</h2><p class="small-note">Administrator access is required.</p></div>';return;}
  invitesHost.innerHTML=`<div class="card" id="fidunioInvitationAdmin"><h2>Invitations</h2><p class="small-note"><strong>${esc(prettyRole(info.role))}</strong> access • Create a single-use invitation and share it directly by Mail, Messages, SMS, or another app.</p><button class="primary" id="createInviteBtn" style="margin-top:14px">Create Invitation</button><div id="inviteResult"></div><div id="pendingInviteList" style="margin-top:14px"></div></div>`;
  const card=invitesHost.querySelector("#fidunioInvitationAdmin");card.querySelector("#createInviteBtn").onclick=e=>{e.preventDefault();e.stopPropagation();openInviteModal(card);};refreshPending(card);
}

function renderAccountEncryption(encryptionHost,info){
  const lifecycle=getAccountE2EELifecycleState(),managerState=lifecycle?.manager?.state||"EMPTY",uid=info.user.uid;
  const ready=managerState==="READY",empty=managerState==="EMPTY";
  const localSecurity=getLocalSecurityStatus(),needsPinSetup=!localSecurity.hasPin;
  encryptionHost.insertAdjacentHTML("beforeend",`<div class="card" id="fidunioAccountEncryptionCard"><h2>FIDUNIO Security</h2>
    <p class="small-note"><strong>End-to-end encryption:</strong> ${ready?"On":"Setup required"}</p>
    ${ready&&!needsPinSetup?`<p class="small-note">Your messages are protected. Encryption keys are managed automatically in the background.</p>`:`
      <p class="small-note">${empty?"Create":"Unlock"} message protection with your account password and your one six-digit FIDUNIO PIN.</p>
      <label class="form-label" for="accountE2EEPassword">Account password</label>
      <input class="text-input" id="accountE2EEPassword" type="password" autocomplete="current-password" placeholder="Password">
      <label class="form-label" for="accountE2EEPin">FIDUNIO PIN</label>
      <input class="text-input" id="accountE2EEPin" type="password" inputmode="numeric" autocomplete="off" maxlength="6" pattern="[0-9]*" placeholder="Exactly 6 digits">
      ${empty?`<label class="form-label" for="accountE2EEPin2">Confirm FIDUNIO PIN</label><input class="text-input" id="accountE2EEPin2" type="password" inputmode="numeric" autocomplete="off" maxlength="6" pattern="[0-9]*" placeholder="Repeat 6-digit PIN">`:""}
      <button class="primary" id="accountE2EEPrimaryBtn" style="margin-top:14px">${empty?"Create FIDUNIO Security":"Unlock FIDUNIO Security"}</button>
      ${empty?"":'<button class="secondary" id="accountE2EERecoverBtn" style="margin-top:10px">Recover After Password Reset</button>'}
      <div id="accountE2EENote"></div>`}
    <p class="small-note">Face ID or Touch ID may be enabled as a convenient alternative on this device.</p></div>`);
  if(ready&&!needsPinSetup)return;
  const card=encryptionHost.querySelector("#fidunioAccountEncryptionCard"),note=card.querySelector("#accountE2EENote"),primary=card.querySelector("#accountE2EEPrimaryBtn");
  primary.onclick=async()=>{const password=card.querySelector("#accountE2EEPassword").value,pin=card.querySelector("#accountE2EEPin").value;if(empty&&pin!==card.querySelector("#accountE2EEPin2").value){note.innerHTML='<p class="warning-note">The FIDUNIO PIN entries do not match.</p>';return;}primary.disabled=true;primary.textContent=empty?"Creating…":"Unlocking…";try{if(localSecurity.hasPin&&!await verifyLocalPin(pin))throw new Error("This installation has a different PIN. Use the existing FIDUNIO PIN or perform the documented PIN migration.");if(empty)await enrollAccountE2EE({uid,password,pin});else await unlockAccountE2EE({uid,password,pin});if(!localSecurity.hasPin)await setLocalPin(pin);renderAccountEncryption(encryptionHost,info);}catch(err){note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;primary.disabled=false;primary.textContent=empty?"Create FIDUNIO Security":"Unlock FIDUNIO Security";}};
  const recover=card.querySelector("#accountE2EERecoverBtn");if(recover)recover.onclick=async()=>{const newPassword=card.querySelector("#accountE2EEPassword").value,pin=card.querySelector("#accountE2EEPin").value;if(!confirm("Use recovery only after the Firebase password has been reset. Continue with the existing six-digit account E2EE PIN?"))return;recover.disabled=true;recover.textContent="Recovering…";try{await recoverAccountE2EE({uid,newPassword,pin});renderAccountEncryption(encryptionHost,info);}catch(err){note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;recover.disabled=false;recover.textContent="Recover After Password Reset";}};
}

const notificationTransport=getNotificationPlatformCapabilities();
const notificationRegistrationOwner=createNotificationRegistrationOwner({
  getCapability:notificationTransport.nativeRegistration?getNativeNotificationCapability:getFidunioNotificationCapability,
  getToken:notificationTransport.nativeRegistration?getNativeMessagingToken:getFidunioMessagingToken,
  deleteToken:notificationTransport.nativeRegistration?deleteNativeMessagingToken:deleteFidunioMessagingToken,
  readRegistration:getCloudNotificationDevice,writeRegistration:upsertCloudNotificationDevice,deleteRegistration:deleteCloudNotificationDevice,
  getConfigured:()=>notificationTransport.nativeRegistration||String(FIDUNIO_WEB_PUSH_PUBLIC_VAPID_KEY||"").trim().length>0,
  requestPermission:notificationTransport.nativeRegistration?requestNativeNotificationPermission:undefined,
  getRegistrationContext:notificationTransport.nativeRegistration?async()=>null:null,
  buildTokenOptions:notificationTransport.nativeRegistration?()=>({}):undefined,
  getPlatform:notificationTransport.nativeRegistration?()=>"ios-native":undefined
});
let notificationTokenMaintenanceStop=()=>{};
let notificationTokenMaintenanceGeneration=0;
export function stopNotificationRegistrationMaintenance(){
  notificationTokenMaintenanceGeneration++;
  try{notificationTokenMaintenanceStop();}catch{}
  notificationTokenMaintenanceStop=()=>{};
}
export function startNotificationRegistrationMaintenance(uid){
  stopNotificationRegistrationMaintenance();
  if(!notificationTransport.nativeRegistration||!uid)return()=>{};
  const generation=notificationTokenMaintenanceGeneration;
  notificationTokenMaintenanceStop=subscribeNativeMessagingTokens(token=>{
    if(generation!==notificationTokenMaintenanceGeneration)return;
    void notificationRegistrationOwner.refreshToken({uid,fcmToken:token}).catch(error=>console.warn("FIDUNIO native notification token refresh failed",error));
  });
  return()=>{if(generation===notificationTokenMaintenanceGeneration)stopNotificationRegistrationMaintenance();};
}

export async function removeNotificationRegistrationForSignOut(uid){
  stopNotificationRegistrationMaintenance();
  if(!uid)return true;
  try{
    await notificationRegistrationOwner.disable({uid});
    return true;
  }catch(error){
    console.warn("FIDUNIO notification sign-out cleanup failed",error);
    throw new Error("Could not safely sign out because this installation's notification registration could not be removed. Check the connection and try again.");
  }
}

function notificationStatusText(status){return({ready:"Enabled",off:"Off",denied:"Permission denied",unsupported:"Unsupported on this device/browser","config-required":"Notification setup required"})[status]||status;}
async function renderNotifications(notificationsHost,info){
  const platformNotifications=getNotificationPlatformCapabilities();
  if(!platformNotifications.webPush&&!platformNotifications.nativeRegistration){notificationsHost.innerHTML='<div class="card" id="fidunioNotificationsCard"><h2>Notifications</h2><p class="small-note"><strong>Status:</strong> Unsupported on this installation</p></div>';return;}
  notificationsHost.innerHTML='<div class="card" id="fidunioNotificationsCard"><h2>Notifications</h2><p class="small-note">Loading notification status…</p></div>';
  const card=notificationsHost.querySelector("#fidunioNotificationsCard");
  try{const state=await notificationRegistrationOwner.getStatus(info.user.uid);if(!card.isConnected)return;const canEnable=state.supported&&state.permission!=="denied"&&state.configured&&!state.enabled;card.innerHTML=`<h2>Notifications</h2><p class="small-note"><strong>Status:</strong> ${esc(notificationStatusText(state.status))}</p><p class="small-note">Private is the default: <strong>FIDUNIO — New message</strong>. You may optionally show only the sender's FIDUNIO display name. Message text, attachment names, email addresses, UIDs, and decrypted content are never placed in the notification.</p>${state.enabled?`<label class="form-label" style="display:flex;gap:10px;align-items:center;margin-top:14px"><input type="checkbox" id="showNotificationSenderName" ${state.showSenderName?"checked":""}> Show sender's FIDUNIO display name</label><p class="small-note">When enabled on this installation, the card may say <strong>New message from Display Name</strong>.</p>`:""}${!state.configured?'<p class="warning-note">Web Push configuration must be completed before notifications can be enabled.</p>':""}<button class="primary" id="enableNotificationsBtn" ${canEnable?"":"disabled"}>Enable Notifications</button><button class="secondary" id="disableNotificationsBtn" ${state.enabled?"":"disabled"} style="margin-top:10px">Turn Off Notifications</button><div id="notificationNote"></div>`;
    const enable=card.querySelector("#enableNotificationsBtn"),disable=card.querySelector("#disableNotificationsBtn"),senderToggle=card.querySelector("#showNotificationSenderName"),note=card.querySelector("#notificationNote");
    if(senderToggle)senderToggle.onchange=async()=>{senderToggle.disabled=true;try{await notificationRegistrationOwner.setShowSenderName({uid:info.user.uid,showSenderName:senderToggle.checked});await renderNotifications(notificationsHost,info);}catch(err){note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;senderToggle.disabled=false;}};
    enable.onclick=async()=>{enable.disabled=true;enable.textContent="Enabling…";try{await notificationRegistrationOwner.enableFromUserGesture({uid:info.user.uid,vapidKey:FIDUNIO_WEB_PUSH_PUBLIC_VAPID_KEY});await renderNotifications(notificationsHost,info);}catch(err){note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;enable.disabled=false;enable.textContent="Enable Notifications";}};
    disable.onclick=async()=>{disable.disabled=true;disable.textContent="Turning off…";try{await notificationRegistrationOwner.disable({uid:info.user.uid});await renderNotifications(notificationsHost,info);}catch(err){note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;disable.disabled=false;disable.textContent="Turn Off Notifications";}};
  }catch(err){card.innerHTML=`<h2>Notifications</h2><p class="warning-note">${esc(err?.message||String(err))}</p>`;}
}

function downloadVault(blob,filename){const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=filename;link.rel="noopener";document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function renderAccountVault(dataHost,info){
  dataHost.querySelector("#fidunioAccountVaultCard")?.remove();if(!mountedAccountVaultOwner||!info?.user)return;
  const card=document.createElement("div");card.className="card";card.id="fidunioAccountVaultCard";
  card.innerHTML='<h2>FIDUNIO Recovery File</h2><p class="small-note">Save an encrypted copy of this account outside the browser. It can recover FIDUNIO after its Home Screen app or browser data is removed. A saved file can contain messages that existed when it was created; replace old files when you create a newer recovery copy.</p><label class="form-label">Existing six-digit FIDUNIO PIN</label><div id="vaultPinHost"></div><button class="primary" id="createVaultBtn" style="margin-top:12px">Create Recovery File</button><input id="restoreVaultFile" type="file" hidden><button class="secondary" id="chooseVaultBtn" style="margin-top:10px">Restore from Recovery File</button><p class="small-note">Select your saved <strong>.fidunio</strong> recovery file. Restoration requires this signed-in account, the existing PIN, and FIDUNIO recovery authority. Current cloud membership and deletions are checked before local data is activated. Notification and biometric registrations are recreated separately.</p><div id="vaultNote" aria-live="polite"></div>';
  dataHost.appendChild(card);const pin=mountSixDigitPinInput(card.querySelector("#vaultPinHost"),{label:"Existing six-digit FIDUNIO PIN"}),note=card.querySelector("#vaultNote"),create=card.querySelector("#createVaultBtn"),choose=card.querySelector("#chooseVaultBtn"),fileInput=card.querySelector("#restoreVaultFile");
  create.onclick=async()=>{if(pin.value().length!==6){note.innerHTML='<p class="warning-note">Enter your six-digit FIDUNIO PIN.</p>';pin.focus();return;}create.disabled=true;choose.disabled=true;pin.setDisabled(true);create.textContent="Creating encrypted file…";try{if(!await verifyLocalPin(pin.value()))throw new Error("Incorrect FIDUNIO PIN.");const result=await mountedAccountVaultOwner.create(pin.value());downloadVault(result.blob,result.filename);note.innerHTML='<p class="small-note">Recovery file created. Keep it in a location you control.</p>';pin.clear();}catch(err){note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;}finally{create.disabled=false;choose.disabled=false;pin.setDisabled(false);create.textContent="Create Recovery File";}};
  choose.onclick=()=>{if(pin.value().length!==6){note.innerHTML='<p class="warning-note">Enter your six-digit FIDUNIO PIN first.</p>';pin.focus();return;}fileInput.value="";fileInput.click();};
  fileInput.onchange=async()=>{const file=fileInput.files?.[0];if(!file)return;if(!confirm("Restore this FIDUNIO Recovery File? Current local account data will be replaced only after the file and current cloud authority are verified."))return;create.disabled=true;choose.disabled=true;pin.setDisabled(true);choose.textContent="Verifying and restoring…";try{if(!await verifyLocalPin(pin.value()))throw new Error("Incorrect FIDUNIO PIN.");await mountedAccountVaultOwner.restore(file,pin.value());}catch(err){note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;create.disabled=false;choose.disabled=false;pin.setDisabled(false);choose.textContent="Restore from Recovery File";pin.clear();}};
}

function renderLegalSupport(legalHost){
  legalHost.innerHTML=`<div class="card" id="fidunioLegalSupportCard"><h2>Legal & Support</h2><p class="small-note">FIDUNIO requires acceptance of the current Terms of Use and acknowledgement of the Privacy Policy before messaging can open.</p><p><a class="secondary" style="display:block;text-align:center;text-decoration:none;margin-top:10px" href="${esc(FIDUNIO_LEGAL_POLICY.termsUrl)}" target="_blank" rel="noopener">Terms of Use</a><a class="secondary" style="display:block;text-align:center;text-decoration:none;margin-top:10px" href="${esc(FIDUNIO_LEGAL_POLICY.privacyUrl)}" target="_blank" rel="noopener">Privacy Policy</a><a class="secondary" style="display:block;text-align:center;text-decoration:none;margin-top:10px" href="${esc(FIDUNIO_LEGAL_POLICY.supportUrl)}" target="_blank" rel="noopener">Help & Contact Support</a></p><p class="small-note">For abusive behavior, use <strong>Settings → Safety → Report Abuse</strong> or <strong>Blocked Users</strong>. Permanent account deletion is available in your Profile settings.</p><p class="small-note">Terms version: ${esc(FIDUNIO_LEGAL_POLICY.termsVersion)} • Privacy version: ${esc(FIDUNIO_LEGAL_POLICY.privacyVersion)}</p></div>`;
}

async function hydrateAccountPanels(g,shell){
  const profileHost=host(shell,"profile"),usersHost=host(shell,"users"),invitesHost=host(shell,"invites"),encryptionHost=host(shell,"privacy"),notificationsHost=host(shell,"notifications"),safetyHost=host(shell,"safety");
  /* Claim the legacy IDs synchronously so old observer-era modules cannot
     become competing writers while this migration build is being validated. */
  profileHost.innerHTML='<div class="card" id="fidunioProfileCard"><h2>Profile</h2><p class="small-note">Loading profile…</p></div>';
  usersHost.innerHTML='<div class="card" id="fidunioUserAdminCard"><h2>User Administration</h2><p class="small-note">Loading access…</p></div>';
  invitesHost.innerHTML='<div class="card" id="fidunioInvitationAdmin"><h2>Invitations</h2><p class="small-note">Loading invitations…</p></div>';
  try{
    const info=await getFidunioAccessInfo();if(!current(g,shell))return;
    if(!info?.user||!info?.profile){profileHost.innerHTML='<div class="card" id="fidunioProfileCard"><h2>Profile</h2><p class="warning-note">Account profile is unavailable.</p></div>';usersHost.innerHTML="";invitesHost.innerHTML="";return;}
    renderProfile(profileHost,info);await renderAccountDeletion(profileHost,usersHost,info);renderAccountEncryption(encryptionHost,info);renderNotifications(notificationsHost,info);renderSafety(safetyHost,info);renderUserAdmin(usersHost,info);renderInvitations(invitesHost,info);renderAccountVault(host(shell,"data"),info);renderLegalSupport(host(shell,"legal"));
  }catch(err){if(!current(g,shell))return;profileHost.innerHTML=`<div class="card" id="fidunioProfileCard"><h2>Profile</h2><p class="warning-note">${esc(err?.message||String(err))}</p></div>`;usersHost.innerHTML="";invitesHost.innerHTML="";}
}

export function mountSettingsLifecycle({accountVaultOwner}={}){
  if(accountVaultOwner)mountedAccountVaultOwner=accountVaultOwner;
  const settings=document.querySelector(".content.settings");if(!settings)return;
  const g=++generation;
  settings.querySelector(":scope > #fidunioSettingsShell")?.remove();
  /* app.js just rebuilt the base Settings cards. This owner now establishes
     the permanent named areas exactly once for this render generation. */
  const shell=createShell(settings);
  placeBaseCards(settings,shell);
  mountInstallGuidance(host(shell,"install"));
  hydrateAccountPanels(g,shell);
}
