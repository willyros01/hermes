const fail=(code,message)=>{const error=new Error(message);error.code=code;throw error;};
const clean=value=>String(value||"").trim();
const validId=value=>value.length>0&&value.length<=180&&/^[A-Za-z0-9_-]+$/.test(value);

export function createMessageDeleteCallableCore({messageRepo,attachmentRepo}){
  if(!messageRepo||!attachmentRepo)throw new Error("Message deletion dependencies are required.");
  return Object.freeze({
    async deleteDirectMessageForEveryoneV1({authUid,data}={}){
      const uid=clean(authUid),conversationId=clean(data?.conversationId),messageId=clean(data?.messageId);
      if(!uid)fail("AUTH_REQUIRED","Authentication is required.");
      if(!validId(conversationId)||!validId(messageId))fail("INVALID_INPUT","Conversation and message IDs are required.");
      const source=await messageRepo.readDirectMessage({conversationId,messageId});
      if(!source)return Object.freeze({deleted:true,alreadyAbsent:true});
      if(source.senderUid!==uid)fail("DELETE_DENIED","Only the original sender may delete this message for everyone.");
      if(!Array.isArray(source.memberUids)||!source.memberUids.includes(uid))fail("DELETE_DENIED","Conversation membership is required.");
      await attachmentRepo.deleteMessageObjects({senderUid:uid,conversationId,messageId});
      await messageRepo.deleteDirectMessage({conversationId,messageId,expectedSenderUid:uid});
      return Object.freeze({deleted:true,alreadyAbsent:false});
    }
  });
}
