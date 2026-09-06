import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');const write=(p,s)=>fs.writeFileSync(p,s);
function rep(p,a,b){const s=read(p);if(!s.includes(a))throw new Error(`Missing anchor ${p}: ${a.slice(0,100)}`);if(s.indexOf(a)!==s.lastIndexOf(a))throw new Error(`Non-unique anchor ${p}`);write(p,s.replace(a,b));}
function appendOnce(p,m,t){const s=read(p);if(!s.includes(m))write(p,s.trimEnd()+"\n\n"+t.trim()+"\n");}

// Repair explicit Settings-local lifecycle/helpers so the module has no hidden global dependencies.
rep('settings-lifecycle.js','import { getAccountE2EELifecycleState,enrollAccountE2EE,unlockAccountE2EE,recoverAccountE2EE } from "./e2ee-account-runtime.js";\n',`import { getAccountE2EELifecycleState,enrollAccountE2EE,unlockAccountE2EE,recoverAccountE2EE,changeAccountPasswordWithE2EE } from "./e2ee-account-runtime.js";

let mutationTail=Promise.resolve();
let generation=0;
function esc(v){return String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[c]));}
function initials(name){return String(name||"U").trim().split(/\\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()||"").join("")||"U";}
function prettyRole(role){return role==="owner"?"Owner":role==="admin"?"Administrator":"User";}
function profileStatus(p){if(p?.active===false)return p?.status||"deactivated";return p?.status||"active";}
function dateText(v){const d=v?.toDate?.()||v;if(!d)return"—";try{return new Date(d).toLocaleString();}catch{return String(d);}}
function guideUrl(){return new URL("./quick-start.html",location.href).href;}
function inviteSubject(){return "Your FIDUNIO invitation";}
function inviteMessage(invite){return \`You are invited to FIDUNIO as \${prettyRole(invite.role)}.\\n\\nJoin: \${invite.link}\\nQuick Start: \${guideUrl()}\\nExpires: \${invite.expiresAt?.toLocaleString?.()||invite.expiresAt||""}\`;}
`);

// Coordinate Firebase password changes with the account E2EE wrapper. If Auth fails, roll the wrapper back.
rep('e2ee-account-runtime.js','import { enrollCloudE2EERecovery,startCloudE2EERecovery,completeCloudE2EERecovery } from "./firebase.js";', 'import { enrollCloudE2EERecovery,startCloudE2EERecovery,completeCloudE2EERecovery,changeFidunioPassword } from "./firebase.js";');
rep('e2ee-account-runtime.js','export async function recoverAccountE2EE({uid,newPassword,pin}){\n  const recovered=await recoveryClient.recoverKey({pin});\n  try{return await manager.recover({uid,recoveryUnlockKey:recovered.recoveryUnlockKey,newPassword,pin});}\n  finally{recovered.recoveryUnlockKey.fill(0);}\n}\n',`export async function recoverAccountE2EE({uid,newPassword,pin}){
  const recovered=await recoveryClient.recoverKey({pin});
  try{return await manager.recover({uid,recoveryUnlockKey:recovered.recoveryUnlockKey,newPassword,pin});}
  finally{recovered.recoveryUnlockKey.fill(0);}
}
export async function changeAccountPasswordWithE2EE({uid,currentPassword,newPassword,pin}){
  const state=manager.getState();
  if(state.state==="EMPTY")return changeFidunioPassword(currentPassword,newPassword);
  if(state.state!=="READY")await manager.unlock({uid,password:currentPassword,pin});
  await manager.rewrap({uid,oldPassword:currentPassword,newPassword,pin});
  try{return await changeFidunioPassword(currentPassword,newPassword);}
  catch(error){
    try{await manager.rewrap({uid,oldPassword:newPassword,newPassword:currentPassword,pin});}
    catch(rollbackError){const e=new Error("Firebase password change failed and the E2EE wrapper rollback also failed. Use account recovery before messaging.");e.cause={error,rollbackError};throw e;}
    throw error;
  }
}
`);
rep('settings-lifecycle.js','async function changePassword(currentPassword,newPassword){return changeFidunioPassword(currentPassword,newPassword);}', 'async function changePassword(uid,currentPassword,newPassword,pin){return changeAccountPasswordWithE2EE({uid,currentPassword,newPassword,pin});}');
rep('settings-lifecycle.js','<label class="form-label" for="newPassword2">Confirm new password</label><input class="text-input" id="newPassword2" type="password" autocomplete="new-password" placeholder="Repeat new password"><button class="secondary" id="changePasswordBtn" style="margin-top:14px">Change Password</button>', '<label class="form-label" for="newPassword2">Confirm new password</label><input class="text-input" id="newPassword2" type="password" autocomplete="new-password" placeholder="Repeat new password"><label class="form-label" for="passwordE2EEPin">Six-digit account E2EE PIN</label><input class="text-input" id="passwordE2EEPin" type="password" inputmode="numeric" autocomplete="off" maxlength="6" pattern="[0-9]*" placeholder="Required after Account Encryption is created"><button class="secondary" id="changePasswordBtn" style="margin-top:14px">Change Password</button>');
rep('settings-lifecycle.js','try{await serializeSettingsMutation("change password",()=>changePassword(currentPassword,next));card.querySelector("#profileCurrentPassword").value="";', 'try{await serializeSettingsMutation("change password",()=>changePassword(info.user.uid,currentPassword,next,card.querySelector("#passwordE2EEPin").value));card.querySelector("#profileCurrentPassword").value="";');

