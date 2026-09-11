export const FIDUNIO_NOTIFICATION_ROUTE_MESSAGE="fidunio-notification-route";
export const FIDUNIO_NOTIFICATION_QUERY_KEYS=Object.freeze({type:"fidunioNotification",conversationId:"conversationId",messageId:"messageId"});

function boundedOpaqueId(value,label,max=256){
  const text=String(value||"").trim();
  if(!text||text.length>max)throw new Error(`${label} is invalid.`);
  return text;
}

export function normalizeNotificationRoute(value){
  if(!value||typeof value!=="object"||!["direct-message","group-message"].includes(value.type))return null;
  try{
    return Object.freeze({
      type:value.type,
      conversationId:boundedOpaqueId(value.conversationId,"Conversation ID"),
      messageId:boundedOpaqueId(value.messageId,"Message ID")
    });
  }catch{return null;}
}

export function notificationRouteFromUrl(href){
  try{
    const url=new URL(String(href||""),"https://fidunio.invalid/");
    return normalizeNotificationRoute({
      type:url.searchParams.get(FIDUNIO_NOTIFICATION_QUERY_KEYS.type),
      conversationId:url.searchParams.get(FIDUNIO_NOTIFICATION_QUERY_KEYS.conversationId),
      messageId:url.searchParams.get(FIDUNIO_NOTIFICATION_QUERY_KEYS.messageId)
    });
  }catch{return null;}
}

export function urlWithoutNotificationRoute(href){
  const url=new URL(String(href||""),"https://fidunio.invalid/");
  for(const key of Object.values(FIDUNIO_NOTIFICATION_QUERY_KEYS))url.searchParams.delete(key);
  return `${url.pathname}${url.search}${url.hash}`;
}
