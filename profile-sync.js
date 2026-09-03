/* FIDUNIO profile-name propagation.
 * Keeps existing direct-conversation metadata aligned with the authoritative
 * /users/{uid}.displayName profile without changing message/E2EE transport.
 */
const SDK_VERSION="12.18.0";

async function startProfileNameSync(){
  try{
    const [appSdk,authSdk,fsSdk]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`)
    ]);
    const app=appSdk.getApp();
    const auth=authSdk.getAuth(app);
    const db=fsSdk.getFirestore(app);
    let stopProfile=()=>{};

    authSdk.onAuthStateChanged(auth,user=>{
      stopProfile();
      stopProfile=()=>{};
      if(!user)return;
      const profileRef=fsSdk.doc(db,"users",user.uid);
      let lastName="";
      stopProfile=fsSdk.onSnapshot(profileRef,async snap=>{
        if(!snap.exists())return;
        const name=String(snap.data()?.displayName||"").trim();
        if(!name||name===lastName)return;
        lastName=name;
        try{
          const q=fsSdk.query(fsSdk.collection(db,"conversations"),fsSdk.where("members","array-contains",user.uid));
          const rows=await fsSdk.getDocs(q);
          const writes=[];
          for(const d of rows.docs){
            const data=d.data();
            if(data?.type!=="direct"||data?.memberNames?.[user.uid]===name)continue;
            writes.push(fsSdk.updateDoc(d.ref,new fsSdk.FieldPath("memberNames",user.uid),name));
          }
          await Promise.allSettled(writes);
        }catch(err){
          console.warn("FIDUNIO display-name propagation skipped",err);
        }
      },err=>console.warn("FIDUNIO profile-name listener unavailable",err));
    });
  }catch(err){
    console.warn("FIDUNIO profile-name synchronization unavailable",err);
  }
}

startProfileNameSync();
