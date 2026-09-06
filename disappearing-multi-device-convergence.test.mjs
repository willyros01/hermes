import {planAuthoritativeMessageProjection} from './disappearing-authoritative-projection.js';
import {planReconnectOutboxConvergence} from './disappearing-reconnect-recovery.js';
import {planPhysicalLocalMessagePurge} from './disappearing-local-storage-plan.js';

const source={id:'gone',mine:true,state:'sent',cloud:true,serverBacked:true,disappearAfterSeconds:60,text:'secret'};
function device(name){return {name,messages:{c:[{...source}]},history:[{conversationId:'c',messages:[{...source}]}],outbox:[{id:'gone',conversationId:'c',sendAttempted:true}]};}
function converge(d){
  const projection=planAuthoritativeMessageProjection({existingRows:d.messages.c,remoteRows:[],snapshotMeta:{fromCache:false},outboxMessageIds:d.outbox.map(x=>x.id)});
  if(projection.purgeMessageIds.join()!=='gone')throw new Error(`${d.name}: authoritative absence did not independently plan purge`);
  const physical=planPhysicalLocalMessagePurge({messagesByConversation:d.messages,historyRecords:d.history,outboxRecords:d.outbox,purgeMessageIds:projection.purgeMessageIds});
  const replay=planReconnectOutboxConvergence({messagesByConversation:d.messages,outboxRecords:d.outbox.map(x=>({...x,messageId:x.id})),authoritativeRemoteIdsByConversation:{c:[]}});
  if(replay.replayMessageIds.length)throw new Error(`${d.name}: stale attempted Outbox can resurrect source`);
  if(physical.messagesByConversation.c.some(x=>x.id==='gone')||physical.historyRecords.some(x=>x.messages?.some(m=>m.id==='gone'))||!physical.outboxDeleteIds.includes('gone'))throw new Error(`${d.name}: physical traces did not converge`);
  return physical;
}
const a=converge(device('device-a')),b=converge(device('device-b'));
if(a.messagesByConversation.c.length||b.messagesByConversation.c.length)throw new Error('same-UID devices did not independently converge');
const cacheOnly=planAuthoritativeMessageProjection({existingRows:[source],remoteRows:[],snapshotMeta:{fromCache:true},outboxMessageIds:['gone']});
if(cacheOnly.purgeMessageIds.length)throw new Error('installation-local/cache absence gained lifetime authority');
console.log('Multi-device disappearing convergence gate passed');
