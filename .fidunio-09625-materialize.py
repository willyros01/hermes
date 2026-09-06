from pathlib import Path

# app.js — preserve app.js as the sole local mutation/controller owner.
p=Path('app.js'); s=p.read_text()
s=s.replace('  subscribeMyGroups\n} from "./firebase.js";','  subscribeMyGroups,\n  readCloudMessageIdsFromServer,\n  readCloudGroupMessageIdsFromServer\n} from "./firebase.js";')
s=s.replace('import { planAuthoritativeMessageProjection } from "./disappearing-authoritative-projection.js";','import { planAuthoritativeMessageProjection } from "./disappearing-authoritative-projection.js";\nimport { planReconnectOutboxConvergence } from "./disappearing-reconnect-recovery.js";')
s=s.replace('let localPurgeTail=Promise.resolve();','let localPurgeTail=Promise.resolve();\nlet reconnectRecoveryTail=Promise.resolve();')
anchor='async function flushQueued(){\n  if(!state.online) return;'
insert='''function serializeReconnectRecovery(work){\n  const run=reconnectRecoveryTail.then(work,work);\n  reconnectRecoveryTail=run.catch(()=>{});\n  return run;\n}\nasync function reconcileOutboxBeforeReplay(){\n  if(!state.online||!firebaseUser)return{acceptedOutboxDeleteIds:[],purgeMessageIds:[],replayMessageIds:[],blockedMessageIds:[]};\n  return serializeReconnectRecovery(async()=>{\n    const records=await getOutboxRecords();\n    const decoded=[];\n    const authoritativeRemoteIdsByConversation={};\n    const authorityKind=new Map();\n    for(const record of records){\n      let payload;\n      try{payload=await decryptOutboxRecord(record);}catch(err){console.warn("Reconnect Outbox decrypt failed; replay blocked",record?.id,err);continue;}\n      const conversationId=String(payload.conversationId||"");\n      const isGroup=payload.kind==="group-e2ee-v1";\n      const isCloud=isGroup||payload.cloud===true;\n      if(!isCloud||!conversationId)continue;\n      decoded.push({id:record.id,messageId:payload.messageId||record.id,conversationId,groupId:isGroup?conversationId:null});\n      authorityKind.set(conversationId,isGroup?"group":"direct");\n    }\n    for(const [conversationId,kind] of authorityKind){\n      authoritativeRemoteIdsByConversation[conversationId]=kind==="group"\n        ?await readCloudGroupMessageIdsFromServer(conversationId)\n        :await readCloudMessageIdsFromServer(conversationId,firebaseUser.uid);\n    }\n    const plan=planReconnectOutboxConvergence({messagesByConversation:state.messages,outboxRecords:decoded,authoritativeRemoteIdsByConversation});\n    for(const id of plan.acceptedOutboxDeleteIds){\n      for(const list of Object.values(state.messages)){\n        const row=Array.isArray(list)?list.find(x=>String(x?.id)===String(id)):null;\n        if(row){row.serverBacked=true;if(["queued","sending","failed"].includes(row.state))row.state="sent";}\n      }\n      await removeOutboxMessage(id);\n    }\n    if(plan.purgeMessageIds.length)await purgeLocalDisappearingMessageTraces(firebaseUser.uid,plan.purgeMessageIds);\n    await persistState();\n    return plan;\n  });\n}\nasync function flushQueuedAfterAuthoritativeReconcile(){\n  if(!state.online||!firebaseUser)return;\n  try{\n    const plan=await reconcileOutboxBeforeReplay();\n    return flushQueued({allowedCloudMessageIds:new Set(plan.replayMessageIds)});\n  }catch(err){\n    firebaseError=err?.message||String(err);\n    console.warn("Authoritative reconnect reconciliation failed; cloud Outbox replay blocked",err);\n  }\n}\nasync function flushQueued({allowedCloudMessageIds=null}={}){\n  if(!state.online) return;'''
if anchor not in s: raise SystemExit('flushQueued anchor missing')
s=s.replace(anchor,insert,1)
s=s.replace('    const isCloud=payload.cloud || !!c?.cloud || isGroupPayload;\n\n    if(isGroupPayload){','    const isCloud=payload.cloud || !!c?.cloud || isGroupPayload;\n    if(isCloud&&allowedCloudMessageIds instanceof Set&&!allowedCloudMessageIds.has(String(payload.messageId))){\n      m.state="queued";\n      await persistState();\n      continue;\n    }\n\n    if(isGroupPayload){',1)
s=s.replace('      await flushQueued();\n    }else{','      await flushQueuedAfterAuthoritativeReconcile();\n    }else{',1)
s=s.replace('  // iOS/Safari may fire "online" slightly before Firebase can complete a\n  // request. Flush now, then make two conservative retries. Outbox\n  // idempotency keeps this safe; successful records are removed only after\n  // Firestore confirms the write.\n  flushQueued();','  // Every cloud replay first performs an explicit server read. Known\n  // server-accepted rows have their stale Outbox copy removed; known\n  // server-backed disappearing rows that are now absent are purged before\n  // any retry. Cache-only state never authorizes replay or purge.\n  flushQueuedAfterAuthoritativeReconcile();',1)
s=s.replace('    if(state.online && firebaseUser) flushQueued();','    if(state.online && firebaseUser) flushQueuedAfterAuthoritativeReconcile();')
s=s.replace('  initializeFirebaseLayer();\n  if(state.online) flushQueued();','  initializeFirebaseLayer();')
p.write_text(s)

