import fs from 'node:fs';

function read(p){return fs.readFileSync(p,'utf8');}
function write(p,s){fs.writeFileSync(p,s);}
function replaceExact(p,from,to){const s=read(p);if(!s.includes(from))throw new Error(`Anchor missing in ${p}: ${from.slice(0,100)}`);if(s.indexOf(from)!==s.lastIndexOf(from))throw new Error(`Anchor not unique in ${p}: ${from.slice(0,100)}`);write(p,s.replace(from,to));}
function appendOnce(p,marker,text){const s=read(p);if(s.includes(marker))return;write(p,s.trimEnd()+"\n\n"+text.trim()+"\n");}

// 1) Central Firebase owner gains the Functions SDK and the three bounded recovery callables.
replaceExact('firebase.js',
'async function loadSdk(){if(sdkPromise)return sdkPromise;sdkPromise=Promise.all([import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`),import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`),import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app-check.js`)]).then(([appSdk,authSdk,fsSdk,appCheckSdk])=>({appSdk,authSdk,fsSdk,appCheckSdk}));return sdkPromise;}\nasync function ensureServices(){if(services)return services;if(!isFirebaseConfigured())throw new Error("Firebase is not configured yet.");const {appSdk,authSdk,fsSdk,appCheckSdk}=await loadSdk();const app=appSdk.initializeApp(firebaseConfig);const appCheck=appCheckSdk.initializeAppCheck(app,{provider:new appCheckSdk.ReCaptchaEnterpriseProvider(FIDUNIO_RECAPTCHA_ENTERPRISE_SITE_KEY),isTokenAutoRefreshEnabled:true});const auth=authSdk.getAuth(app),db=fsSdk.getFirestore(app);services={app,appCheck,auth,db,authSdk,fsSdk};return services;}',
'async function loadSdk(){if(sdkPromise)return sdkPromise;sdkPromise=Promise.all([import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`),import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`),import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app-check.js`),import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-functions.js`)]).then(([appSdk,authSdk,fsSdk,appCheckSdk,functionsSdk])=>({appSdk,authSdk,fsSdk,appCheckSdk,functionsSdk}));return sdkPromise;}\nasync function ensureServices(){if(services)return services;if(!isFirebaseConfigured())throw new Error("Firebase is not configured yet.");const {appSdk,authSdk,fsSdk,appCheckSdk,functionsSdk}=await loadSdk();const app=appSdk.initializeApp(firebaseConfig);const appCheck=appCheckSdk.initializeAppCheck(app,{provider:new appCheckSdk.ReCaptchaEnterpriseProvider(FIDUNIO_RECAPTCHA_ENTERPRISE_SITE_KEY),isTokenAutoRefreshEnabled:true});const auth=authSdk.getAuth(app),db=fsSdk.getFirestore(app),functions=functionsSdk.getFunctions(app,"us-central1");services={app,appCheck,auth,db,functions,authSdk,fsSdk,functionsSdk};return services;}');
replaceExact('firebase.js',
'export function getFirebaseUser(){return authUser;}\n',
'export function getFirebaseUser(){return authUser;}\n\nasync function callRecoveryFunction(name,data={}){\n  const s=await ensureServices();\n  if(!authUser)throw new Error("Sign in first.");\n  const callable=s.functionsSdk.httpsCallable(s.functions,name);\n  const result=await callable(data);\n  return result.data;\n}\nexport function enrollCloudE2EERecovery(data){return callRecoveryFunction("enrollRecoveryV1",data);}\nexport function startCloudE2EERecovery(){return callRecoveryFunction("startE2EERecoveryV1",{});}\nexport function completeCloudE2EERecovery(data){return callRecoveryFunction("completeE2EERecoveryV1",data);}\n');

