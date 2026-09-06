from pathlib import Path

def read(path): return Path(path).read_text()
def write(path,s): Path(path).write_text(s)
def replace_once(path,old,new):
    s=read(path)
    if old not in s:
        raise SystemExit(f"Missing expected anchor in {path}: {old[:120]!r}")
    write(path,s.replace(old,new,1))
def append_once(path,marker,block):
    s=read(path)
    if marker not in s:
        write(path,s.rstrip()+"\n\n"+block.strip()+"\n")

# 1) Central Firebase transport accepts immutable outer metadata without touching crypto envelopes.
replace_once('firebase.js',
'import { firebaseConfig } from "./firebase-config.js";\n',
'import { firebaseConfig } from "./firebase-config.js";\nimport { normalizeDisappearSelection } from "./disappearing-content-policy.js";\n')
replace_once('firebase.js',
'export async function sendCloudMessage(conversationId,message){const s=await ensureServices();if(!authUser)throw new Error("Sign in first.");const ref=s.fsSdk.doc(s.db,"conversations",conversationId,"messages",message.id);const row={senderUid:authUser.uid,senderName:authUser.displayName||authUser.email||"User",timeLabel:message.timeLabel,state:message.state||"sent",createdAt:s.fsSdk.serverTimestamp()};',
'export async function sendCloudMessage(conversationId,message){const s=await ensureServices();if(!authUser)throw new Error("Sign in first.");const ref=s.fsSdk.doc(s.db,"conversations",conversationId,"messages",message.id);const row={senderUid:authUser.uid,senderName:authUser.displayName||authUser.email||"User",timeLabel:message.timeLabel,state:message.state||"sent",createdAt:s.fsSdk.serverTimestamp()};const disappearAfterSeconds=normalizeDisappearSelection(message.disappearAfterSeconds);if(disappearAfterSeconds!==null)row.disappearAfterSeconds=disappearAfterSeconds;')
replace_once('firebase.js',
'export async function sendCloudEncryptedGroupMessage({groupId,messageId,envelope}){const s=await ensureServices();if(!authUser)throw new Error("Sign in first.");const authority=await readCloudGroupAuthority(groupId);if(Number(envelope?.keyEpoch)!==authority.keyEpoch)throw new Error("Group epoch changed; queued message must be re-encrypted.");if(Number(envelope?.e2ee)!==4||envelope?.groupFormat!=="fidunio-group-message-v1")throw new Error("Invalid encrypted group envelope.");await s.fsSdk.setDoc(s.fsSdk.doc(s.db,"groups",groupId,"messages",messageId),{...envelope,senderUid:authUser.uid,state:"sent",createdAt:s.fsSdk.serverTimestamp()});return{messageId,state:"sent",keyEpoch:authority.keyEpoch};}',
'export async function sendCloudEncryptedGroupMessage({groupId,messageId,envelope,disappearAfterSeconds=null}){const s=await ensureServices();if(!authUser)throw new Error("Sign in first.");const authority=await readCloudGroupAuthority(groupId);if(Number(envelope?.keyEpoch)!==authority.keyEpoch)throw new Error("Group epoch changed; queued message must be re-encrypted.");if(Number(envelope?.e2ee)!==4||envelope?.groupFormat!=="fidunio-group-message-v1")throw new Error("Invalid encrypted group envelope.");const duration=normalizeDisappearSelection(disappearAfterSeconds),row={...envelope,senderUid:authUser.uid,state:"sent",createdAt:s.fsSdk.serverTimestamp()};if(duration!==null)row.disappearAfterSeconds=duration;await s.fsSdk.setDoc(s.fsSdk.doc(s.db,"groups",groupId,"messages",messageId),row);return{messageId,state:"sent",keyEpoch:authority.keyEpoch};}')

