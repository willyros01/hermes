function cleanId(value){return String(value||"").trim();}
function conversationKind(conversation){return conversation?.cloudGroup||conversation?.type==="group"?"group":conversation?.cloud?"direct":"local";}

export async function reconcileAccountVaultPayload({payload,readDirectIds,readGroupIds}={}){
  if(!payload?.appState||!Array.isArray(payload.history)||!Array.isArray(payload.outbox))throw new Error("FIDUNIO Vault candidate is incomplete.");
  if(typeof readDirectIds!=="function"||typeof readGroupIds!=="function")throw new Error("Cloud reconciliation authority is unavailable.");
  const appState=structuredClone(payload.appState),conversations=Array.isArray(appState.conversations)?appState.conversations:[],authority=new Map(),retained=[];
  for(const conversation of conversations){
    const id=cleanId(conversation?.id),kind=conversationKind(conversation);if(!id||kind==="local")continue;
    try{const ids=kind==="group"?await readGroupIds(id):await readDirectIds(id);authority.set(id,new Set((ids||[]).map(cleanId).filter(Boolean)));retained.push(conversation);}catch{authority.set(id,null);}
  }
  appState.conversations=[...conversations.filter(c=>conversationKind(c)==="local"),...retained];
  const allowedConversationIds=new Set(appState.conversations.map(c=>cleanId(c.id)));
  const messages={};
  for(const [conversationId,rows] of Object.entries(appState.messages||{})){
    const id=cleanId(conversationId);if(!allowedConversationIds.has(id))continue;const ids=authority.get(id);
    messages[id]=(Array.isArray(rows)?rows:[]).filter(row=>!ids||ids.has(cleanId(row?.id))||(!row?.serverBacked&&["queued","sending","failed"].includes(row?.state))).map(row=>ids?.has(cleanId(row?.id))&&row?.mine&&["queued","sending","failed"].includes(row?.state)?{...row,state:"sent",serverBacked:true}:row);
  }
  appState.messages=messages;if(appState.selectedId&&!allowedConversationIds.has(cleanId(appState.selectedId)))appState.selectedId=null;
  const history=[];
  for(const record of payload.history){const id=cleanId(record?.conversationId),ids=authority.get(id);if(!id||!allowedConversationIds.has(id)||ids===null)continue;history.push({...record,messages:(record.messages||[]).filter(row=>!ids||ids.has(cleanId(row?.id)))});}
  const outbox=[];
  for(const record of payload.outbox){const id=cleanId(record?.conversationId),messageId=cleanId(record?.messageId||record?.id),ids=authority.get(id);if(!id||!messageId||!allowedConversationIds.has(id)||ids===null)continue;if(ids?.has(messageId))continue;const sendAttempted=record.sendAttempted===true;outbox.push({...record,id:messageId,messageId,conversationId:id,sendAttempted});const row=(appState.messages[id]||[]).find(item=>cleanId(item?.id)===messageId);if(row)row.state=sendAttempted?"failed":"queued";}
  return{...payload,appState,history,outbox,reconciledAt:Date.now()};
}
