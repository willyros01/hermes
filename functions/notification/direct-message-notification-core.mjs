export const FIDUNIO_NOTIFICATION_TITLE="FIDUNIO";
export const FIDUNIO_NOTIFICATION_BODY="New message";
const INVALID_TOKEN_CODES=new Set(["messaging/registration-token-not-registered","messaging/invalid-registration-token"]);

function boundedId(value,label,max=256){
  const text=String(value||"").trim();
  if(!text||text.length>max)throw new Error(`${label} is invalid.`);
  return text;
}

function normalizedMembers(value){
  return Array.isArray(value)?[...new Set(value.map(x=>String(x||"").trim()).filter(Boolean))]:[];
}

function senderBody(name){
  const safe=String(name||"").trim();
  return safe&&safe.length<=80?`New message from ${safe}`:FIDUNIO_NOTIFICATION_BODY;
}

export function deriveDirectRecipientUid({conversation,message}={}){
  const members=normalizedMembers(conversation?.members);
  const senderUid=String(message?.senderUid||"").trim();
  if(conversation?.type!=="direct"||members.length!==2||!senderUid||!members.includes(senderUid))throw new Error("Direct notification authority is invalid.");
  return members.find(uid=>uid!==senderUid)||"";
}

export function isInvalidNotificationTokenError(error){
  return INVALID_TOKEN_CODES.has(String(error?.code||""));
}

export function createDirectMessageNotificationCore({conversationRepo,profileRepo,deviceRepo,blockRepo,messaging,admDelivery=null,logger=console}={}){
  if(typeof conversationRepo?.get!=="function"||typeof profileRepo?.getDisplayName!=="function"||typeof deviceRepo?.listActive!=="function"||typeof deviceRepo?.deleteIfTokenMatches!=="function"||typeof blockRepo?.isBlockedEitherDirection!=="function"||typeof messaging?.sendEachForMulticast!=="function")throw new Error("Direct notification core dependencies are incomplete.");
  return Object.freeze({async handleCreatedMessage({conversationId,messageId,message}={}){
    conversationId=boundedId(conversationId,"Conversation ID");
    messageId=boundedId(messageId,"Message ID");
    if(!message||typeof message!=="object")throw new Error("Accepted message snapshot is required.");
    const conversation=await conversationRepo.get(conversationId);
    if(!conversation)return{status:"conversation-missing",sent:0,failed:0,pruned:0};
    const recipientUid=deriveDirectRecipientUid({conversation,message});
    const senderUid=String(message.senderUid||"").trim();
    if(await blockRepo.isBlockedEitherDirection(senderUid,recipientUid))return{status:"blocked",recipientUid,sent:0,failed:0,pruned:0};
    const devices=(await deviceRepo.listActive(recipientUid)).filter(row=>row?.enabled===true&&typeof row?.fcmToken==="string"&&row.fcmToken.length>=20);
    if(!devices.length)return{status:"no-active-installations",recipientUid,sent:0,failed:0,pruned:0};
    const senderDisplayName=await profileRepo.getDisplayName(senderUid);
    let sent=0;
    let failed=0;
    const stale=[];
    async function sendBatch(batch,notificationBody){
      if(!batch.length)return;
      const result=await messaging.sendEachForMulticast({
        tokens:batch.map(row=>row.fcmToken),
        data:{type:"direct-message",conversationId,messageId,notificationBody},
        webpush:{headers:{Urgency:"high"}},
        apns:{headers:{"apns-priority":"10"},payload:{aps:{alert:{title:FIDUNIO_NOTIFICATION_TITLE,body:notificationBody},sound:"default"}}}
      });
      const responses=Array.isArray(result?.responses)?result.responses:[];
      for(let i=0;i<responses.length;i++){
        if(responses[i]?.success!==true&&isInvalidNotificationTokenError(responses[i]?.error))stale.push(batch[i]);
      }
      sent+=Number(result?.successCount||responses.filter(x=>x?.success===true).length||0);
      failed+=Number(result?.failureCount||responses.filter(x=>x?.success!==true).length||0);
    }
    const fcmDevices=devices.filter(row=>row.platform!=="android-adm");
    const admDevices=devices.filter(row=>row.platform==="android-adm");
    await sendBatch(fcmDevices.filter(row=>row.showSenderName!==true),FIDUNIO_NOTIFICATION_BODY);
    await sendBatch(fcmDevices.filter(row=>row.showSenderName===true),senderBody(senderDisplayName));
    // An Amazon token MUST NEVER be handed to Firebase Messaging.
    for(const row of admDevices){
      if(typeof admDelivery?.send!=="function"){
        failed++;
        logger.warn?.("FIDUNIO ADM delivery unavailable; no FCM fallback",{
          recipientUid,installationId:row.installationId});
        continue;
      }
      try{
        const result=await admDelivery.send({token:row.fcmToken,
          data:{type:"direct-message",conversationId,messageId,
            notificationBody:row.showSenderName===true?senderBody(senderDisplayName):FIDUNIO_NOTIFICATION_BODY}});
        if(result?.success===true)sent++;
        else{failed++;if(result?.invalid===true)stale.push(row);}
      }catch(error){
        failed++;
        logger.warn?.("FIDUNIO ADM send failed",{
          recipientUid,installationId:row.installationId,error:String(error?.message||error)});
      }
    }
    await Promise.all(stale.filter(Boolean).map(row=>deviceRepo.deleteIfTokenMatches(recipientUid,row.installationId,row.fcmToken)));
    if(failed>stale.length)logger.warn?.("FIDUNIO direct notification partial failure",{conversationId,messageId,recipientUid,failed,pruned:stale.length});
    return{status:"sent",recipientUid,sent,failed,pruned:stale.length};
  }});
}
