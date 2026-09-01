const app = document.querySelector("#app");

const contacts = [
  {id:"u1", name:"Maria Santos"},
  {id:"u2", name:"John Cruz"},
  {id:"u3", name:"Peter Lee"},
  {id:"u4", name:"Robert Cruz"},
  {id:"u5", name:"Ana Reyes"}
];

let state = {
  unlocked:false,
  route:"messages",
  previousRoute:"messages",
  online:navigator.onLine,
  selectedId:1,
  toolsOpen:false,
  newGroupMembers:[],
  newGroupName:"",
  modal:null,
  quickPhrases:["Yes","No","OK","On my way","Running late","Call me"],
  conversations:[
    {id:1,type:"direct",name:"Maria Santos",unread:2,preview:"I'll call you later.",time:"2:31 PM"},
    {id:2,type:"direct",name:"John Cruz",unread:0,preview:"See you tomorrow.",time:"11:20 AM"},
    {
      id:3,type:"group",name:"Family Group",unread:0,preview:"Dinner around 7?",time:"Yesterday",
      ownerId:"me", members:[
        {id:"me",name:"You",role:"Owner",joinedAt:"Before history",historyAccess:"all"},
        {id:"u1",name:"Maria Santos",role:"Member",joinedAt:"Before history",historyAccess:"all"},
        {id:"u2",name:"John Cruz",role:"Member",joinedAt:"Today, 2:15 PM",historyAccess:"from_join"}
      ]
    }
  ],
  messages:{
    1:[
      {id:"m1",mine:false,text:"Are we meeting tomorrow?",time:"10:31 AM",state:"read"},
      {id:"m2",mine:true,text:"Yes, around 9.",time:"10:32 AM",state:"read"}
    ],
    2:[
      {id:"j1",mine:false,text:"See you tomorrow.",time:"11:20 AM",state:"read"}
    ],
    3:[
      {id:"f0",mine:false,sender:"Maria Santos",text:"I picked up the groceries.",time:"1:48 PM",state:"read",historical:true},
      {id:"join",system:true,text:"John joined the group • Earlier messages hidden by default",time:"2:15 PM"},
      {id:"f1",mine:false,sender:"Maria Santos",text:"Dinner around 7?",time:"2:19 PM",state:"read"},
      {id:"f2",mine:true,text:"7 works for me.",time:"2:22 PM",state:"read"}
    ]
  },
  settings:{previews:false,autoLock:true,largeText:false,wifiAttachments:true}
};

function esc(s=""){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function initials(name){ return name.split(" ").slice(0,2).map(x=>x[0]).join("").toUpperCase(); }
function nowTime(){ return new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}); }
function currentConversation(){ return state.conversations.find(x=>x.id===state.selectedId); }
function isGroup(c=currentConversation()){ return c?.type==="group"; }

function shellTop(title,left=`<span class="topbar-spacer"></span>`,right=`<span class="topbar-spacer"></span>`){
  return `<header class="topbar">${left}<h1>${esc(title)}</h1>${right}</header>`;
}

function render(){
  document.documentElement.style.fontSize=state.settings.largeText?"18px":"16px";
  if(!state.unlocked) return renderUnlock();
  const routes={
    messages:renderMessages, chat:renderChat, settings:renderSettings,
    newConversation:renderNewConversation, newGroup:renderNewGroup,
    groupName:renderGroupName, groupInfo:renderGroupInfo
  };
  (routes[state.route]||renderMessages)();
  if(state.modal) renderModal();
}

function renderUnlock(){
  app.innerHTML=`
    <main class="app-shell unlock">
      <section class="unlock-card">
        <div class="lock-mark">🔒</div>
        <h1>Hermes</h1>
        <p>Secure access prototype. Production will use passkeys/device authentication where supported.</p>
        <button class="primary" id="unlockBtn">Unlock with device</button>
        <button class="secondary" id="pinBtn">Use PIN instead</button>
        <div class="small-note">Hermes UX Prototype 0.2 — no real biometric or PIN validation yet.</div>
      </section>
    </main>`;
  document.querySelector("#unlockBtn").onclick=()=>{state.unlocked=true;render()};
  document.querySelector("#pinBtn").onclick=()=>{state.unlocked=true;render()};
}