// One account-authoritative v3 direct-message runtime owner.
write('e2ee-account-message-runtime.js',`import { createAccountDirectMessageService } from "./e2ee-account-message-service.js";
import { getAccountE2EERuntimeIdentity } from "./e2ee-account-runtime.js";
import { getCloudAccountE2EEPublicKey } from "./firebase.js";
const service=createAccountDirectMessageService({getRuntimeIdentity:getAccountE2EERuntimeIdentity,getPublicIdentity:getCloudAccountE2EEPublicKey});
export function prepareAccountDirectMessage(args){return service.prepareOutgoing(args);}
export function decryptAccountDirectMessage(args){return service.decryptIncoming(args);}
`);

// Raw app.js becomes authoritative for v3 send/receive; no service-worker semantic rewrite remains.
rep('app.js','import { bindAuthenticatedAccountE2EE, resetAccountE2EEForSignOut } from "./e2ee-account-runtime.js";\n', 'import { bindAuthenticatedAccountE2EE, resetAccountE2EEForSignOut } from "./e2ee-account-runtime.js";\nimport { prepareAccountDirectMessage,decryptAccountDirectMessage } from "./e2ee-account-message-runtime.js";\n');
rep('app.js',`        if(m.e2ee){
          if(peerKey){try{text=await decryptCloudText(m,peerKey,conversationId);}catch{text="[Encrypted message — key unavailable]";}}
          else text="[Encrypted message — key unavailable]";
        }`,`        if(m.e2ee===3){
          try{text=await decryptAccountDirectMessage({uid:firebaseUser.uid,peerUid:c.peerUid,conversationId,messageId:m.id,row:m});}
          catch{text="[Encrypted message — account encryption unavailable]";}
        }else if(m.e2ee){
          if(peerKey){try{text=await decryptCloudText(m,peerKey,conversationId);}catch{text="[Encrypted message — key unavailable]";}}
          else text="[Encrypted message — key unavailable]";
        }`);
rep('app.js',`  if(cloud && c?.peerUid){
    await peerPublicKeyForConversation(conversationId,{refresh:true});
    if(peerTrustStatus(c.peerUid)==="changed"){
      state.modal={type:"conversationSecurity",peerUid:c.peerUid,conversationId};
      render();
      return;
    }
  }
`,`  if(cloud && c?.peerUid && !firebaseUser){throw new Error("Sign in before sending an encrypted message.");}
`);
rep('app.js',`        const peerKey=await peerPublicKeyForConversation(payload.conversationId,{refresh:true});
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
        });`,`        const peerUid=await resolvePeerUidForConversation(payload.conversationId);
        if(!peerUid)throw new Error("Recipient account identity is unavailable.");
        const encrypted=await prepareAccountDirectMessage({uid:firebaseUser.uid,peerUid,conversationId:payload.conversationId,messageId:payload.messageId,text:payload.text});
        await sendCloudMessage(payload.conversationId,{id:payload.messageId,text:"",...encrypted,timeLabel:payload.time,state:"sent"});`);

