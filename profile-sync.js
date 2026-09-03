/* FIDUNIO profile-name propagation.
 * Keeps direct-conversation display names aligned with authoritative
 * /users/{uid}.displayName profiles. This is read-only for conversation
 * metadata on peer devices and does not touch message/E2EE transport.
 */
const SDK_VERSION="12.18.0";

async function startProfileNameSync(){
  try{
    const [appSdk,authSdk,fsSdk]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`)
    ]);
    const app=appSdk.getApp(),auth=authSdk.getAuth(app),db=fsSdk.getFirestore(app);
    let stopConversations=()=>{};
    const profileStops=new Map();
    const peerNames=new Map();

    function stopAllProfiles(){for(const stop of profileStops.values())stop();profileStops.clear();peerNames.clear();}
    function emit(){globalThis.dispatchEvent(new CustomEvent("fidunio-profile-names",{detail:{names:Object.fromEntries(peerNames)}}));}

    authSdk.onAuthStateChanged(auth,user=>{
      stopConversations();stopConversations=()=>{};stopAllProfiles();emit();
      if(!user)return;
      const q=fsSdk.query(fsSdk.collection(db,"conversations"),fsSdk.where("members","array-contains",user.uid));
      stopConversations=fsSdk.onSnapshot(q,snap=>{
        const wanted=new Set();
        for(const d of snap.docs){
          const data=d.data();
          if(data?.type!=="direct")continue;
          const peer=(data.members||[]).find(uid=>uid!==user.uid);
          if(peer)wanted.add(peer);
        }
        for(const [uid,stop] of profileStops){if(!wanted.has(uid)){stop();profileStops.delete(uid);peerNames.delete(uid);}}
        for(const uid of wanted){
          if(profileStops.has(uid))continue;
          const stop=fsSdk.onSnapshot(fsSdk.doc(db,"users",uid),profileSnap=>{
            if(profileSnap.exists()){
              const name=String(profileSnap.data()?.displayName||"").trim();
              if(name)peerNames.set(uid,name);else peerNames.delete(uid);
            }else peerNames.delete(uid);
            emit();
          },err=>console.warn("FIDUNIO peer profile listener unavailable",uid,err));
          profileStops.set(uid,stop);
        }
        emit();
      },err=>console.warn("FIDUNIO conversation profile sync unavailable",err));
    });
  }catch(err){console.warn("FIDUNIO profile-name synchronization unavailable",err);}
}
startProfileNameSync();
