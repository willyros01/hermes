import {normalizeDisappearSelection} from './disappearing-content-policy.js';

export const DISAPPEARING_COMPOSE_PRESETS=Object.freeze([
  Object.freeze({value:null,label:'Off'}),
  Object.freeze({value:300,label:'5 minutes'}),
  Object.freeze({value:3600,label:'1 hour'}),
  Object.freeze({value:86400,label:'1 day'}),
  Object.freeze({value:604800,label:'7 days'})
]);

export function resolveComposeDisappearSelection(value){return normalizeDisappearSelection(value);}
export function composeDisappearLabel(value){
  const seconds=resolveComposeDisappearSelection(value);
  if(seconds==null)return 'Off';
  return DISAPPEARING_COMPOSE_PRESETS.find(x=>x.value===seconds)?.label||`${seconds} seconds`;
}
export const DISAPPEARING_PURGE_VERSION=1;
function isAttachmentPayload(text){
  if(typeof text!=="string"||!text.trimStart().startsWith("{"))return false;
  try{return JSON.parse(text)?.fidunioAttachment===1;}catch{return false;}
}
export function disappearingPurgeVersionForOutgoing({text,value}={}){
  const duration=resolveComposeDisappearSelection(value);
  return duration!=null&&!isAttachmentPayload(text)?DISAPPEARING_PURGE_VERSION:null;
}
export function stampOutgoingDisappearSelection(message,value){
  const duration=resolveComposeDisappearSelection(value);
  // Activation 0.9.9.12 is text-only. Attachment Storage deletion is a
  // separate server trace resource and must not be implied by this timer.
  if(duration==null||isAttachmentPayload(message?.text))return {...message};
  return {...message,disappearAfterSeconds:duration,disappearingPurgeVersion:DISAPPEARING_PURGE_VERSION};
}

export const DISAPPEARING_COMPOSE_POLICY_V1=Object.freeze({
  selectionAppliesOnlyToFutureMessages:true,
  sentMessageMetadataImmutable:true,
  directAndGroupUseSameSelection:true
});
