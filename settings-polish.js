/* FIDUNIO Settings layout/polish. Tablet landscape uses two independent
 * vertical columns so a tall Profile card never creates empty grid rows.
 * IMPORTANT: DOM placement is idempotent. Re-appending an already placed card
 * causes a MutationObserver/render loop on iPad Safari and can make form
 * controls appear untappable.
 */
function copyText(text,button){
  const value=String(text||"").trim();if(!value)return;
  navigator.clipboard?.writeText(value).then(()=>{const old=button.textContent;button.textContent="Copied";setTimeout(()=>button.textContent=old,1200);}).catch(()=>prompt("Copy details:",value));
}
function collapseTechnicalCard(card,title){
  if(!card||card.dataset.fidunioCollapsed==="1")return;card.dataset.fidunioCollapsed="1";
  const heading=card.querySelector("h2");if(!heading)return;
  const details=document.createElement("div");details.className="fidunio-tech-details";details.hidden=true;
  while(heading.nextSibling)details.appendChild(heading.nextSibling);
  const toggle=document.createElement("button");toggle.className="secondary";toggle.type="button";toggle.textContent=`Show ${title}`;toggle.setAttribute("aria-expanded","false");
  const copy=document.createElement("button");copy.className="secondary";copy.type="button";copy.textContent="Copy Details";copy.style.marginTop="10px";copy.hidden=true;
  toggle.onclick=()=>{const open=details.hidden;details.hidden=!open;copy.hidden=!open;toggle.textContent=`${open?"Hide":"Show"} ${title}`;toggle.setAttribute("aria-expanded",String(open));};
  copy.onclick=()=>copyText(details.innerText,copy);card.appendChild(toggle);card.appendChild(details);card.appendChild(copy);
}
function allCards(settings){return[...settings.querySelectorAll(":scope > .card, :scope > .fidunio-settings-columns > .fidunio-settings-column > .card")];}
function cardByTitle(settings,title){return allCards(settings).find(card=>card.querySelector("h2")?.textContent?.trim()===title)||null;}
function ensureColumns(settings){
  let host=settings.querySelector(":scope > #fidunioSettingsColumns");
  if(!host){host=document.createElement("div");host.id="fidunioSettingsColumns";host.className="fidunio-settings-columns";host.innerHTML='<div class="fidunio-settings-column fidunio-settings-leftcol"></div><div class="fidunio-settings-column fidunio-settings-rightcol"></div>';settings.prepend(host);}
  return{host,left:host.querySelector(".fidunio-settings-leftcol"),right:host.querySelector(".fidunio-settings-rightcol")};
}
function placeIfNeeded(node,parent){if(node&&node.parentElement!==parent)parent.appendChild(node);}
function arrangeSettings(settings){
  const prototype=cardByTitle(settings,"Prototype connectivity");if(prototype)prototype.remove();
  const {host,left,right}=ensureColumns(settings);
  const firebase=cardByTitle(settings,"Firebase Account"),profile=settings.querySelector("#fidunioProfileCard"),userAdmin=settings.querySelector("#fidunioUserAdminCard");
  const appearance=cardByTitle(settings,"Appearance"),text=cardByTitle(settings,"Text Size"),data=cardByTitle(settings,"Data"),device=cardByTitle(settings,"Device Identity"),privacy=cardByTitle(settings,"Privacy & Access"),invites=settings.querySelector("#fidunioInvitationAdmin");
  /* Privacy & Access becomes substantially taller after a PIN is configured.
   * Keep it in the left column with the account cards so tablet landscape stays
   * visually balanced without measuring heights or repeatedly moving cards. */
  [firebase,profile,userAdmin,privacy].filter(Boolean).forEach(node=>placeIfNeeded(node,left));
  [appearance,text,data,device,invites].filter(Boolean).forEach(node=>placeIfNeeded(node,right));
  const about=cardByTitle(settings,"About"),footer=settings.querySelector(":scope > .version-footer");
  [...settings.querySelectorAll(":scope > .card")].filter(c=>c!==about).forEach(c=>placeIfNeeded(c,right));
  if(footer&&footer.parentElement!==settings)settings.appendChild(footer);
  if(about&&about.parentElement!==settings)settings.appendChild(about);
  if(host!==settings.firstElementChild)settings.prepend(host);
}
function polishSettings(){
  const settings=document.querySelector(".content.settings");if(!settings)return;
  for(const card of allCards(settings)){
    const title=card.querySelector("h2")?.textContent?.trim();
    if(title==="Firebase Account")collapseTechnicalCard(card,"Firebase Account");
    if(title==="Device Identity")collapseTechnicalCard(card,"Device Identity");
  }
  arrangeSettings(settings);
}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;polishSettings();});}
/* Observe only the app root. Ignore mutations that occur entirely inside the
 * already-arranged Settings columns; those are normal live UI updates and do
 * not require another layout pass. This prevents needless iOS Safari repaints. */
const appRoot=document.querySelector("#app")||document.body;
const observer=new MutationObserver(records=>{
  const needsLayout=records.some(record=>{
    const target=record.target instanceof Element?record.target:record.target?.parentElement;
    return !target?.closest?.("#fidunioSettingsColumns");
  });
  if(needsLayout)schedule();
});
observer.observe(appRoot,{subtree:true,childList:true});polishSettings();
