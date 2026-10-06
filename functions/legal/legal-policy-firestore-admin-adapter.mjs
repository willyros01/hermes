export function createLegalPolicyFirestoreRepository({db}={}){
  if(!db?.doc)throw new Error("Firestore Admin database is required.");
  return Object.freeze({
    async read(uid){const snap=await db.doc(`legalAcceptances/${uid}`).get();return snap.exists?snap.data():null;},
    async write(uid,row){await db.doc(`legalAcceptances/${uid}`).set(row,{merge:false});return true;}
  });
}
