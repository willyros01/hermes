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
function keepAboutAbsoluteLast(settings){
  const about=[...settings.querySelectorAll(":scope > .card")].find(card=>card.querySelector("h2")?.textContent?.trim()==="About");
  if(!about)return;
  if(about!==settings.lastElementChild)settings.appendChild(about);
}
function polishSettings(){
  const settings=document.querySelector(".content.settings");if(!settings)return;
  for(const card of settings.querySelectorAll(":scope > .card")){
    const title=card.querySelector("h2")?.textContent?.trim();
    if(title==="Firebase Account")collapseTechnicalCard(card,"Firebase Account");
    if(title==="Device Identity")collapseTechnicalCard(card,"Device Identity");
  }
  keepAboutAbsoluteLast(settings);
}
const observer=new MutationObserver(polishSettings);observer.observe(document.documentElement,{subtree:true,childList:true});polishSettings();
