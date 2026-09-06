import fs from "node:fs";
const policy=fs.readFileSync(new URL("./disappearing-content-policy.js",import.meta.url),"utf8");
const firebase=fs.readFileSync(new URL("./firebase.js",import.meta.url),"utf8");
const groupRuntime=fs.readFileSync(new URL("./e2ee-account-group-runtime.js",import.meta.url),"utf8");
const groupOutbox=fs.readFileSync(new URL("./e2ee-account-group-outbox.js",import.meta.url),"utf8");
const app=fs.readFileSync(new URL("./app.js",import.meta.url),"utf8");
const rules=fs.readFileSync(new URL("./firestore.rules",import.meta.url),"utf8");
const checks=[
 ["canonical metadata field",policy.includes('DISAPPEARING_DURATION_FIELD="disappearAfterSeconds"')],
 ["direct Firebase writer normalizes selection",/sendCloudMessage[\s\S]*?normalizeDisappearSelection\(message\.disappearAfterSeconds\)/.test(firebase)],
 ["group Firebase writer keeps duration outside envelope",/sendCloudEncryptedGroupMessage\(\{groupId,messageId,envelope,disappearAfterSeconds=null\}\)[\s\S]*?row=\{\.\.\.envelope[\s\S]*?row\.disappearAfterSeconds=duration/.test(firebase)],
 ["group runtime forwards separate metadata",/sendEncryptedGroupMessage\(\{groupId,messageId,senderUid:id\.uid,envelope,disappearAfterSeconds:duration\}\)/.test(groupRuntime)],
 ["group Outbox persists duration",groupOutbox.includes('disappearAfterSeconds:duration')],
 ["direct encrypted Outbox persists duration",app.includes('disappearAfterSeconds:message.disappearAfterSeconds??null')],
 ["direct reconnect forwards duration",app.includes('disappearAfterSeconds:payload.disappearAfterSeconds??null')],
 ["direct rules bound optional duration",/validAccountDirectMessage[\s\S]*?disappearAfterSeconds[\s\S]*?31536000/.test(rules)],
 ["group rules bound optional duration",/validGroupMessage[\s\S]*?disappearAfterSeconds[\s\S]*?31536000/.test(rules)],
 ["crypto envelopes unchanged",!fs.readFileSync(new URL("./e2ee-account-message-crypto.js",import.meta.url),"utf8").includes("disappearAfterSeconds")&&!fs.readFileSync(new URL("./e2ee-account-group-crypto.js",import.meta.url),"utf8").includes("disappearAfterSeconds")]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?"PASS":"FAIL",name);if(!ok)failed++;}
console.log(`\n${checks.length-failed}/${checks.length} disappearing message metadata authority assertions passed.`);if(failed)process.exitCode=1;
