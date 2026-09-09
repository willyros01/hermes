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
export function disappearingPurgeVersionForOutgoing({value}={}){
  const duration=resolveComposeDisappearSelection(value);
  return duration!=null?DISAPPEARING_PURGE_VERSION:null;
}
export function stampOutgoingDisappearSelection(message,value){
  const duration=resolveComposeDisappearSelection(value);
  if(duration==null)return {...message};
  // 0.9.9.19 extends the already-accepted disappearing selection to future
  // attachments. The server purge repository remains the sole Firestore/Storage
  // physical-delete owner.
  return {...message,disappearAfterSeconds:duration,disappearingPurgeVersion:DISAPPEARING_PURGE_VERSION};
}

export const DISAPPEARING_COMPOSE_POLICY_V1=Object.freeze({
  selectionAppliesOnlyToFutureMessages:true,
  sentMessageMetadataImmutable:true,
  directAndGroupUseSameSelection:true
});
