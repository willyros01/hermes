from pathlib import Path
import json,re,shutil


def replace_once(path,old,new):
    p=Path(path); s=p.read_text();
    if s.count(old)!=1: raise AssertionError(f'{path}: expected one anchor, got {s.count(old)}')
    p.write_text(s.replace(old,new,1))

def prepend_after_title(path,title,block):
    p=Path(path); s=p.read_text()
    marker=block.splitlines()[0]
    if marker in s:return
    if not s.startswith(title):raise AssertionError(f'{path}: title mismatch')
    p.write_text(title+'\n\n'+block+'\n\n'+s[len(title):].lstrip())

# 1) Activation marker belongs only to real text payloads. Attachments are deliberately excluded.
p=Path('disappearing-compose-policy.js'); s=p.read_text()
old='''export function stampOutgoingDisappearSelection(message,value){\n  const duration=resolveComposeDisappearSelection(value);\n  // Expiry is stamped once, while the application row remains mutable for\n  // the sole Outbox owner's Queued/Sending/Sent receipt transitions.\n  return duration==null?{...message}:{...message,disappearAfterSeconds:duration};\n}'''
new='''export const DISAPPEARING_PURGE_VERSION=1;\nfunction isAttachmentPayload(text){\n  if(typeof text!=="string"||!text.trimStart().startsWith("{"))return false;\n  try{return JSON.parse(text)?.fidunioAttachment===1;}catch{return false;}\n}\nexport function disappearingPurgeVersionForOutgoing({text,value}={}){\n  const duration=resolveComposeDisappearSelection(value);\n  return duration!=null&&!isAttachmentPayload(text)?DISAPPEARING_PURGE_VERSION:null;\n}\nexport function stampOutgoingDisappearSelection(message,value){\n  const duration=resolveComposeDisappearSelection(value);\n  // Activation 0.9.9.12 is text-only. Attachment Storage deletion is a\n  // separate server trace resource and must not be implied by this timer.\n  if(duration==null||isAttachmentPayload(message?.text))return {...message};\n  return {...message,disappearAfterSeconds:duration,disappearingPurgeVersion:DISAPPEARING_PURGE_VERSION};\n}'''
if s.count(old)!=1: raise AssertionError('compose stamp anchor changed')
p.write_text(s.replace(old,new,1))

# 2) Direct Outbox carries the activation marker through the existing encrypted local owner.
p=Path('app.js'); s=p.read_text()
s=s.replace('''    disappearAfterSeconds:message.disappearAfterSeconds??null,\n    cloud:!!message.cloud,''','''    disappearAfterSeconds:message.disappearAfterSeconds??null,\n    disappearingPurgeVersion:message.disappearingPurgeVersion??null,\n    cloud:!!message.cloud,''',1)
s=s.replace('''      disappearAfterSeconds:payload.disappearAfterSeconds??null,\n      serverBacked:false''','''      disappearAfterSeconds:payload.disappearAfterSeconds??null,\n      disappearingPurgeVersion:payload.disappearingPurgeVersion??null,\n      serverBacked:false''',1)
s=s.replace('''senderDeviceId:m.senderDeviceId||null,disappearAfterSeconds:m.disappearAfterSeconds??null});''','''senderDeviceId:m.senderDeviceId||null,disappearAfterSeconds:m.disappearAfterSeconds??null,disappearingPurgeVersion:m.disappearingPurgeVersion??null});''',1)
s=s.replace('''<label for="disappearSelect">Disappearing:</label>''','''<label for="disappearSelect">Disappearing text:</label>''',1)
# Pass marker into account-v3 prepare call without coupling crypto to policy.
pat=re.compile(r'prepareAccountDirectMessage\(\{([^{}]*?text\s*:\s*payload\.text[^{}]*?)\}\)',re.S)
m=pat.search(s)
if not m: raise AssertionError('direct prepareAccountDirectMessage payload anchor not found')
body=m.group(1)
if 'disappearingPurgeVersion' not in body:
    body=body.rstrip()+',disappearingPurgeVersion:payload.disappearingPurgeVersion??null'
    s=s[:m.start()]+f'prepareAccountDirectMessage({{{body}}})'+s[m.end():]
p.write_text(s)

