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
    const timer=setTimeout(()=>{stop();reject(new Error("No existing FIDUNIO sign-in found in this browser."));},5000);
    stop=s.authSdk.onAuthStateChanged(s.auth,user=>{if(!user)return;clearTimeout(timer);stop();resolve(user);},err=>{clearTimeout(timer);stop();reject(err);});
  });
}
async function currentProfile(){
  const s=await services(),user=await signedInUser();
  const snap=await s.fsSdk.getDoc(s.fsSdk.doc(s.db,"users",user.uid));
  if(!snap.exists())throw new Error("Current FIDUNIO profile was not found.");
  return{user,profile:snap.data()};
}
async function myConversations(uid){
  const s=await services();
  const q=s.fsSdk.query(s.fsSdk.collection(s.db,"conversations"),s.fsSdk.where("members","array-contains",uid));
  return s.fsSdk.getDocs(q);
}
async function myGroups(uid){
  const s=await services();
  const q=s.fsSdk.query(s.fsSdk.collection(s.db,"groups"),s.fsSdk.where("memberUids","array-contains",uid));
  return s.fsSdk.getDocs(q);
}
async function deleteCollection(pathParts){
  const s=await services(),snap=await s.fsSdk.getDocs(s.fsSdk.collection(s.db,...pathParts));
  let count=0;
  for(const d of snap.docs){await s.fsSdk.deleteDoc(d.ref);count++;}
  return count;
}
async function resetCloudForCurrentAccount(){
  const s=await services(),{user}=await currentProfile();
  let conversations=0,messages=0,groups=0,groupMembers=0,groupMessages=0,devices=0,profileE2EEFieldsCleared=false;

  const convSnap=await myConversations(user.uid);
  for(const c of convSnap.docs){
    messages+=await deleteCollection(["conversations",c.id,"messages"]);
    await s.fsSdk.deleteDoc(c.ref);
    conversations++;
  }

  const groupSnap=await myGroups(user.uid);
  for(const g of groupSnap.docs){
    groupMembers+=await deleteCollection(["groups",g.id,"members"]);
    try{groupMessages+=await deleteCollection(["groups",g.id,"messages"]);}catch{}
    await s.fsSdk.deleteDoc(g.ref);
    groups++;
  }

  const deviceSnap=await s.fsSdk.getDocs(s.fsSdk.collection(s.db,"users",user.uid,"devices"));
  for(const d of deviceSnap.docs){await s.fsSdk.deleteDoc(d.ref);devices++;}

  try{
    await s.fsSdk.updateDoc(s.fsSdk.doc(s.db,"users",user.uid),{
      e2eePublicJwk:s.fsSdk.deleteField(),
      e2eeVersion:s.fsSdk.deleteField(),
      e2eeUpdatedAt:s.fsSdk.deleteField()
    });
    profileE2EEFieldsCleared=true;
  }catch{}

  return{conversations,messages,groups,groupMembers,groupMessages,devices,profileE2EEFieldsCleared};
}
async function dbNames(){
  if(typeof indexedDB.databases!=="function")throw new Error("Browser database enumeration is required for safe local reset.");
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
function deleteDb(name){return new Promise((resolve,reject)=>{const r=indexedDB.deleteDatabase(name);r.onsuccess=()=>resolve(true);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error(`Database is still open: ${name}. Close normal FIDUNIO tabs and run this reset page again.`));});}
async function resetLocal(){
  const live=await clearLocalLive();
  const names=await dbNames(),deletedVaults=[];
  for(const name of RESET_VAULTS){if(names.has(name)){await deleteDb(name);deletedVaults.push(name);}}
  return{liveCleared:live.cleared,deletedVaults};
}
async function clearServiceWorkerAndCaches(){
  const result={serviceWorkers:0,caches:0};
  if("serviceWorker" in navigator){
    const regs=await navigator.serviceWorker.getRegistrations();
    for(const reg of regs){if(String(reg.scope||"").includes("/hermes/")&&await reg.unregister())result.serviceWorkers++;}
  }
  if("caches" in globalThis){
    for(const key of await caches.keys()){if(String(key).startsWith("fidunio-shell-")&&await caches.delete(key))result.caches++;}
  }
  return result;
}

export async function inspectReset09513(){
  const {user,profile}=await currentProfile(),s=await services();
  const [convSnap,groupSnap,deviceSnap,names]=await Promise.all([
    myConversations(user.uid),
    myGroups(user.uid),
    s.fsSdk.getDocs(s.fsSdk.collection(s.db,"users",user.uid,"devices")),
    dbNames()
  ]);
  let messages=0;
  for(const c of convSnap.docs){messages+=(await s.fsSdk.getDocs(s.fsSdk.collection(s.db,"conversations",c.id,"messages"))).size;}
  return{
    uid:user.uid,
    displayName:profile.displayName||user.email||"FIDUNIO user",
    role:profile.systemRole||"user",
    conversationsVisibleToThisAccount:convSnap.size,
    messagesVisibleToThisAccount:messages,
    groupsVisibleToThisAccount:groupSnap.size,
    deviceRegistrationsForThisAccount:deviceSnap.size,
    localVaults:RESET_VAULTS.filter(n=>names.has(n)),
    liveLocalDb:names.has(LIVE_DB)
  };
}

export async function runReset09513(){
  const cloud=await resetCloudForCurrentAccount();
  const local=await resetLocal();
  const browser=await clearServiceWorkerAndCaches();
  return{cloud,local,browser};
}