function renderMessages(){
  app.innerHTML=`
    <main class="app-shell">
      ${shellTop("Messages",undefined,'<button class="icon-btn" id="settingsBtn" aria-label="Settings">⚙︎</button>')}
      <section class="content">
        <input class="search" id="searchBox" placeholder="Search conversations" />
        <div class="conversation-list" id="conversationList"></div>
      </section>
      <button class="fab" id="newBtn" aria-label="New conversation">＋</button>
    </main>`;
  document.querySelector("#settingsBtn").onclick=()=>{state.route="settings";render()};
  document.querySelector("#newBtn").onclick=()=>{state.route="newConversation";render()};
  const list=document.querySelector("#conversationList");
  const draw=(term="")=>{
    list.innerHTML=state.conversations
      .filter(c=>c.name.toLowerCase().includes(term.toLowerCase())||c.preview.toLowerCase().includes(term.toLowerCase()))
      .map(c=>`
        <button class="conversation" data-id="${c.id}">
          <div class="avatar ${c.type==="group"?"group-avatar":""}">${initials(c.name)}</div>
          <div>
            <div class="name">${esc(c.name)}</div>
            <div class="preview">${c.type==="group"?"Group • ":""}${esc(c.preview)}</div>
          </div>
          <div class="meta">${esc(c.time)}${c.unread?`<div class="badge">${c.unread}</div>`:""}</div>
        </button>`).join("");
    list.querySelectorAll(".conversation").forEach(btn=>btn.onclick=()=>{
      state.selectedId=Number(btn.dataset.id); state.route="chat";
      state.conversations.find(x=>x.id===state.selectedId).unread=0; render();
    });
  };
  draw();
  document.querySelector("#searchBox").oninput=e=>draw(e.target.value);
}

function renderNewConversation(){
  app.innerHTML=`
    <main class="app-shell">
      ${shellTop("New Message",'<button class="back-btn" id="backBtn">‹</button>')}
      <section class="content">
        <div class="action-sheet">
          <button class="big-choice" id="newGroupBtn">
            <span class="choice-icon">👥</span>
            <span><strong>New Group</strong><span>Create a secure group conversation</span></span>
          </button>
        </div>
        <div class="section-title">Start a conversation</div>
        <div class="choice-list">
          ${contacts.map(p=>`
            <button class="member-option direct-contact" data-id="${p.id}">
              <div class="avatar">${initials(p.name)}</div>
              <div><strong>${esc(p.name)}</strong><div class="preview">Secure contact</div></div>
              <span>›</span>
            </button>`).join("")}
        </div>
      </section>
    </main>`;
  document.querySelector("#backBtn").onclick=()=>{state.route="messages";render()};
  document.querySelector("#newGroupBtn").onclick=()=>{
    state.newGroupMembers=[];state.newGroupName="";state.route="newGroup";render();
  };
  document.querySelectorAll(".direct-contact").forEach(btn=>btn.onclick=()=>alert("Direct-conversation creation remains a UX placeholder in 0.2."));
}

function renderNewGroup(){
  app.innerHTML=`
    <main class="app-shell">
      ${shellTop("New Group",'<button class="back-btn" id="backBtn">‹</button>','<button class="text-btn" id="nextBtn">Next</button>')}
      <section class="content">
        <input class="search" id="memberSearch" placeholder="Search people" />
        <div class="chip-row" id="selectedChips"></div>
        <div class="choice-list" id="memberChoices"></div>
      </section>
    </main>`;
  document.querySelector("#backBtn").onclick=()=>{state.route="newConversation";render()};
  const draw=(term="")=>{
    const selected=new Set(state.newGroupMembers);
    document.querySelector("#selectedChips").innerHTML=state.newGroupMembers.length
      ? contacts.filter(p=>selected.has(p.id)).map(p=>`<span class="person-chip">${esc(p.name)}</span>`).join("")
      : `<span class="small-note">Select at least 2 people for the group.</span>`;
    document.querySelector("#memberChoices").innerHTML=contacts
      .filter(p=>p.name.toLowerCase().includes(term.toLowerCase()))
      .map(p=>`
        <button class="member-option ${selected.has(p.id)?"selected":""}" data-id="${p.id}">
          <div class="avatar">${initials(p.name)}</div>
          <div><strong>${esc(p.name)}</strong><div class="preview">Secure contact</div></div>
          <div class="checkmark">${selected.has(p.id)?"✓":""}</div>
        </button>`).join("");
    document.querySelectorAll("#memberChoices .member-option").forEach(btn=>btn.onclick=()=>{
      const id=btn.dataset.id;
      state.newGroupMembers=selected.has(id)?state.newGroupMembers.filter(x=>x!==id):[...state.newGroupMembers,id];
      draw(document.querySelector("#memberSearch").value);
    });
    document.querySelector("#nextBtn").disabled=state.newGroupMembers.length<2;
  };
  draw();
  document.querySelector("#memberSearch").oninput=e=>draw(e.target.value);
  document.querySelector("#nextBtn").onclick=()=>{ if(state.newGroupMembers.length>=2){state.route="groupName";render();} };
}