// 2) Pure recovery client: one bounded adapter between identity manager and callable APIs.
write('e2ee-account-recovery-client.js',`function bytesToBase64Url(bytes){
  const u8=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes||[]);
  if(u8.length!==32)throw new Error("Recovery key must be exactly 32 bytes.");
  let raw="";for(const b of u8)raw+=String.fromCharCode(b);
  return btoa(raw).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/g,"");
}
function base64UrlToBytes(value){
  const v=String(value||"");if(!/^[A-Za-z0-9_-]+$/.test(v))throw new Error("Recovery key response is invalid.");
  const padded=v.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-v.length%4)%4);
  const raw=atob(padded),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  if(out.length!==32)throw new Error("Recovery key response is invalid.");return out;
}
export function createAccountE2EERecoveryClient({enroll,start,complete}={}){
  for(const [name,fn] of Object.entries({enroll,start,complete}))if(typeof fn!=="function")throw new Error(\`Missing recovery callable: \${name}\`);
  return Object.freeze({
    async protectRecoveryKey({keyId,pin,recoveryUnlockKey}){return enroll({keyId,pin,recoveryUnlockKey:bytesToBase64Url(recoveryUnlockKey)});},
    async recoverKey({pin}){const started=await start();const finished=await complete({sessionId:started.sessionId,pin});return{...finished,recoveryUnlockKey:base64UrlToBytes(finished.recoveryUnlockKey)};}
  });
}
`);

// 3) Runtime binds the live recovery authority to the existing sole identity manager.
write('e2ee-account-runtime.js',`import { createAccountE2EEIdentityManager } from "./e2ee-account-identity-manager.js";
import { createFirebaseAccountE2EEIdentityStore } from "./e2ee-account-firebase-adapter.js";
import { createAccountE2EEAuthLifecycle } from "./e2ee-account-lifecycle.js";
import { createAccountE2EERecoveryClient } from "./e2ee-account-recovery-client.js";
import { enrollCloudE2EERecovery,startCloudE2EERecovery,completeCloudE2EERecovery } from "./firebase.js";

const recoveryClient=createAccountE2EERecoveryClient({enroll:enrollCloudE2EERecovery,start:startCloudE2EERecovery,complete:completeCloudE2EERecovery});
const identityStore=createFirebaseAccountE2EEIdentityStore();
const manager=createAccountE2EEIdentityManager({identityStore,recoveryService:recoveryClient});
const lifecycle=createAccountE2EEAuthLifecycle({manager});

export function bindAuthenticatedAccountE2EE(uid){return lifecycle.bindAuthenticatedUid(uid);}
export function resetAccountE2EEForSignOut(){lifecycle.resetForSignOut();}
export function getAccountE2EELifecycleState(){return lifecycle.getLifecycleState();}
export function getAccountE2EERuntimeIdentity(){return manager.getRuntimeIdentity();}
export function enrollAccountE2EE({uid,password,pin}){return manager.enroll({uid,password,pin});}
export function unlockAccountE2EE({uid,password,pin}){return manager.unlock({uid,password,pin});}
export async function recoverAccountE2EE({uid,newPassword,pin}){
  const recovered=await recoveryClient.recoverKey({pin});
  try{return await manager.recover({uid,recoveryUnlockKey:recovered.recoveryUnlockKey,newPassword,pin});}
  finally{recovered.recoveryUnlockKey.fill(0);}
}
`);