# 2) Group runtime/Outbox carry duration as outer message metadata, never inside E2EE envelope.
replace_once('e2ee-account-group-runtime.js',
'import {encryptGroupHistoryGrantMessage,decryptGroupHistoryGrantMessage} from "./e2ee-account-group-history-crypto.js";\n',
'import {encryptGroupHistoryGrantMessage,decryptGroupHistoryGrantMessage} from "./e2ee-account-group-history-crypto.js";\nimport {normalizeDisappearSelection} from "./disappearing-content-policy.js";\n')
replace_once('e2ee-account-group-runtime.js',
'  async function send({groupId,messageId,text:body}){return serial(async()=>{const g=generation,id=identity(),a=await authority(groupId);',
'  async function send({groupId,messageId,text:body,disappearAfterSeconds=null}){return serial(async()=>{const g=generation,id=identity(),a=await authority(groupId);')
replace_once('e2ee-account-group-runtime.js',
'const envelope=await encryptAccountGroupMessage({text:body,groupId,messageId,keyEpoch:a.keyEpoch,senderUid:id.uid,senderKeyId:id.keyId,epochKey});await transport.sendEncryptedGroupMessage({groupId,messageId,senderUid:id.uid,envelope});return{messageId,keyEpoch:a.keyEpoch};',
'const envelope=await encryptAccountGroupMessage({text:body,groupId,messageId,keyEpoch:a.keyEpoch,senderUid:id.uid,senderKeyId:id.keyId,epochKey});const duration=normalizeDisappearSelection(disappearAfterSeconds);await transport.sendEncryptedGroupMessage({groupId,messageId,senderUid:id.uid,envelope,disappearAfterSeconds:duration});return{messageId,keyEpoch:a.keyEpoch,disappearAfterSeconds:duration};')
replace_once('e2ee-account-group-service.js',
'export function sendAccountGroupMessage({groupId,messageId,text}){return runtime.send({groupId,messageId,text});}',
'export function sendAccountGroupMessage({groupId,messageId,text,disappearAfterSeconds=null}){return runtime.send({groupId,messageId,text,disappearAfterSeconds});}')
replace_once('e2ee-account-group-outbox.js',
'import {ensureAccountGroupEpoch,sendAccountGroupMessage,revalidateQueuedAccountGroupMessage} from "./e2ee-account-group-service.js";\n',
'import {ensureAccountGroupEpoch,sendAccountGroupMessage,revalidateQueuedAccountGroupMessage} from "./e2ee-account-group-service.js";\nimport {normalizeDisappearSelection} from "./disappearing-content-policy.js";\n')
replace_once('e2ee-account-group-outbox.js',
'export async function prepareQueuedAccountGroupMessage({groupId,messageId,text}){',
'export async function prepareQueuedAccountGroupMessage({groupId,messageId,text,disappearAfterSeconds=null}){')
replace_once('e2ee-account-group-outbox.js',
'  return{kind:"group-e2ee-v1",groupId:String(groupId),messageId:String(messageId),text:String(text),expectedKeyEpoch:Number(epoch.keyEpoch)};',
'  const duration=normalizeDisappearSelection(disappearAfterSeconds);\n  return{kind:"group-e2ee-v1",groupId:String(groupId),messageId:String(messageId),text:String(text),expectedKeyEpoch:Number(epoch.keyEpoch),disappearAfterSeconds:duration};')
replace_once('e2ee-account-group-outbox.js',
'    const result=await sendAccountGroupMessage({groupId:payload.groupId,messageId:payload.messageId,text:payload.text});',
'    const result=await sendAccountGroupMessage({groupId:payload.groupId,messageId:payload.messageId,text:payload.text,disappearAfterSeconds:payload.disappearAfterSeconds??null});')
replace_once('e2ee-account-group-app-controller.js',
'export function prepareGroupSend({groupId,messageId,text}){\n  return serial(()=>prepareQueuedAccountGroupMessage({groupId,messageId,text}));\n}',
'export function prepareGroupSend({groupId,messageId,text,disappearAfterSeconds=null}){\n  return serial(()=>prepareQueuedAccountGroupMessage({groupId,messageId,text,disappearAfterSeconds}));\n}')
replace_once('e2ee-account-group-app-integration.js',
'export async function queueGroupTextForApp({groupId,messageId,text,time,persistEncryptedOutbox}){',
'export async function queueGroupTextForApp({groupId,messageId,text,time,disappearAfterSeconds=null,persistEncryptedOutbox}){')
replace_once('e2ee-account-group-app-integration.js',
'  const queued=await prepareGroupSend({groupId,messageId,text});',
'  const queued=await prepareGroupSend({groupId,messageId,text,disappearAfterSeconds});')

