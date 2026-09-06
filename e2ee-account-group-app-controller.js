import {prepareQueuedAccountGroupMessage,flushQueuedAccountGroupMessage,resetAccountGroupOutboxQueue} from "./e2ee-account-group-outbox.js";
import {subscribeAccountGroupConversation,stopAccountGroupConversation,resetAccountGroupConversationStreams} from "./e2ee-account-group-conversation.js";
import {renameAccountGroup,addAccountGroupMember,removeAccountGroupMember,leaveAccountGroup} from "./e2ee-account-group-service.js";

// This is the only surface app.js needs for group text messaging. It owns no
// Firebase, crypto, IndexedDB, or DOM. The caller persists queued payloads in
// the existing encrypted local Outbox and removes them only after flushGroupSend
// confirms the Firestore write.
let activeGroupId=null;
let tail=Promise.resolve();
function serial(task){const run=tail.then(task,task);tail=run.catch(()=>{});return run;}

export function renameGroup(groupId,name){return serial(()=>renameAccountGroup(groupId,name));}
export function addGroupMember(groupId,targetUid){return serial(()=>addAccountGroupMember(groupId,targetUid));}
export function removeGroupMember(groupId,targetUid){return serial(()=>removeAccountGroupMember(groupId,targetUid));}
export function leaveGroup(groupId){return serial(()=>leaveAccountGroup(groupId));}

export function prepareGroupSend({groupId,messageId,text}){
  return serial(()=>prepareQueuedAccountGroupMessage({groupId,messageId,text}));
}

export function flushGroupSend(payload){
  return serial(()=>flushQueuedAccountGroupMessage(payload));
}

export function openGroupConversation(groupId,{onRows,onError,isOpen}={}){
  const id=String(groupId||"");
  if(!id)throw new Error("Group ID is required.");
  closeGroupConversation();
  activeGroupId=id;
  return subscribeAccountGroupConversation(activeGroupId,{onRows,onError,isOpen});
}

export function closeGroupConversation(){
  if(activeGroupId!==null)stopAccountGroupConversation(activeGroupId);
  activeGroupId=null;
}

export function isGroupOutboxPayload(payload){
  return payload?.kind==="group-e2ee-v1"&&!!payload.groupId&&!!payload.messageId&&Number.isInteger(payload.expectedKeyEpoch);
}

export function resetGroupMessagingForSignOut(){
  closeGroupConversation();
  tail=Promise.resolve();
  resetAccountGroupOutboxQueue();
  resetAccountGroupConversationStreams();
}
