import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync(new URL("./app.js",import.meta.url),"utf8");
const css=readFileSync(new URL("./styles.css",import.meta.url),"utf8");
const worker=readFileSync(new URL("./service-worker.js",import.meta.url),"utf8");

assert.match(app,/\["queued","sending","failed"\]\.includes\(m\.state\)/,"only pending outgoing messages expose cancellation");
assert.match(app,/const outboxCancellationRequests=new Set\(\)/,"one cancellation reservation set must coordinate with the sole Outbox cycle");
assert.match(app,/await outboxCycleTail\.catch\(\(\)=>\{\}\)[\s\S]*?await getOutboxMessage\(id\)[\s\S]*?purgeLocalDisappearingMessageTraces\(firebaseUser\.uid,\[id\]\)/,"delete must wait for the Outbox owner, confirm the record, then use physical local purge");
assert.match(app,/if\(!record\)\{await deleteMessageForMe\(conversationId,id\);return;\}/,"a stale Sending row whose Outbox entry already completed must still support Delete for Me");
assert.match(app,/outboxCancellationRequests\.has\(String\(payload\.messageId\)\)/,"send must honor a cancellation reservation before cloud transport");
assert.match(app,/setTimeout\(open,650\)/,"touch press-and-hold must expose message actions");
assert.match(app,/Delete Message/,"the deletion action must be explicit and readable");
assert.match(app,/Delete for Everyone/,"accepted sender-owned direct messages must expose controlled server deletion");
assert.match(app,/Delete for Me/,"accepted sent and received messages must expose local-only deletion");
assert.match(app,/state\.hiddenMessages\[cid\]=\[\.\.\.hidden\]/,"Delete for Me must durably retain the local hidden-message decision");
assert.match(app,/rows=\(rows\|\|\[\]\)\.filter\(m=>!isMessageHidden\(conversationId,m\.id\)\)/,"direct cloud refresh must not restore a locally deleted message");
assert.match(app,/rows=\(rows\|\|\[\]\)\.filter\(m=>!isMessageHidden\(groupId,m\.id\)\)/,"group cloud refresh must not restore a locally deleted message");
assert.match(app,/deleteCloudDirectMessageForEveryone\(modal\.conversationId,modal\.messageId\)/,"sent direct-message deletion must use the sole Firebase callable owner");
assert.match(app,/if\(conversation\?\.cloudGroup\)await deleteCloudGroupMessageForEveryone\(modal\.conversationId,modal\.messageId\)/,"sent group-message deletion must use the sender-authorized server callable");
assert.match(app,/const canDeleteForEveryone=[^;]*message\?\.mine/,"Delete for Everyone must remain sender-only in the UI");
assert.match(app,/conversation\?\.cloud\|\|conversation\?\.cloudGroup/,"accepted direct and group cloud messages must expose sender-owned deletion");
assert.match(app,/const MESSAGE_DELETE_FOR_EVERYONE_ENABLED=true/,'accepted-message deletion must be available through its server authority');
assert.match(css,/\.modal-delete\{[^}]*background:#a52b2b;[^}]*color:#fff/,"destructive action must have a high-contrast dedicated style");
assert.doesNotMatch(app,/deleteDoc\s*\(/,"pending-message deletion must not introduce broad client Firestore delete authority");
assert.match(app,/if\(messageSendInFlight\)return;[\s\S]*?messageSendInFlight=true;[\s\S]*?box\.value=""/,"send must reserve one attempt and clear the composer before asynchronous work");
assert.match(app,/document\.querySelector\("#sendBtn"\)\?\.click\(\)/,"keyboard send must use the same guarded button path");
assert.match(app,/if\(isGroupPayload\)[\s\S]*?m\.state="sent";await persistState\(\);[\s\S]*?if\(state\.route==="chat"&&String\(state\.selectedId\)===String\(payload\.conversationId\)\)render\(\)/,"group send completion must immediately replace stale Sending UI");
assert.match(worker,/SHELL_REVISION="0\.9\.9\.9r-photo-compression"/,"the deployed shell must invalidate the prior cache");

console.log("Pending encrypted-Outbox message deletion gate passed");
