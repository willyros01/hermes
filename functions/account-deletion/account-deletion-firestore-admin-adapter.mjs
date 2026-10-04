import {FieldValue} from "firebase-admin/firestore";

async function deleteQueryDocs(db,query){
  const snap=await query.get();
  for(const doc of snap.docs)await doc.ref.delete();
}
export function createAccountDeletionAdminRepository({db,auth}={}){
  if(!db?.doc||!db?.collection||typeof db.recursiveDelete!=="function"||!auth?.deleteUser)throw new Error("Account deletion Admin dependencies are required.");
  return Object.freeze({
    async readRequest(uid){const snap=await db.doc(`accountDeletionRequests/${uid}`).get();return snap.exists?snap.data():null;},
    async inspectAuthority(uid){
      const [access,owned,memberships]=await Promise.all([
        db.doc("system/access").get(),
        db.collection("groups").where("ownerUid","==",uid).limit(5).get(),
        db.collection("groups").where("memberUids","array-contains",uid).limit(5).get()
      ]);
      return{systemOwner:access.exists&&String(access.data()?.ownerUid||"")===uid,ownedGroups:owned.docs.map(d=>d.id),groupMemberships:memberships.docs.map(d=>d.id)};
    },
    async markProcessing(uid){await db.doc(`accountDeletionRequests/${uid}`).update({status:"processing",adminUpdatedAt:FieldValue.serverTimestamp(),adminUpdatedByUid:uid});},
    async closeDirectConversations(uid){
      const snap=await db.collection("conversations").where("members","array-contains",uid).get();
      for(const doc of snap.docs){
        const row=doc.data()||{},names={...(row.memberNames||{})};if(uid in names)names[uid]="Deleted account";
        await doc.ref.update({memberNames:names,deletionState:"member-deleted",updatedAt:FieldValue.serverTimestamp()});
      }
    },
    async deletePersonalData(uid){
      await db.recursiveDelete(db.doc(`users/${uid}`));
      for(const path of [`e2eePublicKeys/${uid}`,`e2eeRecoveryState/${uid}`,`legalAcceptances/${uid}`])await db.doc(path).delete().catch(()=>{});
      await deleteQueryDocs(db,db.collection("recoverySessions").where("uid","==",uid));
      await deleteQueryDocs(db,db.collection("accountRecoveryAuthorizations").where("targetUid","==",uid));
      await deleteQueryDocs(db,db.collection("accountRecoveryAuthorizations").where("initiatedByUid","==",uid));
      await deleteQueryDocs(db,db.collection("abuseReports").where("reporterUid","==",uid));
      const targeted=await db.collection("abuseReports").where("targetUid","==",uid).get();
      for(const doc of targeted.docs)await doc.ref.update({targetUid:null});
      const accepted=await db.collection("invitations").where("acceptedUid","==",uid).get();
      for(const doc of accepted.docs)await doc.ref.update({acceptedUid:null,acceptedEmail:""});
      const invited=await db.collection("invitations").where("invitedByUid","==",uid).get();
      for(const doc of invited.docs){
        const row=doc.data()||{},patch={invitedByUid:"deleted-account",invitedByName:"Former FIDUNIO user"};
        if(row.status==="pending")Object.assign(patch,{status:"revoked",revokedAt:FieldValue.serverTimestamp()});
        await doc.ref.update(patch);
      }
    },
    async deleteAuthUser(uid){await auth.deleteUser(uid);},
    async deleteRequest(uid){await db.doc(`accountDeletionRequests/${uid}`).delete();}
  });
}
