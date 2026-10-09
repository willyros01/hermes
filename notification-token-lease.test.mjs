// FIDUNIO notification token lease regression suite (required TestFlight gate).
//
// Exercises the authoritative owners directly, with in-memory fakes only (no network, no
// Firebase project, no npm dependencies):
//   client lease owner ......... notification-lease-session.js   (native iOS installation lease)
//   web registration owner ..... notification-registration.js    (web/PWA Web Push registration)
//   server lease authority ..... functions/notification/notification-lease-firestore-admin.mjs
//   server delivery eligibility  functions/notification/notification-lease-policy.mjs
//                                functions/notification/direct-message-notification-firestore-admin-adapter.mjs
//   Settings / sign-out wiring . settings-lifecycle.js, app.js (source contracts)
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {createNotificationLeaseSession,FIDUNIO_NOTIFICATION_LEASE_ROLLOUT,NOTIFICATION_LOGOUT_BOUND_MS,NOTIFICATION_REVOKE_ATTEMPTS} from "./notification-lease-session.js";
import {createNotificationRegistrationOwner} from "./notification-registration.js";
import {createNotificationLeaseFirestoreAdmin} from "./functions/notification/notification-lease-firestore-admin.mjs";
import {NOTIFICATION_LEASE_MS,NOTIFICATION_INACTIVE_RETENTION_MS,mayDeliverRegistration} from "./functions/notification/notification-lease-policy.mjs";
import {createNotificationAdminRepositories} from "./functions/notification/direct-message-notification-firestore-admin-adapter.mjs";

// ---------- tiny sequential runner: every case runs, any failure fails the process ----------
const failures=[];let passed=0;
async function test(name,fn){try{await fn();passed++;console.log("PASS "+name);}catch(error){failures.push(name);console.error("FAIL "+name+"\n  "+(error?.stack||error));}}

// ---------- in-memory Firestore Admin fake with transactional read-then-write semantics ----------
function createFakeFirestore(){
  const docs=new Map();
  const snap=path=>{const v=docs.get(path);return{exists:v!==undefined,id:path.split("/").at(-1),data:()=>v===undefined?undefined:structuredClone(v)};};
  const ref=path=>({path,get:async()=>snap(path)});
  function query(path,filters=[],max=Infinity){
    return{
      where(field,op,value){return query(path,[...filters,{field,op,value}],max);},
      limit(n){return query(path,filters,n);},
      async get(){
        const depth=path.split("/").length+1;
        const rows=[...docs.entries()].filter(([key])=>key.startsWith(path+"/")&&key.split("/").length===depth)
          .filter(([,row])=>filters.every(({field,op,value})=>op==="=="?row[field]===value:op==="<="?row[field]<=value:(()=>{throw new Error("unsupported op "+op);})()))
          .slice(0,max).map(([key,row])=>({id:key.split("/").at(-1),data:()=>structuredClone(row)}));
        return{docs:rows,size:rows.length};
      }
    };
  }
  const db={
    doc:ref,
    collection:path=>query(path),
    async runTransaction(fn){
      const writes=[];
      const tx={
        get:async r=>snap(r.path),
        set(r,row,options={}){writes.push(()=>docs.set(r.path,options.merge?{...(docs.get(r.path)||{}),...structuredClone(row)}:structuredClone(row)));},
        update(r,row){writes.push(()=>{if(!docs.has(r.path))throw new Error("update of missing document "+r.path);docs.set(r.path,{...docs.get(r.path),...structuredClone(row)});});},
        delete(r){writes.push(()=>docs.delete(r.path));}
      };
      const result=await fn(tx);
      for(const write of writes)write();
      return result;
    }
  };
  return{db,docs};
}
const tokenKey=token=>createHash("sha256").update(token).digest("hex");
const TOKEN="t".repeat(80),TOKEN2="u".repeat(80),INSTALL="install-0001";
// Server code paths that read Date.now() directly (delivery eligibility) must see the same
// simulated clock as the injected lease authority, so Date.now is pinned to it per backend.
function backend(){const fake=createFakeFirestore();let clock=1_900_000_000_000;Date.now=()=>clock;const store=createNotificationLeaseFirestoreAdmin({db:fake.db,now:()=>clock});const repos=createNotificationAdminRepositories({db:fake.db});return{...fake,store,repos,advance:ms=>{clock+=ms;},now:()=>clock};}
// Delivery as the notification Cloud Functions actually perform it (deviceRepo.listActive), then
// filtered exactly like direct/group notification cores (enabled + token length).
const deliverable=async(env,uid)=>(await env.repos.deviceRepo.listActive(uid)).filter(row=>row?.enabled===true&&typeof row?.fcmToken==="string"&&row.fcmToken.length>=20);