# 3) Direct account E2EE service carries opaque outer activation metadata without changing ciphertext format.
replace_once('e2ee-account-message-service.js',
'''  async function prepareOutgoing({uid,peerUid,conversationId,messageId,text}){''',
'''  async function prepareOutgoing({uid,peerUid,conversationId,messageId,text,disappearingPurgeVersion=null}){''')
replace_once('e2ee-account-message-service.js',
'''    return Object.freeze({...envelope});''',
'''    return Object.freeze({...envelope,...(disappearingPurgeVersion===1?{disappearingPurgeVersion:1}:{})});''')

# 4) firebase.js writes the marker only when the prepared/send owner explicitly carries v1.
p=Path('firebase.js'); s=p.read_text()
s=s.replace('''if(disappearAfterSeconds!==null)row.disappearAfterSeconds=disappearAfterSeconds;if(message.senderDeviceId)''','''if(disappearAfterSeconds!==null)row.disappearAfterSeconds=disappearAfterSeconds;if(message.disappearingPurgeVersion===1&&disappearAfterSeconds!==null)row.disappearingPurgeVersion=1;if(message.senderDeviceId)''',1)
s=s.replace('''export async function sendCloudEncryptedGroupMessage({groupId,messageId,envelope,disappearAfterSeconds=null})''','''export async function sendCloudEncryptedGroupMessage({groupId,messageId,envelope,disappearAfterSeconds=null,disappearingPurgeVersion=null})''',1)
s=s.replace('''if(duration!==null)row.disappearAfterSeconds=duration;await s.fsSdk.setDoc(s.fsSdk.doc(s.db,"groups",groupId,"messages",messageId),row);''','''if(duration!==null)row.disappearAfterSeconds=duration;if(disappearingPurgeVersion===1&&duration!==null)row.disappearingPurgeVersion=1;await s.fsSdk.setDoc(s.fsSdk.doc(s.db,"groups",groupId,"messages",messageId),row);''',1)
p.write_text(s)

# 5) Group plaintext Outbox computes the same text-only marker and carries it through the one existing group send owner.
p=Path('e2ee-account-group-outbox.js'); s=p.read_text()
s=s.replace('''import {normalizeDisappearSelection} from "./disappearing-content-policy.js";''','''import {normalizeDisappearSelection} from "./disappearing-content-policy.js";\nimport {disappearingPurgeVersionForOutgoing} from "./disappearing-compose-policy.js";''',1)
s=s.replace('''return{kind:"group-e2ee-v1",groupId:String(groupId),messageId:String(messageId),text:String(text),expectedKeyEpoch:Number(epoch.authority?.keyEpoch),disappearAfterSeconds:duration};''','''return{kind:"group-e2ee-v1",groupId:String(groupId),messageId:String(messageId),text:String(text),expectedKeyEpoch:Number(epoch.authority?.keyEpoch),disappearAfterSeconds:duration,disappearingPurgeVersion:disappearingPurgeVersionForOutgoing({text:String(text),value:duration})};''',1)
s=s.replace('''const result=await sendAccountGroupMessage({groupId:payload.groupId,messageId:payload.messageId,text:payload.text,disappearAfterSeconds:payload.disappearAfterSeconds??null});''','''const result=await sendAccountGroupMessage({groupId:payload.groupId,messageId:payload.messageId,text:payload.text,disappearAfterSeconds:payload.disappearAfterSeconds??null,disappearingPurgeVersion:payload.disappearingPurgeVersion??null});''',1)
p.write_text(s)
replace_once('e2ee-account-group-service.js',
'''export function sendAccountGroupMessage({groupId,messageId,text,disappearAfterSeconds=null}){return runtime.send({groupId,messageId,text,disappearAfterSeconds});}''',
'''export function sendAccountGroupMessage({groupId,messageId,text,disappearAfterSeconds=null,disappearingPurgeVersion=null}){return runtime.send({groupId,messageId,text,disappearAfterSeconds,disappearingPurgeVersion});}''')
p=Path('e2ee-account-group-runtime.js'); s=p.read_text()
s=s.replace('''async function send({groupId,messageId,text:body,disappearAfterSeconds=null})''','''async function send({groupId,messageId,text:body,disappearAfterSeconds=null,disappearingPurgeVersion=null})''',1)
s=s.replace('''await transport.sendEncryptedGroupMessage({groupId,messageId,senderUid:id.uid,envelope,disappearAfterSeconds:duration});return{messageId,keyEpoch:a.keyEpoch,disappearAfterSeconds:duration};''','''await transport.sendEncryptedGroupMessage({groupId,messageId,senderUid:id.uid,envelope,disappearAfterSeconds:duration,disappearingPurgeVersion:disappearingPurgeVersion===1?1:null});return{messageId,keyEpoch:a.keyEpoch,disappearAfterSeconds:duration,disappearingPurgeVersion:disappearingPurgeVersion===1?1:null};''',1)
p.write_text(s)