# firebase.js — sole client Firebase owner adds explicit server-only message-ID probes.
p=Path('firebase.js'); s=p.read_text()
append='''\n\n// Restart/reconnect anti-resurrection probes. These functions deliberately use\n// Firestore server reads rather than cache reads; they expose only current source\n// message IDs to the app controller and do not mutate Firebase state.\nexport async function readCloudMessageIdsFromServer(conversationId,myUid){const s=await ensureServices();if(!authUser||authUser.uid!==myUid)throw new Error("Sign in first.");const cid=String(conversationId||"").trim();if(!cid)throw new Error("Conversation is required.");const conv=await s.fsSdk.getDocFromServer(s.fsSdk.doc(s.db,"conversations",cid));if(!conv.exists())throw new Error("Conversation is not available to this account.");const members=Array.isArray(conv.data().members)?conv.data().members:[];if(!members.includes(myUid))throw new Error("Conversation is not available to this account.");const snap=await s.fsSdk.getDocsFromServer(s.fsSdk.collection(s.db,"conversations",cid,"messages"));return snap.docs.map(d=>d.id);}\nexport async function readCloudGroupMessageIdsFromServer(groupId){const s=await ensureServices();if(!authUser)throw new Error("Sign in first.");const gid=String(groupId||"").trim();if(!gid)throw new Error("Group is required.");const group=await s.fsSdk.getDocFromServer(s.fsSdk.doc(s.db,"groups",gid));if(!group.exists())throw new Error("Group is not available to this account.");const members=Array.isArray(group.data().memberUids)?group.data().memberUids:[];if(!members.includes(authUser.uid))throw new Error("Group is not available to this account.");const snap=await s.fsSdk.getDocsFromServer(s.fsSdk.collection(s.db,"groups",gid,"messages"));return snap.docs.map(d=>d.id);}\n'''
if 'export async function readCloudMessageIdsFromServer' not in s:s=s.rstrip()+append
p.write_text(s)

# package.json
p=Path('package.json'); s=p.read_text()
needle='"test:disappearing-local-storage":"node disappearing-local-storage-plan.test.mjs"'
if needle not in s: raise SystemExit('package script anchor missing')
s=s.replace(needle,needle+',"test:disappearing-reconnect-recovery":"node disappearing-reconnect-recovery.test.mjs"')
p.write_text(s)

# Permanent normal baseline gate.
p=Path('.github/workflows/rebuild-baseline-security.yml'); s=p.read_text()
anchor='''      - name: Disappearing local physical purge wiring\n        run: npm run test:disappearing-local-storage\n'''
if anchor not in s: raise SystemExit('workflow anchor missing')
addition=anchor+'''      - name: Disappearing restart reconnect recovery\n        run: npm run test:disappearing-reconnect-recovery\n'''
s=s.replace(anchor,addition,1)
p.write_text(s)

# Materialized build number, but 0.9.6.25 remains IN PROGRESS until the crash-gap decision is resolved.
p=Path('version.js'); s=p.read_text(); s=s.replace('version: "0.9.6.24"','version: "0.9.6.25"'); p.write_text(s)
print('0.9.6.25 reconnect barrier materialized')