# 3) Direct encrypted Outbox preserves outer duration through reconnect and send.
replace_once('app.js',
'    time:message.time,\n    cloud:!!message.cloud,',
'    time:message.time,\n    disappearAfterSeconds:message.disappearAfterSeconds??null,\n    cloud:!!message.cloud,')
replace_once('app.js',
'        await sendCloudMessage(payload.conversationId,{id:payload.messageId,text:"",...encrypted,timeLabel:payload.time,state:"sent"});',
'        await sendCloudMessage(payload.conversationId,{id:payload.messageId,text:"",...encrypted,timeLabel:payload.time,state:"sent",disappearAfterSeconds:payload.disappearAfterSeconds??null});')

# 4) Firestore exact schemas accept optional immutable bounded outer metadata.
replace_once('firestore.rules',
'd.keys().hasOnly(["senderUid","senderName","timeLabel","state","createdAt","text","e2ee","kdfVersion","senderKeyId","recipientKeyId","ciphertext","iv"]) && d.senderUid==request.auth.uid',
'd.keys().hasOnly(["senderUid","senderName","timeLabel","state","createdAt","text","e2ee","kdfVersion","senderKeyId","recipientKeyId","ciphertext","iv","disappearAfterSeconds"]) && (!("disappearAfterSeconds" in d)||(d.disappearAfterSeconds is int&&d.disappearAfterSeconds>=1&&d.disappearAfterSeconds<=31536000)) && d.senderUid==request.auth.uid')
replace_once('firestore.rules',
'd.keys().hasOnly(["e2ee","groupFormat","keyEpoch","senderUid","senderKeyId","ciphertext","iv","state","createdAt","timeLabel"]) && d.e2ee==4',
'd.keys().hasOnly(["e2ee","groupFormat","keyEpoch","senderUid","senderKeyId","ciphertext","iv","state","createdAt","timeLabel","disappearAfterSeconds"]) && (!("disappearAfterSeconds" in d)||(d.disappearAfterSeconds is int&&d.disappearAfterSeconds>=1&&d.disappearAfterSeconds<=31536000)) && d.e2ee==4')

# 5) Emulator matrices prove bounded optional metadata and immutability through receipts.
replace_once('firestore-account-message-v3.rules.test.mjs',
'await test("15 recipient can advance sent to delivered",()=>assertSucceeds(updateDoc(doc(dbB,"conversations","dm-v3","messages","m01"),{state:"delivered"})));',
'''await test("15 valid disappearing duration allowed as outer metadata",()=>assertSucceeds(setDoc(doc(dbA,"conversations","dm-v3","messages","m15d"),{...v3(A,keyA,keyB),disappearAfterSeconds:3600})));
await test("15a zero disappearing duration denied",()=>assertFails(setDoc(doc(dbA,"conversations","dm-v3","messages","m15a"),{...v3(A,keyA,keyB),disappearAfterSeconds:0})));
await test("15b over-max disappearing duration denied",()=>assertFails(setDoc(doc(dbA,"conversations","dm-v3","messages","m15b"),{...v3(A,keyA,keyB),disappearAfterSeconds:31536001})));
await test("15c non-integer disappearing duration denied",()=>assertFails(setDoc(doc(dbA,"conversations","dm-v3","messages","m15c"),{...v3(A,keyA,keyB),disappearAfterSeconds:1.5})));
await test("15d recipient cannot mutate disappearing duration",()=>assertFails(updateDoc(doc(dbB,"conversations","dm-v3","messages","m15d"),{state:"read",readAt:serverTimestamp(),disappearAfterSeconds:7200})));
await test("16 recipient can advance sent to delivered",()=>assertSucceeds(updateDoc(doc(dbB,"conversations","dm-v3","messages","m01"),{state:"delivered"})));''')
# renumber labels after insert only for readability; logic does not depend on numbering.
s=read('firestore-account-message-v3.rules.test.mjs')
for old,new in [("16 sender","17 sender"),("17 recipient read","18 recipient read"),("18 recipient first","19 recipient first"),("19 repeat","20 repeat"),("20 recipient receipt","21 recipient receipt"),("21 legacy e2ee","22 legacy e2ee"),("22 legacy plaintext","23 legacy plaintext")]:
    s=s.replace(f'await test("{old}',f'await test("{new}',1)
