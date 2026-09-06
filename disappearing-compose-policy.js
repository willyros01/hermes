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
export function stampOutgoingDisappearSelection(message,value){
  const duration=resolveComposeDisappearSelection(value);
  return Object.freeze(duration==null?{...message}:{...message,disappearAfterSeconds:duration});
}

export const DISAPPEARING_COMPOSE_POLICY_V1=Object.freeze({
  selectionAppliesOnlyToFutureMessages:true,
  sentMessageMetadataImmutable:true,
  directAndGroupUseSameSelection:true
});
