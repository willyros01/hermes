import { firebaseConfig } from "./firebase-config.js";

const SDK_VERSION="12.18.0";
const LIVE_DB="fidunio-local";
const RESET_VAULTS=["fidunio-account-vault","fidunio-account-vault-v2","fidunio-account-vault-v3"];
const KEEP_META=new Set(["local-key","local-security-v1"]);
let servicesPromise=null;

function req(r){return new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function txDone(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error("IndexedDB transaction failed"));tx.onabort=()=>reject(tx.error||new Error("IndexedDB transaction aborted"));});}
async function services(){
  if(servicesPromise)return servicesPromise;
  servicesPromise=Promise.all([
    import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`)
  ]).then(([appSdk,authSdk,fsSdk])=>{
    const app=appSdk.initializeApp(firebaseConfig);
    return{app,auth:authSdk.getAuth(app),db:fsSdk.getFirestore(app),authSdk,fsSdk};
  });
  return servicesPromise;
}
async function signedInUser(){
  const s=await services();
  if(s.auth.currentUser)return s.auth.currentUser;
  return new Promise((resolve,reject)=>{
    let stop=()=>{};
    const timer=setTimeout(()=>{stop();reject(new Error("No existing FIDUNIO sign-in found in this Safari."));},5000);
    stop=s.authSdk.onAuthStateChanged(s.auth,user=>{if(!user)return;clearTimeout(timer);stop();resolve(user);},err=>{clearTimeout(timer);stop();reject(err);});
  });
}
async function requireOwner(){
  const s=await services(),user=await signedInUser();
  const snap=await s.fsSdk.getDoc(s.fsSdk.doc(s.db,"users",user.uid));
  if(!snap.exists())throw new Error("Current FIDUNIO profile was not found.");
  const profile=snap.data();
  if(profile.systemRole!=="owner")throw new Error("Master reset requires the FIDUNIO Owner account.");
  return{user,profile};
}
async function deleteCollection(pathParts){
  const s=await services();
  const col=s.fsSdk.collection(s.db,...pathParts);
  const snap=await s.fsSdk.getDocs(col);
  let count=0;
  for(const d of snap.docs){await s.fsSdk.deleteDoc(d.ref);count++;}
  return count;
}
async function resetCloudTestData(){
  const s=await services();
  await requireOwner();
  let conversations=0,messages=0,groups=0,groupMembers=0,groupMessages=0,devices=0,profilesCleared=0;

  const convSnap=await s.fsSdk.getDocs(s.fsSdk.collection(s.db,"conversations"));
  for(const c of convSnap.docs){
    messages+=await deleteCollection(["conversations",c.id,"messages"]);
    await s.fsSdk.deleteDoc(c.ref);
    conversations++;
  }

  const groupSnap=await s.fsSdk.getDocs(s.fsSdk.collection(s.db,"groups"));
  for(const g of groupSnap.docs){
    groupMembers+=await deleteCollection(["groups",g.id,"members"]);
    groupMessages+=await deleteCollection(["groups",g.id,"messages"]);
    await s.fsSdk.deleteDoc(g.ref);
    groups++;
  }

  const userSnap=await s.fsSdk.getDocs(s.fsSdk.collection(s.db,"users"));
  for(const u of userSnap.docs){
    devices+=await deleteCollection(["users",u.id,"devices"]);
    await s.fsSdk.updateDoc(u.ref,{
      e2eePublicJwk:s.fsSdk.deleteField(),
      e2eeVersion:s.fsSdk.deleteField(),
      e2eeUpdatedAt:s.fsSdk.deleteField()
    }).catch(()=>{});
    profilesCleared++;
  }

  return{conversations,messages,groups,groupMembers,groupMessages,devices,profilesCleared};
}
async function dbNames(){
  if(typeof indexedDB.databases!=="function")throw new Error("Safari database enumeration is required for safe local reset.");
  return new Set((await indexedDB.databases()).map(x=>x.name).filter(Boolean));
}
function openExisting(name){return new Promise((resolve,reject)=>{const r=indexedDB.open(name);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function clearLocalLive(){
  const names=await dbNames();
  if(!names.has(LIVE_DB))return{cleared:false};
  const db=await openExisting(LIVE_DB);
  try{
    const stores=[...db.objectStoreNames].filter(n=>["meta","outbox","history"].includes(n));
    if(!stores.length)return{cleared:false};
    const tx=db.transaction(stores,"readwrite");
    for(const name of stores){
      const st=tx.objectStore(name);
      if(name!=="meta"){st.clear();continue;}
      const keys=await req(st.getAllKeys());
      for(const key of keys){if(!KEEP_META.has(String(key)))st.delete(key);}
    }
    await txDone(tx);
    return{cleared:true};
  }finally{db.close();}
}
function deleteDb(name){return new Promise((resolve,reject)=>{const r=indexedDB.deleteDatabase(name);r.onsuccess=()=>resolve(true);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error(`Database is still open: ${name}. Close normal FIDUNIO tabs and run the reset again.`));});}
async function resetLocalTestData(){
  const live=await clearLocalLive();
  const names=await dbNames(),deletedVaults=[];
  for(const name of RESET_VAULTS){if(names.has(name)){await deleteDb(name);deletedVaults.push(name);}}
  return{liveCleared:live.cleared,deletedVaults};
}
async function clearHermesServiceWorkerAndCaches(){
  const result={serviceWorkers:0,caches:0};
  if("serviceWorker" in navigator){
    const regs=await navigator.serviceWorker.getRegistrations();
    for(const reg of regs){
      const scope=String(reg.scope||"");
      if(scope.includes("/hermes/")){if(await reg.unregister())result.serviceWorkers++;}
    }
  }
  if("caches" in globalThis){
    for(const key of await caches.keys()){
      if(String(key).startsWith("fidunio-shell-")){if(await caches.delete(key))result.caches++;}
    }
  }
  return result;
}

export async function inspectMasterReset(){
  const {user}=await requireOwner();
  const s=await services();
  const [conv,groups,users,names]=await Promise.all([
    s.fsSdk.getDocs(s.fsSdk.collection(s.db,"conversations")),
    s.fsSdk.getDocs(s.fsSdk.collection(s.db,"groups")),
    s.fsSdk.getDocs(s.fsSdk.collection(s.db,"users")),
    dbNames()
  ]);
  let devices=0,messages=0;
  for(const u of users.docs)devices+=(await s.fsSdk.getDocs(s.fsSdk.collection(s.db,"users",u.id,"devices"))).size;
  for(const c of conv.docs)messages+=(await s.fsSdk.getDocs(s.fsSdk.collection(s.db,"conversations",c.id,"messages"))).size;
  return{uid:user.uid,conversations:conv.size,messages,groups:groups.size,devices,localVaults:RESET_VAULTS.filter(n=>names.has(n)),liveLocalDb:names.has(LIVE_DB)};
}

export async function runMasterReset(){
  const cloud=await resetCloudTestData();
  const local=await resetLocalTestData();
  const browser=await clearHermesServiceWorkerAndCaches();
  return{cloud,local,browser};
}
