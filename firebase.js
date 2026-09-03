import { firebaseConfig } from "./firebase-config.js";

const SDK_VERSION="12.18.0";
let sdkPromise=null;
let services=null;
let authUser=null;
const messageStreams=new Map();

export function isFirebaseConfigured(){
  return firebaseConfig &&
    !String(firebaseConfig.apiKey||"").includes("PASTE_") &&
    !String(firebaseConfig.projectId||"").includes("PASTE_") &&
    !String(firebaseConfig.appId||"").includes("PASTE_");
}

async function loadSdk(){
  if(sdkPromise) return sdkPromise;
  sdkPromise=Promise.all([
    import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`)
  ]).then(([appSdk,authSdk,fsSdk])=>({appSdk,authSdk,fsSdk}));
  return sdkPromise;
}
async function ensureServices(){
  if(services) return services;
  if(!isFirebaseConfigured()) throw new Error("Firebase is not configured yet.");
  const {appSdk,authSdk,fsSdk}=await loadSdk();
  const app=appSdk.initializeApp(firebaseConfig);
  const auth=authSdk.getAuth(app);
  const db=fsSdk.getFirestore(app);
  services={app,auth,db,authSdk,fsSdk};
  return services;
}
export async function initFirebase(onUserChanged){
  const s=await ensureServices();
  s.authSdk.onAuthStateChanged(s.auth,user=>{
    authUser=user||null;
    onUserChanged?.(authUser);
  });
  return s;
}
export function getFirebaseUser(){ return authUser; }

export async function createFidunioAccount(email,password,displayName){
  const s=await ensureServices();
  const cred=await s.authSdk.createUserWithEmailAndPassword(s.auth,email,password);
  await s.authSdk.updateProfile(cred.user,{displayName});
  await s.fsSdk.setDoc(s.fsSdk.doc(s.db,"users",cred.user.uid),{
    displayName,
    email:cred.user.email,
    createdAt:s.fsSdk.serverTimestamp()
  },{merge:true});
  authUser=cred.user;
  return cred.user;
}
export async function signInFidunio(email,password){
  const s=await ensureServices();
  const cred=await s.authSdk.signInWithEmailAndPassword(s.auth,email,password);
  authUser=cred.user;
  return cred.user;
}
export async function signOutFidunio(){
  const s=await ensureServices();
  await s.authSdk.signOut(s.auth);
  authUser=null;
}

function dmId(a,b){ return "dm_"+[a,b].sort().join("_"); }

export async function startDirectConversation(peerUid){
  const s=await ensureServices();
  if(!authUser) throw new Error("Sign in first.");
  const peerSnap=await s.fsSdk.getDoc(s.fsSdk.doc(s.db,"users",peerUid));
  if(!peerSnap.exists()) throw new Error("Recipient FIDUNIO ID was not found.");
  const peer=peerSnap.data();
  const meSnap=await s.fsSdk.getDoc(s.fsSdk.doc(s.db,"users",authUser.uid));
  const me=meSnap.exists()?meSnap.data():{displayName:authUser.displayName||authUser.email||"User"};
  const id=dmId(authUser.uid,peerUid);
  const ref=s.fsSdk.doc(s.db,"conversations",id);
  await s.fsSdk.setDoc(ref,{
    type:"direct",
    members:[authUser.uid,peerUid],
    memberNames:{
      [authUser.uid]:me.displayName||"User",
      [peerUid]:peer.displayName||"User"
    },
    updatedAt:s.fsSdk.serverTimestamp(),
    createdAt:s.fsSdk.serverTimestamp()
  },{merge:true});
  return {id,cloud:true,peerUid,name:peer.displayName||"FIDUNIO contact",preview:"Cloud conversation",time:""};
}

export async function getCloudUserProfile(uid){
  const s=await ensureServices();
  const snap=await s.fsSdk.getDoc(s.fsSdk.doc(s.db,"users",uid));
  return snap.exists()?{uid,...snap.data()}:null;
}
export async function getCloudConversation(conversationId,myUid){
  const s=await ensureServices();
  if(!authUser || authUser.uid!==myUid) throw new Error("Sign in first.");
  const snap=await s.fsSdk.getDoc(s.fsSdk.doc(s.db,"conversations",conversationId));
  if(!snap.exists()) return null;
  const x=snap.data();
  const members=Array.isArray(x.members)?x.members:[];
  if(!members.includes(myUid)) throw new Error("Conversation is not available to this account.");
  const other=members.find(m=>m!==myUid) || null;
  return {
    id:snap.id,cloud:true,type:x.type||"direct",peerUid:other,
    name:x.memberNames?.[other]||"FIDUNIO contact",
    preview:"Cloud conversation",time:""
  };
}
export async function publishCloudE2EEPublicKey(uid,publicJwk){
  const s=await ensureServices();
  if(!authUser||authUser.uid!==uid)throw new Error("Cannot publish another user's encryption key.");
  await s.fsSdk.setDoc(s.fsSdk.doc(s.db,"users",uid),{e2eePublicJwk:publicJwk,e2eeVersion:1,e2eeUpdatedAt:s.fsSdk.serverTimestamp()},{merge:true});
}
export async function publishCloudE2EEDevice(uid,device){
  const s=await ensureServices();
  if(!authUser||authUser.uid!==uid)throw new Error("Cannot publish another user's device key.");
  if(!device?.deviceId||!device?.publicJwk)throw new Error("Device identity is incomplete.");
  const ref=s.fsSdk.doc(s.db,"users",uid,"devices",device.deviceId);
  await s.fsSdk.setDoc(ref,{
    uid,
    deviceId:device.deviceId,
    label:device.label||"FIDUNIO Web device",
    e2eeVersion:1,
    publicJwk:device.publicJwk,
    fingerprint:device.fingerprint||"",
    createdAt:device.createdAt||Date.now(),
    lastSeenAt:s.fsSdk.serverTimestamp(),
    active:true
  },{merge:true});
}
export async function getCloudUserDevices(uid){
  const s=await ensureServices();
  if(!authUser)throw new Error("Sign in first.");
  const snap=await s.fsSdk.getDocs(s.fsSdk.collection(s.db,"users",uid,"devices"));
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}
export async function sendCloudMessage(conversationId,message){
  const s=await ensureServices();
  if(!authUser) throw new Error("Sign in first.");
  const ref=s.fsSdk.doc(s.db,"conversations",conversationId,"messages",message.id);
  const row={senderUid:authUser.uid,senderName:authUser.displayName||authUser.email||"User",timeLabel:message.timeLabel,state:message.state||"sent",createdAt:s.fsSdk.serverTimestamp()};
  if(message.senderDeviceId) row.senderDeviceId=message.senderDeviceId;
  if(message.e2ee){row.e2ee=message.e2ee;row.ciphertext=message.ciphertext;row.iv=message.iv;row.text="";}
  else row.text=message.text||"";
  await s.fsSdk.setDoc(ref,row);
  await s.fsSdk.updateDoc(s.fsSdk.doc(s.db,"conversations",conversationId),{
    updatedAt:s.fsSdk.serverTimestamp()
  });
}
export async function updateCloudMessageState(conversationId,messageId,state){
  const s=await ensureServices();
  if(!authUser) return;
  await s.fsSdk.updateDoc(s.fsSdk.doc(s.db,"conversations",conversationId,"messages",messageId),{state});
}
export function subscribeMyConversations(uid,onRows,onError){
  let active=true,unsub=()=>{};
  ensureServices().then(s=>{
    if(!active) return;
    const q=s.fsSdk.query(
      s.fsSdk.collection(s.db,"conversations"),
      s.fsSdk.where("members","array-contains",uid)
    );
    unsub=s.fsSdk.onSnapshot(q,snap=>{
      const rows=snap.docs.map(d=>{
        const x=d.data();
        const other=(x.members||[]).find(m=>m!==uid);
        return {
          id:d.id,cloud:true,type:"direct",peerUid:other,
          name:x.memberNames?.[other]||"FIDUNIO contact",
          preview:"Cloud conversation",
          time:""
        };
      });
      onRows(rows);
    },onError);
  }).catch(onError);
  return ()=>{active=false;unsub();};
}
export function subscribeConversationMessages(conversationId,myUid,onRows,onError){
  const key=String(conversationId);
  const token=Symbol(key);
  let stream=messageStreams.get(key);

  // Tablet two-pane navigation can re-enter the same chat during render and
  // historically called unsubscribe + subscribe with force:true. Keep the
  // underlying Firestore listener alive across that handoff instead of
  // repeatedly tearing down the active receipt stream.
  if(stream){
    if(stream.closeTimer){clearTimeout(stream.closeTimer);stream.closeTimer=null;}
    stream.token=token;
    stream.onRows=onRows;
    stream.onError=onError;
  }else{
    stream={
      token,onRows,onError,
      delivery:Promise.resolve(),
      unsub:()=>{},
      closeTimer:null,
      ready:false
    };
    messageStreams.set(key,stream);
    ensureServices().then(s=>{
      if(messageStreams.get(key)!==stream) return;
      const q=s.fsSdk.query(
        s.fsSdk.collection(s.db,"conversations",conversationId,"messages"),
        s.fsSdk.orderBy("createdAt","asc")
      );
      stream.unsub=s.fsSdk.onSnapshot(q,snap=>{
        const current=messageStreams.get(key);
        if(current!==stream) return;
        const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
        const meta={
          fromCache:!!snap.metadata?.fromCache,
          hasPendingWrites:!!snap.metadata?.hasPendingWrites
        };
        stream.delivery=stream.delivery
          .then(()=>{
            const live=messageStreams.get(key);
            return live===stream ? stream.onRows(rows,meta) : undefined;
          })
          .catch(err=>{
            const live=messageStreams.get(key);
            if(live===stream) stream.onError?.(err);
          });
      },err=>{
        const current=messageStreams.get(key);
        if(current===stream) stream.onError?.(err);
      });
      stream.ready=true;
    }).catch(err=>{
      const current=messageStreams.get(key);
      if(current===stream) stream.onError?.(err);
    });
  }

  return ()=>{
    const current=messageStreams.get(key);
    if(current!==stream || current.token!==token) return;
    // A short grace period lets the iPad's immediate forced resubscribe adopt
    // this exact listener. Real conversation changes still close promptly.
    current.closeTimer=setTimeout(()=>{
      const latest=messageStreams.get(key);
      if(latest!==stream || latest.token!==token) return;
      latest.unsub();
      messageStreams.delete(key);
    },250);
  };
}
