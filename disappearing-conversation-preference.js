import {normalizeDisappearSelection} from "./disappearing-content-policy.js";

function cleanId(value){return String(value??"").trim();}

export function readConversationDisappearSelection(map,conversationId){
  const id=cleanId(conversationId);
  if(!id||!map||typeof map!=="object"||Array.isArray(map))return null;
  return normalizeDisappearSelection(map[id]);
}

export function writeConversationDisappearSelection(map,conversationId,value){
  const id=cleanId(conversationId);
  if(!id)throw new Error("Conversation ID is required for disappearing-message preference.");
  const next={...(map&&typeof map==="object"&&!Array.isArray(map)?map:{})};
  const duration=normalizeDisappearSelection(value);
  if(duration===null)delete next[id];
  else next[id]=duration;
  return next;
}

export const DISAPPEARING_CONVERSATION_PREFERENCE_V1=Object.freeze({
  scope:"conversation",
  defaultValue:null,
  appliesToFutureMessagesOnly:true,
});