# 6) Firestore Rules: marker is optional, exact, immutable through receipt-only updates, and requires a duration.
p=Path('firestore.rules'); s=p.read_text()
s=s.replace('''"iv","disappearAfterSeconds"]) && (!("disappearAfterSeconds" in d)||(d.disappearAfterSeconds is int&&d.disappearAfterSeconds>=1&&d.disappearAfterSeconds<=31536000))''','''"iv","disappearAfterSeconds","disappearingPurgeVersion"]) && (!("disappearAfterSeconds" in d)||(d.disappearAfterSeconds is int&&d.disappearAfterSeconds>=1&&d.disappearAfterSeconds<=31536000)) && (!("disappearingPurgeVersion" in d)||(d.disappearingPurgeVersion==1&&("disappearAfterSeconds" in d)))''',1)
s=s.replace('''"timeLabel","disappearAfterSeconds","receiptRevision"]) && d.receiptRevision==0 && (!("disappearAfterSeconds" in d)||(d.disappearAfterSeconds is int&&d.disappearAfterSeconds>=1&&d.disappearAfterSeconds<=31536000))''','''"timeLabel","disappearAfterSeconds","receiptRevision","disappearingPurgeVersion"]) && d.receiptRevision==0 && (!("disappearAfterSeconds" in d)||(d.disappearAfterSeconds is int&&d.disappearAfterSeconds>=1&&d.disappearAfterSeconds<=31536000)) && (!("disappearingPurgeVersion" in d)||(d.disappearingPurgeVersion==1&&("disappearAfterSeconds" in d)))''',1)
p.write_text(s)

# 7) Functions deployment mirror: root remains review authority; byte-for-byte mirror is gated.
d=Path('functions/disappearing');d.mkdir(parents=True,exist_ok=True)
for name in ['disappearing-purge-policy.js','disappearing-purge-executor.js','disappearing-purge-firestore-admin-adapter.mjs','disappearing-group-grant-trace-plan.js']:
    shutil.copyfile(name,d/name)

Path('functions/disappearing/disappearing-scheduler-core.mjs').write_text(r'''export function classifyDisappearingMessagePath(path){
  const p=String(path||'').split('/');
  if(p.length!==4||p[2]!=='messages')return null;
  if(p[0]==='conversations')return Object.freeze({kind:'direct',conversationId:p[1],messageId:p[3]});
  if(p[0]==='groups')return Object.freeze({kind:'group',groupId:p[1],messageId:p[3]});
  return null;
}
export async function runDisappearingPurgeSweep({db,executor,limit=200,logger=console}={}){
  if(!db?.collectionGroup||!executor?.purgeDirect||!executor?.purgeGroup)throw new Error('Disappearing scheduler dependencies are incomplete.');
  const bounded=Math.max(1,Math.min(500,Number(limit)||200));
  const snap=await db.collectionGroup('messages').where('disappearingPurgeVersion','==',1).limit(bounded).get();
  const result={examined:0,purged:0,retained:0,deferred:0,ignored:0};
  for(const doc of snap.docs||[]){
    const target=classifyDisappearingMessagePath(doc.ref?.path);if(!target){result.ignored++;continue;}
    result.examined++;
    try{
      const out=target.kind==='direct'?await executor.purgeDirect(target):await executor.purgeGroup(target);
      if(out?.purged)result.purged++;else result.retained++;
    }catch(error){
      if(['STALE_PURGE_BASIS','PURGE_TRACE_TOO_LARGE'].includes(String(error?.code||''))){result.deferred++;logger.warn?.('FIDUNIO disappearing purge deferred',{path:doc.ref?.path,code:error.code});continue;}
      logger.error?.('FIDUNIO disappearing purge candidate failed',{path:doc.ref?.path,code:error?.code||'INTERNAL',message:error?.message||String(error)});throw error;
    }
  }
  return Object.freeze(result);
}
''')

