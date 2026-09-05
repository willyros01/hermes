import fs from "node:fs";

const firebasePath="firebase.js",appPath="app.js",bootstrapPath="bootstrap.js",gatePath="runtime-authority-gate.test.mjs";
let firebase=fs.readFileSync(firebasePath,"utf8");
let app=fs.readFileSync(appPath,"utf8");
let bootstrap=fs.readFileSync(bootstrapPath,"utf8");
let gate=fs.readFileSync(gatePath,"utf8");

function replaceOnce(source,from,to,label){
  const first=source.indexOf(from);
  if(first<0)throw new Error(`${label}: anchor missing`);
  if(source.indexOf(from,first+from.length)>=0)throw new Error(`${label}: anchor not unique`);
  return source.slice(0,first)+to+source.slice(first+from.length);
}

// Central Firebase owns all SDK/service acquisition for peer display names.
const e2eeAnchor='// BEGIN ACCOUNT E2EE V1 CENTRAL FIREBASE API';
const profileApi=`// Central read-only live display-name subscription. Callers provide the exact
// UIDs already discovered by their owned conversation lifecycle; this function
// never creates a second conversation query or a second Firebase initializer.
export function subscribeUserDisplayNames(uids,onNames,onError){
  let active=true;
  const stops=[];
  const names=new Map();
  const wanted=[...new Set((uids||[]).map(x=>String(x||"").trim()).filter(Boolean))];
  const emit=()=>{if(active)onNames?.(Object.fromEntries(names));};
  ensureServices().then(s=>{
    if(!active)return;
    if(!authUser)throw new Error("Sign in first.");
    if(!wanted.length){emit();return;}
    for(const uid of wanted){
      const stop=s.fsSdk.onSnapshot(s.fsSdk.doc(s.db,"users",uid),snap=>{
        if(!active)return;
        if(snap.exists()){
          const name=String(snap.data()?.displayName||snap.data()?.email||"").trim();
          if(name)names.set(uid,name);else names.delete(uid);
        }else names.delete(uid);
        emit();
      },err=>{if(active)onError?.(err);});
      stops.push(stop);
    }
  }).catch(err=>{if(active)onError?.(err);});
  return()=>{active=false;for(const stop of stops.splice(0))try{stop();}catch{}names.clear();};
}

`;
if(firebase.includes('export function subscribeUserDisplayNames'))throw new Error("peer display-name central API already exists");
firebase=replaceOnce(firebase,e2eeAnchor,profileApi+e2eeAnchor,"central peer display-name API");

// app.js imports only the central subscription API.
app=replaceOnce(app,'  subscribeMyConversations,\n  subscribeConversationMessages,','  subscribeMyConversations,\n  subscribeUserDisplayNames,\n  subscribeConversationMessages,',"peer display-name import");

app=replaceOnce(app,'let cloudConversationUnsub = null;\nlet cloudGroupUnsub = null;','let cloudConversationUnsub = null;\nlet peerDisplayNameUnsub = ()=>{};\nlet peerDisplayNameKey = "";\nlet peerDisplayNames = {};\nlet cloudGroupUnsub = null;',"peer display-name runtime state");

// Prefer authoritative live profile names whenever a conversation snapshot is merged.
app=replaceOnce(app,'  if(existing) Object.assign(existing,item);\n  else state.conversations.unshift(item);','  if(item.peerUid&&peerDisplayNames[item.peerUid])item.name=peerDisplayNames[item.peerUid];\n  if(existing) Object.assign(existing,item);\n  else state.conversations.unshift(item);',"conversation live-name projection");

const peerSync=`function stopPeerDisplayNameSubscription(){
  try{peerDisplayNameUnsub();}catch{}
  peerDisplayNameUnsub=()=>{};
  peerDisplayNameKey="";
  peerDisplayNames={};
}
function syncPeerDisplayNameSubscription(rows){
  const uids=[...new Set((rows||[]).map(r=>r?.peerUid).filter(Boolean))].sort();
  const key=uids.join("|");
  if(key===peerDisplayNameKey)return;
  stopPeerDisplayNameSubscription();
  peerDisplayNameKey=key;
  if(!uids.length)return;
  peerDisplayNameUnsub=subscribeUserDisplayNames(uids,names=>{
    peerDisplayNames=names||{};
    let changed=false;
    for(const c of state.conversations){
      const name=c?.peerUid?peerDisplayNames[c.peerUid]:null;
      if(name&&c.name!==name){c.name=name;changed=true;}
    }
    if(changed){persistSoon();if(state.route==="messages"||state.route==="chat")render();}
  },err=>console.warn("FIDUNIO peer display-name sync unavailable",err));
}
`;
app=replaceOnce(app,'function stopCloudMessageSubscription(){',peerSync+'function stopCloudMessageSubscription(){',"peer display-name subscription owner");

app=replaceOnce(app,'    rows.forEach(mergeCloudConversation);\n    // A restored Firestore conversation may repair peerUid','    rows.forEach(mergeCloudConversation);\n    syncPeerDisplayNameSubscription(rows);\n    // A restored Firestore conversation may repair peerUid',"conversation profile sync trigger");
app=replaceOnce(app,'        if(cloudConversationUnsub){cloudConversationUnsub();cloudConversationUnsub=null;}\n        if(cloudGroupUnsub){cloudGroupUnsub();cloudGroupUnsub=null;}','        if(cloudConversationUnsub){cloudConversationUnsub();cloudConversationUnsub=null;}\n        stopPeerDisplayNameSubscription();\n        if(cloudGroupUnsub){cloudGroupUnsub();cloudGroupUnsub=null;}',"profile sync sign-out cleanup");