// 4) Settings owns an explicit Account Encryption panel. Password/PIN are never persisted.
replaceExact('settings-lifecycle.js',
'} from "./firebase.js";\n',
'} from "./firebase.js";\nimport { getAccountE2EELifecycleState,enrollAccountE2EE,unlockAccountE2EE,recoverAccountE2EE } from "./e2ee-account-runtime.js";\n');
replaceExact('settings-lifecycle.js',
'  {id:"privacy",label:"Privacy & Access",icon:"🔒",subtitle:"Local PIN, device unlock, inactivity lock, and device identity.",cards:["Privacy & Access","Device Identity"]},\n  {id:"profile",',
'  {id:"privacy",label:"Privacy & Access",icon:"🔒",subtitle:"Local PIN, device unlock, inactivity lock, and device identity.",cards:["Privacy & Access","Device Identity"]},\n  {id:"encryption",label:"Account Encryption",icon:"◇",subtitle:"Unlock or recover the one durable account E2EE identity."},\n  {id:"profile",');
replaceExact('settings-lifecycle.js',
'const PANEL_ORDER=["profile","general","privacy","users","invites","data","about"];',
'const PANEL_ORDER=["profile","general","privacy","encryption","users","invites","data","about"];');
replaceExact('settings-lifecycle.js',
'async function hydrateAccountPanels(g,shell){\n  const profileHost=host(shell,"profile"),usersHost=host(shell,"users"),invitesHost=host(shell,"invites");',
`function renderAccountEncryption(encryptionHost,info){
  const lifecycle=getAccountE2EELifecycleState(),managerState=lifecycle?.manager?.state||"EMPTY",uid=info.user.uid;
  const ready=managerState==="READY",empty=managerState==="EMPTY";
  encryptionHost.innerHTML=\`<div class="card" id="fidunioAccountEncryptionCard"><h2>Account Encryption</h2>
    <p class="small-note"><strong>Status:</strong> \${esc(managerState)}</p>
    \${ready?\`<p class="small-note">Your durable account encryption identity is unlocked on this installation. The same keyId is used across legitimate recovery; FIDUNIO never creates a replacement identity after an unlock/recovery failure.</p>\`:\`
      <label class="form-label" for="accountE2EEPassword">\${empty?"Current Firebase password":"Firebase password"}</label>
      <input class="text-input" id="accountE2EEPassword" type="password" autocomplete="current-password" placeholder="Password">
      <label class="form-label" for="accountE2EEPin">Six-digit account E2EE PIN</label>
      <input class="text-input" id="accountE2EEPin" type="password" inputmode="numeric" autocomplete="off" maxlength="6" pattern="[0-9]*" placeholder="Exactly 6 digits">
      \${empty?\`<label class="form-label" for="accountE2EEPin2">Confirm E2EE PIN</label><input class="text-input" id="accountE2EEPin2" type="password" inputmode="numeric" autocomplete="off" maxlength="6" pattern="[0-9]*" placeholder="Repeat 6-digit PIN">\`:""}
      <button class="primary" id="accountE2EEPrimaryBtn" style="margin-top:14px">\${empty?"Create Account Encryption":"Unlock Account Encryption"}</button>
      \${empty?"":'<button class="secondary" id="accountE2EERecoverBtn" style="margin-top:10px">Recover After Password Reset</button>'}
      <div id="accountE2EENote"></div>\`}
    <p class="warning-note">This six-digit account E2EE PIN is separate from the installation-local 4–12 digit app-lock PIN.</p></div>\`;
  if(ready)return;
  const card=encryptionHost.querySelector("#fidunioAccountEncryptionCard"),note=card.querySelector("#accountE2EENote"),primary=card.querySelector("#accountE2EEPrimaryBtn");
  primary.onclick=async()=>{const password=card.querySelector("#accountE2EEPassword").value,pin=card.querySelector("#accountE2EEPin").value;if(empty&&pin!==card.querySelector("#accountE2EEPin2").value){note.innerHTML='<p class="warning-note">The E2EE PIN entries do not match.</p>';return;}primary.disabled=true;primary.textContent=empty?"Creating…":"Unlocking…";try{if(empty)await enrollAccountE2EE({uid,password,pin});else await unlockAccountE2EE({uid,password,pin});renderAccountEncryption(encryptionHost,info);}catch(err){note.innerHTML=\`<p class="warning-note">\${esc(err?.message||String(err))}</p>\`;primary.disabled=false;primary.textContent=empty?"Create Account Encryption":"Unlock Account Encryption";}};
  const recover=card.querySelector("#accountE2EERecoverBtn");if(recover)recover.onclick=async()=>{const newPassword=card.querySelector("#accountE2EEPassword").value,pin=card.querySelector("#accountE2EEPin").value;if(!confirm("Use recovery only after the Firebase password has been reset. Continue with the existing six-digit account E2EE PIN?"))return;recover.disabled=true;recover.textContent="Recovering…";try{await recoverAccountE2EE({uid,newPassword,pin});renderAccountEncryption(encryptionHost,info);}catch(err){note.innerHTML=\`<p class="warning-note">\${esc(err?.message||String(err))}</p>\`;recover.disabled=false;recover.textContent="Recover After Password Reset";}};
}

async function hydrateAccountPanels(g,shell){
  const profileHost=host(shell,"profile"),usersHost=host(shell,"users"),invitesHost=host(shell,"invites"),encryptionHost=host(shell,"encryption");`);