// Firestore writer carries the exact v3 envelope metadata already allowed by deployed rules.
rep('firebase.js','if(message.e2ee){row.e2ee=message.e2ee;row.ciphertext=message.ciphertext||"";row.iv=message.iv||"";row.text="";if(message.envelopes&&typeof message.envelopes==="object")row.envelopes=message.envelopes;if(message.recipientDeviceIds)row.recipientDeviceIds=message.recipientDeviceIds;}else row.text=message.text||"";', 'if(message.e2ee){row.e2ee=message.e2ee;row.ciphertext=message.ciphertext||"";row.iv=message.iv||"";row.text="";if(message.kdfVersion)row.kdfVersion=message.kdfVersion;if(message.senderKeyId)row.senderKeyId=message.senderKeyId;if(message.recipientKeyId)row.recipientKeyId=message.recipientKeyId;if(message.envelopes&&typeof message.envelopes==="object")row.envelopes=message.envelopes;if(message.recipientDeviceIds)row.recipientDeviceIds=message.recipientDeviceIds;}else row.text=message.text||"";');

// Service worker is transport/cache only. All semantic app.js rewriting is removed.
write('service-worker.js',`/* FIDUNIO account-E2EE runtime service worker. Network-first shell; no semantic source transforms. */
importScripts("./version.js");
const SW_VERSION=globalThis.FIDUNIO_RELEASE?.version||"unknown";
const CACHE=\`fidunio-shell-\${SW_VERSION}\`;
const SHELL=["./","./index.html","./version.js","./styles.css","./styles-0.9.0.css","./app.js","./firebase.js","./firebase-config.js","./settings-lifecycle.js","./new-message-owner.js","./local-security.js","./account-storage.js","./e2ee-account-runtime.js","./e2ee-account-lifecycle.js","./e2ee-account-identity-manager.js","./e2ee-account-firebase-adapter.js","./e2ee-account-firestore-adapter.js","./e2ee-account-crypto.js","./e2ee-account-recovery-client.js","./e2ee-account-message-runtime.js","./e2ee-account-message-service.js","./e2ee-account-message-crypto.js","./manifest.json","./favicon.png","./fidunio-logo.png","./icon-180.png","./icon-192.png","./icon-512.png"];
const FIREBASE_SDK=["https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js","https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js","https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js","https://www.gstatic.com/firebasejs/12.18.0/firebase-app-check.js","https://www.gstatic.com/firebasejs/12.18.0/firebase-functions.js"];
const NETWORK_TIMEOUT=4000;
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled([...SHELL,...FIREBASE_SDK].map(url=>cache.add(url)))).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function networkFirst(request){const cache=await caches.open(CACHE);try{const response=await Promise.race([fetch(request,{cache:"no-store"}),new Promise((_,reject)=>setTimeout(()=>reject(new Error("slow")),NETWORK_TIMEOUT))]);if(response&&response.ok)cache.put(request,response.clone());return response;}catch{const hit=await cache.match(request);if(hit)return hit;if(request.mode==="navigate"){const shell=await cache.match("./index.html");if(shell)return shell;}throw new Error("offline and not cached");}}
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;const url=new URL(event.request.url);if(url.hostname.endsWith("googleapis.com")||url.hostname.endsWith("firebaseio.com"))return;if(url.hostname==="www.gstatic.com"){event.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(event.request);const fresh=fetch(event.request).then(response=>{if(response&&response.ok)cache.put(event.request,response.clone());return response;}).catch(()=>hit);return hit||fresh;}));return;}if(url.origin===self.location.origin)event.respondWith(networkFirst(event.request));});
`);