function renderGroupName(){
  const selected=contacts.filter(p=>state.newGroupMembers.includes(p.id));
  app.innerHTML=`
    <main class="app-shell">
      ${shellTop("Group Details",'<button class="back-btn" id="backBtn">‹</button>')}
      <section class="content">
        <div class="card">
          <label class="form-label" for="groupNameInput">Group name</label>
          <input class="text-input" id="groupNameInput" maxlength="50" placeholder="Enter a group name" value="${esc(state.newGroupName)}" />
          <div class="section-title">Members</div>
          <div class="chip-row">${selected.map(p=>`<span class="person-chip">${esc(p.name)}</span>`).join("")}</div>
          <p class="small-note">New members see messages only from the time they join. Earlier history stays private unless an admin explicitly grants access.</p>
        </div>
        <button class="primary" id="createGroupBtn">Create Group</button>
      </section>
    </main>`;
  document.querySelector("#backBtn").onclick=()=>{state.route="newGroup";render()};
  const input=document.querySelector("#groupNameInput");
  const btn=document.querySelector("#createGroupBtn");
  const validate=()=>{state.newGroupName=input.value;btn.disabled=!input.value.trim()};
  input.oninput=validate;validate();
  btn.onclick=()=>{
    const id=Math.max(...state.conversations.map(c=>c.id))+1;
    const memberObjs=[
      {id:"me",name:"You",role:"Owner",joinedAt:"Created group",historyAccess:"all"},
      ...selected.map(p=>({id:p.id,name:p.name,role:"Member",joinedAt:"At group creation",historyAccess:"from_join"}))
    ];
    state.conversations.unshift({
      id,type:"group",name:state.newGroupName.trim(),unread:0,preview:"Group created",time:nowTime(),ownerId:"me",members:memberObjs
    });
    state.messages[id]=[
      {id:crypto.randomUUID(),system:true,text:`Group created with ${selected.length+1} members`,time:nowTime()}
    ];
    state.selectedId=id;state.route="chat";render();
  };
}

