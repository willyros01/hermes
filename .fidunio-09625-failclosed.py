from pathlib import Path
p=Path('app.js'); s=p.read_text()
old='''async function removeOutboxMessage(id){\n  const db=await openDb();\n  const tx=db.transaction("outbox","readwrite");\n  tx.objectStore("outbox").delete(id);\n  await txDone(tx);\n}\n'''
new=old+'''async function markOutboxSendAttempted(id){\n  const db=await openDb();\n  const tx=db.transaction("outbox","readwrite");\n  const store=tx.objectStore("outbox");\n  const record=await idbRequest(store.get(id));\n  if(!record){tx.abort();throw new Error("Outbox record disappeared before send attempt marker.");}\n  store.put({...record,sendAttempted:true});\n  await txDone(tx);\n}\n'''
assert old in s; s=s.replace(old,new,1)
s=s.replace('''      decoded.push({id:record.id,messageId:payload.messageId||record.id,conversationId,groupId:isGroup?conversationId:null});''','''      decoded.push({id:record.id,messageId:payload.messageId||record.id,conversationId,groupId:isGroup?conversationId:null,sendAttempted:record.sendAttempted===true});''',1)
old='''    if(plan.purgeMessageIds.length)await purgeLocalDisappearingMessageTraces(firebaseUser.uid,plan.purgeMessageIds);\n    await persistState();'''
new='''    if(plan.purgeMessageIds.length)await purgeLocalDisappearingMessageTraces(firebaseUser.uid,plan.purgeMessageIds);\n    for(const id of plan.blockedMessageIds){\n      for(const list of Object.values(state.messages)){\n        const row=Array.isArray(list)?list.find(x=>String(x?.id)===String(id)):null;\n        if(row&&["queued","sending","failed"].includes(row.state))row.state="failed";\n      }\n    }\n    await persistState();'''
assert old in s; s=s.replace(old,new,1)
old='''        m.state="sending";await persistState();\n        await flushGroupOutboxForApp(payload,{removeEncryptedOutbox:removeOutboxMessage});'''
new='''        m.state="sending";await persistState();\n        await markOutboxSendAttempted(payload.messageId);\n        await flushGroupOutboxForApp(payload,{removeEncryptedOutbox:removeOutboxMessage});'''
assert old in s; s=s.replace(old,new,1)
old='''        const encrypted=await prepareAccountDirectMessage({uid:firebaseUser.uid,peerUid,conversationId:payload.conversationId,messageId:payload.messageId,text:payload.text});\n        await sendCloudMessage(payload.conversationId,{id:payload.messageId,text:"",...encrypted,timeLabel:payload.time,state:"sent",disappearAfterSeconds:payload.disappearAfterSeconds??null});'''
new='''        const encrypted=await prepareAccountDirectMessage({uid:firebaseUser.uid,peerUid,conversationId:payload.conversationId,messageId:payload.messageId,text:payload.text});\n        await markOutboxSendAttempted(payload.messageId);\n        await sendCloudMessage(payload.conversationId,{id:payload.messageId,text:"",...encrypted,timeLabel:payload.time,state:"sent",disappearAfterSeconds:payload.disappearAfterSeconds??null});'''
assert old in s; s=s.replace(old,new,1)
p.write_text(s)
