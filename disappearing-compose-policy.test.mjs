import {DISAPPEARING_COMPOSE_PRESETS,resolveComposeDisappearSelection,composeDisappearLabel,stampOutgoingDisappearSelection,DISAPPEARING_COMPOSE_POLICY_V1} from './disappearing-compose-policy.js';
if(resolveComposeDisappearSelection('off')!==null||resolveComposeDisappearSelection(3600)!==3600)throw new Error('selection normalization failed');
if(composeDisappearLabel(3600)!=='1 hour'||DISAPPEARING_COMPOSE_PRESETS.length<5)throw new Error('preset presentation failed');
const original=Object.freeze({id:'a',text:'hello'}),sent=stampOutgoingDisappearSelection(original,86400);
if(sent.disappearAfterSeconds!==86400||Object.hasOwn(original,'disappearAfterSeconds'))throw new Error('future-message stamp mutated prior object');
const later=stampOutgoingDisappearSelection({id:'b',text:'later'},300);
if(sent.disappearAfterSeconds!==86400||later.disappearAfterSeconds!==300)throw new Error('later preference retroactively changed sent metadata');
if(!DISAPPEARING_COMPOSE_POLICY_V1.selectionAppliesOnlyToFutureMessages||!DISAPPEARING_COMPOSE_POLICY_V1.sentMessageMetadataImmutable)throw new Error('compose policy contract weakened');
console.log('Disappearing compose policy gate passed');
