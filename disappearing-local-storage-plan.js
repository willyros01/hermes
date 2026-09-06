function ids(values){return new Set((values||[]).map(x=>String(x??"").trim()).filter(Boolean));}
export function planPhysicalLocalMessagePurge({messagesByConversation={},historyRecords=[],outboxRecords=[],purgeMessageIds=[]}={}){
  const purge=ids(purgeMessageIds),messages={};
  for(const [conversationId,rows] of Object.entries(messagesByConversation||{}))messages[conversationId]=(rows||[]).filter(row=>!purge.has(String(row?.id??"")));
  const history=(historyRecords||[]).map(record=>({...record,messages:(record?.messages||[]).filter(row=>!purge.has(String(row?.id??"")))}));
  const outboxDeleteIds=(outboxRecords||[]).filter(row=>purge.has(String(row?.id??""))).map(row=>String(row.id));
  return Object.freeze({messagesByConversation:messages,historyRecords:history,outboxDeleteIds:Object.freeze(outboxDeleteIds)});
}
export const DISAPPEARING_LOCAL_STORAGE_PURGE_V1=Object.freeze({physicalDelete:true,createsTombstones:false,uidScopedCallerRequired:true,serializedOwner:"app.js"});
