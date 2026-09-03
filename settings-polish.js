/* FIDUNIO settings polish: keep technical identifiers available without dominating Settings. */
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
function cardByTitle(settings,title){return[...settings.querySelectorAll(":scope > .card")].find(card=>card.querySelector("h2")?.textContent?.trim()===title)||null;}
function arrangeSettings(settings){
  const privacy=cardByTitle(settings,"Privacy & Access"),text=cardByTitle(settings,"Text Size"),appearance=cardByTitle(settings,"Appearance"),data=cardByTitle(settings,"Data"),firebase=cardByTitle(settings,"Firebase Account"),device=cardByTitle(settings,"Device Identity"),prototype=cardByTitle(settings,"Prototype connectivity"),profile=settings.querySelector(":scope > #fidunioProfileCard"),invites=settings.querySelector(":scope > #fidunioInvitationAdmin"),about=cardByTitle(settings,"About"),footer=settings.querySelector(":scope > .version-footer");
  if(prototype)prototype.remove();
  const ordered=[privacy,text,appearance,data,firebase,device,profile,invites,footer,about].filter(Boolean);
  for(const node of ordered)settings.appendChild(node);
  const all=[...settings.children];
  all.forEach(el=>{el.classList.remove("fidunio-settings-left","fidunio-settings-right","fidunio-settings-full");});
  [privacy,appearance,firebase,profile].filter(Boolean).forEach(el=>el.classList.add("fidunio-settings-left"));
  [text,data,device,invites].filter(Boolean).forEach(el=>el.classList.add("fidunio-settings-right"));
  [footer,about].filter(Boolean).forEach(el=>el.classList.add("fidunio-settings-full"));
}
function polishSettings(){
  const settings=document.querySelector(".content.settings");if(!settings)return;
  for(const card of settings.querySelectorAll(":scope > .card")){
    const title=card.querySelector("h2")?.textContent?.trim();
    if(title==="Firebase Account")collapseTechnicalCard(card,"Firebase Account");
    if(title==="Device Identity")collapseTechnicalCard(card,"Device Identity");
  }
  arrangeSettings(settings);
}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;polishSettings();});}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{subtree:true,childList:true});polishSettings();