function renderChat(){
  const c=currentConversation();
  const msgs=state.messages[state.selectedId]||[];
  app.innerHTML=`
    <main class="app-shell">
      <header class="topbar">
        <button class="back-btn" id="backBtn" aria-label="Back">‹</button>
        <div class="chat-header-title">
          <strong>${esc(c.name)}</strong>
          <span class="secure">● ${isGroup(c)?`${c.members.length} members • `:""}Secure</span>
        </div>
        <button class="icon-btn" id="infoBtn" aria-label="Info">ⓘ</button>
      </header>
      ${state.online?"":'<div class="status-banner">Offline — messages will be queued and sent automatically when connection returns.</div>'}
      ${isGroup(c)?'<div class="info-banner">New members see conversation only from their join time unless an admin explicitly grants earlier history.</div>':""}
      <section class="chat" id="chatArea">${msgs.map(m=>renderBubble(m,c)).join("")}</section>
      <section class="composer-wrap">
        <div class="quick-row">${state.quickPhrases.map(q=>`<button class="quick-chip" data-quick="${esc(q)}">${esc(q)}</button>`).join("")}</div>
        <div class="compose-line">
          <button class="more-btn" id="moreBtn" aria-label="More tools">＋</button>
          <textarea id="messageBox" rows="1" placeholder="Type a message…"></textarea>
          <button class="send-btn" id="sendBtn" aria-label="Send">➤</button>
        </div>
        <div class="tool-panel ${state.toolsOpen?"open":""}" id="toolPanel">
          <button class="tool">📷 Photo</button><button class="tool">📎 File</button>
          <button class="tool">🎤 Voice</button><button class="tool">📍 Location</button>
          <button class="tool">👤 Contact</button><button class="tool">✓ Checklist</button>
          <button class="tool">⏰ Schedule</button><button class="tool">★ Saved</button>
        </div>
      </section>
    </main>`;
  document.querySelector("#backBtn").onclick=()=>{state.route="messages";render()};
  document.querySelector("#infoBtn").onclick=()=>{ if(isGroup(c)){state.route="groupInfo";render()} else alert("Conversation details remain a UX placeholder."); };
  document.querySelector("#moreBtn").onclick=()=>{state.toolsOpen=!state.toolsOpen;render()};
  document.querySelectorAll(".quick-chip").forEach(btn=>btn.onclick=()=>{
    const box=document.querySelector("#messageBox");box.value=btn.dataset.quick;box.focus();
  });
  document.querySelectorAll(".tool").forEach(btn=>btn.onclick=()=>alert(`${btn.textContent.trim()} is a UX placeholder in Hermes UX Prototype 0.2.`));
  const box=document.querySelector("#messageBox");
  box.addEventListener("input",()=>{box.style.height="46px";box.style.height=Math.min(box.scrollHeight,120)+"px"});
  document.querySelector("#sendBtn").onclick=sendCurrent;
  box.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendCurrent()}});
  requestAnimationFrame(()=>{const a=document.querySelector("#chatArea");a.scrollTop=a.scrollHeight;window.scrollTo(0,document.body.scrollHeight)});
}

function renderBubble(m,c){
  if(m.system) return `<div class="day-divider">${esc(m.text)} • ${esc(m.time)}</div>`;
  const label=m.state==="queued"?"Queued":m.state==="sending"?"Sending":m.state==="sent"?"Sent":
    m.state==="delivered"?"Delivered":m.state==="failed"?"Failed":"Read";
  const cls=m.state==="queued"?"state-queued":m.state==="failed"?"state-failed":"";
  return `<div class="msg-row ${m.mine?"mine":""}">
    ${c.type==="group"&&!m.mine&&m.sender?`<div class="sender-label">${esc(m.sender)}</div>`:""}
    <div class="bubble">
      <div class="msg-text">${esc(m.text)}</div>
      <div class="msg-meta"><span>${esc(m.time)}</span>${m.mine?`<span class="${cls}">${label}</span>`:""}</div>
    </div>
  </div>`;
}

function sendCurrent(){
  const box=document.querySelector("#messageBox");const text=box.value.trim();if(!text)return;
  const m={id:crypto.randomUUID(),mine:true,text,time:nowTime(),state:state.online?"sending":"queued"};
  state.messages[state.selectedId].push(m);
  const c=currentConversation();c.preview=text;c.time=m.time;render();
  if(state.online)simulateDelivery(state.selectedId,m.id);
}

function simulateDelivery(conversationId,id){
  setTimeout(()=>updateMessageState(conversationId,id,"sent"),700);
  setTimeout(()=>updateMessageState(conversationId,id,"delivered"),1500);
  setTimeout(()=>updateMessageState(conversationId,id,"read"),2600);
}
function updateMessageState(conversationId,id,newState){
  const arr=state.messages[conversationId]||[];const m=arr.find(x=>x.id===id);if(!m)return;
  m.state=newState;if(state.route==="chat"&&state.selectedId===conversationId)render();
}
function flushQueued(){
  Object.entries(state.messages).forEach(([conversationId,arr])=>{
    arr.filter(m=>m.mine&&m.state==="queued").forEach((m,i)=>{
      m.state="sending";
      setTimeout(()=>updateMessageState(Number(conversationId),m.id,"sent"),500+i*150);
      setTimeout(()=>updateMessageState(Number(conversationId),m.id,"delivered"),1200+i*150);
    });
  });
  render();
}
window.addEventListener("online",()=>{state.online=true;flushQueued()});
window.addEventListener("offline",()=>{state.online=false;render()});