# 8) Export scheduled Function. Server/Admin initializer remains functions/index.mjs only.
p=Path('functions/index.mjs'); s=p.read_text()
s=s.replace('''import { onCall, HttpsError } from "firebase-functions/v2/https";''','''import { onCall, HttpsError } from "firebase-functions/v2/https";\nimport { onSchedule } from "firebase-functions/v2/scheduler";''',1)
s=s.replace('''import { createMessageDeleteAdminRepositories } from "./message-delete/message-delete-firestore-admin-adapter.mjs";''','''import { createMessageDeleteAdminRepositories } from "./message-delete/message-delete-firestore-admin-adapter.mjs";\nimport { createDisappearingPurgeExecutor } from "./disappearing/disappearing-purge-executor.js";\nimport { createDisappearingPurgeFirestoreAdminRepository } from "./disappearing/disappearing-purge-firestore-admin-adapter.mjs";\nimport { runDisappearingPurgeSweep } from "./disappearing/disappearing-scheduler-core.mjs";''',1)
s=s.replace('''const MESSAGE_DELETE_SERVICE_ACCOUNT = "fidunio-message-delete@fidunio-fef13.iam.gserviceaccount.com";''','''const MESSAGE_DELETE_SERVICE_ACCOUNT = "fidunio-message-delete@fidunio-fef13.iam.gserviceaccount.com";\nconst DISAPPEARING_PURGE_SERVICE_ACCOUNT = "fidunio-disappearing-purge@fidunio-fef13.iam.gserviceaccount.com";''',1)
s=s.replace('''const {messageRepo,attachmentRepo}=createMessageDeleteAdminRepositories({db,bucket:getStorage().bucket(ATTACHMENT_BUCKET)});''','''const {messageRepo,attachmentRepo}=createMessageDeleteAdminRepositories({db,bucket:getStorage().bucket(ATTACHMENT_BUCKET)});\nconst disappearingPurgeRepository=createDisappearingPurgeFirestoreAdminRepository({db});\nconst disappearingPurgeExecutor=createDisappearingPurgeExecutor({repository:disappearingPurgeRepository,serverNow:()=>new Date()});''',1)
s += '''\n\nexport const purgeDisappearingMessagesV1 = onSchedule(\n  {\n    region:"us-central1",\n    schedule:"every 1 minutes",\n    timeZone:"UTC",\n    serviceAccount:DISAPPEARING_PURGE_SERVICE_ACCOUNT,\n    timeoutSeconds:120,\n    memory:"256MiB"\n  },\n  async()=>runDisappearingPurgeSweep({db,executor:disappearingPurgeExecutor,limit:200})\n);\n'''
p.write_text(s)

# 9) Focused permanent gates.
Path('disappearing-activation.test.mjs').write_text(r'''import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stampOutgoingDisappearSelection,disappearingPurgeVersionForOutgoing} from './disappearing-compose-policy.js';
import {classifyDisappearingMessagePath,runDisappearingPurgeSweep} from './functions/disappearing/disappearing-scheduler-core.mjs';
assert.equal(disappearingPurgeVersionForOutgoing({text:'hello',value:300}),1);
assert.equal(stampOutgoingDisappearSelection({text:'hello'},300).disappearingPurgeVersion,1);
const attachment=JSON.stringify({fidunioAttachment:1,attachmentId:'a'});
assert.equal(disappearingPurgeVersionForOutgoing({text:attachment,value:300}),null);
assert.equal(stampOutgoingDisappearSelection({text:attachment},300).disappearAfterSeconds,undefined);
assert.deepEqual(classifyDisappearingMessagePath('conversations/c1/messages/m1'),{kind:'direct',conversationId:'c1',messageId:'m1'});
assert.deepEqual(classifyDisappearingMessagePath('groups/g1/messages/m2'),{kind:'group',groupId:'g1',messageId:'m2'});
assert.equal(classifyDisappearingMessagePath('groups/g1/historyGrants/h/messages/m2'),null);
let direct=0,group=0;
const docs=[{ref:{path:'conversations/c1/messages/m1'}},{ref:{path:'groups/g1/messages/m2'}},{ref:{path:'groups/g1/historyGrants/h/messages/m3'}}];
const db={collectionGroup(){return{where(field,op,value){assert.deepEqual([field,op,value],['disappearingPurgeVersion','==',1]);return{limit(n){assert.equal(n,200);return{async get(){return{docs};}};}};}};}};
const executor={async purgeDirect(){direct++;return{purged:true};},async purgeGroup(){group++;return{purged:false};}};
const r=await runDisappearingPurgeSweep({db,executor});assert.equal(direct,1);assert.equal(group,1);assert.deepEqual(r,{examined:2,purged:1,retained:1,deferred:0,ignored:1});
const app=readFileSync('app.js','utf8'),fb=readFileSync('firebase.js','utf8'),rules=readFileSync('firestore.rules','utf8'),fn=readFileSync('functions/index.mjs','utf8');
assert.match(app,/Disappearing text:/);assert.match(app,/disappearingPurgeVersion:message\.disappearingPurgeVersion/);
assert.match(fb,/row\.disappearingPurgeVersion=1/);assert.match(rules,/disappearingPurgeVersion/);
assert.match(fn,/purgeDisappearingMessagesV1/);assert.match(fn,/every 1 minutes/);
for(const n of ['disappearing-purge-policy.js','disappearing-purge-executor.js','disappearing-purge-firestore-admin-adapter.mjs','disappearing-group-grant-trace-plan.js'])assert.equal(readFileSync(n,'utf8'),readFileSync('functions/disappearing/'+n,'utf8'),n+' deployment mirror drifted');
console.log('Disappearing-message activation gate passed');
''')