// ---------- client fakes ----------
function memoryStorage(){const records=new Map();return{records,getItem:k=>records.has(k)?records.get(k):null,setItem:(k,v)=>records.set(k,String(v)),removeItem:k=>records.delete(k)};}
// Client session wired to the real server authority through a fake callable transport.
function deviceSession(env,{storage=memoryStorage(),token=()=>TOKEN,currentUid,network={online:true},timeoutMs=50,attempts,sleep=async()=>{}}={}){
  const calls=[];
  const session=createNotificationLeaseSession({
    storage,getInstallationId:()=>INSTALL,getToken:async()=>token(),getPlatform:()=>"ios-native",timeoutMs,attempts,sleep,
    claim:async args=>{calls.push(["claim",args]);if(!network.online)throw new Error("offline");return env.store.claim({...args,uid:currentUid()});},
    revoke:async args=>{calls.push(["revoke",args]);if(network.hang)return new Promise(()=>{});if(!network.online)throw new Error("offline");return env.store.revoke({...args,uid:currentUid()});}
  });
  return{session,calls,storage,network};
}

assert.equal(FIDUNIO_NOTIFICATION_LEASE_ROLLOUT,true,"native lease rollout is the active iOS notification owner");

// 1. Token registration and ownership
await test("1 token registration creates one owner record bound to account, installation and token",async()=>{
  const env=backend();let uid="A";const {session,calls}=deviceSession(env,{currentUid:()=>uid});
  assert.deepEqual(await session.activate("A"),{activated:false,reason:"not-enabled"},"no claim before the user enables notifications");
  assert.equal(calls.length,0);
  session.setPreference("A",true);
  const out=await session.activate("A");
  assert.equal(out.activated,true);
  assert.deepEqual(calls[0][1],{installationId:INSTALL,fcmToken:TOKEN,platform:"ios-native",showSenderName:false});
  const owner=env.docs.get("notificationTokenOwners/"+tokenKey(TOKEN));
  assert.equal(owner.ownerUid,"A");assert.equal(owner.installationId,INSTALL);assert.equal(owner.fcmToken,TOKEN);assert.equal(owner.leaseId,out.result.leaseId);
  assert.ok(!JSON.stringify([...env.docs.keys()]).includes(TOKEN),"raw token never used as a document ID");
  assert.equal((await deliverable(env,"A")).length,1);
  assert.equal(session.retainedLease().leaseId,out.result.leaseId);
});
await test("1b a too-short or missing token is rejected before any claim",async()=>{
  const env=backend();const {session,calls}=deviceSession(env,{currentUid:()=>"A",token:()=>"short"});
  session.setPreference("A",true);
  await assert.rejects(session.activate("A"),/Notification token unavailable/);
  assert.equal(calls.length,0);
  await assert.rejects(env.store.claim({uid:"A",installationId:INSTALL,fcmToken:"short",platform:"ios-native"}),/Invalid notification lease claim/);
});