replaceExact('settings-lifecycle.js',
'    renderProfile(profileHost,info);renderUserAdmin(usersHost,info);renderInvitations(invitesHost,info);',
'    renderProfile(profileHost,info);renderAccountEncryption(encryptionHost,info);renderUserAdmin(usersHost,info);renderInvitations(invitesHost,info);');

// 5) Recovery client test proves exact RUK round-trip and callable payload boundaries.
write('e2ee-account-recovery-client.test.mjs',`import assert from "node:assert/strict";
if(typeof globalThis.btoa!=="function")globalThis.btoa=s=>Buffer.from(s,"binary").toString("base64");
if(typeof globalThis.atob!=="function")globalThis.atob=s=>Buffer.from(s,"base64").toString("binary");
const {createAccountE2EERecoveryClient}=await import("./e2ee-account-recovery-client.js");
const ruk=Uint8Array.from({length:32},(_,i)=>i+1);let enrollPayload,startCalls=0,completePayload;
const client=createAccountE2EERecoveryClient({
  enroll:async data=>{enrollPayload=data;return{recoveryAuthorityVersion:1,recoveryKeyWrappingAlgorithm:"HMAC-SHA256+A256GCM",recoveryKeyIv:"abc",wrappedRecoveryKey:"def"};},
  start:async()=>{startCalls++;return{sessionId:"session-1",expiresAtMs:123,status:"PENDING"};},
  complete:async data=>{completePayload=data;return{recoveryUnlockKey:Buffer.from(ruk).toString("base64url"),keyId:"key-1",identityRevision:7};}
});
const protectedResult=await client.protectRecoveryKey({keyId:"key-1",pin:"012345",recoveryUnlockKey:ruk});
assert.equal(enrollPayload.keyId,"key-1");assert.equal(enrollPayload.pin,"012345");assert.equal(Buffer.from(enrollPayload.recoveryUnlockKey,"base64url").length,32);assert.equal(protectedResult.recoveryAuthorityVersion,1);
const recovered=await client.recoverKey({pin:"012345"});assert.equal(startCalls,1);assert.deepEqual(completePayload,{sessionId:"session-1",pin:"012345"});assert.deepEqual([...recovered.recoveryUnlockKey],[...ruk]);assert.equal(recovered.keyId,"key-1");
await assert.rejects(()=>client.protectRecoveryKey({keyId:"k",pin:"012345",recoveryUnlockKey:new Uint8Array(31)}),/32 bytes/);
console.log("Account E2EE recovery client boundary tests passed");
`);

// 6) Add the new gate and strengthen central Firebase/App Check ownership assertions.
const pkg=JSON.parse(read('package.json'));pkg.scripts['test:e2ee-account-recovery-client']='node e2ee-account-recovery-client.test.mjs';write('package.json',JSON.stringify(pkg,null,2)+"\n");
replaceExact('.github/workflows/rebuild-baseline-security.yml',
'      - name: Account E2EE auth lifecycle\n        run: npm run test:e2ee-account-lifecycle\n',
'      - name: Account E2EE auth lifecycle\n        run: npm run test:e2ee-account-lifecycle\n      - name: Account E2EE recovery client\n        run: npm run test:e2ee-account-recovery-client\n');
replaceExact('firebase-app-check.test.mjs',
'assert.match(firebaseSource,/firebase-app-check\\.js/);',
'assert.match(firebaseSource,/firebase-app-check\\.js/);\nassert.match(firebaseSource,/firebase-functions\\.js/);\nassert.match(firebaseSource,/getFunctions\\(app,"us-central1"\\)/);\nassert.match(firebaseSource,/httpsCallable\\(s\\.functions,name\\)/);');

// 7) Visible test version.
replaceExact('version.js','version: "0.9.6.1"','version: "0.9.6.2"');

