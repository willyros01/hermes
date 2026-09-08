import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync(new URL("./app.js",import.meta.url),"utf8");
const firebase=readFileSync(new URL("./firebase.js",import.meta.url),"utf8");
const rules=readFileSync(new URL("./firestore.rules",import.meta.url),"utf8");
const worker=readFileSync(new URL("./service-worker.js",import.meta.url),"utf8");

assert.doesNotMatch(app,/prepareAccountDirectMessage\(/,"new direct text must not require encryption-key preparation");
assert.match(app,/sendCloudMessage\(payload\.conversationId,\{id:payload\.messageId,text:payload\.text,timeLabel:payload\.time,state:"sent"/,"the Outbox owner must send the user's direct text through the existing Firebase owner");
assert.match(firebase,/else row\.text=message\.text\|\|"";await s\.fsSdk\.setDoc\(ref,row\)/,"Firebase must persist non-E2EE direct text with the fixed message ID");
assert.match(rules,/request\.resource\.data\.text is string&&request\.resource\.data\.text\.size\(\)>0&&request\.resource\.data\.text\.size\(\)<=10000&&!\("e2ee" in request\.resource\.data\)/,"current rules must already authorize bounded authenticated direct text");
assert.match(app,/if\(m\.e2ee===3\)/,"historical account-encrypted messages must remain readable");
assert.doesNotMatch(app,/Encryption key changed since first seen/,"ordinary chat must not show key-change warnings");
assert.doesNotMatch(app,/state\.modal=\{type:"conversationSecurity"/,"ordinary chat info must not open key-management UI");
assert.match(app,/state\.modal=\{type:"directChatInfo"/,"direct chat info must remain simple and nontechnical");
assert.match(worker,/SHELL_REVISION="0\.9\.9\.8d-basic-dm-read"/,"the installed PWA must load the basic direct-message repair");

console.log("Basic direct-message send/receive path gate passed");