// 2. Lease creation and renewal
await test("2 renewal issues a new lease, extends expiry, carries sender-name preference and fences the old lease",async()=>{
  const env=backend();const {session,calls}=deviceSession(env,{currentUid:()=>"A"});
  session.setPreference("A",true);
  const first=(await session.activate("A")).result;
  assert.equal(first.leaseUntilMs,env.now()+NOTIFICATION_LEASE_MS);
  env.advance(NOTIFICATION_LEASE_MS-1000);
  session.setShowSenderName(true);
  const second=(await session.activate("A")).result;
  assert.notEqual(second.leaseId,first.leaseId);
  assert.equal(second.generation,first.generation+1);
  assert.equal(second.leaseUntilMs,env.now()+NOTIFICATION_LEASE_MS);
  assert.equal(calls[1][1].showSenderName,true,"renewal carries the installation sender-name preference");
  assert.equal(env.docs.get("users/A/notificationDevices/"+INSTALL).showSenderName,true);
  assert.equal(session.retainedLease().leaseId,second.leaseId,"client retains the newest lease");
  assert.equal((await env.store.revoke({uid:"A",installationId:INSTALL,fcmToken:TOKEN,leaseId:first.leaseId})).revoked,false,"superseded lease cannot revoke the renewed one");
  assert.equal((await deliverable(env,"A")).length,1);
});

await test("2b lease length is 30 days, matching the inactive-retention period (user decision 2026-10-09)",()=>{
  assert.equal(NOTIFICATION_LEASE_MS,30*24*60*60*1000);
  assert.equal(NOTIFICATION_LEASE_MS,NOTIFICATION_INACTIVE_RETENTION_MS);
});

// 3. Lease expiration
await test("3 an unrenewed lease stops delivery exactly at expiry and renewal restores it",async()=>{
  const env=backend();const {session}=deviceSession(env,{currentUid:()=>"A"});
  session.setPreference("A",true);await session.activate("A");
  env.advance(NOTIFICATION_LEASE_MS-1);
  assert.equal((await deliverable(env,"A")).length,1,"still valid 1 ms before expiry");
  env.advance(1);
  assert.equal((await deliverable(env,"A")).length,0,"expired lease cannot deliver");
  assert.equal((await env.store.eligible("A")).length,0);
  await session.activate("A");
  assert.equal((await deliverable(env,"A")).length,1,"foreground renewal restores delivery");
});

// 4. Successful logout revokes immediately and releases token ownership
await test("4 logout revokes the exact lease at once, releases ownership and keeps the preference",async()=>{
  const env=backend();const {session,calls}=deviceSession(env,{currentUid:()=>"A"});
  session.setPreference("A",true);const lease=(await session.activate("A")).result;
  const out=await session.logout("A");
  assert.equal(out.revoked,true);assert.equal(out.stopped,true);assert.equal(out.attempts,1);
  assert.equal(calls.at(-1)[1].leaseId,lease.leaseId,"revoke targets the exact issued lease");
  assert.equal((await deliverable(env,"A")).length,0,"no delivery immediately after logout");
  const owner=env.docs.get("notificationTokenOwners/"+tokenKey(TOKEN));
  assert.ok(!owner||owner.enabled===false,"token ownership released (no valid owner)");
  assert.equal(env.docs.get("users/A/notificationDevices/"+INSTALL).enabled,false);
  assert.equal(session.retainedLease(),null,"confirmed revocation clears the retained lease");
  assert.equal(session.preferred("A"),true,"logout keeps the account's notification preference");
  assert.equal((await session.logout("A")).reason,"no-current-lease");
});

