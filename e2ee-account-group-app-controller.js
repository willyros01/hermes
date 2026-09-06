import {prepareQueuedAccountGroupMessage,flushQueuedAccountGroupMessage} from "./e2ee-account-group-outbox.js";
import {subscribeAccountGroupConversation,stopAccountGroupConversation} from "./e2ee-account-group-conversation.js";

// This is the only surface app.js needs for group text messaging. It does not
// own Firebase, crypto, IndexedDB, or rendering. The caller persists the
// returned queued payload inside its already-encrypted local Outbox.
let activeGroupId=null;

export async function prepareGroupSend({groupId,messageId,text}){
  return prepareQueuedAccountGroupMessage({groupId,messageId,text});
}

export async function flushGroupSend(payload){
  return flushQueuedAccountGroupMessage(payload);
}

export function openGroupConversation(groupId,{onRows,onError,isOpen}={}){
  closeGroupConversation();
  activeGroupId=String(groupId);
  return subscribeAccountGroupConversation(activeGroupId,{onRows,onError,isOpen});
}

export function closeGroupConversation(){
  if(activeGroupId!==null)stopAccountGroupConversation(activeGroupId);
  activeGroupId=null;
}

export function isGroupOutboxPayload(payload){
  return payload?.kind==="group-e2ee-v1"&&!!payload.groupId&&!!payload.messageId;
}
