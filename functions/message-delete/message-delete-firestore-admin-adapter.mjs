export function createMessageDeleteAdminRepositories({db,bucket}){
  if(!db||!bucket)throw new Error("Firestore and Storage admin services are required.");
  return Object.freeze({
    messageRepo:Object.freeze({
      async readDirectMessage({conversationId,messageId}){
        const conversationRef=db.doc(`conversations/${conversationId}`),messageRef=conversationRef.collection("messages").doc(messageId);
        const [conversation,message]=await Promise.all([conversationRef.get(),messageRef.get()]);
        if(!message.exists)return null;
        if(!conversation.exists)throw Object.assign(new Error("Conversation is missing."),{code:"DELETE_DENIED"});
        return{senderUid:String(message.data()?.senderUid||""),memberUids:Array.isArray(conversation.data()?.members)?conversation.data().members.map(String):[]};
      },
      async deleteDirectMessage({conversationId,messageId,expectedSenderUid}){
        const ref=db.doc(`conversations/${conversationId}/messages/${messageId}`);
        return db.runTransaction(async tx=>{
          const snap=await tx.get(ref);
          if(!snap.exists)return;
          if(String(snap.data()?.senderUid||"")!==expectedSenderUid)throw Object.assign(new Error("Message sender changed."),{code:"DELETE_DENIED"});
          tx.delete(ref);
        });
      }
    }),
    attachmentRepo:Object.freeze({
      async deleteMessageObjects({senderUid,conversationId,messageId}){
        await bucket.deleteFiles({prefix:`attachments/${senderUid}/${conversationId}/${messageId}/`,force:true});
      }
    })
  });
}
