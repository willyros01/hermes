/* FIDUNIO Settings layout/polish.
 * Wide tablet/landscape uses one stable sidebar plus one content pane.
 * Narrow/mobile keeps the established stacked Settings cards.
 * DOM placement is idempotent to avoid Safari MutationObserver churn.
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
function allCards(settings){
  return[...settings.querySelectorAll(":scope > .card, :scope > #fidunioSettingsShell .card")];
}
function cardByTitle(settings,title){return allCards(settings).find(card=>card.querySelector("h2")?.textContent?.trim()===title)||null;}
function placeIfNeeded(node,parent){if(node&&node.parentElement!==parent)parent.appendChild(node);}

const GROUPS=[
  {id:"general",label:"General",icon:"⚙︎",subtitle:"Appearance, text size, and account information.",cards:["Appearance","Text Size","Firebase Account"]},
  {id:"privacy",label:"Privacy & Access",icon:"🔒",subtitle:"Local PIN, device unlock, inactivity lock, and device identity.",cards:["Privacy & Access","Device Identity"]},
  {id:"profile",label:"Profile",icon:"●",subtitle:"Your personal information and how you appear to other FIDUNIO users.",selectors:["#fidunioProfileCard"]},
  {id:"users",label:"User Administration",icon:"◉",subtitle:"Manage account status, roles, and expiration.",selectors:["#fidunioUserAdminCard"]},
  {id:"invites",label:"Invitations",icon:"✉︎",subtitle:"Create and manage FIDUNIO invitations.",selectors:["#fidunioInvitationAdmin"]},
  {id:"data",label:"Data",icon:"▤",subtitle:"Local data and storage controls.",cards:["Data"]},
  {id:"about",label:"About",icon:"ⓘ",subtitle:"FIDUNIO information and version details.",cards:["About"]}
];
/* On narrow/iPhone Settings, Profile should be the first stacked section.
 * Wide sidebar navigation keeps the established menu order above. */
const PANEL_GROUPS=[GROUPS.find(g=>g.id==="profile"),...GROUPS.filter(g=>g.id!=="profile")];
let activeGroup="profile";

function ensureShell(settings){
  let shell=settings.querySelector(":scope > #fidunioSettingsShell");
  if(shell)return shell;
  shell=document.createElement("div");shell.id="fidunioSettingsShell";
  shell.innerHTML='<aside id="fidunioSettingsNav" aria-label="Settings sections"><h2>Settings</h2><div class="fidunio-settings-nav-list"></div></aside><div class="fidunio-settings-panels"></div>';
  settings.prepend(shell);
  return shell;
}
function ensurePanel(panels,group){
  let panel=panels.querySelector(`#fidunioSettingsPanel-${group.id}`);
  if(!panel){
    panel=document.createElement("section");
    panel.id=`fidunioSettingsPanel-${group.id}`;
    panel.className="fidunio-settings-panel";
    panel.dataset.group=group.id;
    const title=document.createElement("h2");title.className="fidunio-settings-panel-title";title.textContent=group.label;
    const subtitle=document.createElement("p");subtitle.className="fidunio-settings-panel-subtitle";subtitle.textContent=group.subtitle;
    panel.append(title,subtitle);
    panels.appendChild(panel);
  }
  return panel;
}
function updateSelection(shell){
  shell.querySelectorAll(".fidunio-settings-nav-btn").forEach(btn=>{
    const active=btn.dataset.group===activeGroup;
    btn.classList.toggle("is-active",active);
    btn.setAttribute("aria-current",active?"page":"false");
  });
  shell.querySelectorAll(".fidunio-settings-panel").forEach(panel=>panel.classList.toggle("is-active",panel.dataset.group===activeGroup));
}
function ensureNav(shell){
  const list=shell.querySelector(".fidunio-settings-nav-list");
  for(const group of GROUPS){
    let btn=list.querySelector(`[data-group="${group.id}"]`);
    if(!btn){
      btn=document.createElement("button");btn.type="button";btn.className="fidunio-settings-nav-btn";btn.dataset.group=group.id;
      btn.innerHTML=`<span class="fidunio-settings-nav-icon" aria-hidden="true">${group.icon}</span><span>${group.label}</span><span class="fidunio-settings-nav-arrow" aria-hidden="true">›</span>`;
      btn.addEventListener("click",()=>{activeGroup=group.id;updateSelection(shell);shell.querySelector(`#fidunioSettingsPanel-${group.id}`)?.scrollIntoView({block:"start"});});
      list.appendChild(btn);
    }
  }
}
function arrangeSettings(settings){
  const prototype=cardByTitle(settings,"Prototype connectivity");if(prototype)prototype.remove();
  const shell=ensureShell(settings),panels=shell.querySelector(".fidunio-settings-panels");
  ensureNav(shell);
  const assigned=new Set();
  for(const group of PANEL_GROUPS){
    const panel=ensurePanel(panels,group);
    /* Keep panel DOM order stable so narrow/mobile shows Profile first. */
    panels.appendChild(panel);
    const nodes=[];
    for(const title of group.cards||[]){const card=cardByTitle(settings,title);if(card)nodes.push(card);}
    for(const selector of group.selectors||[]){const card=settings.querySelector(selector);if(card)nodes.push(card);}
    for(const node of nodes){assigned.add(node);placeIfNeeded(node,panel);}
  }
  const general=ensurePanel(panels,GROUPS[0]);
  for(const card of allCards(settings)){if(!assigned.has(card))placeIfNeeded(card,general);}
  const footer=settings.querySelector(":scope > .version-footer");
  if(footer){footer.id="fidunioSettingsFooter";if(footer.parentElement!==settings)settings.appendChild(footer);}
  if(shell!==settings.firstElementChild)settings.prepend(shell);
  updateSelection(shell);
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
const appRoot=document.querySelector("#app")||document.body;
const observer=new MutationObserver(records=>{
  const needsLayout=records.some(record=>{
    const target=record.target instanceof Element?record.target:record.target?.parentElement;
    return !target?.closest?.("#fidunioSettingsShell");
  });
  if(needsLayout)schedule();
});
observer.observe(appRoot,{subtree:true,childList:true});polishSettings();
