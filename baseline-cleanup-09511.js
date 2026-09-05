import { firebaseConfig } from "./firebase-config.js";

const SDK_VERSION="12.18.0";
const LIVE_DB="fidunio-local";
const KEEP_META=new Set(["local-key","local-security-v1","e2ee-device-keypair-v1","e2ee-device-identity-v1"]);
const RESET_VAULTS=["fidunio-account-vault","fidunio-account-vault-v2","fidunio-account-vault-v3"];
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
    // IMPORTANT: use the DEFAULT Firebase app name. Normal FIDUNIO also uses
    // the default app, so Safari's existing Firebase Auth session is visible
    // to this maintenance page. 0.9.5.10 used a named app and therefore had
    // a separate auth persistence namespace.
    const app=appSdk.initializeApp(firebaseConfig);
    const auth=authSdk.getAuth(app);
    return{app,auth,db:fsSdk.getFirestore(app),authSdk,fsSdk};
  });
  return servicesPromise;
}

async function signedInUser(){
  const s=await services();
  if(s.auth.currentUser)return s.auth.currentUser;
  return new Promise((resolve,reject)=>{
    let stop=()=>{};
    const timer=setTimeout(()=>{stop();reject(new Error("No existing FIDUNIO sign-in was found in this Safari."));},5000);
    stop=s.authSdk.onAuthStateChanged(s.auth,user=>{
      if(!user)return;
      clearTimeout(timer);stop();resolve(user);
    },err=>{clearTimeout(timer);stop();reject(err);});
  });
}

async function dbNames(){
  if(typeof indexedDB.databases!=="function")throw new Error("Safari database enumeration is required for safe cleanup.");
  return new Set((await indexedDB.databases()).map(x=>x.name).filter(Boolean));
}
function openExisting(name){return new Promise((resolve,reject)=>{const r=indexedDB.open(name);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}

async function readIdentity(){
  const names=await dbNames();
  if(!names.has(LIVE_DB))throw new Error("FIDUNIO live database not found.");
  const db=await openExisting(LIVE_DB);
  try{
    if(!db.objectStoreNames.contains("meta"))throw new Error("FIDUNIO meta store not found.");
    const tx=db.transaction("meta","readonly"),st=tx.objectStore("meta");
    const iReq=st.get("e2ee-device-identity-v1"),kReq=st.get("e2ee-device-keypair-v1");
    const [identity,keypair]=await Promise.all([req(iReq),req(kReq)]);
    await txDone(tx);
    if(!identity?.deviceId||!keypair?.privateKey||!keypair?.publicKey)throw new Error("Current E2EE identity is incomplete; cleanup cancelled.");
    return identity;
  }finally{db.close();}
}

async function listDevices(uid){
  const s=await services();
  const snap=await s.fsSdk.getDocs(s.fsSdk.collection(s.db,"users",uid,"devices"));
  return snap.docs.map(d=>({ref:d.ref,id:d.id,...d.data()}));
}
async function deactivateStale(uid,keepDeviceId){
  const s=await services(),rows=await listDevices(uid),batch=s.fsSdk.writeBatch(s.db);
  let n=0;
  for(const d of rows){
    if(d.id===keepDeviceId||d.active===false)continue;
    batch.set(d.ref,{active:false,revokedAt:s.fsSdk.serverTimestamp(),revokedReason:"test-baseline-cleanup-09511"},{merge:true});
    n++;
  }
  if(n)await batch.commit();
  return n;
}

async function clearLiveTestData(){
  const db=await openExisting(LIVE_DB);
  try{
    const stores=[...db.objectStoreNames].filter(n=>["meta","outbox","history"].includes(n));
    if(!stores.length)return;
    const tx=db.transaction(stores,"readwrite");
    for(const name of stores){
      const st=tx.objectStore(name);
      if(name!=="meta"){st.clear();continue;}
      const keys=await req(st.getAllKeys());
      for(const key of keys){if(!KEEP_META.has(String(key)))st.delete(key);}
    }
    await txDone(tx);
  }finally{db.close();}
}
function deleteDb(name){return new Promise((resolve,reject)=>{const r=indexedDB.deleteDatabase(name);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error(`Database is still open: ${name}. Close the normal FIDUNIO tab and retry Run Cleanup.`));});}

export async function inspect09511(){
  const user=await signedInUser(),identity=await readIdentity(),devices=await listDevices(user.uid),names=await dbNames();
  return{
    uid:user.uid,
    deviceId:identity.deviceId,
    staleActiveDevices:devices.filter(d=>d.active!==false&&d.id!==identity.deviceId).length,
    vaults:RESET_VAULTS.filter(n=>names.has(n))
  };
}

export async function run09511(expectedDeviceId){
  const user=await signedInUser(),identity=await readIdentity();
  if(identity.deviceId!==expectedDeviceId)throw new Error("Protected device identity changed; cleanup cancelled.");
  const deactivated=await deactivateStale(user.uid,identity.deviceId);
  await clearLiveTestData();
  const names=await dbNames(),deleted=[];
  for(const name of RESET_VAULTS){if(names.has(name)){await deleteDb(name);deleted.push(name);}}
  return{deviceId:identity.deviceId,deactivated,deleted};
}
