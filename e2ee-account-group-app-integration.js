import {prepareGroupSend,flushGroupSend,openGroupConversation,closeGroupConversation,isGroupOutboxPayload,resetGroupMessagingForSignOut,renameGroup,addGroupMember,removeGroupMember,leaveGroup,grantGroupHistory} from "./e2ee-account-group-app-controller.js";

// Bounded bridge between the legacy app shell and the account-authoritative
// group messaging owners. This module owns no Firebase, crypto, IndexedDB or
// DOM. app.js supplies only intent and its existing encrypted Outbox/state callbacks.
let activeGroupId=null;

export function renameGroupForApp(groupId,name){return renameGroup(groupId,name);}
export function addGroupMemberForApp(groupId,targetUid){return addGroupMember(groupId,targetUid);}
export function removeGroupMemberForApp(groupId,targetUid){return removeGroupMember(groupId,targetUid);}
export function leaveGroupForApp(groupId){return leaveGroup(groupId);}
export function grantGroupHistoryForApp(groupId,targetUid,boundary){return grantGroupHistory(groupId,targetUid,boundary);}

export async function queueGroupTextForApp({groupId,messageId,text,time,disappearAfterSeconds=null,persistEncryptedOutbox}){
  if(typeof persistEncryptedOutbox!=="function")throw new Error("Encrypted Outbox persistence callback is required.");
  const queued=await prepareGroupSend({groupId,messageId,text,disappearAfterSeconds});
  const payload={...queued,time:String(time||"")};
  // The plaintext is persisted only through app.js's AES-GCM encrypted Outbox.
  await persistEncryptedOutbox(payload);
  return payload;
}

export function normalizeGroupOutboxPayload(payload){
  return{...payload,groupId:payload?.groupId||payload?.conversationId};
}

export async function flushGroupOutboxForApp(payload,{removeEncryptedOutbox}={}){
  const normalized=normalizeGroupOutboxPayload(payload);
  if(!isGroupOutboxPayload(normalized))throw new Error("Unsupported group Outbox payload.");
  if(typeof removeEncryptedOutbox!=="function")throw new Error("Outbox removal callback is required.");
  const result=await flushGroupSend(normalized);
  // Removal is deliberately after the controller confirms the Firestore write.
  await removeEncryptedOutbox(normalized.messageId);
  return result;
}

export function openGroupForApp(groupId,{onRows,onError,isOpen}={}){
  const id=String(groupId||"");
  if(!id)throw new Error("Group ID is required.");
  closeGroupForApp();
  activeGroupId=id;
  return openGroupConversation(id,{onRows,onError,isOpen});
}

export function closeGroupForApp(){
  if(activeGroupId!==null)closeGroupConversation();
  activeGroupId=null;
}

export function resetGroupAppIntegrationForSignOut(){
  closeGroupForApp();
  resetGroupMessagingForSignOut();
}
