/* FIDUNIO system administration: account lifecycle + invitation revoke. */
const SDK_VERSION="12.18.0";
let mountedForUid="";
let apiPromise=null;
function esc(s=""){return String(s??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function api(){if(apiPromise)return apiPromise;apiPromise=Promise.all([import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`),import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`)]).then(([appSdk,authSdk,fsSdk])=>{const app=appSdk.getApp();return{auth:authSdk.getAuth(app),db:fsSdk.getFirestore(app),authSdk,fsSdk};});return apiPromise;}
function profileStatus(p){if(p?.active===false)return p.status||"suspended";return p?.status||"active";}
function dateText(ts){const d=ts?.toDate?.();return d?d.toLocaleDateString():"Never";}
async function currentAccess(){const s=await api(),u=s.auth.currentUser;if(!u)return null;const snap=await s.fsSdk.getDoc(s.fsSdk.doc(s.db,"users",u.uid));if(!snap.exists())return null;return{user:u,profile:{uid:snap.id,...snap.data()}};}
async function listUsers(){const s=await api(),snap=await s.fsSdk.getDocs(s.fsSdk.collection(s.db,"users"));return snap.docs.map(d=>({uid:d.id,...d.data()})).sort((a,b)=>String(a.displayName||a.email||a.uid).localeCompare(String(b.displayName||b.email||b.uid)));}
async function listInvites(){const s=await api(),snap=await s.fsSdk.getDocs(s.fsSdk.collection(s.db,"invitations"));return snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));}
async function updateLifecycle(target,status,expiryDays=null){const s=await api(),me=s.auth.currentUser;if(!me)throw new Error("Sign in first.");const now=s.fsSdk.serverTimestamp(),ref=s.fsSdk.doc(s.db,"users",target.uid),row={status,active:status==="active",adminUpdatedAt:now,adminUpdatedByUid:me.uid};
  if(expiryDays!==undefined){row.expiresAt=expiryDays===null?null:s.fsSdk.Timestamp.fromDate(new Date(Date.now()+Number(expiryDays)*86400000));}
  if(status==="suspended"){row.suspendedAt=now;row.suspendedByUid=me.uid;row.restoredAt=null;row.restoredByUid=null;}
  if(status==="active"){row.restoredAt=now;row.restoredByUid=me.uid;row.suspendedAt=null;row.suspendedByUid=null;row.deactivatedAt=null;row.deactivatedByUid=null;}
  if(status==="deactivated"){row.deactivatedAt=now;row.deactivatedByUid=me.uid;}
  await s.fsSdk.updateDoc(ref,row);
}
async function setExpiration(target,days){const status=profileStatus(target);await updateLifecycle(target,status,days==="never"?null:Number(days));}
async function revokeInvitation(invite){const s=await api();await s.fsSdk.updateDoc(s.fsSdk.doc(s.db,"invitations",invite.id),{status:"revoked",revokedAt:s.fsSdk.serverTimestamp()});}
function closeModal(){document.querySelector("#fidunioAdminModal")?.remove();}
async function openAdmin(){
  const access=await currentAccess();if(!access||!["owner","admin"].includes(access.profile.systemRole))return;
  const old=document.querySelector("#fidunioAdminModal");if(old)old.remove();
  const host=document.createElement("div");host.id="fidunioAdminModal";host.className="modal-backdrop";host.innerHTML='<div class="modal" style="max-width:920px"><h2>User Administration</h2><p class="small-note">Loading FIDUNIO users and invitations…</p></div>';document.body.appendChild(host);host.onclick=e=>{if(e.target===host)closeModal();};
  try{
    const [users,invites]=await Promise.all([listUsers(),listInvites()]);const role=access.profile.systemRole;
    const rows=users.map(u=>{const status=profileStatus(u),isSelf=u.uid===access.user.uid,canManage=!isSelf&&u.systemRole!=="owner"&&(u.systemRole!=="admin"||role==="owner");return `<div class="permission-box" style="margin-top:10px"><div class="row-main"><strong>${esc(u.displayName||u.email||"FIDUNIO user")}</strong><span>${esc(u.email||"")} • ${esc((u.systemRole||"user").toUpperCase())} • ${esc(status.toUpperCase())}${u.expiresAt?` • Expires ${esc(dateText(u.expiresAt))}`:" • No expiration"}</span></div>${canManage?`<div class="auth-actions" style="margin-top:8px"><button class="secondary adminStatusBtn" data-uid="${esc(u.uid)}" data-action="${status==="active"?"suspended":"active"}">${status==="active"?"Suspend":"Restore"}</button><button class="secondary adminDeactivateBtn" data-uid="${esc(u.uid)}">Deactivate</button></div><div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-top:8px"><label class="form-label" style="margin:0">Expiration<select class="text-input adminExpiry" data-uid="${esc(u.uid)}" style="margin-top:5px"><option value="never">Never</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select></label><button class="secondary adminExpiryBtn" data-uid="${esc(u.uid)}" style="width:auto">Apply</button></div>`:`<p class="small-note">${isSelf?"Current account":u.systemRole==="owner"?"Owner account is protected":"Only the Owner can manage another Admin"}</p>`}</div>`;}).join("");
    const pending=invites.filter(i=>i.status==="pending");const inviteRows=pending.length?pending.map(i=>`<div class="row"><div class="row-main"><strong>${esc((i.role||"user").toUpperCase())} invitation</strong><span>Created by ${esc(i.invitedByName||"Administrator")} • Expires ${esc(dateText(i.expiresAt))}</span></div><button class="row-action revokeInviteBtn" data-id="${esc(i.id)}">Revoke</button></div>`).join(""):'<p class="small-note">No pending invitations.</p>';
    host.querySelector(".modal").innerHTML=`<h2>User Administration</h2><p class="small-note">Suspend or restore access without deleting message/group history. Expiration is enforced by Firestore access rules.</p><div class="section-title">Users</div>${rows}<div class="section-title">Pending Invitations</div><div class="card">${inviteRows}</div><div class="modal-actions"><button class="modal-cancel" id="adminCloseBtn">Close</button></div>`;
    host.querySelector("#adminCloseBtn").onclick=closeModal;
    host.querySelectorAll(".adminStatusBtn").forEach(btn=>btn.onclick=async()=>{const u=users.find(x=>x.uid===btn.dataset.uid);btn.disabled=true;try{await updateLifecycle(u,btn.dataset.action);await openAdmin();}catch(e){alert(e?.message||String(e));btn.disabled=false;}});
    host.querySelectorAll(".adminDeactivateBtn").forEach(btn=>btn.onclick=async()=>{const u=users.find(x=>x.uid===btn.dataset.uid);if(!confirm(`Deactivate ${u.displayName||u.email||"this account"}?`))return;btn.disabled=true;try{await updateLifecycle(u,"deactivated");await openAdmin();}catch(e){alert(e?.message||String(e));btn.disabled=false;}});
    host.querySelectorAll(".adminExpiryBtn").forEach(btn=>btn.onclick=async()=>{const u=users.find(x=>x.uid===btn.dataset.uid),sel=host.querySelector(`.adminExpiry[data-uid="${CSS.escape(btn.dataset.uid)}"]`);btn.disabled=true;try{await setExpiration(u,sel.value);await openAdmin();}catch(e){alert(e?.message||String(e));btn.disabled=false;}});
    host.querySelectorAll(".revokeInviteBtn").forEach(btn=>btn.onclick=async()=>{const i=invites.find(x=>x.id===btn.dataset.id);btn.disabled=true;try{await revokeInvitation(i);await openAdmin();}catch(e){alert(e?.message||String(e));btn.disabled=false;}});
  }catch(e){host.querySelector(".modal").innerHTML=`<h2>User Administration</h2><p class="warning-note">${esc(e?.message||String(e))}</p><button class="secondary" id="adminCloseBtn">Close</button>`;host.querySelector("#adminCloseBtn").onclick=closeModal;}
}
async function mount(){
  const settings=document.querySelector(".content.settings");if(!settings)return;
  const access=await currentAccess().catch(()=>null);if(!access||!["owner","admin"].includes(access.profile.systemRole)){document.querySelector("#fidunioUserAdminCard")?.remove();return;}
  if(document.querySelector("#fidunioUserAdminCard"))return;
  const card=document.createElement("div");card.className="card";card.id="fidunioUserAdminCard";card.innerHTML='<h2>User Administration</h2><p class="small-note">Manage user access, suspension, restoration, expiration, and pending invitations.</p><button class="secondary" id="manageUsersBtn">Manage Users & Access</button>';settings.appendChild(card);card.querySelector("#manageUsersBtn").onclick=openAdmin;mountedForUid=access.user.uid;
}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();});}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{subtree:true,childList:true});mount();
