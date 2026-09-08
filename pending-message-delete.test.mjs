import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync(new URL("./app.js",import.meta.url),"utf8");
const css=readFileSync(new URL("./styles.css",import.meta.url),"utf8");
const worker=readFileSync(new URL("./service-worker.js",import.meta.url),"utf8");

assert.match(app,/\["queued","sending","failed"\]\.includes\(m\.state\)/,"only pending outgoing messages expose cancellation");
assert.match(app,/const outboxCancellationRequests=new Set\(\)/,"one cancellation reservation set must coordinate with the sole Outbox cycle");
assert.match(app,/await outboxCycleTail\.catch\(\(\)=>\{\}\)[\s\S]*?await getOutboxMessage\(id\)[\s\S]*?purgeLocalDisappearingMessageTraces\(firebaseUser\.uid,\[id\]\)/,"delete must wait for the Outbox owner, confirm the record, then use physical local purge");
assert.match(app,/outboxCancellationRequests\.has\(String\(payload\.messageId\)\)/,"send must honor a cancellation reservation before cloud transport");
assert.match(app,/setTimeout\(open,650\)/,"touch press-and-hold must expose message actions");
assert.match(app,/Delete Message/,"the deletion action must be explicit and readable");
assert.match(app,/Delete for Everyone/,"accepted sender-owned direct messages must expose controlled server deletion");
assert.match(app,/deleteCloudDirectMessageForEveryone\(modal\.conversationId,modal\.messageId\)/,"sent direct-message deletion must use the sole Firebase callable owner");
assert.match(app,/const MESSAGE_DELETE_FOR_EVERYONE_ENABLED=false/,'accepted-message deletion must remain unavailable until its server authority is deployed');
assert.match(css,/\.modal-delete\{[^}]*background:#a52b2b;[^}]*color:#fff/,"destructive action must have a high-contrast dedicated style");
assert.doesNotMatch(app,/deleteDoc\s*\(/,"pending-message deletion must not introduce broad client Firestore delete authority");
assert.match(worker,/SHELL_REVISION="0\.9\.9\.8d-basic-dm-read"/,"the deployed shell must invalidate the prior cache");

console.log("Pending encrypted-Outbox message deletion gate passed");