// 5. Failed revocation: bounded retries, never hangs, finishes later
await test("5a a hanging revoke is retried a bounded number of times and returns within the bound",async()=>{
  const env=backend();const net={online:true};const {session,calls}=deviceSession(env,{currentUid:()=>"A",network:net,timeoutMs:30});
  session.setPreference("A",true);await session.activate("A");
  net.hang=true;const started=performance.now();
  const out=await session.logout("A");
  assert.equal(out.revoked,false);assert.equal(out.stopped,false);assert.equal(out.reason,"offline-or-timeout");
  assert.equal(out.attempts,NOTIFICATION_REVOKE_ATTEMPTS);
  assert.equal(calls.filter(c=>c[0]==="revoke").length,NOTIFICATION_REVOKE_ATTEMPTS);
  assert.ok(performance.now()-started<NOTIFICATION_REVOKE_ATTEMPTS*30+500,"bounded: no indefinite hang");
  assert.ok(session.retainedLease(),"unconfirmed lease is retained, not forgotten");
});
await test("5b transient failures are retried and the revoke succeeds on a later attempt",async()=>{
  const env=backend();let failuresLeft=2;const waits=[];
  const session=createNotificationLeaseSession({storage:memoryStorage(),getInstallationId:()=>INSTALL,getToken:async()=>TOKEN,getPlatform:()=>"ios-native",timeoutMs:50,sleep:async ms=>{waits.push(ms);},
    claim:args=>env.store.claim({...args,uid:"A"}),
    revoke:async args=>{if(failuresLeft-->0)throw new Error("network");return env.store.revoke({...args,uid:"A"});}});
  session.setPreference("A",true);await session.activate("A");
  const out=await session.logout("A");
  assert.equal(out.revoked,true);assert.equal(out.attempts,3);
  assert.equal(waits.length,2,"backoff only between attempts");assert.ok(waits[1]>waits[0],"increasing backoff");
  assert.equal((await deliverable(env,"A")).length,0);
});
await test("5c an unfinished turn-off is completed automatically at the next activation",async()=>{
  const env=backend();const net={online:true};const {session}=deviceSession(env,{currentUid:()=>"A",network:net});
  session.setPreference("A",true);await session.activate("A");
  session.setPreference("A",false);net.online=false;
  assert.equal((await session.logout("A")).stopped,false);
  assert.equal((await deliverable(env,"A")).length,1,"server still delivers while the revoke is unconfirmed");
  net.online=true;
  const renewal=await session.activate("A");
  assert.equal(renewal.activated,false);assert.equal(renewal.revocation.revoked,true);
  assert.equal((await deliverable(env,"A")).length,0,"pending revocation completed");
  assert.equal(session.retainedLease(),null);
});
await test("5d a revoke the server answers as superseded is final and is not retried",async()=>{
  const env=backend();let uid="A";const {session,calls}=deviceSession(env,{currentUid:()=>uid});
  session.setPreference("A",true);await session.activate("A");
  await env.store.claim({uid:"B",installationId:INSTALL,fcmToken:TOKEN,platform:"ios-native"});
  const out=await session.logout("A");
  assert.equal(out.revoked,false);assert.equal(out.stopped,true);assert.equal(out.reason,"superseded");
  assert.equal(calls.filter(c=>c[0]==="revoke").length,1);
  assert.equal((await deliverable(env,"B")).length,1,"A's stale revoke cannot disturb B");
});

// 6. Stale or abandoned token cleanup
await test("6 cleanup removes only expired, 30-day-inactive leases and never an active one",async()=>{
  const env=backend();
  await env.store.claim({uid:"A",installationId:INSTALL,fcmToken:TOKEN,platform:"ios-native"});
  env.advance(NOTIFICATION_INACTIVE_RETENTION_MS-1000);
  await env.store.claim({uid:"C",installationId:"install-0003",fcmToken:TOKEN2,platform:"ios-native"});
  assert.deepEqual(await env.store.purgeInactive({limit:50}),{inspected:0,deleted:0},"nothing is 30 days inactive yet");
  env.advance(2000);
  assert.deepEqual(await env.store.purgeInactive({limit:50}),{inspected:1,deleted:1});
  assert.equal(env.docs.has("notificationTokenOwners/"+tokenKey(TOKEN)),false);
  assert.equal(env.docs.has("users/A/notificationDevices/"+INSTALL),false,"abandoned device row removed");
  assert.equal((await deliverable(env,"C")).length,1,"recently active installation untouched");
  await assert.rejects(env.store.purgeInactive({limit:0}),/Invalid cleanup batch/);
  await assert.rejects(env.store.purgeInactive({limit:201}),/Invalid cleanup batch/);
});
await test("6b cleanup re-checks inside its transaction and skips a lease renewed after the query",async()=>{
  const env=backend();
  await env.store.claim({uid:"A",installationId:INSTALL,fcmToken:TOKEN,platform:"ios-native"});
  env.advance(NOTIFICATION_INACTIVE_RETENTION_MS+1);
  const ownerPath="notificationTokenOwners/"+tokenKey(TOKEN),realGet=env.db.collection;
  env.db.collection=path=>{const q=realGet(path);if(path!=="notificationTokenOwners")return q;return{where:(...a)=>{const w=q.where(...a);return{limit:n=>{const l=w.limit(n);return{get:async()=>{const r=await l.get();env.docs.set(ownerPath,{...env.docs.get(ownerPath),leaseUntilMs:env.now()+NOTIFICATION_LEASE_MS,lastSeenMs:env.now()});return r;}};}};}};};
  assert.deepEqual(await env.store.purgeInactive({limit:10}),{inspected:1,deleted:0});
  env.db.collection=realGet;
  assert.equal(env.docs.has(ownerPath),true);
});

