export function createDirectNotificationAdminRepositories({db}={}){
  if(!db?.doc||!db?.collection||!db?.runTransaction)throw new Error("Firestore Admin database is required.");
  const conversationRepo=Object.freeze({
    async get(conversationId){const snap=await db.doc(`conversations/${conversationId}`).get();return snap.exists?{id:snap.id,...snap.data()}:null;}
  });
  const profileRepo=Object.freeze({
    async getDisplayName(uid){const snap=await db.doc(`users/${uid}`).get();if(!snap.exists)return"";const name=String(snap.data()?.displayName||"").trim();return name.length>0&&name.length<=80?name:"";}
  });
  const deviceRepo=Object.freeze({
    async listActive(uid){const snap=await db.collection(`users/${uid}/notificationDevices`).where("enabled","==",true).get();return snap.docs.map(doc=>({installationId:doc.id,...doc.data()}));},
    async deleteIfTokenMatches(uid,installationId,fcmToken){const ref=db.doc(`users/${uid}/notificationDevices/${installationId}`);return db.runTransaction(async tx=>{const snap=await tx.get(ref);if(!snap.exists)return false;const row=snap.data();if(row.enabled!==true||row.fcmToken!==fcmToken)return false;tx.delete(ref);return true;});}
  });
  return Object.freeze({conversationRepo,profileRepo,deviceRepo});
}
