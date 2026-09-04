/* FIDUNIO New Message user-facing recipient picker.
 * Keep the existing direct-conversation handler as the single action path:
 * this layer resolves a display name to the user's UID, places that UID in the
 * existing hidden field, then invokes the existing Start Conversation button.
 */
import { listCloudUsers } from "./firebase.js";

function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
const loadedCards=new WeakSet();

function displayName(user){return String(user?.displayName||user?.email||"FIDUNIO user").trim();}
function initials(name){
  const parts=String(name||"").trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0,2).map(x=>x[0]?.toUpperCase()||"").join("")||"F").slice(0,2);
}
function renderPeople(list,users,query=""){
  const q=String(query||"").trim().toLocaleLowerCase();
  const rows=users.filter(user=>displayName(user).toLocaleLowerCase().includes(q));
  list.innerHTML="";
  if(!rows.length){
    const empty=document.createElement("p");empty.className="small-note";empty.textContent=q?"No matching FIDUNIO users.":"No other FIDUNIO users are available.";list.appendChild(empty);return;
  }
  for(const user of rows){
    const name=displayName(user);
    const btn=document.createElement("button");btn.type="button";btn.className="big-choice fidunio-recipient-choice";
    btn.innerHTML=`<span class="choice-icon" aria-hidden="true">${initials(name)}</span><span><strong></strong><span>FIDUNIO contact</span></span>`;
    btn.querySelector("strong").textContent=name;
    btn.addEventListener("click",()=>{
      const card=list.closest(".card"),uidInput=card?.querySelector("#peerUid"),start=card?.querySelector("#cloudDirectBtn");
      if(!uidInput||!start)return;
      uidInput.value=user.uid;
      start.click();
    });
    list.appendChild(btn);
  }
}
async function installRecipientPicker(card){
  if(!card||loadedCards.has(card))return;loadedCards.add(card);
  const uidInput=card.querySelector("#peerUid"),start=card.querySelector("#cloudDirectBtn");
  if(!uidInput||!start)return;

  const label=card.querySelector('label[for="peerUid"]');
  if(label)label.hidden=true;
  uidInput.hidden=true;
  start.hidden=true;

  const picker=document.createElement("div");picker.className="fidunio-recipient-picker";
  const search=document.createElement("input");search.type="search";search.className="search";search.autocomplete="off";search.placeholder="Search by display name";search.setAttribute("aria-label","Search FIDUNIO users by display name");
  const list=document.createElement("div");list.className="choice-list fidunio-recipient-list";
  const loading=document.createElement("p");loading.className="small-note";loading.textContent="Loading FIDUNIO users…";list.appendChild(loading);
  picker.append(search,list);
  uidInput.before(picker);

  try{
    const users=await listCloudUsers();
    if(!picker.isConnected)return;
    renderPeople(list,users);
    search.addEventListener("input",()=>renderPeople(list,users,search.value));
  }catch(err){
    if(!picker.isConnected)return;
    list.innerHTML="";
    const note=document.createElement("p");note.className="warning-note";note.textContent="Could not load FIDUNIO contacts. Please try again.";list.appendChild(note);
    console.warn("FIDUNIO recipient list could not be loaded",err);
  }
}

function polishNewMessage(){
  const heading=[...document.querySelectorAll('.content .card h2')].find(h=>/^FIDUNIO ID\s*—/.test(h.textContent.trim())||h.textContent.trim()==='Start a Conversation');
  if(heading){
    const card=heading.closest('.card');
    setText(heading,'Choose a Person');
    const note=card?.querySelector('.small-note');
    if(note)setText(note,'Select a FIDUNIO user by display name.');
    const warning=card?.querySelector('.warning-note');
    if(warning)setText(warning,'Private one-to-one messages are end-to-end encrypted.');
    installRecipientPicker(card);
  }
  const groupCard=[...document.querySelectorAll('.content .big-choice,.content .card')].find(el=>el.textContent?.includes('New Group'));
  if(groupCard){
    const subtitle=[...groupCard.querySelectorAll('span,p')].find(el=>el.textContent?.trim()==='Create a secure group conversation');
    if(subtitle)setText(subtitle,'Create a group and choose its members');
  }
}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;polishNewMessage();});}
const root=document.querySelector('#app')||document.body;
new MutationObserver(()=>schedule()).observe(root,{subtree:true,childList:true});
polishNewMessage();
