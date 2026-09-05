/* FIDUNIO 0.9.1.1 test service worker. Network-first shell; Firestore/Auth are never cached. */
importScripts("./version.js");
const SW_VERSION=globalThis.FIDUNIO_RELEASE?.version || "unknown";
const CACHE=`fidunio-shell-${SW_VERSION}`;
const SHELL=["./","./index.html","./version.js","./styles.css","./styles-0.9.0.css","./app.js","./firebase.js","./firebase-config.js","./manifest.json","./favicon.png","./fidunio-logo.png","./icon-180.png","./icon-192.png","./icon-512.png"];
const FIREBASE_SDK=["https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js","https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js","https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js"];
const NETWORK_TIMEOUT=4000;
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled([...SHELL,...FIREBASE_SDK].map(url=>cache.add(url)))).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));

async function transformApp(request,response){
  if(!response||!response.ok)return response;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||!url.pathname.endsWith("/app.js"))return response;
  let source=await response.text();

  const helperNeedle=`async function resolvePeerUidForConversation(conversationId){`;
  const helperReplacement=`async function deriveDeviceEnvelopeKey(peerPublicJwk,conversationId){
  const mine=await getOrCreateDeviceKeyPair();
  const peer=await crypto.subtle.importKey("jwk",peerPublicJwk,{name:"ECDH",namedCurve:"P-256"},false,[]);
  const bits=await crypto.subtle.deriveBits({name:"ECDH",public:peer},mine.privateKey,256);
  const base=await crypto.subtle.importKey("raw",bits,"HKDF",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"HKDF",hash:"SHA-256",salt:new TextEncoder().encode("FIDUNIO-E2EE-v2"),info:new TextEncoder().encode(String(conversationId))},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
async function encryptDeviceEnvelope(text,targetPublicJwk,conversationId){
  const key=await deriveDeviceEnvelopeKey(targetPublicJwk,conversationId),iv=crypto.getRandomValues(new Uint8Array(12));
  const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:new TextEncoder().encode(String(conversationId))},key,new TextEncoder().encode(text));
  return {ciphertext:b64(cipher),iv:b64(iv)};
}
async function buildDeviceEnvelopes(text,conversationId){
  const peerUid=await resolvePeerUidForConversation(conversationId);if(!peerUid)throw new Error("Recipient identity is unavailable");
  const identity=await getOrCreateDeviceIdentity();
  const [peerDevices,myDevices]=await Promise.all([getCloudUserDevices(peerUid),getCloudUserDevices(firebaseUser.uid)]);
  const targets=new Map();for(const d of [...peerDevices,...myDevices]){const id=String(d.deviceId||d.id||"");if(id&&d.publicJwk&&d.active!==false)targets.set(id,{deviceId:id,publicJwk:d.publicJwk});}
  targets.set(identity.deviceId,{deviceId:identity.deviceId,publicJwk:identity.publicJwk});
  if(!peerDevices.some(d=>d.publicJwk&&d.active!==false))throw new Error("Recipient has no registered encryption device yet");
  const envelopes={};for(const target of targets.values())envelopes[target.deviceId]=await encryptDeviceEnvelope(text,target.publicJwk,conversationId);
  return {envelopes,recipientDeviceIds:[...targets.keys()],identity};
}
async function decryptDeviceEnvelope(row,conversationId){
  const identity=await getOrCreateDeviceIdentity(),env=row?.envelopes?.[identity.deviceId];if(!env?.ciphertext||!env?.iv)throw new Error("No encrypted envelope exists for this device");if(!row?.senderDevicePublicJwk)throw new Error("Sender device key is unavailable");
  const mine=await getOrCreateDeviceKeyPair(),sender=await crypto.subtle.importKey("jwk",row.senderDevicePublicJwk,{name:"ECDH",namedCurve:"P-256"},false,[]);
  const bits=await crypto.subtle.deriveBits({name:"ECDH",public:sender},mine.privateKey,256),base=await crypto.subtle.importKey("raw",bits,"HKDF",false,["deriveKey"]);
  const key=await crypto.subtle.deriveKey({name:"HKDF",hash:"SHA-256",salt:new TextEncoder().encode("FIDUNIO-E2EE-v2"),info:new TextEncoder().encode(String(conversationId))},base,{name:"AES-GCM",length:256},false,["decrypt"]);
  const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(env.iv),additionalData:new TextEncoder().encode(String(conversationId))},key,unb64(env.ciphertext));return new TextDecoder().decode(plain);
}
async function resolvePeerUidForConversation(conversationId){`;
  source=source.replace(helperNeedle,helperReplacement);

  source=source.replace(`        if(m.e2ee){
          if(peerKey){try{text=await decryptCloudText(m,peerKey,conversationId);}catch{text="[Encrypted message — key unavailable]";}}
          else text="[Encrypted message — key unavailable]";
        }`,`        if(m.e2ee===2){try{text=await decryptDeviceEnvelope(m,conversationId);}catch{text="[Encrypted message — not available on this device]";}}
        else if(m.e2ee){if(peerKey){try{text=await decryptCloudText(m,peerKey,conversationId);}catch{text="[Encrypted message — key unavailable]";}}else text="[Encrypted message — key unavailable]";}`);

  const preSendTrustNeedle=`  if(cloud && c?.peerUid){
    await peerPublicKeyForConversation(conversationId,{refresh:true});
    if(peerTrustStatus(c.peerUid)==="changed"){
      state.modal={type:"conversationSecurity",peerUid:c.peerUid,conversationId};
      render();
      return;
    }
  }`;
  const preSendTrustReplacement=`  if(cloud && c?.peerUid){await peerPublicKeyForConversation(conversationId,{refresh:true});}`;
  source=source.replace(preSendTrustNeedle,preSendTrustReplacement);
  source=source.replace(/  if\(cloud && c\?\.peerUid\)\{\s*await peerPublicKeyForConversation\(conversationId,\{refresh:true\}\);\s*if\(peerTrustStatus\(c\.peerUid\)==="changed"\)\{\s*state\.modal=\{type:"conversationSecurity",peerUid:c\.peerUid,conversationId\};\s*render\(\);\s*return;\s*\}\s*\}/,preSendTrustReplacement);

  source=source.replace(`        const peerKey=await peerPublicKeyForConversation(payload.conversationId,{refresh:true});
        if(!peerKey) throw new Error("Recipient encryption key is not available yet");
        const peerUid=await resolvePeerUidForConversation(payload.conversationId);
        if(peerUid && peerTrustStatus(peerUid)==="changed"){
          throw new Error("Recipient encryption key changed. Verify the new key in Conversation Security before sending.");
        }
        const encrypted=await encryptCloudText(payload.text,peerKey,payload.conversationId);
        const identity=await getOrCreateDeviceIdentity();
        await sendCloudMessage(payload.conversationId,{
          id:payload.messageId,text:"",ciphertext:encrypted.ciphertext,iv:encrypted.iv,e2ee:encrypted.e2ee,
          senderDeviceId:identity.deviceId,
          timeLabel:payload.time,state:"sent"
        });`,`        const fanout=await buildDeviceEnvelopes(payload.text,payload.conversationId);
        await sendCloudMessage(payload.conversationId,{id:payload.messageId,text:"",ciphertext:"",iv:"",e2ee:2,envelopes:fanout.envelopes,recipientDeviceIds:fanout.recipientDeviceIds,senderDeviceId:fanout.identity.deviceId,senderDevicePublicJwk:fanout.identity.publicJwk,timeLabel:payload.time,state:"sent"});`);

  // 0.9.1.1 group metadata harness. These replacements deliberately contain real newlines.
  source=source.replace(`  getCloudUserDevices
} from "./firebase.js";`,`  getCloudUserDevices,
  listCloudUsers,
  createCloudGroup,
  subscribeMyGroups
} from "./firebase.js";`);
  source=source.replace(`let cloudConversationUnsub = null;`,`let cloudConversationUnsub = null;
let cloudGroupUnsub = null;
let groupCandidates = [];`);
  source=source.replace(`function stopCloudMessageSubscription(){`,`function mergeCloudGroup(remote){
  const existing=state.conversations.find(c=>String(c.id)===String(remote.id));
  const item={...remote,type:"group",cloudGroup:true,unread:existing?.unread||0,preview:remote.preview||existing?.preview||"Group • messaging pending E2EE",time:remote.time||existing?.time||""};
  if(existing)Object.assign(existing,item);else state.conversations.unshift(item);
  if(!state.messages[item.id])state.messages[item.id]=[];
  return existing||item;
}
function beginCloudGroupSubscription(){
  if(cloudGroupUnsub){cloudGroupUnsub();cloudGroupUnsub=null;}
  if(!firebaseUser)return;
  cloudGroupUnsub=subscribeMyGroups(firebaseUser.uid,rows=>{rows.forEach(mergeCloudGroup);persistSoon();if(state.route==="messages"||state.route==="chat"||state.route==="groupInfo")render();},err=>{firebaseError=err?.message||String(err);});
}
function stopCloudMessageSubscription(){`);
  source=source.replace(`        beginCloudConversationSubscription();`,`        beginCloudConversationSubscription();
        beginCloudGroupSubscription();`);
  source=source.replace(`        if(cloudConversationUnsub){cloudConversationUnsub();cloudConversationUnsub=null;}`,`        if(cloudConversationUnsub){cloudConversationUnsub();cloudConversationUnsub=null;}
        if(cloudGroupUnsub){cloudGroupUnsub();cloudGroupUnsub=null;}`);

  const newGroupStart=source.indexOf(`function renderNewGroup(){`),groupNameStart=source.indexOf(`function renderGroupName(){`),chatStart=source.indexOf(`function renderChat(){`);
  if(newGroupStart>=0&&groupNameStart>newGroupStart&&chatStart>groupNameStart){
    const groupUi=`function renderNewGroup(){
  if(!firebaseUser){alert("Sign in to a FIDUNIO account before creating a real group.");state.route="newConversation";return render();}
  app.innerHTML=\`<main class="app-shell">\${shellTop("New Group",'<button class="back-btn" id="backBtn">‹</button>','<button class="text-btn" id="nextBtn">Next</button>')}<section class="content"><input class="search" id="memberSearch" placeholder="Search FIDUNIO users" /><div class="chip-row" id="selectedChips"></div><div class="choice-list" id="memberChoices"><p class="small-note">Loading FIDUNIO users…</p></div></section></main>\`;
  document.querySelector("#backBtn").onclick=()=>{state.route="newConversation";render()};
  const draw=(term="")=>{const selected=new Set(state.newGroupMembers),choices=document.querySelector("#memberChoices"),chips=document.querySelector("#selectedChips");if(!choices||!chips)return;chips.innerHTML=state.newGroupMembers.length?groupCandidates.filter(p=>selected.has(p.uid)).map(p=>\`<span class="person-chip">\${esc(p.displayName||p.email||p.uid)}</span>\`).join(""):'<span class="small-note">Select at least 2 people for the group.</span>';choices.innerHTML=groupCandidates.filter(p=>String(p.displayName||p.email||p.uid).toLowerCase().includes(term.toLowerCase())).map(p=>\`<button class="member-option \${selected.has(p.uid)?"selected":""}" data-id="\${p.uid}"><div class="avatar">\${initials(p.displayName||p.email||"U")}</div><div><strong>\${esc(p.displayName||p.email||"FIDUNIO user")}</strong><div class="preview">FIDUNIO account</div></div><div class="checkmark">\${selected.has(p.uid)?"✓":""}</div></button>\`).join("")||'<p class="small-note">No matching FIDUNIO users.</p>';document.querySelectorAll("#memberChoices .member-option").forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id;state.newGroupMembers=selected.has(id)?state.newGroupMembers.filter(x=>x!==id):[...state.newGroupMembers,id];draw(document.querySelector("#memberSearch").value);});document.querySelector("#nextBtn").disabled=state.newGroupMembers.length<2;};
  draw();listCloudUsers().then(rows=>{groupCandidates=rows||[];draw(document.querySelector("#memberSearch")?.value||"");}).catch(err=>{firebaseError=err?.message||String(err);document.querySelector("#memberChoices").innerHTML=\`<p class="warning-note">\${esc(firebaseError)}</p>\`;});document.querySelector("#memberSearch").oninput=e=>draw(e.target.value);document.querySelector("#nextBtn").onclick=()=>{if(state.newGroupMembers.length>=2){state.route="groupName";render();}};
}

function renderGroupName(){
  const selected=groupCandidates.filter(p=>state.newGroupMembers.includes(p.uid));
  app.innerHTML=\`<main class="app-shell">\${shellTop("Group Details",'<button class="back-btn" id="backBtn">‹</button>')}<section class="content"><div class="card"><label class="form-label" for="groupNameInput">Group name</label><input class="text-input" id="groupNameInput" maxlength="120" placeholder="Enter a group name" value="\${esc(state.newGroupName)}" /><div class="section-title">Members</div><div class="chip-row">\${selected.map(p=>\`<span class="person-chip">\${esc(p.displayName||p.email||p.uid)}</span>\`).join("")}</div><p class="small-note">New members begin at join time. Real group messaging remains disabled until group E2EE is implemented.</p></div><button class="primary" id="createGroupBtn">Create Group</button></section></main>\`;
  document.querySelector("#backBtn").onclick=()=>{state.route="newGroup";render()};const input=document.querySelector("#groupNameInput"),btn=document.querySelector("#createGroupBtn");const validate=()=>{state.newGroupName=input.value;btn.disabled=!input.value.trim()||state.newGroupMembers.length<2;};input.oninput=validate;validate();btn.onclick=async()=>{btn.disabled=true;btn.textContent="Creating…";try{const group=await createCloudGroup(state.newGroupName.trim(),state.newGroupMembers);mergeCloudGroup(group);state.selectedId=group.id;state.newGroupMembers=[];state.newGroupName="";state.route="groupInfo";await persistState();render();}catch(err){alert("Could not create group: "+(err?.message||err));btn.disabled=false;btn.textContent="Create Group";}};
}

`;
    source=source.slice(0,newGroupStart)+groupUi+source.slice(chatStart);
  }
  source=source.replace(`  const cloud=!!c?.cloud;`,`  const cloud=!!c?.cloud;
  if(c?.cloudGroup){alert("Group messaging is intentionally disabled in FIDUNIO 0.9.1.1 until group E2EE is implemented.");return;}`);

  const headers=new Headers(response.headers);headers.set("content-type","text/javascript; charset=utf-8");headers.delete("content-length");
  return new Response(source,{status:response.status,statusText:response.statusText,headers});
}
async function networkFirst(request){const cache=await caches.open(CACHE);try{let response=await Promise.race([fetch(request,{cache:"no-store"}),new Promise((_,reject)=>setTimeout(()=>reject(new Error("slow")),NETWORK_TIMEOUT))]);response=await transformApp(request,response);if(response&&response.ok)cache.put(request,response.clone());return response;}catch{const hit=await cache.match(request);if(hit)return hit;if(request.mode==="navigate"){const shell=await cache.match("./index.html");if(shell)return shell;}throw new Error("offline and not cached");}}
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;const url=new URL(event.request.url);if(url.hostname.endsWith("googleapis.com")||url.hostname.endsWith("firebaseio.com"))return;if(url.hostname==="www.gstatic.com"){event.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(event.request);const fresh=fetch(event.request).then(response=>{if(response&&response.ok)cache.put(event.request,response.clone());return response;}).catch(()=>hit);return hit||fresh;}));return;}if(url.origin===self.location.origin)event.respondWith(networkFirst(event.request));});