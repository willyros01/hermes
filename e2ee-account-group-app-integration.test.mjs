import fs from "node:fs";
const src=fs.readFileSync(new URL("./e2ee-account-group-app-integration.js",import.meta.url),"utf8");
const checks=[
 ["bridge delegates group send preparation",/prepareGroupSend\(\{groupId,messageId,text\}\)/.test(src)],
 ["bridge persists only through injected encrypted Outbox callback",/await persistEncryptedOutbox\(payload\)/.test(src)&&!/indexedDB|openDb\(/.test(src)],
 ["bridge flushes before Outbox removal",src.indexOf("await flushGroupSend(payload)")<src.indexOf("await removeEncryptedOutbox(payload.messageId)")],
 ["bridge rejects non-group Outbox payloads",/isGroupOutboxPayload\(payload\)/.test(src)],
 ["bridge owns no Firebase",!/firebase\.js|Firestore|sendCloud/.test(src)],
 ["bridge owns no cryptography",!/crypto\.subtle|deriveKey|encrypt\(|decrypt\(/.test(src)],
 ["bridge exposes bounded conversation open-close",/openGroupForApp/.test(src)&&/closeGroupForApp/.test(src)],
 ["sign-out reset reaches group messaging owner",/resetGroupMessagingForSignOut\(\)/.test(src)]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?"PASS":"FAIL",name);if(!ok)failed++;}console.log(`\n${checks.length-failed}/${checks.length} bounded group app-integration assertions passed.`);if(failed)process.exitCode=1;
