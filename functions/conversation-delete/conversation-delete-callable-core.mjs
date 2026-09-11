const fail=(code,message)=>{const error=new Error(message);error.code=code;throw error;};
const clean=value=>String(value||"").trim();
const validId=value=>value.length>0&&value.length<=180&&/^[A-Za-z0-9_-]+$/.test(value);
const ATTACHMENT_DELETE_CONCURRENCY=8;

async function deleteAttachmentRows(rows,attachmentRepo,conversationId){
  let cursor=0;
  const workers=Array.from({length:Math.min(ATTACHMENT_DELETE_CONCURRENCY,Math.max(1,rows.length))},async()=>{
    while(cursor<rows.length){
      const row=rows[cursor++];
      await attachmentRepo.deleteMessageObjects({senderUid:row.senderUid,conversationId,messageId:row.messageId});
    }
  });
  await Promise.all(workers);
}

export function createConversationDeleteCallableCore({conversationRepo,attachmentRepo}){
  if(!conversationRepo||!attachmentRepo)throw new Error("Conversation deletion dependencies are required.");
  return Object.freeze({
    async deleteConversationForEveryoneV1({authUid,data}={}){
      const uid=clean(authUid),conversationId=clean(data?.conversationId),conversationKind=data?.conversationKind==="group"?"group":"direct";
      if(!uid)fail("AUTH_REQUIRED","Authentication is required.");
      if(!validId(conversationId))fail("INVALID_INPUT","Conversation ID is required.");
      const authority=await conversationRepo.beginDeletion({conversationId,conversationKind,requesterUid:uid});
      if(authority?.alreadyAbsent)return Object.freeze({deleted:true,alreadyAbsent:true,deletedMessageCount:0});
      const rows=await conversationRepo.listAttachmentRows({conversationId,conversationKind});
      await deleteAttachmentRows(rows,attachmentRepo,conversationId);
      await conversationRepo.deleteConversationTree({conversationId,conversationKind});
      return Object.freeze({deleted:true,alreadyAbsent:false,deletedMessageCount:rows.length});
    }
  });
}