// 7. Multiple users sharing one device: no cross-account leakage
await test("7 a second account on the same device takes the token; the first stops receiving at once",async()=>{
  const env=backend();
  await env.store.claim({uid:"A",installationId:INSTALL,fcmToken:TOKEN,platform:"ios-native"});
  await env.store.claim({uid:"B",installationId:INSTALL,fcmToken:TOKEN,platform:"ios-native"});
  assert.equal((await deliverable(env,"A")).length,0,"A's messages never reach the device now used by B");
  assert.equal((await deliverable(env,"B")).length,1);
  assert.equal(env.docs.has("users/A/notificationDevices/"+INSTALL),false,"A's device row for this token is removed in the same transaction");
});
await test("7b a pre-lease (legacy) registration of another account cannot receive on a device whose lease was revoked",async()=>{
  const env=backend();
  // Account A registered this device through the pre-lease path (no lease fields) and was never cleaned up.
  env.docs.set("users/A/notificationDevices/"+INSTALL,{installationId:INSTALL,fcmToken:TOKEN,platform:"ios-native",enabled:true,showSenderName:false});
  const lease=await env.store.claim({uid:"B",installationId:INSTALL,fcmToken:TOKEN,platform:"ios-native"});
  assert.equal((await deliverable(env,"A")).length,0,"legacy row fenced while B owns the token");
  await env.store.revoke({uid:"B",installationId:INSTALL,fcmToken:TOKEN,leaseId:lease.leaseId});
  assert.equal((await deliverable(env,"B")).length,0);
  assert.equal((await deliverable(env,"A")).length,0,"after B signs out, the device must not fall back to A's stale legacy registration");
});
await test("7c policy: a leased registration without its owner record fails closed; foreign owner blocks legacy rows",()=>{
  const now=1_900_000_000_000;
  const leased={ownerUid:"A",installationId:INSTALL,fcmToken:TOKEN,generation:1,leaseId:"x".repeat(36),enabled:true,leaseUntilMs:now+1000};
  assert.equal(mayDeliverRegistration({recipientUid:"A",registration:leased,owner:null,nowMs:now}),false);
  const legacy={installationId:INSTALL,fcmToken:TOKEN,enabled:true};
  assert.equal(mayDeliverRegistration({recipientUid:"A",registration:legacy,owner:{...leased,ownerUid:"B"},nowMs:now}),false);
  assert.equal(mayDeliverRegistration({recipientUid:"A",registration:legacy,owner:null,nowMs:now}),true,"phased rollout: untouched legacy web registration still delivers");
});

