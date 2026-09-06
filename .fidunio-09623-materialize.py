from pathlib import Path

def replace(path, old, new):
    p=Path(path); s=p.read_text()
    if old not in s: raise SystemExit(f'anchor missing in {path}: {old[:80]!r}')
    p.write_text(s.replace(old,new,1))

replace('app.js','import { planPhysicalLocalMessagePurge } from "./disappearing-local-storage-plan.js";','import { planPhysicalLocalMessagePurge } from "./disappearing-local-storage-plan.js";\nimport { planAuthoritativeMessageProjection } from "./disappearing-authoritative-projection.js";')
replace('app.js','    onRows:async rows=>{\n      const existing=state.messages[groupId]||[];\n      const remoteIds=new Set(rows.map(x=>x.id));\n      const pending=existing.filter(x=>x.mine&&["queued","sending","failed"].includes(x.state)&&!remoteIds.has(x.id));\n      state.messages[groupId]=[...rows,...pending];','    onRows:async (rows,meta={})=>{\n      const existing=state.messages[groupId]||[];\n      const outboxIds=(await getOutboxRecords()).map(x=>x.id);\n      const projection=planAuthoritativeMessageProjection({existingRows:existing,remoteRows:rows,snapshotMeta:meta,outboxMessageIds:outboxIds});\n      if(projection.authoritative&&projection.purgeMessageIds.length)await purgeLocalDisappearingMessageTraces(firebaseUser.uid,projection.purgeMessageIds);\n      state.messages[groupId]=[...projection.rows];')
replace('app.js','        remote.push({id:m.id,mine:m.senderUid===firebaseUser.uid,sender:m.senderName||"",text,time:m.timeLabel||"",state:m.state||"sent",cloud:true,e2ee:!!m.e2ee,senderDeviceId:m.senderDeviceId||null});','        remote.push({id:m.id,mine:m.senderUid===firebaseUser.uid,sender:m.senderName||"",text,time:m.timeLabel||"",state:m.state||"sent",cloud:true,e2ee:!!m.e2ee,senderDeviceId:m.senderDeviceId||null,disappearAfterSeconds:m.disappearAfterSeconds??null});')
start='      let merged;\n\n      if(meta.fromCache){'
end='        merged=[...remote,...localPending];\n      }\n\n      state.messages[conversationId]=merged;'
s=Path('app.js').read_text(); a=s.find(start); b=s.find(end,a)
if a<0 or b<0: raise SystemExit('direct projection block anchors missing')
b += len(end)
new='      const outboxIds=(await getOutboxRecords()).map(x=>x.id);\n      const projection=planAuthoritativeMessageProjection({existingRows:existing,remoteRows:remote,snapshotMeta:meta,outboxMessageIds:outboxIds});\n      if(projection.authoritative&&projection.purgeMessageIds.length)await purgeLocalDisappearingMessageTraces(firebaseUser.uid,projection.purgeMessageIds);\n      const merged=[...projection.rows];\n      state.messages[conversationId]=merged;'
Path('app.js').write_text(s[:a]+new+s[b:])

replace('firebase.js','const snap=await s.fsSdk.getDocs(q);return snap.docs.map(d=>({id:d.id,...d.data()}));}\nexport async function readCloudGroupHistoryGrantCopies','const snap=await s.fsSdk.getDocsFromServer(q);return snap.docs.map(d=>({id:d.id,...d.data()}));}\nexport async function readCloudGroupHistoryGrantCopies')
replace('firebase.js','const grantSnap=await s.fsSdk.getDoc(s.fsSdk.doc(s.db,"groups",gid,"historyGrants",id));if(!grantSnap.exists()||grantSnap.data().status!=="active"||grantSnap.data().targetUid!==authUser.uid)throw new Error("Active history grant is not available to this account.");const q=s.fsSdk.query(s.fsSdk.collection(s.db,"groups",gid,"historyGrants",id,"messages"),s.fsSdk.orderBy("sourceCreatedAt","asc"));const snap=await s.fsSdk.getDocs(q);','const grantSnap=await s.fsSdk.getDocFromServer(s.fsSdk.doc(s.db,"groups",gid,"historyGrants",id));if(!grantSnap.exists()||grantSnap.data().status!=="active"||grantSnap.data().targetUid!==authUser.uid)throw new Error("Active history grant is not available to this account.");const q=s.fsSdk.query(s.fsSdk.collection(s.db,"groups",gid,"historyGrants",id,"messages"),s.fsSdk.orderBy("sourceCreatedAt","asc"));const snap=await s.fsSdk.getDocsFromServer(q);')

replace('e2ee-account-group-conversation.test.mjs',"  'isOpen()?\"read\":\"delivered\"'","  'isOpen()?\"read\":\"delivered\"',\n  'disappearAfterSeconds:row.disappearAfterSeconds??null',\n  'onRows?.(merged,snapshotMeta)',\n  'meta.fromCache===true'")

Path('version.js').write_text('globalThis.FIDUNIO_RELEASE = Object.freeze({version: "0.9.6.23"});\n')
print('0.9.6.23 authoritative projection wiring materialized')
