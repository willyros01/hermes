import {FieldValue} from "firebase-admin/firestore";

export function createSystemOwnershipFirestoreRepository({db}={}){
  if(!db?.doc||!db?.runTransaction)throw new Error("Firestore Admin database is required.");
  return Object.freeze({
    async readAccess(){const snap=await db.doc("system/access").get();return snap.exists?snap.data():null;},
    async readProfile(uid){const snap=await db.doc(`users/${uid}`).get();return snap.exists?snap.data():null;},
    async transfer({fromUid,toUid}){
      return db.runTransaction(async tx=>{
        const accessRef=db.doc("system/access"),fromRef=db.doc(`users/${fromUid}`),toRef=db.doc(`users/${toUid}`);
        const [access,from,to]=await Promise.all([tx.get(accessRef),tx.get(fromRef),tx.get(toRef)]);
        if(!access.exists||String(access.data()?.ownerUid||"")!==fromUid)throw Object.assign(new Error("System ownership changed."),{code:"DELETE_DENIED"});
        if(!from.exists||String(from.data()?.systemRole||"")!=="owner")throw Object.assign(new Error("Owner profile changed."),{code:"DELETE_DENIED"});
        if(!to.exists||String(to.data()?.systemRole||"")!=="admin"||to.data()?.active===false)throw Object.assign(new Error("Target administrator changed."),{code:"DELETE_DENIED"});
        tx.update(accessRef,{ownerUid:toUid,transferredAt:FieldValue.serverTimestamp(),transferredByUid:fromUid});
        tx.update(fromRef,{systemRole:"admin",adminUpdatedAt:FieldValue.serverTimestamp(),adminUpdatedByUid:fromUid});
        tx.update(toRef,{systemRole:"owner",adminUpdatedAt:FieldValue.serverTimestamp(),adminUpdatedByUid:fromUid});
      });
    }
  });
}