write('runtime-transform-anchor.test.mjs',`import fs from "node:fs";
const app=fs.readFileSync("app.js","utf8"),sw=fs.readFileSync("service-worker.js","utf8"),settings=fs.readFileSync("settings-lifecycle.js","utf8");
for(const forbidden of ["transformApp(","source.replace(","helperNeedle","buildDeviceEnvelopes","decryptDeviceEnvelope"])if(sw.includes(forbidden))throw new Error(\`semantic service-worker transform remains: \${forbidden}\`);
for(const required of ["prepareAccountDirectMessage","decryptAccountDirectMessage","m.e2ee===3","recipientKeyId","senderKeyId","kdfVersion"])if(!app.includes(required)&&!fs.readFileSync("firebase.js","utf8").includes(required))throw new Error(\`v3 runtime anchor missing: \${required}\`);
for(const required of ["let mutationTail=Promise.resolve()","let generation=0","function esc(","changeAccountPasswordWithE2EE"])if(!settings.includes(required))throw new Error(\`Settings local authority anchor missing: \${required}\`);
for(const forbidden of ["Maria Santos","John Cruz","Family Group","Sample local contacts"])if(app.includes(forbidden))throw new Error(\`prototype marker remains: \${forbidden}\`);
if(!app.includes("conversations:[]")||!app.includes("messages:{}")||!app.includes("selectedId:null"))throw new Error("empty production defaults are not authoritative");
console.log("PASS raw runtime is authoritative; service worker contains no semantic transforms");
`);

// Runtime authority gate must accept only the central firebase.js SDK owner and raw app runtime.
appendOnce('ACCOUNT-E2EE-DIRECT-MESSAGE-FORMAT.md','## Runtime cutover — September 6, 2026',`## Runtime cutover — September 6, 2026

The raw application runtime now prepares and decrypts direct-message e2ee:3 envelopes through e2ee-account-message-runtime.js. firebase.js remains the sole Firebase SDK/service owner and writes the exact v3 metadata. The service worker no longer rewrites app.js or owns any E2EE semantics. Legacy e2ee:1/e2ee:2 rows remain readable for migration/history compatibility, but new direct sends fail closed unless the durable account identity is READY.`);
appendOnce('RUNTIME-TRANSFORM-INVENTORY.md','## Account-E2EE v3 transform retirement — September 6, 2026',`## Account-E2EE v3 transform retirement — September 6, 2026

The remaining direct-message service-worker transforms have been retired. Raw app.js now owns account-authoritative e2ee:3 send/receive, and service-worker.js is cache/transport only. No source.replace/transformApp semantic layer remains. Legacy e2ee:1/e2ee:2 receive compatibility stays in raw app.js only for existing history; new direct sends use e2ee:3 and fail closed when Account E2EE is not READY.`);
appendOnce('RUNTIME-AUTHORITY-MAP.md','## September 6, 2026 account-E2EE runtime authority',`## September 6, 2026 account-E2EE runtime authority

- Firebase SDK/service initialization and callable recovery: firebase.js only.
- Durable account identity lifecycle: e2ee-account-identity-manager.js through e2ee-account-runtime.js.
- Direct-message e2ee:3 orchestration: e2ee-account-message-runtime.js -> e2ee-account-message-service.js.
- Settings enrollment/unlock/recovery UI: settings-lifecycle.js in its named Account Encryption host.
- Service worker: cache/transport only; zero app.js semantic transforms.
- New direct-message transport is e2ee:3 only and requires account identity READY. Legacy e2ee:1/e2ee:2 remain read compatibility until migration history is no longer needed.`);
appendOnce('hermes-memory.txt','ACCOUNT E2EE CLIENT/RUNTIME CUTOVER — SEPTEMBER 6, 2026',`ACCOUNT E2EE CLIENT/RUNTIME CUTOVER — SEPTEMBER 6, 2026
- Recovery callable client is centralized through firebase.js Functions SDK in us-central1; Firebase Auth/App Check tokens are attached by the official callable SDK.
- Settings has a named Account Encryption panel for enrollment, unlock, and post-password-reset recovery. The account E2EE PIN remains exactly six digits and separate from the installation-local 4–12 digit app-lock PIN.
- Firebase password change is coordinated with account E2EE rewrap and attempts rollback if Auth update fails.
- Raw app.js now sends/decrypts direct-message e2ee:3 via the account-authoritative message service. New sends fail closed unless the durable account identity is READY.
- service-worker.js no longer transforms app.js or owns E2EE semantics; it is cache/transport only. Legacy e2ee:1/e2ee:2 receive compatibility remains in raw app.js for history.
- App Check enforcement remains OFF pending real legitimate-device validation and metrics.`);
rep('version.js','version: "0.9.6.2"','version: "0.9.6.3"');
console.log('v3 runtime materialization complete');
