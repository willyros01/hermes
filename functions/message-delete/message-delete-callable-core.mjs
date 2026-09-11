const fail=(code,message)=>{const error=new Error(message);error.code=code;throw error;};
const clean=value=>String(value||"").trim();
const validId=value=>value.length>0&&value.length<=180&&/^[A-Za-z0-9_-]+$/.test(value);
const BULK_DELETE_PAGE_SIZE=25;

export function createMessageDeleteCallableCore({messageRepo,attachmentRepo}){
  if(!messageRepo||!attachmentRepo)throw new Error("Message deletion dependencies are required.");
  async function deleteOne({uid,conversationId,messageId,messageKind}){
    const source=messageKind==="group"
      ?await messageRepo.readGroupMessage({groupId:conversationId,messageId})
      :await messageRepo.readDirectMessage({conversationId,messageId});
    if(!source)return{deleted:true,alreadyAbsent:true};
    if(source.senderUid!==uid)fail("DELETE_DENIED","Only the original sender may delete this message for everyone.");
    if(!Array.isArray(source.memberUids)||!source.memberUids.includes(uid))fail("DELETE_DENIED","Conversation membership is required.");
    await attachmentRepo.deleteMessageObjects({senderUid:uid,conversationId,messageId});
    if(messageKind==="group")await messageRepo.deleteGroupMessage({groupId:conversationId,messageId,expectedSenderUid:uid,expectedMemberUid:uid});
    else await messageRepo.deleteDirectMessage({conversationId,messageId,expectedSenderUid:uid});
    return{deleted:true,alreadyAbsent:false};
  }
  return Object.freeze({
    async deleteDirectMessageForEveryoneV1({authUid,data}={}){
      const uid=clean(authUid),conversationId=clean(data?.conversationId),messageId=clean(data?.messageId),messageKind=data?.messageKind==="group"?"group":"direct";
      if(!uid)fail("AUTH_REQUIRED","Authentication is required.");
      if(!validId(conversationId)||!validId(messageId))fail("INVALID_INPUT","Conversation and message IDs are required.");
      return Object.freeze(await deleteOne({uid,conversationId,messageId,messageKind}));
    },
    async deleteMyMessagesForEveryoneV1({authUid,data}={}){
      const uid=clean(authUid),conversationId=clean(data?.conversationId),messageKind=data?.messageKind==="group"?"group":"direct";
      if(!uid)fail("AUTH_REQUIRED","Authentication is required.");
      if(!validId(conversationId))fail("INVALID_INPUT","Conversation ID is required.");
      const messageIds=messageKind==="group"
        ?await messageRepo.listGroupMessageIdsBySender({groupId:conversationId,senderUid:uid,limit:BULK_DELETE_PAGE_SIZE})
        :await messageRepo.listDirectMessageIdsBySender({conversationId,senderUid:uid,limit:BULK_DELETE_PAGE_SIZE});
      const deletedMessageIds=[];
      for(const messageId of messageIds){
        const result=await deleteOne({uid,conversationId,messageId,messageKind});
        if(!result.alreadyAbsent)deletedMessageIds.push(messageId);
      }
      return Object.freeze({deleted:true,deletedCount:deletedMessageIds.length,deletedMessageIds:Object.freeze(deletedMessageIds),hasMore:messageIds.length===BULK_DELETE_PAGE_SIZE});
    }
  });
}