function renderGroupInfo(){
  const c=currentConversation();
  if(!c||c.type!=="group"){state.route="chat";return render()}
  app.innerHTML=`
    <main class="app-shell">
      ${shellTop("Group Info",'<button class="back-btn" id="backBtn">‹</button>')}
      <section class="content">
        <div class="card" style="text-align:center">
          <div class="avatar group-avatar" style="margin:0 auto 10px">${initials(c.name)}</div>
          <h2 style="font-size:22px;margin:0">${esc(c.name)}</h2>
          <p class="small-note">${c.members.length} members • Secure group</p>
          <button class="secondary" id="renameBtn">Rename Group</button>
        </div>
        <div class="card">
          <h2>Members</h2>
          ${c.members.map(m=>`
            <div class="member-card">
              <div class="avatar">${initials(m.name)}</div>
              <div class="row-main">
                <strong>${esc(m.name)}</strong>
                <span>${esc(m.joinedAt)}</span>
                ${m.historyAccess==="from_join"?'<span class="history-lock">Earlier history hidden</span>':
                  m.historyAccess==="all"?'<span class="history-lock">Earlier history available</span>':""}
              </div>
              <div>${m.role!=="Member"?`<span class="role-tag">${esc(m.role)}</span>`:
                `<button class="row-action historyBtn" data-id="${m.id}">History</button>`}</div>
            </div>`).join("")}
          <button class="secondary" id="addMemberBtn">＋ Add Member</button>
        </div>
        <div class="card">
          <h2>Group Controls</h2>
          <div class="row"><div class="row-main"><strong>Mute notifications</strong><span>Silence alerts for this group</span></div><button class="toggle"></button></div>
          <div class="row"><div class="row-main"><strong>Search messages</strong><span>Find text in this conversation</span></div><button class="row-action placeholderBtn">Open</button></div>
          <div class="row"><div class="row-main"><strong>Shared photos & files</strong><span>View shared attachments</span></div><button class="row-action placeholderBtn">Open</button></div>
          <div class="row"><div class="row-main"><strong>Security information</strong><span>Member keys and group-key status</span></div><button class="row-action placeholderBtn">View</button></div>
        </div>
        <button class="danger-btn" id="leaveBtn">Leave Group</button>
      </section>
    </main>`;
  document.querySelector("#backBtn").onclick=()=>{state.route="chat";render()};
  document.querySelector("#renameBtn").onclick=()=>{
    const name=prompt("Rename group:",c.name);
    if(name?.trim()){c.name=name.trim();render()}
  };
  document.querySelector("#addMemberBtn").onclick=()=>openAddMemberModal();
  document.querySelectorAll(".historyBtn").forEach(btn=>btn.onclick=()=>openHistoryModal(btn.dataset.id));
  document.querySelectorAll(".placeholderBtn").forEach(btn=>btn.onclick=()=>alert("This control is represented for UX review and will be implemented in a later prototype."));
  document.querySelector(".toggle").onclick=e=>e.currentTarget.classList.toggle("on");
  document.querySelector("#leaveBtn").onclick=()=>alert("Leave Group is a UX placeholder in Hermes UX Prototype 0.2.");
}

function openAddMemberModal(){
  const c=currentConversation();
  const currentIds=new Set(c.members.map(m=>m.id));
  const available=contacts.filter(p=>!currentIds.has(p.id));
  state.modal={
    type:"addMember",
    options:available,
    selected:available[0]?.id||null
  };
  render();
}

function openHistoryModal(memberId){
  const c=currentConversation();
  const member=c.members.find(m=>m.id===memberId);
  if(!member)return;
  state.modal={type:"history",memberId,historyChoice:member.historyAccess==="all"?"all":"24h"};
  render();
}

