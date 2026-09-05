import fs from "node:fs";

const appPath="app.js",bootstrapPath="bootstrap.js",versionPath="version.js";
let app=fs.readFileSync(appPath,"utf8");
let bootstrap=fs.readFileSync(bootstrapPath,"utf8");
let version=fs.readFileSync(versionPath,"utf8");

function replaceBetween(source,startNeedle,endNeedle,replacement,label){
  const start=source.indexOf(startNeedle),end=source.indexOf(endNeedle,start+startNeedle.length);
  if(start<0||end<0||end<=start)throw new Error(`Missing ${label} anchors.`);
  return source.slice(0,start)+replacement+source.slice(end);
}

// Runtime-state owner: app.js. Production defaults are truly empty; persisted
// UID-local state / Outbox / Firestore discovery repopulate them explicitly.
app=replaceBetween(app,'const contacts = [','const DB_NAME = "fidunio-local";',`const contacts=[]; // legacy group-info compatibility only; no prototype identities\n\nlet state = {\n  unlocked:false,\n  route:"messages",\n  previousRoute:"messages",\n  online:navigator.onLine,\n  selectedId:null,\n  toolsOpen:false,\n  newGroupMembers:[],\n  newGroupName:"",\n  modal:null,\n  quickPhrases:["Yes","No","OK","On my way","Running late","Call me"],\n  conversations:[],\n  messages:{},\n  settings:{previews:false,autoLock:true,textSize:"normal",wifiAttachments:true,appearance:"auto"},\n  peerTrust:{}\n};\n\n`,'initial runtime state');

const messagesRenderer=`function renderMessages(){\n  if(isWideLayout()){\n    let chosen=state.conversations.find(c=>String(c.id)===String(state.selectedId));\n    if(!chosen) chosen=state.conversations[0]||null;\n    if(chosen){\n      state.selectedId=chosen.id;\n      state.route="chat";\n      chosen.unread=0;\n      if(chosen.cloud) beginCloudMessageSubscription(chosen.id,{force:true});\n      else stopCloudMessageSubscription();\n      return renderChat();\n    }\n    state.selectedId=null;\n    stopCloudMessageSubscription();\n    app.innerHTML=\`<main class="app-shell tablet-shell">\${renderConversationSidebar()}<section class="tablet-chat-pane"><div class="content"><div class="card" style="text-align:center;margin-top:24px"><h2>No conversations yet</h2><p class="small-note">Start a private conversation with another FIDUNIO user.</p><button class="primary" id="emptyNewBtn">New Message</button></div></div></section></main>\`;\n    drawTabletConversationList();\n    const tSearch=document.querySelector("#tabletSearchBox");\n    if(tSearch)tSearch.oninput=e=>drawTabletConversationList(e.target.value);\n    document.querySelector("#tabletSettingsBtn")?.addEventListener("click",()=>{state.route="settings";render()});\n    document.querySelector("#tabletNewBtn")?.addEventListener("click",()=>{state.route="newConversation";render()});\n    document.querySelector("#tabletContactsNav")?.addEventListener("click",()=>{state.route="newConversation";render()});\n    document.querySelector("#tabletSettingsNav")?.addEventListener("click",()=>{state.route="settings";render()});\n    document.querySelector("#emptyNewBtn")?.addEventListener("click",()=>{state.route="newConversation";render()});\n    return;\n  }\n\n  app.innerHTML=\`\n    <main class="app-shell">\n      \${shellTop("Messages",undefined,'<button class="icon-btn icon-2d" id="settingsBtn" aria-label="Settings">'+icon2d("settings",23)+'</button>')}\n      <section class="content">\n        <input class="search" id="searchBox" placeholder="Search conversations" />\n        <div class="conversation-list" id="conversationList"></div>\n      </section>\n      <button class="fab icon-2d" id="newBtn" aria-label="New conversation">\${icon2d("plus",26)}</button>\n    </main>\`;\n  document.querySelector("#settingsBtn").onclick=()=>{state.route="settings";render()};\n  document.querySelector("#newBtn").onclick=()=>{state.route="newConversation";render()};\n  const list=document.querySelector("#conversationList");\n  const draw=(term="")=>{\n    const rows=state.conversations.filter(c=>(c.name||"").toLowerCase().includes(term.toLowerCase())||(c.preview||"").toLowerCase().includes(term.toLowerCase()));\n    list.innerHTML=rows.length?rows.map(c=>\`\n        <button class="conversation" data-id="\${c.id}">\n          <div class="avatar \${c.type==="group"?"group-avatar":""}">\${initials(c.name||"FIDUNIO")}</div>\n          <div>\n            <div class="name">\${esc(c.name||"FIDUNIO contact")}</div>\n            <div class="preview">\${c.type==="group"?"Group • ":""}\${esc(c.preview||"")}</div>\n          </div>\n          <div class="meta">\${esc(c.time||"")}\${c.unread?\`<div class="badge">\${c.unread}</div>\`:""}</div>\n        </button>\`).join(""):\`<div class="card" style="text-align:center"><h2>\${term?"No matching conversations":"No conversations yet"}</h2><p class="small-note">\${term?"Try another search.":"Start a private conversation with another FIDUNIO user."}</p></div>\`;\n    list.querySelectorAll(".conversation").forEach(btn=>btn.onclick=()=>{\n      const raw=btn.dataset.id;\n      state.selectedId=/^\\d+$/.test(raw)?Number(raw):raw;\n      state.route="chat";\n      const chosen=state.conversations.find(x=>String(x.id)===String(state.selectedId));\n      if(chosen)chosen.unread=0;\n      if(chosen?.cloud)beginCloudMessageSubscription(chosen.id,{force:true});else stopCloudMessageSubscription();\n      render();\n    });\n  };\n  draw();\n  document.querySelector("#searchBox").oninput=e=>draw(e.target.value);\n}\n\n`;
app=replaceBetween(app,'function renderMessages(){','function renderNewConversation(){',messagesRenderer,'Messages renderer');

