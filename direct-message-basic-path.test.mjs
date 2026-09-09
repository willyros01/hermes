import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync(new URL("./app.js",import.meta.url),"utf8");
const firebase=readFileSync(new URL("./firebase.js",import.meta.url),"utf8");
const rules=readFileSync(new URL("./firestore.rules",import.meta.url),"utf8");
const worker=readFileSync(new URL("./service-worker.js",import.meta.url),"utf8");

assert.match(app,/prepareAccountDirectMessage\(\{uid:firebaseUser\.uid,peerUid,conversationId:payload\.conversationId,messageId:payload\.messageId,text:payload\.text,disappearingPurgeVersion:payload\.disappearingPurgeVersion\?\?null\}\)/,"the Outbox owner must prepare one account-encrypted envelope while carrying only outer disappearing activation metadata");
assert.match(app,/sendCloudMessage\(payload\.conversationId,\{id:payload\.messageId,text:"",\.\.\.encrypted,timeLabel:payload\.time,state:"sent"/,"the Outbox owner must send ciphertext through the existing Firebase owner");
assert.match(firebase,/else row\.text=message\.text\|\|"";await s\.fsSdk\.setDoc\(ref,row\)/,"Firebase must persist non-E2EE direct text with the fixed message ID");
assert.match(rules,/request\.resource\.data\.text is string&&request\.resource\.data\.text\.size\(\)>0&&request\.resource\.data\.text\.size\(\)<=10000&&!\("e2ee" in request\.resource\.data\)/,"current rules must already authorize bounded authenticated direct text");
assert.match(app,/if\(m\.e2ee===3\)/,"historical account-encrypted messages must remain readable");
assert.doesNotMatch(app,/Encryption key changed since first seen/,"ordinary chat must not show key-change warnings");
assert.doesNotMatch(app,/state\.modal=\{type:"conversationSecurity"/,"ordinary chat info must not open key-management UI");
assert.match(app,/state\.modal=\{type:"directChatInfo"/,"direct chat info must remain simple and nontechnical");
assert.match(worker,/SHELL_REVISION="0\.9\.9\.15-group-sender-time"/,"the installed PWA must load the current direct-message candidate");

console.log("Encrypted direct-message send/receive path gate passed");
