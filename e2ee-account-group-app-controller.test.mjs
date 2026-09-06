import fs from "node:fs";
const src=fs.readFileSync(new URL("./e2ee-account-group-app-controller.js",import.meta.url),"utf8");
const app=fs.readFileSync(new URL("./app.js",import.meta.url),"utf8");
const checks=[
 ["controller uses group Outbox owner",/prepareQueuedAccountGroupMessage/.test(src)&&/flushQueuedAccountGroupMessage/.test(src)],
 ["controller uses group conversation owner",/subscribeAccountGroupConversation/.test(src)&&/stopAccountGroupConversation/.test(src)],
 ["controller serializes send preparation and flush",/let tail=Promise\.resolve\(\)/.test(src)&&/return serial\(\(\)=>prepareQueuedAccountGroupMessage/.test(src)&&/return serial\(\(\)=>flushQueuedAccountGroupMessage/.test(src)],
 ["controller does not import Firebase",!/from\s+["']\.\/firebase\.js["']/.test(src)],
 ["controller does not own IndexedDB",!/indexedDB\.|openDb\(|IDB/.test(src)],
 ["controller does not own crypto",!/crypto\.subtle|deriveKey|encrypt\(|decrypt\(/.test(src)],
 ["controller recognizes epoch-bound group Outbox records",/kind===\"group-e2ee-v1\"/.test(src)&&/Number\.isInteger\(payload\.expectedKeyEpoch\)/.test(src)],
 ["sign-out reset clears group messaging owners",/resetGroupMessagingForSignOut/.test(src)&&/resetAccountGroupOutboxQueue/.test(src)&&/resetAccountGroupConversationStreams/.test(src)],
 ["legacy app still has explicit disabled marker until bounded wiring",/Group messaging is intentionally disabled until group E2EE is implemented/.test(app)]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?"PASS":"FAIL",name);if(!ok)failed++;}console.log(`\n${checks.length-failed}/${checks.length} app group ownership assertions passed.`);if(failed)process.exitCode=1;