// Main-screen Sign Out becomes an explicit app.js projection using central Firebase.
const shellAnchor='function shellTop(title,left=`<span class="topbar-spacer"></span>`,right=`<span class="topbar-spacer"></span>`){\n  return `<header class="topbar">${left}<h1>${esc(title)}</h1>${right}</header>`;\n}\n';
const signOutHelpers=`function mainSignOutMarkup(){
  return '<button class="secondary" id="fidunioMainSignOutBtn" type="button" aria-label="Sign Out" style="width:auto;margin:0 6px;padding:8px 12px">Sign Out</button>';
}
function bindMainSignOut(){
  const btn=document.querySelector("#fidunioMainSignOutBtn");
  if(!btn)return;
  btn.onclick=async()=>{
    btn.disabled=true;btn.textContent="Signing Out…";
    try{await signOutFidunio();location.reload();}
    catch(err){btn.disabled=false;btn.textContent="Sign Out";alert(err?.message||String(err));}
  };
}
`;
app=replaceOnce(app,shellAnchor,shellAnchor+signOutHelpers,"main Sign Out helper");

app=replaceOnce(app,'          <button class="icon-btn icon-2d" id="tabletNewBtn" aria-label="New conversation">${icon2d("plus",23)}</button>\n        </div>','          <button class="icon-btn icon-2d" id="tabletNewBtn" aria-label="New conversation">${icon2d("plus",23)}</button>\n          ${mainSignOutMarkup()}\n        </div>',"tablet Sign Out projection");

app=replaceOnce(app,'      ${shellTop("Messages",undefined,\'<button class="icon-btn icon-2d" id="settingsBtn" aria-label="Settings">\'+icon2d("settings",23)+\'</button>\')}','      ${shellTop("Messages",undefined,\'<button class="icon-btn icon-2d" id="settingsBtn" aria-label="Settings">\'+icon2d("settings",23)+\'</button>\'+mainSignOutMarkup())}',"mobile Messages Sign Out projection");

app=replaceOnce(app,'    document.querySelector("#emptyNewBtn")?.addEventListener("click",()=>{state.route="newConversation";render()});\n    return;','    document.querySelector("#emptyNewBtn")?.addEventListener("click",()=>{state.route="newConversation";render()});\n    bindMainSignOut();\n    return;',"wide empty Sign Out binding");
app=replaceOnce(app,'  document.querySelector("#newBtn").onclick=()=>{state.route="newConversation";render()};\n  const list=document.querySelector("#conversationList");','  document.querySelector("#newBtn").onclick=()=>{state.route="newConversation";render()};\n  bindMainSignOut();\n  const list=document.querySelector("#conversationList");',"mobile Messages Sign Out binding");

app=replaceOnce(app,'        <button class="icon-btn icon-2d" id="infoBtn" aria-label="Info">${icon2d("info",23)}</button>\n      </header>','        <button class="icon-btn icon-2d" id="infoBtn" aria-label="Info">${icon2d("info",23)}</button>\n        ${isWideLayout()?"":mainSignOutMarkup()}\n      </header>',"mobile Chat Sign Out projection");
app=replaceOnce(app,'  }else{\n    app.innerHTML=`<main class="app-shell">${chatMarkup}</main>`;\n  }\n  document.querySelector("#backBtn").onclick','  }else{\n    app.innerHTML=`<main class="app-shell">${chatMarkup}</main>`;\n  }\n  bindMainSignOut();\n  document.querySelector("#backBtn").onclick',"Chat Sign Out binding");

// Bootstrap is sequencing only; compatibility projection modules are retired.
bootstrap=bootstrap.replace('await import("./profile-sync.js");\n','').replace('await import("./main-screen-polish.js");\n','');
if(bootstrap.includes("profile-sync")||bootstrap.includes("main-screen-polish"))throw new Error("retired projection bootstrap imports remain");

// Runtime authority gate shrinks its temporary exception lists and protects the retirement.
gate=gate.replace('  "profile-sync.js",         // temporary live peer-profile listener\n','');
gate=gate.replace('  "main-screen-polish.js",   // temporary sign-out/display-name compatibility overlay\n','');
gate=gate.replace('if(/new-message-polish/.test(bootstrap))throw new Error("bootstrap.js must not revive superseded New Message polish.");','if(/new-message-polish/.test(bootstrap))throw new Error("bootstrap.js must not revive superseded New Message polish.");\nif(/profile-sync|main-screen-polish/.test(bootstrap))throw new Error("bootstrap.js must not revive retired main-screen projection overlays.");');
const appCheck='if(!/const contacts=\\[\\]/.test(app))throw new Error("Prototype contact seed must not return to app.js.");';
if(!gate.includes(appCheck))throw new Error("runtime authority app gate anchor missing");
gate=gate.replace(appCheck,appCheck+'\nif(!/subscribeUserDisplayNames/.test(app))throw new Error("app.js must use central peer display-name subscription.");\nif(!/mainSignOutMarkup/.test(app)||!/bindMainSignOut/.test(app))throw new Error("main-screen Sign Out must remain an explicit app projection.");');

for(const retired of ["profile-sync.js","main-screen-polish.js"]){
  if(!fs.existsSync(retired))throw new Error(`${retired} missing before retirement; refusing ambiguous cleanup`);
  fs.unlinkSync(retired);
}

fs.writeFileSync(firebasePath,firebase);
fs.writeFileSync(appPath,app);
fs.writeFileSync(bootstrapPath,bootstrap);
fs.writeFileSync(gatePath,gate);
console.log("Materialized live peer-name and Sign Out projections; retired observer/direct-SDK compatibility modules.");