const newConversationRenderer=`function renderNewConversation(){\n  const cloudEnabled=isFirebaseConfigured() && firebaseUser;\n  app.innerHTML=\`\n    <main class="app-shell">\n      \${shellTop("New Message",'<button class="back-btn" id="backBtn">‹</button>')}\n      <section class="content">\n        <div class="action-sheet">\n          <button class="big-choice" id="newGroupBtn"><span class="choice-icon">👥</span><span><strong>New Group</strong><span>Create a group and choose its members</span></span></button>\n        </div>\n        <div class="card">\n          <h2>Start a Conversation</h2>\n          \${cloudEnabled?\`<p class="small-note">Choose another FIDUNIO user.</p><label class="form-label" for="peerUid">Recipient FIDUNIO ID</label><input class="text-input" id="peerUid" autocomplete="off" placeholder="Recipient UID" /><button class="primary" id="cloudDirectBtn">Start Conversation</button><p class="warning-note">Private one-to-one messages are end-to-end encrypted.</p>\`:\`<p class="small-note">Sign in to FIDUNIO before starting a conversation.</p>\`}\n        </div>\n      </section>\n    </main>\`;\n  document.querySelector("#backBtn").onclick=()=>{stopCloudMessageSubscription();state.route="messages";render()};\n  document.querySelector("#newGroupBtn").onclick=()=>{state.newGroupMembers=[];state.newGroupName="";state.route="newGroup";render()};\n  const cloudBtn=document.querySelector("#cloudDirectBtn");\n  if(cloudBtn)cloudBtn.onclick=async()=>{\n    const peerUid=document.querySelector("#peerUid").value.trim();\n    if(!peerUid)return alert("Choose a FIDUNIO user first.");\n    if(peerUid===firebaseUser.uid)return alert("Choose another FIDUNIO user.");\n    cloudBtn.disabled=true;cloudBtn.textContent="Connecting…";\n    try{\n      const remote=await startDirectConversation(peerUid);\n      mergeCloudConversation(remote);\n      state.selectedId=remote.id;state.route="chat";\n      beginCloudMessageSubscription(remote.id,{force:true});persistSoon();render();\n    }catch(err){alert("Could not create the conversation: "+(err?.message||err));cloudBtn.disabled=false;cloudBtn.textContent="Start Conversation";}\n  };\n}\n\n`;
app=replaceBetween(app,'function renderNewConversation(){','function renderNewGroup(){',newConversationRenderer,'New Message renderer');

// Raw source must fail safely without a controlling service worker. The current
// service-worker transform still replaces this bounded block with the validated
// real cloud-group implementation until group behavior is materialized later.
const groupFallback=`function renderNewGroup(){\n  app.innerHTML=\`<main class="app-shell">\${shellTop("New Group",'<button class="back-btn" id="backBtn">‹</button>')}<section class="content"><div class="card"><h2>Group setup is not available yet</h2><p class="small-note">FIDUNIO is rebuilding group creation on the account-authoritative messaging path.</p></div></section></main>\`;\n  document.querySelector("#backBtn").onclick=()=>{state.route="newConversation";render()};\n}\n\nfunction renderGroupName(){\n  state.route="newGroup";\n  renderNewGroup();\n}\n\n`;
app=replaceBetween(app,'function renderNewGroup(){','function renderChat(){',groupFallback,'raw prototype group block');

const chatNeedle='function renderChat(){\n  const c=currentConversation();';
if(!app.includes(chatNeedle))throw new Error("Chat guard anchor missing.");
app=app.replace(chatNeedle,'function renderChat(){\n  const c=currentConversation();\n  if(!c){state.selectedId=null;state.route="messages";return renderMessages();}');
app=app.replace('function currentConversation(){ return state.conversations.find(x=>x.id===state.selectedId); }','function currentConversation(){ return state.conversations.find(x=>String(x.id)===String(state.selectedId)); }');

// Bootstrap is now orchestration only. Prototype state no longer exists in app
// source, so bootstrap must not maintain an independent scrub/repair lifecycle.
const startImport='await import("./new-message-polish.js");';
const importAt=bootstrap.indexOf(startImport);
if(importAt<0)throw new Error("Bootstrap import anchor missing.");
bootstrap=`/* FIDUNIO deterministic bootstrap. Account/auth owners run before app.js. */\n${bootstrap.slice(importAt)}`.replace(/\nscrubPrototypeUi\(\);\s*$/,'\n');
if(bootstrap.includes('MutationObserver')||bootstrap.includes('migratePrototypeData')||bootstrap.includes('PROTOTYPE_CONVERSATIONS'))throw new Error("Legacy bootstrap repair path remained.");

if(!version.includes('version: "0.9.5.13"'))throw new Error("Expected release version anchor missing.");
version=version.replace('version: "0.9.5.13"','version: "0.9.6.0"');

for(const forbidden of ['Maria Santos','John Cruz','Family Group','Sample local contacts','Local prototype contact']){
  if(app.includes(forbidden))throw new Error(`Prototype marker remained: ${forbidden}`);
}
for(const required of ['conversations:[]','messages:{}','selectedId:null','function renderNewGroup(){','function renderGroupName(){','function renderChat(){','const cloud=!!c?.cloud;']){
  if(!app.includes(required))throw new Error(`Required runtime anchor missing: ${required}`);
}

fs.writeFileSync(appPath,app);
fs.writeFileSync(bootstrapPath,bootstrap);
fs.writeFileSync(versionPath,version);
console.log("Materialized deterministic empty runtime candidate.");