// 8. Token reassignment after logout (and token rotation)
await test("8 after A logs out, B claims the token; when A returns, ownership moves back cleanly",async()=>{
  const env=backend();let uid="A";const {session}=deviceSession(env,{currentUid:()=>uid});
  session.setPreference("A",true);await session.activate("A");
  assert.equal((await session.logout("A")).revoked,true);
  uid="B";session.setPreference("B",true);await session.activate("B");
  assert.equal((await deliverable(env,"B")).length,1);assert.equal((await deliverable(env,"A")).length,0);
  assert.equal((await session.logout("B")).revoked,true);
  uid="A";await session.activate("A");
  assert.equal((await deliverable(env,"A")).length,1,"A's retained preference re-activates on return");
  assert.equal((await deliverable(env,"B")).length,0);
});
await test("8b FCM token rotation moves the lease to the new token and retires the old token owner",async()=>{
  const env=backend();let token=TOKEN;const {session}=deviceSession(env,{currentUid:()=>"A",token:()=>token});
  session.setPreference("A",true);await session.activate("A");
  token=TOKEN2;await session.activate("A");
  assert.equal(env.docs.has("notificationTokenOwners/"+tokenKey(TOKEN)),false,"old token owner removed");
  const rows=await deliverable(env,"A");assert.equal(rows.length,1);assert.equal(rows[0].fcmToken,TOKEN2);
});