write('firestore-account-message-v3.rules.test.mjs',s)

replace_once('firestore-group-e2ee-v1.rules.test.mjs',
'await test("09 plaintext field on encrypted message denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m2"),msg({text:"leak"}))));',
'''await test("09 disappearing duration allowed as outer metadata",()=>assertSucceeds(setDoc(doc(dbA,"groups","g1","messages","m-disappear"),msg({disappearAfterSeconds:3600}))));
await test("09a zero disappearing duration denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m-disappear-zero"),msg({disappearAfterSeconds:0}))));
await test("09b over-max disappearing duration denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m-disappear-max"),msg({disappearAfterSeconds:31536001}))));
await test("09c non-integer disappearing duration denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m-disappear-float"),msg({disappearAfterSeconds:1.5}))));
await test("10 plaintext field on encrypted message denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m2"),msg({text:"leak"}))));''')
s=read('firestore-group-e2ee-v1.rules.test.mjs')
for old,new in [("10 stale","11 stale"),("11 sender","12 sender"),("12 member can write","13 member can write"),("13 read transition","14 read transition"),("14 member first","15 member first"),("15 repeat","16 repeat"),("16 member cannot","17 member cannot"),("17 outsider","18 outsider"),("18 membership","19 membership"),("19 admin atomic","20 admin atomic"),("20 removed","21 removed"),("21 non-admin","22 non-admin"),("22 admin cannot","23 admin cannot"),("23 timestamp","24 timestamp"),("24 admin creates","25 admin creates"),("25 target cannot read building","26 target cannot read building"),("26 admin writes","27 admin writes"),("27 target cannot read copy","28 target cannot read copy"),("28 grantor","29 grantor"),("29 target reads active grant","30 target reads active grant"),("30 target reads active granted","31 target reads active granted"),("31 outsider","32 outsider")]:
    s=s.replace(f'await test("{old}',f'await test("{new}',1)
write('firestore-group-e2ee-v1.rules.test.mjs',s)

# Runtime test: duration stays outside envelope and reaches transport unchanged.
replace_once('e2ee-account-group-runtime.test.mjs',
'await ra.send({groupId:"g1",messageId:"m1",text:"hello group"});ok(sent?.envelope?.e2ee===4,"encrypted send");',
'await ra.send({groupId:"g1",messageId:"m1",text:"hello group",disappearAfterSeconds:3600});ok(sent?.envelope?.e2ee===4&&sent.disappearAfterSeconds===3600&&!("disappearAfterSeconds" in sent.envelope),"encrypted send keeps disappearing duration outside crypto envelope");')
replace_once('e2ee-account-group-outbox.test.mjs',
'  ["captures expected epoch",src.includes("expectedKeyEpoch:Number(epoch.keyEpoch)")],',
'  ["captures expected epoch",src.includes("expectedKeyEpoch:Number(epoch.keyEpoch)")],\n  ["persists normalized disappearing duration in encrypted Outbox payload",src.includes("disappearAfterSeconds:duration")],\n  ["forwards immutable duration on retry",src.includes("disappearAfterSeconds:payload.disappearAfterSeconds??null")],')