pkg=Path('package.json'); data=json.loads(pkg.read_text());data.setdefault('scripts',{})['test:disappearing-activation']='node disappearing-activation.test.mjs';pkg.write_text(json.dumps(data,separators=(',',':')))

# 10) Release + cache.
replace_once('version.js','0.9.9.11','0.9.9.12')
p=Path('service-worker.js'); s=p.read_text();
m=re.search(r'const SHELL_REVISION="([^"]+)"',s)
if not m: raise AssertionError('service worker revision not found')
s=s[:m.start(1)]+'0.9.9.12-disappearing-text-activation'+s[m.end(1):]
if './disappearing-compose-policy.js' not in s: raise AssertionError('compose policy not cached')
p.write_text(s)
# release-coupled source tests
for name in ['outbox-reconciliation-boundary.test.mjs','direct-message-basic-path.test.mjs']:
    q=Path(name); x=q.read_text();x=re.sub(r'0\\\.9\\\.9\\\.(?:9z|10|11)[^"/]*',r'0\\.9\\.9\\.12-disappearing-text-activation',x);q.write_text(x)

# 11) Durable docs.
section='''### Disappearing text activation — 0.9.9.12\n\n**Status: REPOSITORY CANDIDATE; LIVE SCHEDULER DEPLOYMENT REQUIRED.**\n\nThe previously visible compose selector had policy, immutable metadata, server eligibility, physical Firestore purge repositories, authoritative local convergence and reconnect anti-resurrection foundations, but no scheduled server owner was deployed. 0.9.9.12 adds the missing scheduled Function owner `purgeDisappearingMessagesV1`. Only newly created text messages explicitly stamped `disappearingPurgeVersion: 1` are discoverable by the scheduler. This is an activation boundary: old pre-activation rows and attachment descriptors are intentionally excluded. The scheduler runs from server time, invokes the existing serialized purge executor/revalidated repository path, and never authorizes deletion from a browser clock. Attachments remain non-disappearing in this activation build until Storage trace deletion can satisfy the source-delete-last contract. Live Firebase rules/Function/IAM remain unchanged until the reviewed deployment handoff is run and verified.'''
prepend_after_title('CURRENT-REBUILD.md','# FIDUNIO Current Rebuild — Recovery Entry Point',section)
prepend_after_title('BUG-LIST.md','# FIDUNIO / Hermes Bug List',section)
prepend_after_title('README.md','# FIDUNIO / Hermes',section)
mem='''### DISAPPEARING TEXT ACTIVATION — 0.9.9.12\n\nDisappearing text is activated only through the binding `DISAPPEARING-PURGE-AUTHORITY.md` ownership path. New text rows receive `disappearingPurgeVersion: 1`; pre-activation rows and attachments do not. `purgeDisappearingMessagesV1` is the only scheduled server discovery owner and calls the existing purge executor/revalidated server repository. Browser clocks and client delete rules remain prohibited. Before any future disappearing-content change, reread `DISAPPEARING-PURGE-AUTHORITY.md` plus the normal mandatory architecture documents. Attachment disappearance remains intentionally unactivated until server Storage deletion can satisfy the trace-free source-delete-last contract. Repository code does not equal live activation: live rules, dedicated purge IAM and scheduled Function must be deployed and verified through the controlled Firebase handoff.'''
p=Path('hermes-memory.txt');s=p.read_text();anchor='CUMULATIVE PROJECT MEMORY\n';assert anchor in s
if '### DISAPPEARING TEXT ACTIVATION — 0.9.9.12' not in s:p.write_text(s.replace(anchor,anchor+'\n'+mem+'\n\n',1))
check='''### Disappearing text activation — 0.9.9.12\n\n- [x] Preserve server-time-only eligibility and the existing single purge executor/repository path.\n- [x] Add explicit activation marker `disappearingPurgeVersion: 1` only to newly sent disappearing text.\n- [x] Exclude pre-activation rows and attachment payloads from scheduler discovery.\n- [x] Add scheduled server discovery owner `purgeDisappearingMessagesV1` (one-minute sweep).\n- [x] Preserve direct/group first-Read duration semantics and authoritative local anti-resurrection convergence.\n- [x] Extend exact Firestore create schemas for the bounded optional activation marker.\n- [x] Add permanent disappearing activation gate and deployment-mirror drift gate.\n- [ ] Deploy/verify reviewed Firestore rules, dedicated purge IAM, and scheduled Function to live `fidunio-fef13`.\n- [ ] Device-confirm direct 5-minute disappearing text from Read -> physical absence on sender and recipient.\n- [ ] Device-confirm group 5-minute disappearing text with all entitled recipients Read -> physical absence.\n- [ ] Device-confirm unread message does not disappear and offline/reopen does not resurrect a purged message.\n- [ ] Attachment disappearing remains NOT ACTIVE until server Storage trace cleanup meets the source-delete-last contract.'''
prepend_after_title('FIDUNIO-BUILD-CHECKLIST.md','# FIDUNIO Complete Rebuild — Authoritative Build Checklist',check)
# Authority docs
for path,title in [('RUNTIME-AUTHORITY-MAP.md','# FIDUNIO Runtime Authority Map'),('architecture-ownership.txt','FIDUNIO / HERMES ARCHITECTURE OWNERSHIP RULES')]:
    block='''## 0.9.9.12 disappearing text activation owner\n`purgeDisappearingMessagesV1` is the sole scheduled discovery trigger. It discovers only exact direct/group message documents carrying `disappearingPurgeVersion: 1`, then delegates eligibility/serialization to `disappearing-purge-executor.js` and physical Firestore mutation to `disappearing-purge-firestore-admin-adapter.mjs`. Server time is mandatory. The marker is stamped only on newly sent text; attachments and pre-activation rows are excluded. `app.js` remains sole UID-local physical convergence/Outbox owner. No client delete rule, tombstone, second Firebase owner, or service-worker semantic owner is introduced.'''
    prepend_after_title(path,title,block)