function renderModal(){
  const modal=state.modal;
  const host=document.createElement("div");
  host.className="modal-backdrop";
  if(modal.type==="addMember"){
    host.innerHTML=`
      <div class="modal">
        <h2>Add Member</h2>
        <p>New members begin with access only from the time they join.</p>
        ${modal.options.length?`
          <div class="choice-list">
            ${modal.options.map(p=>`
              <label class="member-option">
                <div class="avatar">${initials(p.name)}</div>
                <div><strong>${esc(p.name)}</strong><div class="preview">No earlier history by default</div></div>
                <input type="radio" name="newMember" value="${p.id}" ${modal.selected===p.id?"checked":""}>
              </label>`).join("")}
          </div>
          <div class="modal-actions">
            <button class="modal-cancel" id="modalCancel">Cancel</button>
            <button class="modal-confirm" id="modalConfirm">Add Member</button>
          </div>`:
          `<p>No additional sample contacts are available in this prototype.</p><button class="secondary" id="modalCancel">Close</button>`}
      </div>`;
    document.body.appendChild(host);
    host.querySelectorAll('input[name="newMember"]').forEach(r=>r.onchange=()=>state.modal.selected=r.value);
    host.querySelector("#modalCancel").onclick=()=>{state.modal=null;render()};
    const confirm=host.querySelector("#modalConfirm");
    if(confirm) confirm.onclick=()=>{
      const p=contacts.find(x=>x.id===state.modal.selected);
      if(p){
        const c=currentConversation();
        c.members.push({id:p.id,name:p.name,role:"Member",joinedAt:`Joined ${nowTime()}`,historyAccess:"from_join"});
        state.messages[c.id].push({id:crypto.randomUUID(),system:true,text:`${p.name} joined the group • Earlier messages hidden by default`,time:nowTime()});
        c.preview=`${p.name} joined the group`;c.time=nowTime();
      }
      state.modal=null;render();
    };
  } else if(modal.type==="history"){
    const c=currentConversation();
    const member=c.members.find(m=>m.id===modal.memberId);
    host.innerHTML=`
      <div class="modal">
        <h2>History Access</h2>
        <p>${esc(member.name)} normally sees messages only from the time they joined. As admin, you can explicitly grant earlier history.</p>
        <div class="permission-box">
          ${[
            ["24h","Last 24 hours"],
            ["7d","Last 7 days"],
            ["date","From selected date"],
            ["all","Entire available history"]
          ].map(([v,label])=>`
            <label class="radio-row">
              <input type="radio" name="history" value="${v}" ${modal.historyChoice===v?"checked":""}>
              <span><strong>${label}</strong>${v==="all"?'<div class="small-note">Shares all historical material available to the group.</div>':""}</span>
            </label>`).join("")}
        </div>
        <div class="modal-actions">
          <button class="modal-cancel" id="modalCancel">Cancel</button>
          <button class="modal-confirm" id="modalConfirm">Grant Access</button>
        </div>
      </div>`;
    document.body.appendChild(host);
    host.querySelectorAll('input[name="history"]').forEach(r=>r.onchange=()=>state.modal.historyChoice=r.value);
    host.querySelector("#modalCancel").onclick=()=>{state.modal=null;render()};
    host.querySelector("#modalConfirm").onclick=()=>{
      member.historyAccess=state.modal.historyChoice==="all"?"all":state.modal.historyChoice;
      member.joinedAt=member.joinedAt;
      state.modal=null;
      alert(`Prototype: ${member.name} was granted the selected historical access. In production this will require secure key/history sharing.`);
      render();
    };
  }
  host.onclick=e=>{if(e.target===host){state.modal=null;render()}};
}

function renderSettings(){
  app.innerHTML=`
    <main class="app-shell">
      ${shellTop("Settings",'<button class="back-btn" id="backBtn">‹</button>')}
      <section class="content settings">
        <div class="card"><h2>Privacy & Access</h2>
          ${settingRow("Biometric / passkey unlock","autoLock")}
          ${settingRow("Notification message previews","previews")}
        </div>
        <div class="card"><h2>Reading</h2>${settingRow("Large text mode","largeText")}</div>
        <div class="card"><h2>Data</h2>${settingRow("Large attachments on Wi-Fi only","wifiAttachments")}</div>
        <div class="card"><h2>Prototype connectivity</h2>
          <p class="small-note">Use browser/device airplane mode or network controls to test offline behavior. Outgoing messages show Queued while offline.</p>
        </div>
      </section>
    </main>`;
  document.querySelector("#backBtn").onclick=()=>{state.route="messages";render()};
  document.querySelectorAll(".toggle").forEach(btn=>btn.onclick=()=>{
    const key=btn.dataset.key;state.settings[key]=!state.settings[key];renderSettings();
  });
}
function settingRow(label,key){
  return `<div class="row"><span>${esc(label)}</span><button class="toggle ${state.settings[key]?"on":""}" data-key="${key}" aria-label="${esc(label)}"></button></div>`;
}

render();