// 9. Notification preference persistence
await test("9 per-account preference and per-installation sender name survive logout and app restart",async()=>{
  const env=backend();const storage=memoryStorage();let uid="A";
  const first=deviceSession(env,{storage,currentUid:()=>uid}).session;
  first.setPreference("A",true);first.setShowSenderName(true);const lease=(await first.activate("A")).result;
  // Simulated restart: a fresh owner over the same persistent storage.
  const restarted=deviceSession(env,{storage,currentUid:()=>uid}).session;
  assert.equal(restarted.preferred("A"),true);assert.equal(restarted.showSenderName(),true);
  assert.equal(restarted.retainedLease().leaseId,lease.leaseId,"retained lease survives restart");
  assert.equal(restarted.preferred("B"),false,"preference is per account");
  assert.equal((await restarted.logout("A")).revoked,true,"restart can still revoke the exact lease");
  assert.equal(restarted.preferred("A"),true);
});
await test("9b Settings commits the lease preference only after the server confirms, otherwise rolls back",()=>{
  const settings=readFileSync(new URL("./settings-lifecycle.js",import.meta.url),"utf8");
  assert.match(settings,/setPreference\(info\.user\.uid,true\);rollbackPreference=true;\s*await notificationLeaseSession\.activate\(info\.user\.uid\);rollbackPreference=false;/,"enable: rollback armed until claim succeeds");
  assert.match(settings,/catch\(err\)\{if\(rollbackPreference\)notificationLeaseSession\.setPreference\(info\.user\.uid,false\);/,"enable: failed claim restores Off");
  assert.match(settings,/const outcome=await notificationLeaseSession\.logout\(info\.user\.uid\);\s*if\(!outcome\?\.stopped\)throw new Error\(NOTIFICATION_TURN_OFF_UNCONFIRMED_MESSAGE\);\s*rollbackPreference=false;/,"turn-off: unconfirmed revoke is an error, not success");
  assert.match(settings,/catch\(err\)\{if\(rollbackPreference\)notificationLeaseSession\.setPreference\(info\.user\.uid,true\);/,"turn-off: failed revoke restores On");
  assert.match(settings,/try\{await updateCloudNotificationSenderName\(\{installationId:getOrCreateNotificationInstallationId\(\),showSenderName:senderToggle\.checked\}\);notificationLeaseSession\.setShowSenderName\(senderToggle\.checked\);/,"sender name saved locally only after the cloud write");
  assert.match(settings,/status\.enabled&&!notificationLeaseSession\.preferred\(uid\)&&!notificationLeaseSession\.retainedLease\(\)/,"preference recovery cannot undo an unfinished turn-off");
});

// 10. Correct operation on web and iOS
await test("10a iOS sign-out uses the bounded lease logout, never blocks, and tells the user when unconfirmed",()=>{
  const settings=readFileSync(new URL("./settings-lifecycle.js",import.meta.url),"utf8"),app=readFileSync(new URL("./app.js",import.meta.url),"utf8");
  assert.match(settings,/if\(FIDUNIO_NOTIFICATION_LEASE_ROLLOUT&&notificationTransport\.nativeRegistration\)\{[^}]*const outcome=await notificationLeaseSession\.logout\(uid\);\s*if\(!outcome\?\.stopped\)globalThis\.alert\?\.\(NOTIFICATION_SIGNOUT_PENDING_MESSAGE\);\s*\}else await notificationRegistrationOwner\.disable\(\{uid\}\);/);
  assert.match(app,/async function signOutWithNotificationCleanup\(\)\{const user=getFirebaseUser\(\);if\(user\?\.uid\)await removeNotificationRegistrationForSignOut\(user\.uid\);await signOutFidunio\(\);\}/,"cleanup runs before Firebase sign-out, while the revoke is still authenticated");
  assert.match(settings,/getPlatform:\(\)=>"ios-native",\s*\}\);/,"native lease session reports the ios-native platform");
  assert.ok(NOTIFICATION_LOGOUT_BOUND_MS*NOTIFICATION_REVOKE_ATTEMPTS<=20000,"worst-case sign-out wait stays bounded");
});
await test("10b web registration owner: enable registers this browser, disable removes token and registration",async()=>{
  const registrations=new Map(),events=[];
  const owner=createNotificationRegistrationOwner({
    getCapability:async()=>({supported:true,permission:"granted"}),getConfigured:()=>true,requestPermission:async()=>"granted",
    getServiceWorkerRegistration:async()=>({scope:"/"}),getInstallationId:()=>"web-install-01",getPlatform:()=>"desktop-browser",timeoutMs:200,
    getToken:async options=>{events.push(["getToken",options]);return TOKEN;},
    deleteToken:async()=>{events.push(["deleteToken"]);return true;},
    readRegistration:async id=>registrations.get(id)||null,
    writeRegistration:async row=>{registrations.set(row.installationId,row);},
    deleteRegistration:async id=>{events.push(["deleteRegistration",id]);registrations.delete(id);}
  });
  const enabled=await owner.enableFromUserGesture({uid:"A",vapidKey:"vapid"});
  assert.equal(enabled.enabled,true);assert.equal(enabled.status,"ready");
  assert.deepEqual(registrations.get("web-install-01"),{installationId:"web-install-01",fcmToken:TOKEN,platform:"desktop-browser",enabled:true,showSenderName:false});
  assert.equal(events[0][1].vapidKey,"vapid");
  const disabled=await owner.disable({uid:"A"});
  assert.equal(disabled.enabled,false);
  assert.deepEqual(events.slice(1).map(e=>e[0]),["deleteToken","deleteRegistration"]);
});
await test("10c web sign-out fails safely (blocks) when the registration cannot be removed, and never hangs",async()=>{
  const owner=createNotificationRegistrationOwner({
    getCapability:async()=>({supported:true,permission:"granted"}),getConfigured:()=>true,getInstallationId:()=>"web-install-01",timeoutMs:30,
    getToken:async()=>TOKEN,deleteToken:async()=>true,readRegistration:async()=>null,writeRegistration:async()=>{},
    deleteRegistration:()=>new Promise(()=>{})
  });
  const started=performance.now();
  await assert.rejects(owner.disable({uid:"A"}),/timed out/);
  assert.ok(performance.now()-started<1000);
  const settings=readFileSync(new URL("./settings-lifecycle.js",import.meta.url),"utf8");
  assert.match(settings,/throw new Error\("Could not safely sign out because this installation's notification registration could not be removed\./,"web sign-out is refused rather than leaving a live registration");
});
await test("10d a legacy web registration and an iOS lease for the same account both deliver",async()=>{
  const env=backend();
  env.docs.set("users/A/notificationDevices/web-install-01",{installationId:"web-install-01",fcmToken:TOKEN2,platform:"desktop-browser",enabled:true,showSenderName:false});
  await env.store.claim({uid:"A",installationId:INSTALL,fcmToken:TOKEN,platform:"ios-native"});
  const rows=await deliverable(env,"A");
  assert.deepEqual(rows.map(r=>r.platform).sort(),["desktop-browser","ios-native"]);
});

console.log(`\n${passed} passed, ${failures.length} failed`);
if(failures.length){console.error("FAILED: "+failures.join("; "));process.exit(1);}
console.log("PASS: FIDUNIO notification token lease regression suite");