# Append binding activation section to purge authority.
p=Path('DISAPPEARING-PURGE-AUTHORITY.md');s=p.read_text();block='''\n## Activation checkpoint — 0.9.9.12\n\nThe first live-capable scheduler is `purgeDisappearingMessagesV1`. It may discover only exact `conversations/{id}/messages/{id}` and `groups/{id}/messages/{id}` rows carrying `disappearingPurgeVersion: 1`. That marker is an explicit activation boundary, not expiry authority: eligibility remains exclusively in the existing pure purge policy using authoritative first-Read state and server time. The scheduler delegates all mutation to the existing executor/revalidated repository.\n\nOnly new text payloads receive marker v1. Pre-activation rows are not retroactively swept. Attachment payloads receive neither the marker nor disappearing duration in this checkpoint because Storage-object deletion cannot yet satisfy this document's source-delete-last trace contract under concurrent authority changes. This restriction is deliberate fail-closed behavior, not a change to future product intent.\n\nRepository implementation does not activate production by itself. Live activation requires reviewed Firestore rules, dedicated `fidunio-disappearing-purge` service account/IAM, Function deployment, and verification.''' 
if '## Activation checkpoint — 0.9.9.12' not in s:p.write_text(s.rstrip()+block+'\n')

print('disappearing activation patch prepared')
