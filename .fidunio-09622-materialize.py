from pathlib import Path
import json

app=Path('app.js'); s=app.read_text()
anchor='import { queueGroupTextForApp,flushGroupOutboxForApp,openGroupForApp,closeGroupForApp,resetGroupAppIntegrationForSignOut,renameGroupForApp,addGroupMemberForApp,removeGroupMemberForApp,leaveGroupForApp } from "./e2ee-account-group-app-integration.js";\n'
if 'planPhysicalLocalMessagePurge' not in s:
    s=s.replace(anchor,anchor+'import { planPhysicalLocalMessagePurge } from "./disappearing-local-storage-plan.js";\n',1)
if 'let localPurgeTail=Promise.resolve();' not in s:
    s=s.replace('let persistTimer = null;','let persistTimer = null;\nlet localPurgeTail=Promise.resolve();',1)
old='''      state:"queued",\n      cloud:payload.cloud\n'''
new='''      state:"queued",\n      cloud:payload.cloud,\n      disappearAfterSeconds:payload.disappearAfterSeconds??null,\n      serverBacked:false\n'''
if old in s:s=s.replace(old,new,1)
marker='async function cacheCloudHistory(conversationId,messages){'
if 'async function purgeLocalDisappearingMessageTraces' not in s:
    block=r'''function serializeLocalPurge(work){
  const run=localPurgeTail.then(work,work);
  localPurgeTail=run.catch(()=>{});
  return run;
}
async function purgeLocalDisappearingMessageTraces(uid,messageIds){
  const targetUid=String(uid||"").trim();
  const ids=[...new Set((messageIds||[]).map(x=>String(x||"").trim()).filter(Boolean))];
  if(!targetUid||!firebaseUser||String(firebaseUser.uid)!==targetUid)throw new Error("Active authenticated UID is required for local purge.");
  if(!ids.length)return{purgedMessageIds:[],outboxDeleted:0,historyUpdated:0};
  return serializeLocalPurge(async()=>{
    clearTimeout(persistTimer);persistTimer=null;
    const db=await openDb();
    const historyValues=await idbRequest(db.transaction("history","readonly").objectStore("history").getAll());
    const decoded=[];
    for(const value of historyValues){
      try{decoded.push(await decryptLocal(value));}catch(err){throw new Error("Local history decrypt failed during purge: "+String(err?.message||err));}
    }
    const plan=planPhysicalLocalMessagePurge({messagesByConversation:state.messages,historyRecords:decoded,outboxRecords:await getOutboxRecords(),purgeMessageIds:ids});
    state.messages=plan.messagesByConversation;
    const historyWrites=[];
    for(const record of plan.historyRecords){historyWrites.push({key:String(record.conversationId),value:await encryptLocal(record)});}
    const tx=db.transaction(["history","outbox"],"readwrite"),history=tx.objectStore("history"),outbox=tx.objectStore("outbox");
    for(const row of historyWrites)history.put(row.value,row.key);
    for(const id of plan.outboxDeleteIds)outbox.delete(id);
    await txDone(tx);
    await persistState();
    return{purgedMessageIds:ids,outboxDeleted:plan.outboxDeleteIds.length,historyUpdated:historyWrites.length};
  });
}

'''
    s=s.replace(marker,block+marker,1)
app.write_text(s)

Path('disappearing-local-storage-plan.js').write_text(r'''function ids(values){return new Set((values||[]).map(x=>String(x??"").trim()).filter(Boolean));}
export function planPhysicalLocalMessagePurge({messagesByConversation={},historyRecords=[],outboxRecords=[],purgeMessageIds=[]}={}){
  const purge=ids(purgeMessageIds),messages={};
  for(const [conversationId,rows] of Object.entries(messagesByConversation||{}))messages[conversationId]=(rows||[]).filter(row=>!purge.has(String(row?.id??"")));
  const history=(historyRecords||[]).map(record=>({...record,messages:(record?.messages||[]).filter(row=>!purge.has(String(row?.id??"")))}));
  const outboxDeleteIds=(outboxRecords||[]).filter(row=>purge.has(String(row?.id??""))).map(row=>String(row.id));
  return Object.freeze({messagesByConversation:messages,historyRecords:history,outboxDeleteIds:Object.freeze(outboxDeleteIds)});
}
export const DISAPPEARING_LOCAL_STORAGE_PURGE_V1=Object.freeze({physicalDelete:true,createsTombstones:false,uidScopedCallerRequired:true,serializedOwner:"app.js"});
''')
Path('disappearing-local-storage-plan.test.mjs').write_text(r'''import assert from "node:assert/strict";import fs from "node:fs";import {planPhysicalLocalMessagePurge,DISAPPEARING_LOCAL_STORAGE_PURGE_V1} from "./disappearing-local-storage-plan.js";
const p=planPhysicalLocalMessagePurge({messagesByConversation:{a:[{id:"gone",text:"secret"},{id:"keep"}],b:[{id:"other"}]},historyRecords:[{conversationId:"a",messages:[{id:"gone"},{id:"keep"}]},{conversationId:"b",messages:[{id:"other"}]}],outboxRecords:[{id:"gone"},{id:"pending"}],purgeMessageIds:["gone"]});
assert.deepEqual(p.messagesByConversation,{a:[{id:"keep"}],b:[{id:"other"}]});assert.deepEqual(p.historyRecords,[{conversationId:"a",messages:[{id:"keep"}]},{conversationId:"b",messages:[{id:"other"}]}]);assert.deepEqual(p.outboxDeleteIds,["gone"]);assert.equal(DISAPPEARING_LOCAL_STORAGE_PURGE_V1.createsTombstones,false);
const src=fs.readFileSync("app.js","utf8");assert.match(src,/let localPurgeTail=Promise\.resolve\(\)/);assert.match(src,/serializeLocalPurge/);assert.match(src,/String\(firebaseUser\.uid\)!==targetUid/);assert.match(src,/outbox\.delete\(id\)/);assert.match(src,/await persistState\(\)/);assert.match(src,/disappearAfterSeconds:payload\.disappearAfterSeconds\?\?null/);assert.match(src,/serverBacked:false/);assert.doesNotMatch(src,/expired\s*:\s*true/);console.log("PASS local physical purge wiring, exact retention, UID guard, serialization, no tombstone");
''')

pkg=json.loads(Path('package.json').read_text());pkg['scripts']['test:disappearing-local-storage']='node disappearing-local-storage-plan.test.mjs';Path('package.json').write_text(json.dumps(pkg,separators=(',',':'))+'\n')
wf=Path('.github/workflows/rebuild-baseline-security.yml'); w=wf.read_text(); anchor='      - name: Disappearing local convergence policy\n        run: npm run test:disappearing-local-convergence\n';
if 'Disappearing local physical purge wiring' not in w:w=w.replace(anchor,anchor+'      - name: Disappearing local physical purge wiring\n        run: npm run test:disappearing-local-storage\n',1)
wf.write_text(w)
Path('version.js').write_text('/* FIDUNIO single authoritative release version. Update this file for each new release. */\nglobalThis.FIDUNIO_RELEASE = Object.freeze({\n  version: "0.9.6.22"\n});\n')
print('0.9.6.22 materialized')