# Dedicated cross-owner source gate.
Path('disappearing-message-metadata-authority.test.mjs').write_text('''import fs from "node:fs";\nconst policy=fs.readFileSync(new URL("./disappearing-content-policy.js",import.meta.url),"utf8");\nconst firebase=fs.readFileSync(new URL("./firebase.js",import.meta.url),"utf8");\nconst groupRuntime=fs.readFileSync(new URL("./e2ee-account-group-runtime.js",import.meta.url),"utf8");\nconst groupOutbox=fs.readFileSync(new URL("./e2ee-account-group-outbox.js",import.meta.url),"utf8");\nconst app=fs.readFileSync(new URL("./app.js",import.meta.url),"utf8");\nconst rules=fs.readFileSync(new URL("./firestore.rules",import.meta.url),"utf8");\nconst checks=[\n ["canonical metadata field",policy.includes('DISAPPEARING_DURATION_FIELD="disappearAfterSeconds"')],\n ["direct Firebase writer normalizes selection",/sendCloudMessage[\\s\\S]*?normalizeDisappearSelection\\(message\\.disappearAfterSeconds\\)/.test(firebase)],\n ["group Firebase writer keeps duration outside envelope",/sendCloudEncryptedGroupMessage\\(\\{groupId,messageId,envelope,disappearAfterSeconds=null\\}\\)[\\s\\S]*?row=\\{\\.\\.\\.envelope[\\s\\S]*?row\\.disappearAfterSeconds=duration/.test(firebase)],\n ["group runtime forwards separate metadata",/sendEncryptedGroupMessage\\(\\{groupId,messageId,senderUid:id\\.uid,envelope,disappearAfterSeconds:duration\\}\\)/.test(groupRuntime)],\n ["group Outbox persists duration",groupOutbox.includes('disappearAfterSeconds:duration')],\n ["direct encrypted Outbox persists duration",app.includes('disappearAfterSeconds:message.disappearAfterSeconds??null')],\n ["direct reconnect forwards duration",app.includes('disappearAfterSeconds:payload.disappearAfterSeconds??null')],\n ["direct rules bound optional duration",/validAccountDirectMessage[\\s\\S]*?disappearAfterSeconds[\\s\\S]*?31536000/.test(rules)],\n ["group rules bound optional duration",/validGroupMessage[\\s\\S]*?disappearAfterSeconds[\\s\\S]*?31536000/.test(rules)],\n ["crypto envelopes unchanged",!fs.readFileSync(new URL("./e2ee-account-message-crypto.js",import.meta.url),"utf8").includes("disappearAfterSeconds")&&!fs.readFileSync(new URL("./e2ee-account-group-crypto.js",import.meta.url),"utf8").includes("disappearAfterSeconds")]\n];\nlet failed=0;for(const [name,ok] of checks){console.log(ok?"PASS":"FAIL",name);if(!ok)failed++;}\nconsole.log(`\\n${checks.length-failed}/${checks.length} disappearing message metadata authority assertions passed.`);if(failed)process.exitCode=1;\n''')

replace_once('package.json',
'    "test:disappearing-read-authority":"node disappearing-read-authority.test.mjs",',
'    "test:disappearing-read-authority":"node disappearing-read-authority.test.mjs",\n    "test:disappearing-message-metadata-authority":"node disappearing-message-metadata-authority.test.mjs",')
replace_once('.github/workflows/rebuild-baseline-security.yml',
'      - name: Disappearing first-read authority\n        run: npm run test:disappearing-read-authority\n',
'      - name: Disappearing first-read authority\n        run: npm run test:disappearing-read-authority\n      - name: Disappearing message metadata authority\n        run: npm run test:disappearing-message-metadata-authority\n')

