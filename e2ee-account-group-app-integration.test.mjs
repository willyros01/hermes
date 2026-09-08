import fs from "node:fs";
import assert from "node:assert/strict";
import {normalizeGroupOutboxPayload} from "./e2ee-account-group-app-integration.js";
const src=fs.readFileSync(new URL("./e2ee-account-group-app-integration.js",import.meta.url),"utf8");
const checks=[
 ["bridge delegates group send preparation with outer disappearing metadata",/prepareGroupSend\(\{groupId,messageId,text,disappearAfterSeconds\}\)/.test(src)],
 ["bridge persists only through injected encrypted Outbox callback",/await persistEncryptedOutbox\(payload\)/.test(src)&&!/indexedDB|openDb\(/.test(src)],
 ["bridge flushes before Outbox removal",src.indexOf("await flushGroupSend(normalized)")<src.indexOf("await removeEncryptedOutbox(normalized.messageId)")],
 ["bridge rejects non-group Outbox payloads after compatibility normalization",/isGroupOutboxPayload\(normalized\)/.test(src)],
 ["bridge repairs legacy conversationId-only group payloads",/normalizeGroupOutboxPayload\(payload\)/.test(src)&&/flushGroupSend\(normalized\)/.test(src)],
 ["bridge owns no Firebase",!/from\s+["']\.\/firebase\.js["']|firebaseApp|firebaseConfig|sendCloud|\bgetFirestore\b|\bsetDoc\b|\bupdateDoc\b/.test(src)],
 ["bridge owns no cryptography",!/crypto\.subtle|deriveKey|encrypt\(|decrypt\(/.test(src)],
 ["bridge exposes bounded conversation open-close",/openGroupForApp/.test(src)&&/closeGroupForApp/.test(src)],
 ["bridge imports all delegated administration owners",/import\s*\{[^}]*renameGroup[^}]*addGroupMember[^}]*removeGroupMember[^}]*leaveGroup[^}]*grantGroupHistory[^}]*\}\s*from\s*["']\.\/e2ee-account-group-app-controller\.js["']/.test(src)],
 ["bridge delegates administration through controller",/renameGroupForApp\(groupId,name\)\{return renameGroup\(groupId,name\);\}/.test(src)&&/addGroupMemberForApp\(groupId,targetUid\)\{return addGroupMember\(groupId,targetUid\);\}/.test(src)&&/removeGroupMemberForApp\(groupId,targetUid\)\{return removeGroupMember\(groupId,targetUid\);\}/.test(src)&&/leaveGroupForApp\(groupId\)\{return leaveGroup\(groupId\);\}/.test(src)],
 ["bridge exposes intent-only history grant",/grantGroupHistoryForApp\(groupId,targetUid,boundary\)\{return grantGroupHistory\(groupId,targetUid,boundary\);\}/.test(src)&&!/sourceRows/.test(src)],
 ["sign-out reset reaches group messaging owner",/resetGroupMessagingForSignOut\(\)/.test(src)]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?"PASS":"FAIL",name);if(!ok)failed++;}console.log(`\n${checks.length-failed}/${checks.length} bounded group app-integration assertions passed.`);if(failed)process.exitCode=1;
assert.deepEqual(normalizeGroupOutboxPayload({kind:"group-e2ee-v1",conversationId:"legacy-group",messageId:"m1",expectedKeyEpoch:null}),{kind:"group-e2ee-v1",conversationId:"legacy-group",groupId:"legacy-group",messageId:"m1",expectedKeyEpoch:null});
console.log("PASS legacy conversationId-only payload normalizes to groupId");
