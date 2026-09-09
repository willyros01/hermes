export const FIDUNIO_NOTIFICATION_TITLE="FIDUNIO";
export const FIDUNIO_NOTIFICATION_BODY="New message";
const INVALID_TOKEN_CODES=new Set(["messaging/registration-token-not-registered","messaging/invalid-registration-token"]);

function boundedId(value,label,max=256){const text=String(value||"").trim();if(!text||text.length>max)throw new Error(`${label} is invalid.`);return text;}
function normalizedMembers(value){return Array.isArray(value)?[...new Set(value.map(x=>String(x||"").trim()).filter(Boolean))]:[];}
export function deriveDirectRecipientUid({conversation,message}={}){
  const members=normalizedMembers(conversation?.members),senderUid=String(message?.senderUid||"").trim();
  if(conversation?.type!=="direct"||members.length!==2||!senderUid||!members.includes(senderUid))throw new Error("Direct notification authority is invalid.");
  return members.find(uid=>uid!==senderUid)||"";
}
export function isInvalidNotificationTokenError(error){return INVALID_TOKEN_CODES.has(String(error?.code||""));}
export function createDirectMessageNotificationCore({conversationRepo,deviceRepo,messaging,logger=console}={}){
  if(typeof conversationRepo?.get!=="function"||typeof deviceRepo?.listActive!=="function"||typeof deviceRepo?.deleteIfTokenMatches!=="function"||typeof messaging?.sendEachForMulticast!=="function")throw new Error("Direct notification core dependencies are incomplete.");
  return Object.freeze({
    async handleCreatedMessage({conversationId,messageId,message}={}){
      conversationId=boundedId(conversationId,"Conversation ID");messageId=boundedId(messageId,"Message ID");
      if(!message||typeof message!=="object")throw new Error("Accepted message snapshot is required.");
      const conversation=await conversationRepo.get(conversationId);if(!conversation)return{status:"conversation-missing",sent:0,failed:0,pruned:0};
      const recipientUid=deriveDirectRecipientUid({conversation,message});
      const devices=(await deviceRepo.listActive(recipientUid)).filter(row=>row?.enabled===true&&typeof row?.fcmToken==="string"&&row.fcmToken.length>=20);
      if(!devices.length)return{status:"no-active-installations",recipientUid,sent:0,failed:0,pruned:0};
      const multicast={
        tokens:devices.map(row=>row.fcmToken),
        notification:{title:FIDUNIO_NOTIFICATION_TITLE,body:FIDUNIO_NOTIFICATION_BODY},
        data:{type:"direct-message",conversationId,messageId},
        webpush:{headers:{Urgency:"high"}}
      };
      const result=await messaging.sendEachForMulticast(multicast);
      const responses=Array.isArray(result?.responses)?result.responses:[];
      const stale=[];
      for(let i=0;i<responses.length;i++)if(responses[i]?.success!==true&&isInvalidNotificationTokenError(responses[i]?.error))stale.push(devices[i]);
      await Promise.all(stale.filter(Boolean).map(row=>deviceRepo.deleteIfTokenMatches(recipientUid,row.installationId,row.fcmToken)));
      const sent=Number(result?.successCount||responses.filter(x=>x?.success===true).length||0),failed=Number(result?.failureCount||responses.filter(x=>x?.success!==true).length||0);
      if(failed>stale.length)logger.warn?.("FIDUNIO direct notification partial failure",{conversationId,messageId,recipientUid,failed,pruned:stale.length});
      return{status:"sent",recipientUid,sent,failed,pruned:stale.length};
    }
  });
}
