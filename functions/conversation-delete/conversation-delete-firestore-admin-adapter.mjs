const denied=message=>Object.assign(new Error(message),{code:"DELETE_DENIED"});
const pathFor=(conversationId,conversationKind)=>conversationKind==="group"?`groups/${conversationId}`:`conversations/${conversationId}`;

export function createConversationDeleteAdminRepositories({db,bucket}){
  if(!db||!bucket)throw new Error("Firestore and Storage admin services are required.");
  return Object.freeze({
    conversationRepo:Object.freeze({
      async beginDeletion({conversationId,conversationKind,requesterUid}){
        const ref=db.doc(pathFor(conversationId,conversationKind));
        return db.runTransaction(async tx=>{
          const snap=await tx.get(ref);
          if(!snap.exists)return{alreadyAbsent:true};
          const row=snap.data()||{};
          if(conversationKind==="group"){
            if(String(row.ownerUid||"")!==String(requesterUid))throw denied("Only the group owner may permanently delete the group.");
          }else{
            const members=Array.isArray(row.members)?row.members.map(String):[];
            if(!members.includes(String(requesterUid)))throw denied("Conversation membership is required.");
          }
          if(row.deletionState!=="deleting")tx.update(ref,{deletionState:"deleting",deletionRequestedByUid:String(requesterUid),deletionRequestedAt:FieldValue.serverTimestamp()});
          return{alreadyAbsent:false};
        });
      },
      async listAttachmentRows({conversationId,conversationKind}){
        const ref=db.doc(pathFor(conversationId,conversationKind));
        const snap=await ref.collection("messages").select("senderUid").get();
        return(snap.docs||[]).map(doc=>({messageId:String(doc.id),senderUid:String(doc.data()?.senderUid||"")})).filter(row=>row.senderUid);
      },
      async deleteConversationTree({conversationId,conversationKind}){
        await db.recursiveDelete(db.doc(pathFor(conversationId,conversationKind)));
      }
    }),
    attachmentRepo:Object.freeze({
      async deleteMessageObjects({senderUid,conversationId,messageId}){
        await bucket.deleteFiles({prefix:`attachments/${senderUid}/${conversationId}/${messageId}/`,force:true});
      }
    })
  });
}
import {FieldValue} from "firebase-admin/firestore";