# 6) Version + durable documentation in same release boundary.
replace_once('version.js','version: "0.9.6.11"','version: "0.9.6.12"')
replace_once('README.md','Current checkpoint version: **0.9.6.11**','Current checkpoint version: **0.9.6.12**')
append_once('README.md','### 0.9.6.12 — immutable outer disappearing-message metadata','''### 0.9.6.12 — immutable outer disappearing-message metadata\n\nRelease transition: **0.9.6.11 -> 0.9.6.12**.\n\n- `disappearAfterSeconds` is now carried as optional outer message metadata for current account-authoritative direct (`e2ee:3`) and group (`e2ee:4`) sends. It is deliberately not part of either exact cryptographic envelope.\n- The central `firebase.js` owner normalizes the user-selected duration and writes it only when disappearing content is enabled. The accepted range remains 1..31,536,000 seconds; absence means off.\n- Direct encrypted Outbox records preserve the resolved duration across offline/reconnect. Group Outbox/runtime/service/controller/integration similarly preserve and forward the resolved duration while re-encrypting only ciphertext when epochs change.\n- Firestore Rules accept only the bounded optional integer and receipt transitions cannot mutate it because existing receipt diff constraints remain authoritative.\n- Direct/group emulator matrices now cover valid duration, zero/over-max/non-integer rejection, and direct receipt mutation denial. A dedicated source gate verifies metadata ownership and that crypto-envelope modules remain untouched.\n- This checkpoint still does not implement physical deletion. Purge ownership, deletion authorization, grant-copy/attachment/local-cache purge, and stale-client anti-resurrection remain prerequisites before user-facing disappearing controls or earlier-history controls are enabled.\n- Repository rules changed but are not deployed to live Firebase. `htest` remains untouched; FCM remains deferred to 1.1; App Check enforcement remains OFF/deferred to 1.2.\n- Overall first-rebuild estimate remains approximately 65%.''')
append_once('hermes-memory.txt','2026-09-06 — 0.9.6.12 IMMUTABLE OUTER DISAPPEARING METADATA','''2026-09-06 — 0.9.6.12 IMMUTABLE OUTER DISAPPEARING METADATA\n- User-selected duration is now threaded through current direct/group send authorities as optional outer `disappearAfterSeconds` message metadata, never inside E2EE v3/v4 crypto envelopes.\n- `firebase.js` remains sole Firebase writer and normalizes the metadata through the pure disappearing policy owner before Firestore persistence.\n- Direct encrypted Outbox payloads retain the resolved duration through reconnect. Group encrypted Outbox -> controller -> service -> serialized runtime -> Firebase adapter preserves the same resolved duration while current epoch revalidation may re-encrypt only ciphertext.\n- Firestore rules allow the optional integer only in range 1..31536000 seconds. Existing receipt update diff rules make duration immutable after create.\n- Direct/group emulator tests and `disappearing-message-metadata-authority.test.mjs` cover the new boundary; crypto modules remain exact and unaware of disappearing metadata.\n- Physical trace-free purge, server purge authority, grant-copy/attachment purge, local/offline convergence and stale-client anti-resurrection remain unfinished and must be completed before exposing disappearing controls.\n- No live Firebase or htest deployment; App Check enforcement remains OFF; FCM deferred to 1.1.\n- Overall first complete rebuild estimate remains approximately 65%.''')

p=Path('FIDUNIO-BUILD-CHECKLIST.md'); s=p.read_text()
s=s.replace('| Disappearing-message policy/model | IN PROGRESS | 0.9.6.11 adds the user-selected per-message duration contract on top of 0.9.6.10 immutable server-backed first-Read authority. `disappearAfterSeconds` is the resolved immutable duration for a disappearing message; absence means off. Message-schema persistence/rules, physical purge execution, local/offline convergence, attachments and anti-resurrection remain unfinished. |','| Disappearing-message policy/model | IN PROGRESS | 0.9.6.12 persists the resolved user-selected `disappearAfterSeconds` as bounded immutable outer metadata for current direct/group sends and carries it through encrypted Outbox retry without changing crypto-envelope formats. Physical purge execution, deletion authority, local/offline convergence, attachments and anti-resurrection remain unfinished. |',1)
log='- 2026-09-06 — 0.9.6.12 disappearing metadata persistence: optional bounded `disappearAfterSeconds` is outer immutable metadata for v3 direct/v4 group messages, preserved through encrypted Outbox retry and central Firebase transport; rules/emulator/source gates extended. Physical purge remains IN PROGRESS; no live Firebase or htest change; overall estimate remains approximately 65%.'
if log not in s:s=s.rstrip()+"\n"+log+"\n"
p.write_text(s)

