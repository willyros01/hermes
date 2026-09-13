export const GROUP_REPLY_DESCRIPTOR_VERSION=1;
export const GROUP_REPLY_PREVIEW_LIMIT=160;
export const GROUP_REPLY_SENDER_LIMIT=80;

function cleanBounded(value,limit){
  return String(value??"").replace(/\s+/g," ").trim().slice(0,limit);
}

export function parseGroupReplyDescriptor(value){
  if(typeof value!=="string"||!value.trimStart().startsWith("{"))return null;
  try{
    const row=JSON.parse(value);
    if(row?.fidunioReply!==GROUP_REPLY_DESCRIPTOR_VERSION)return null;
    const replyToMessageId=String(row.replyToMessageId||"").trim();
    if(!replyToMessageId||typeof row.text!=="string")return null;
    return Object.freeze({
      fidunioReply:GROUP_REPLY_DESCRIPTOR_VERSION,
      replyToMessageId,
      replyToSender:cleanBounded(row.replyToSender||"FIDUNIO member",GROUP_REPLY_SENDER_LIMIT)||"FIDUNIO member",
      replyPreview:cleanBounded(row.replyPreview||"Message",GROUP_REPLY_PREVIEW_LIMIT)||"Message",
      text:row.text
    });
  }catch{return null;}
}

export function encodeGroupReplyDescriptor({replyToMessageId,replyToSender,replyPreview,text}={}){
  const messageId=String(replyToMessageId||"").trim();
  const body=String(text??"");
  if(!messageId)throw new Error("Reply target message ID is required.");
  if(!body.trim())throw new Error("Reply text is required.");
  return JSON.stringify({
    fidunioReply:GROUP_REPLY_DESCRIPTOR_VERSION,
    replyToMessageId:messageId,
    replyToSender:cleanBounded(replyToSender||"FIDUNIO member",GROUP_REPLY_SENDER_LIMIT)||"FIDUNIO member",
    replyPreview:cleanBounded(replyPreview||"Message",GROUP_REPLY_PREVIEW_LIMIT)||"Message",
    text:body
  });
}

export function groupReplyVisibleText(value){
  return parseGroupReplyDescriptor(value)?.text??String(value??"");
}
