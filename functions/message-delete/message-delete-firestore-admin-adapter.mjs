export function createMessageDeleteAdminRepositories({db,bucket}){
  if(!db||!bucket)throw new Error("Firestore and Storage admin services are required.");
  return Object.freeze({
    messageRepo:Object.freeze({
      async listDirectMessageIdsBySender({conversationId,senderUid,limit}){
        const conversationRef=db.doc(`conversations/${conversationId}`),conversation=await conversationRef.get();
        if(!conversation.exists||!Array.isArray(conversation.data()?.members)||!conversation.data().members.map(String).includes(String(senderUid)))throw Object.assign(new Error("Conversation membership is required."),{code:"DELETE_DENIED"});
        const snap=await conversationRef.collection("messages").where("senderUid","==",String(senderUid)).limit(Number(limit)).get();
        return(snap.docs||[]).map(doc=>String(doc.id));
      },
      async listGroupMessageIdsBySender({groupId,senderUid,limit}){
        const groupRef=db.doc(`groups/${groupId}`),group=await groupRef.get();
        if(!group.exists||!Array.isArray(group.data()?.memberUids)||!group.data().memberUids.map(String).includes(String(senderUid)))throw Object.assign(new Error("Group membership is required."),{code:"DELETE_DENIED"});
        const snap=await groupRef.collection("messages").where("senderUid","==",String(senderUid)).limit(Number(limit)).get();
        return(snap.docs||[]).map(doc=>String(doc.id));
      },
      async readDirectMessage({conversationId,messageId}){
        const conversationRef=db.doc(`conversations/${conversationId}`),messageRef=conversationRef.collection("messages").doc(messageId);
        const [conversation,message]=await Promise.all([conversationRef.get(),messageRef.get()]);
        if(!message.exists)return null;
        if(!conversation.exists)throw Object.assign(new Error("Conversation is missing."),{code:"DELETE_DENIED"});
        return{senderUid:String(message.data()?.senderUid||""),memberUids:Array.isArray(conversation.data()?.members)?conversation.data().members.map(String):[]};
      },
      async readGroupMessage({groupId,messageId}){
        const groupRef=db.doc(`groups/${groupId}`),messageRef=groupRef.collection("messages").doc(messageId);
        const [group,message]=await Promise.all([groupRef.get(),messageRef.get()]);
        if(!message.exists)return null;
        if(!group.exists)throw Object.assign(new Error("Group is missing."),{code:"DELETE_DENIED"});
        return{senderUid:String(message.data()?.senderUid||""),memberUids:Array.isArray(group.data()?.memberUids)?group.data().memberUids.map(String):[]};
      },
      async deleteDirectMessage({conversationId,messageId,expectedSenderUid}){
        const ref=db.doc(`conversations/${conversationId}/messages/${messageId}`);
        return db.runTransaction(async tx=>{
          const snap=await tx.get(ref);
          if(!snap.exists)return;
          if(String(snap.data()?.senderUid||"")!==expectedSenderUid)throw Object.assign(new Error("Message sender changed."),{code:"DELETE_DENIED"});
          tx.delete(ref);
        });
      },
      async deleteGroupMessage({groupId,messageId,expectedSenderUid,expectedMemberUid}){
        const groupRef=db.doc(`groups/${groupId}`),messageRef=groupRef.collection("messages").doc(messageId);
        return db.runTransaction(async tx=>{
          const [groupSnap,messageSnap,receiptSnap,grantSnap]=await Promise.all([
            tx.get(groupRef),tx.get(messageRef),tx.get(messageRef.collection("receipts")),tx.get(groupRef.collection("historyGrants"))
          ]);
          if(!messageSnap.exists)return;
          if(!groupSnap.exists)throw Object.assign(new Error("Group message deletion authority changed."),{code:"DELETE_DENIED"});
          const members=Array.isArray(groupSnap.data()?.memberUids)?groupSnap.data().memberUids.map(String):[];
          if(!members.includes(expectedMemberUid)||String(messageSnap.data()?.senderUid||"")!==expectedSenderUid)throw Object.assign(new Error("Group message deletion authority changed."),{code:"DELETE_DENIED"});
          const grantCopies=[];
          for(const grant of grantSnap.docs||[])grantCopies.push({grant,copies:await tx.get(grant.ref.collection("messages"))});
          let writes=(receiptSnap.docs?.length||0)+1;
          for(const entry of grantCopies)if(entry.copies.docs?.some(copy=>String(copy.data()?.sourceMessageId||copy.id)===messageId))writes+=2;
          if(writes>400)throw Object.assign(new Error("Group message has too many deletion traces."),{code:"DELETE_DENIED"});
          for(const receipt of receiptSnap.docs||[])tx.delete(receipt.ref);
          for(const {grant,copies} of grantCopies){
            const matching=(copies.docs||[]).filter(copy=>String(copy.data()?.sourceMessageId||copy.id)===messageId);
            if(!matching.length)continue;
            for(const copy of matching)tx.delete(copy.ref);
            const remaining=(copies.docs||[]).filter(copy=>!matching.includes(copy)).sort((a,b)=>{
              const av=a.data()?.sourceCreatedAt?.toMillis?.()||0,bv=b.data()?.sourceCreatedAt?.toMillis?.()||0;return av-bv||a.id.localeCompare(b.id);
            });
            if(!remaining.length)tx.delete(grant.ref);
            else tx.update(grant.ref,{totalCopies:remaining.length,firstSharedMessageId:String(remaining[0].data()?.sourceMessageId||remaining[0].id),firstSharedAt:remaining[0].data()?.sourceCreatedAt});
          }
          tx.delete(messageRef);
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