append_once('ACCOUNT-E2EE-DIRECT-MESSAGE-FORMAT.md','## Disappearing-message outer metadata — 0.9.6.12','''## Disappearing-message outer metadata — 0.9.6.12\n`disappearAfterSeconds` is optional outer Firestore message metadata for account-authoritative v3 direct messages. It is not part of the six-field cryptographic envelope or AAD. When present it must be an integer from 1 through 31,536,000 and is immutable after creation; absence means disappearing is off. The encrypted local Outbox preserves the resolved value across reconnect, and `firebase.js` is the sole persistence owner. First recipient `readAt` remains the start authority. Repository rules are not live-deployed by this checkpoint.''')
append_once('ACCOUNT-E2EE-GROUP-MESSAGE-FORMAT.md','### Disappearing-message outer metadata — 0.9.6.12','''### Disappearing-message outer metadata — 0.9.6.12\nCurrent `e2ee:4` group messages may include optional outer `disappearAfterSeconds` metadata, integer 1..31,536,000. The group crypto envelope remains unchanged. The encrypted group Outbox preserves the resolved value while queued epoch revalidation may replace only the ciphertext envelope. Each recipient still starts an independent expiry window at immutable server-backed first Read. Final shared-source deletion remains blocked until every applicable recipient window has elapsed and the dedicated purge owner can remove all related traces.''')
append_once('RUNTIME-AUTHORITY-MAP.md','## Disappearing outer message metadata — 0.9.6.12','''## Disappearing outer message metadata — 0.9.6.12\n- `disappearing-content-policy.js`: sole duration normalization/schema-name policy owner.\n- Direct/group UI/controller callers provide intent only; resolved duration is stored as outer `disappearAfterSeconds` metadata.\n- Encrypted Outbox records preserve the resolved duration across offline retry.\n- Direct/group crypto modules do not own or authenticate this metadata and remain exact-envelope owners only.\n- `firebase.js` is the sole Firestore persistence owner and writes the bounded optional metadata alongside ciphertext.\n- Firestore Rules enforce bounds and immutability through exact create schemas plus receipt-only update diffs.\n- Physical deletion remains a separate not-yet-materialized serialized resource owner.''')
append_once('architecture-ownership.txt','DISAPPEARING OUTER MESSAGE METADATA — 0.9.6.12','''DISAPPEARING OUTER MESSAGE METADATA — 0.9.6.12\n- Resource: resolved per-message disappearing duration.\n- Policy owner: `disappearing-content-policy.js`.\n- Pending-send authority: encrypted Outbox preserves the resolved duration; reconnect must not recompute it from a changed user preference.\n- Cloud write owner: `firebase.js`; current direct/group ciphertext rows may carry optional `disappearAfterSeconds`.\n- Crypto owners remain unchanged and must not absorb disappearing metadata into their exact envelopes.\n- Firestore Rules bound and freeze the metadata.\n- Physical purge is a different resource and still requires one dedicated serialized deletion owner.''')

p=Path('hermes-setup.txt');s=p.read_text()
needle='- Duration is user-selected. The resolved per-message authority is `disappearAfterSeconds`; absence means disappearing is off. UI presets/defaults may be convenience only and must not retroactively change already-sent messages.'
extra='\n- As of 0.9.6.12, current direct/group send and encrypted-Outbox paths preserve that resolved duration as immutable outer metadata; it is deliberately outside the E2EE envelopes. Repository rules supporting the metadata are not yet deployed live.'
if extra.strip() not in s:s=s.replace(needle,needle+extra,1)
p.write_text(s)

print('0.9.6.12 materialization completed')