// 8) Durable state docs: record the verified live deployment before further runtime work.
for(const p of ['hermes-memory.txt','FIREBASE-RECOVERY-PROJECT-CONFIG.md','E2EE-RECOVERY-PROTOCOL.md','ACCOUNT-E2EE-FIRESTORE-AUTHORITY.md','REBUILD-BASELINE-AUDIT.md','RUNTIME-TRANSFORM-INVENTORY.md']){
  let s=read(p);
  s=s.replaceAll('No Recovery Function has been deployed yet.','All three Recovery Functions were deployed and verified ACTIVE in us-central1 on September 6, 2026.');
  s=s.replaceAll('no Recovery Functions deployed yet','all three Recovery Functions deployed and verified ACTIVE');
  s=s.replaceAll('No Recovery Functions deployed yet.','All three Recovery Functions are deployed and verified ACTIVE.');
  s=s.replaceAll('no Recovery Function has been deployed yet','all three Recovery Functions are deployed and verified ACTIVE');
  write(p,s);
}
appendOnce('hermes-memory.txt','RECOVERY FUNCTIONS LIVE VERIFICATION — SEPTEMBER 6, 2026',`RECOVERY FUNCTIONS LIVE VERIFICATION — SEPTEMBER 6, 2026
- enrollRecoveryV1, startE2EERecoveryV1, and completeE2EERecoveryV1 are ACTIVE in us-central1.
- All three use fidunio-recovery@fidunio-fef13.iam.gserviceaccount.com.
- FIDUNIO_RECOVERY_MASTER_V1 is bound only to enrollment and completion; start has no secret binding.
- roles/datastore.user is present on the dedicated recovery runtime service account; Secret Accessor remains narrow on the recovery secret.
- Artifact Registry gcf-artifacts cleanup policy is configured to delete images older than 1 day.
- App Check enforcement remains OFF. Firestore rules, Hosting, Auth, and normal message transport were not changed by final verification.
- The first deploy returned an error only because artifact cleanup policy was not yet configured; the three Functions themselves reported successful create operations. The final verification script then confirmed ACTIVE/runtime-SA/secret bindings and set cleanup policy successfully.
- Console/Cloud Shell setup is complete. Do not repeat deployment or console setup. The next boundary is client recovery/enrollment validation and account-authoritative runtime migration.`);
appendOnce('FIREBASE-RECOVERY-PROJECT-CONFIG.md','## Live Recovery Functions verification — September 6, 2026',`## Live Recovery Functions verification — September 6, 2026

The deployment handoff is COMPLETE. enrollRecoveryV1, startE2EERecoveryV1 and completeE2EERecoveryV1 are ACTIVE in us-central1 under the dedicated recovery service account. Enrollment/completion have the recovery-secret binding; start does not. Artifact Registry cleanup is configured for images older than one day. App Check enforcement remains OFF. No further planned Firebase/Google Console setup remains before later conditional App Check enforcement.`);
appendOnce('E2EE-RECOVERY-PROTOCOL.md','## 14. Live deployment verification — September 6, 2026',`## 14. Live deployment verification — September 6, 2026

The three reviewed Recovery Functions are live and verified ACTIVE in us-central1 under the dedicated recovery runtime service account. Secret binding matches this protocol: enrollment and completion bind FIDUNIO_RECOVERY_MASTER_V1; start does not. App Check enforcement remains OFF while legitimate client traffic and recovery behavior are validated.`);
appendOnce('REBUILD-BASELINE-AUDIT.md','## Recovery deployment completion — September 6, 2026',`## Recovery deployment completion — September 6, 2026

The controlled Google/Firebase handoff completed. All three Recovery Functions are ACTIVE in us-central1 with the dedicated runtime service account and exact secret-binding boundary. Artifact Registry cleanup is configured. App Check remains OFF. Repository continuation may now wire and test the client recovery/enrollment lifecycle; normal e2ee:3 transport remains gated until account identity READY is proven.`);
appendOnce('RUNTIME-TRANSFORM-INVENTORY.md','## September 6 live-boundary update',`## September 6 live-boundary update

The Firebase/Google handoff that previously blocked account-E2EE enrollment is complete: reviewed Firestore rules are live and all three Recovery Functions are ACTIVE/verified. App Check remains OFF. The next bounded runtime work is explicit account enrollment/unlock/recovery readiness, followed by e2ee:3 send/receive/Outbox migration. Legacy per-device transforms remain until their replacement passes.`);

console.log('Account E2EE recovery/enrollment materialization complete.');
