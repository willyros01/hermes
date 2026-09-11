import {FIDUNIO_NOTIFICATION_BODY,isInvalidNotificationTokenError} from "./direct-message-notification-core.mjs";

const MAX_MULTICAST_TOKENS=500;

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

function batches(rows,size=MAX_MULTICAST_TOKENS){
  const result=[];
  for(let index=0;index<rows.length;index+=size)result.push(rows.slice(index,index+size));
  return result;
}

export function deriveGroupRecipientUids({group,message}={}){
  const members=normalizedMembers(group?.memberUids);
  const senderUid=String(message?.senderUid||"").trim();
  if(group?.type!=="group"||!members.length||members.length>64||!senderUid||!members.includes(senderUid))throw new Error("Group notification authority is invalid.");
  return members.filter(uid=>uid!==senderUid);
}

export function createGroupMessageNotificationCore({groupRepo,profileRepo,deviceRepo,messaging,logger=console}={}){
  if(typeof groupRepo?.get!=="function"||typeof profileRepo?.getDisplayName!=="function"||typeof deviceRepo?.listActive!=="function"||typeof deviceRepo?.deleteIfTokenMatches!=="function"||typeof messaging?.sendEachForMulticast!=="function")throw new Error("Group notification core dependencies are incomplete.");
  return Object.freeze({async handleCreatedMessage({groupId,messageId,message}={}){
    groupId=boundedId(groupId,"Group ID");
    messageId=boundedId(messageId,"Message ID");
    if(!message||typeof message!=="object")throw new Error("Accepted message snapshot is required.");
    const group=await groupRepo.get(groupId);
    if(!group)return{status:"group-missing",sent:0,failed:0,pruned:0,recipientCount:0};
    const recipientUids=deriveGroupRecipientUids({group,message});
    const installations=(await Promise.all(recipientUids.map(async recipientUid=>(await deviceRepo.listActive(recipientUid))
      .filter(row=>row?.enabled===true&&typeof row?.fcmToken==="string"&&row.fcmToken.length>=20)
      .map(row=>({...row,recipientUid}))))).flat();
    if(!installations.length)return{status:"no-active-installations",recipientCount:recipientUids.length,sent:0,failed:0,pruned:0};

    const senderDisplayName=installations.some(row=>row.showSenderName===true)
      ?await profileRepo.getDisplayName(String(message.senderUid||"").trim())
      :"";
    const privateDevices=installations.filter(row=>row.showSenderName!==true);
    const namedDevices=installations.filter(row=>row.showSenderName===true);
    let sent=0,failed=0;
    const stale=[];
    async function sendBatch(batch,notificationBody){
      const result=await messaging.sendEachForMulticast({
        tokens:batch.map(row=>row.fcmToken),
        data:{type:"group-message",conversationId:groupId,messageId,notificationBody},
        webpush:{headers:{Urgency:"high"}}
      });
      const responses=Array.isArray(result?.responses)?result.responses:[];
      for(let index=0;index<responses.length;index++)if(responses[index]?.success!==true&&isInvalidNotificationTokenError(responses[index]?.error))stale.push(batch[index]);
      sent+=Number(result?.successCount||responses.filter(row=>row?.success===true).length||0);
      failed+=Number(result?.failureCount||responses.filter(row=>row?.success!==true).length||0);
    }
    for(const batch of batches(privateDevices))await sendBatch(batch,FIDUNIO_NOTIFICATION_BODY);
    for(const batch of batches(namedDevices))await sendBatch(batch,senderBody(senderDisplayName));
    await Promise.all(stale.filter(Boolean).map(row=>deviceRepo.deleteIfTokenMatches(row.recipientUid,row.installationId,row.fcmToken)));
    if(failed>stale.length)logger.warn?.("FIDUNIO group notification partial failure",{groupId,messageId,recipientCount:recipientUids.length,failed,pruned:stale.length});
    return{status:"sent",recipientCount:recipientUids.length,sent,failed,pruned:stale.length};
  }});
}
