import {createHash} from "node:crypto";
import {mayDeliverRegistration} from "./notification-lease-policy.mjs";
/* Firestore access for HELP. Device rules are the same as normal message notifications. */
export function createHelpFirestoreRepo({db,FieldValue}){
  return Object.freeze({
    async getAlert(id){const s=await db.doc(`helpAlerts/${id}`).get();return s.exists?s.data():null;},
    async getSettings(uid){const s=await db.doc(`helpSettings/${uid}`).get();return s.exists?s.data():null;},
    async getDisplayName(uid){const s=await db.doc(`users/${uid}`).get();return s.exists?String(s.data()?.displayName||""):"";},
    async listDevices(uid){
      const snap=await db.collection(`users/${uid}/notificationDevices`).where("enabled","==",true).get();
      const rows=snap.docs.map(d=>({installationId:d.id,...d.data()}));
      const ok=await Promise.all(rows.map(async row=>{
        if(typeof row.fcmToken!=="string"||row.fcmToken.length<20)return null;
        const owner=await db.doc("notificationTokenOwners/"+createHash("sha256").update(row.fcmToken).digest("hex")).get();
        return mayDeliverRegistration({recipientUid:uid,registration:row,owner:owner.exists?owner.data():null})?row:null;
      }));
      return ok.filter(Boolean);
    },
    async markSent(id,fields){await db.doc(`helpAlerts/${id}`).update({...fields,serverUpdatedAt:FieldValue.serverTimestamp()});},
    async listOpenAlerts(){const s=await db.collection("helpAlerts").where("state","==","open").limit(200).get();return s.docs.map(d=>({id:d.id,alert:d.data()}));},
    async deleteAlertsBefore(ms){
      const s=await db.collection("helpAlerts").where("createdAt","<",new Date(ms)).limit(200).get();
      await Promise.all(s.docs.map(d=>d.ref.delete()));return s.size;
    }
  });
}
