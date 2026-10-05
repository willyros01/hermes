import {FIDUNIO_LEGAL_POLICY,FIDUNIO_TERMS_SECTIONS,legalAcceptanceIsCurrent} from "./legal-policy.js";

const DEVICE_KEY="fidunio:terms";

function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function shell(inner){
  document.querySelector("#app").innerHTML=`<main class="app-shell unlock startup-terms"><section class="unlock-card" style="max-width:620px"><div class="unlock-brand"><img class="brand-logo" src="fidunio-logo.png" alt="FIDUNIO logo"></div><h1>FIDUNIO</h1><p>Private Messaging</p>${inner}</section></main>`;
}
export function readStartupTermsAcceptance(){
  try{
    const row=JSON.parse(localStorage.getItem(DEVICE_KEY)||"null");
    return legalAcceptanceIsCurrent(row)?row:null;
  }catch{return null;}
}
function saveStartupTermsAcceptance(){
  const row={accepted:true,termsVersion:FIDUNIO_LEGAL_POLICY.termsVersion,privacyVersion:FIDUNIO_LEGAL_POLICY.privacyVersion,acceptedAt:new Date().toISOString(),source:"device"};
  localStorage.setItem(DEVICE_KEY,JSON.stringify(row));
  return row;
}
function termsBody(){
  return FIDUNIO_TERMS_SECTIONS.map(([h,p])=>`<h3 style="margin:18px 0 6px">${esc(h)}</h3><p class="small-note" style="text-align:left">${esc(p)}</p>`).join("");
}
function renderTerms(resolve){
  shell(`<h2>Terms of Use</h2><p class="small-note"><strong>Please read these terms. You must accept them before using FIDUNIO.</strong></p><div class="startup-terms-body" tabindex="0" aria-label="Terms text">${termsBody()}</div><p class="small-note"><a href="${esc(FIDUNIO_LEGAL_POLICY.termsUrl)}" target="_blank" rel="noopener">Full Terms of Use</a> • <a href="${esc(FIDUNIO_LEGAL_POLICY.privacyUrl)}" target="_blank" rel="noopener">Privacy Policy</a> • <a href="${esc(FIDUNIO_LEGAL_POLICY.supportUrl)}" target="_blank" rel="noopener">Support</a></p><label class="form-label" style="display:flex;gap:10px;align-items:flex-start;margin-top:14px;text-align:left"><input type="checkbox" id="startupTermsTick" style="margin-top:4px"> <span>I have read and agree to the FIDUNIO Terms of Use and acknowledge the Privacy Policy.</span></label><p class="small-note">By tapping Accept, you agree to these terms. If you decline, FIDUNIO stays locked.</p><div class="startup-terms-actions"><button class="secondary" id="startupTermsDecline">Decline</button><button class="primary" id="startupTermsAccept" style="margin-top:10px" disabled>Accept</button></div>`);
  const tick=document.querySelector("#startupTermsTick"),accept=document.querySelector("#startupTermsAccept");
  tick.onchange=()=>{accept.disabled=!tick.checked;};
  accept.onclick=()=>{if(!tick.checked)return;saveStartupTermsAcceptance();resolve(true);};
  document.querySelector("#startupTermsDecline").onclick=()=>{
    shell('<h2>Terms declined</h2><p class="warning-note">FIDUNIO cannot be used unless you accept the Terms of Use.</p><button class="primary" id="startupTermsAgain">Read the Terms Again</button>');
    document.querySelector("#startupTermsAgain").onclick=()=>renderTerms(resolve);
  };
}
export async function ensureStartupTermsAccepted(){
  if(readStartupTermsAcceptance())return true;
  return new Promise(resolve=>renderTerms(resolve));
}
