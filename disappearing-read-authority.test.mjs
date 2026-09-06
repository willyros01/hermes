import fs from "node:fs";

const firebaseSrc=fs.readFileSync(new URL("./firebase.js",import.meta.url),"utf8");
const rulesSrc=fs.readFileSync(new URL("./firestore.rules",import.meta.url),"utf8");

const checks=[
  ["direct receipt write is transactional",/export async function updateCloudMessageState[\s\S]*?runTransaction\(s\.db/.test(firebaseSrc)],
  ["direct first Read writes server timestamp",/updateCloudMessageState[\s\S]*?state:\"read\",readAt:s\.fsSdk\.serverTimestamp\(\)/.test(firebaseSrc)],
  ["direct repeat Read preserves existing authority",/current\.state===\"read\"[\s\S]*?current\.readAt\|\|null/.test(firebaseSrc)],
  ["direct bulk read delegates to authoritative writer",/markCloudConversationRead[\s\S]*?updateCloudMessageState\(conversationId,d\.id,\"read\"\)/.test(firebaseSrc)],
  ["group receipt write is transactional",/export async function updateCloudGroupReceipt[\s\S]*?runTransaction\(s\.db/.test(firebaseSrc)],
  ["group first Read writes readAt with server authority",/updateCloudGroupReceipt[\s\S]*?readAt:now/.test(firebaseSrc)&&/const now=s\.fsSdk\.serverTimestamp\(\)/.test(firebaseSrc)],
  ["group repeat Read is a no-op",/current\?\.state===\"read\"[\s\S]*?return\{state:\"read\",readAt:current\.readAt\|\|null\}/.test(firebaseSrc)],
  ["direct rules require first readAt request time",/validDirectReceiptUpdate[\s\S]*?d\.readAt==request\.time/.test(rulesSrc)],
  ["group rules require first readAt request time",/validGroupReceipt(?:Create|Update)[\s\S]*?readAt==request\.time/.test(rulesSrc)],
  ["rules reject sender-written direct receipt authority",/validDirectReceiptUpdate[\s\S]*?request\.auth\.uid!=old\.senderUid/.test(rulesSrc)]
];

let failed=0;
for(const [name,ok] of checks){console.log(ok?"PASS":"FAIL",name);if(!ok)failed++;}
console.log(`\n${checks.length-failed}/${checks.length} disappearing first-read authority assertions passed.`);
if(failed)process.exitCode=1;
