export const FIDUNIO_BACKGROUND_NOTIFICATION_TITLE="FIDUNIO";
export const FIDUNIO_PRIVATE_NOTIFICATION_BODY="New message";

function boundedOpaqueId(value,max=256){
  const text=String(value||"").trim();
  return text&&text.length<=max?text:null;
}

function boundedNotificationBody(value){
  const text=String(value||"").trim();
  if(text===FIDUNIO_PRIVATE_NOTIFICATION_BODY)return text;
  return /^New message from .{1,80}$/u.test(text)?text:FIDUNIO_PRIVATE_NOTIFICATION_BODY;
}

export function notificationEnvelopeFromFcmPayload(payload){
  const data=payload?.data;
  if(!data||!["direct-message","group-message"].includes(data.type))return null;
  const conversationId=boundedOpaqueId(data.conversationId);
  const messageId=boundedOpaqueId(data.messageId);
  if(!conversationId||!messageId)return null;
  return Object.freeze({
    route:Object.freeze({type:data.type,conversationId,messageId}),
    body:boundedNotificationBody(data.notificationBody)
  });
}

export function notificationOptionsForEnvelope(envelope){
  if(!envelope?.route)return null;
  return {
    body:boundedNotificationBody(envelope.body),
    icon:"./icon-192.png",
    badge:"./icon-192.png",
    tag:`fidunio-${envelope.route.messageId}`,
    data:envelope.route
  };
}
