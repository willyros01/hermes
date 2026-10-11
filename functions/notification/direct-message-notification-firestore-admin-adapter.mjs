import {createHash} from "node:crypto";
import {mayDeliverRegistration} from "./notification-lease-policy.mjs";

export function createNotificationAdminRepositories({db}={}){
  if(!db?.doc||!db?.collection||!db?.runTransaction)throw new Error("Firestore Admin database is required.");
  const conversationRepo=Object.freeze({
    async get(conversationId){const snap=await db.doc(`conversations/${conversationId}`).get();return snap.exists?{id:snap.id,...snap.data()}:null;}
  });
  const groupRepo=Object.freeze({
    async get(groupId){const snap=await db.doc(`groups/${groupId}`).get();return snap.exists?{id:snap.id,...snap.data()}:null;}
  });
  const profileRepo=Object.freeze({
    async getDisplayName(uid){const snap=await db.doc(`users/${uid}`).get();if(!snap.exists)return"";const name=String(snap.data()?.displayName||"").trim();return name.length>0&&name.length<=80?name:"";}
  });
  const blockRepo=Object.freeze({
    async isBlockedEitherDirection(senderUid,recipientUid){
      const [recipientBlock,senderBlock]=await Promise.all([
        db.doc(`users/${recipientUid}/blocks/${senderUid}`).get(),
        db.doc(`users/${senderUid}/blocks/${recipientUid}`).get()
      ]);
      return recipientBlock.exists||senderBlock.exists;
    }
  });
  const deviceRepo=Object.freeze({
    async listActive(uid){
      const snap=await db.collection(`users/${uid}/notificationDevices`).where("enabled","==",true).get();
      const rows=snap.docs.map(doc=>({installationId:doc.id,...doc.data()}));
      const checked=await Promise.all(rows.map(async row=>{
        if(typeof row.fcmToken!=="string"||row.fcmToken.length<20)return null;
        const digest=createHash("sha256").update(row.fcmToken).digest("hex");
        const ownerSnap=await db.doc("notificationTokenOwners/"+digest).get();
        return mayDeliverRegistration({recipientUid:uid,registration:row,owner:ownerSnap.exists?ownerSnap.data():null})?row:null;
      }));
      return checked.filter(Boolean);
    },
    async deleteIfTokenMatches(uid,installationId,fcmToken){const ref=db.doc(`users/${uid}/notificationDevices/${installationId}`);return db.runTransaction(async tx=>{const snap=await tx.get(ref);if(!snap.exists)return false;const row=snap.data();if(row.enabled!==true||row.fcmToken!==fcmToken)return false;tx.delete(ref);return true;});}
  });
  return Object.freeze({conversationRepo,groupRepo,profileRepo,deviceRepo,blockRepo});
}

export const createDirectNotificationAdminRepositories=createNotificationAdminRepositories;
