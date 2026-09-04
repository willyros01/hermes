/* FIDUNIO invitation creation modal.
 * Replaces the inline role/expiry selectors with a reliable modal flow on
 * iPad/tablet while preserving the existing invitation result/share UI.
 */
import { createFidunioInvitation } from "./firebase.js";

function esc(s=""){return String(s??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function prettyRole(role){return role==="admin"?"Admin":"User";}
function closeInviteModal(){document.querySelector("#fidunioInviteModal")?.remove();}

function renderInviteResult(admin,invite){
  const result=admin.querySelector("#inviteResult");
  if(!result)return;
  result.innerHTML=`<div class="permission-box" style="margin-top:14px"><strong>Single-use ${esc(prettyRole(invite.role))} invitation</strong><div class="uid-box" style="margin-top:8px;word-break:break-all">${esc(invite.link)}</div><div class="auth-actions" style="margin-top:10px"><button class="secondary" id="copyInviteBtn">Copy Link</button>${navigator.share?'<button class="secondary" id="shareInviteBtn">Share…</button>':""}</div><p class="small-note">Expires ${esc(invite.expiresAt.toLocaleString())}. It becomes unusable after successful account creation.</p></div>`;
  const copy=result.querySelector("#copyInviteBtn");
  copy.onclick=async e=>{try{await navigator.clipboard.writeText(invite.link);e.currentTarget.textContent="Copied";}catch{prompt("Copy invitation link:",invite.link);}};
  const share=result.querySelector("#shareInviteBtn");
  if(share)share.onclick=()=>navigator.share({title:"FIDUNIO invitation",text:`You have been invited to join FIDUNIO as ${prettyRole(invite.role)}.`,url:invite.link}).catch(()=>{});
}

function openInviteModal(admin){
  closeInviteModal();
  const host=document.createElement("div");
  host.id="fidunioInviteModal";
  host.className="modal-backdrop";
  host.innerHTML=`<div class="modal" style="max-width:640px">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><h2 style="margin:0">Create Invitation</h2><button class="text-btn" id="inviteModalX" aria-label="Close" style="font-size:28px;line-height:1">×</button></div>
    <p class="small-note">Choose the new user's role and how long the invitation should remain valid.</p>
    <label class="form-label" for="modalInviteRole">New user's role</label>
    <select class="text-input" id="modalInviteRole"><option value="user">User</option><option value="admin">Admin</option></select>
    <label class="form-label" for="modalInviteDays">Expires</label>
    <select class="text-input" id="modalInviteDays"><option value="1">1 day</option><option value="7" selected>7 days</option><option value="30">30 days</option></select>
    <div class="permission-box" style="margin-top:14px"><p class="small-note" style="margin:0">ⓘ An invitation link will be generated that can be used only once. After the account is created, the link becomes invalid.</p></div>
    <div class="modal-actions"><button class="modal-cancel" id="inviteModalCancel">Cancel</button><button class="modal-confirm" id="inviteModalCreate">Create Invitation</button></div>
    <div id="inviteModalNote"></div>
  </div>`;
  document.body.appendChild(host);
  host.onclick=e=>{if(e.target===host)closeInviteModal();};
  host.querySelector("#inviteModalX").onclick=closeInviteModal;
  host.querySelector("#inviteModalCancel").onclick=closeInviteModal;
  host.querySelector("#inviteModalCreate").onclick=async()=>{
    const btn=host.querySelector("#inviteModalCreate"),note=host.querySelector("#inviteModalNote");
    btn.disabled=true;btn.textContent="Creating…";
    try{
      const role=host.querySelector("#modalInviteRole").value;
      const days=Number(host.querySelector("#modalInviteDays").value);
      const invite=await createFidunioInvitation(role,days);
      renderInviteResult(admin,invite);
      closeInviteModal();
    }catch(err){note.innerHTML=`<p class="warning-note">${esc(err?.message||String(err))}</p>`;btn.disabled=false;btn.textContent="Create Invitation";}
  };
}

function polishInvitationCard(){
  const admin=document.querySelector("#fidunioInvitationAdmin");
  if(!admin)return;
  const btn=admin.querySelector("#createInviteBtn");
  if(!btn||btn.dataset.fidunioModalized==="1")return;
  btn.dataset.fidunioModalized="1";
  const role=admin.querySelector("#inviteRole"),days=admin.querySelector("#inviteDays");
  const roleLabel=role?.closest("label")||role?.previousElementSibling;
  const daysLabel=days?.closest("label")||days?.previousElementSibling;
  if(role)role.style.display="none";
  if(days)days.style.display="none";
  if(roleLabel?.classList?.contains("form-label"))roleLabel.style.display="none";
  if(daysLabel?.classList?.contains("form-label"))daysLabel.style.display="none";
  btn.onclick=()=>openInviteModal(admin);
}

let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;polishInvitationCard();});}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{subtree:true,childList:true});polishInvitationCard();
