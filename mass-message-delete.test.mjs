import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync(new URL("./app.js",import.meta.url),"utf8");
const firebase=readFileSync(new URL("./firebase.js",import.meta.url),"utf8");
const functions=readFileSync(new URL("./functions/index.mjs",import.meta.url),"utf8");
const core=readFileSync(new URL("./functions/message-delete/message-delete-callable-core.mjs",import.meta.url),"utf8");
const adapter=readFileSync(new URL("./functions/message-delete/message-delete-firestore-admin-adapter.mjs",import.meta.url),"utf8");

assert.match(app,/Delete My Sent Messages/,"direct/group UI must expose a readable bulk sender-delete action");
assert.match(app,/modal\.type==="bulkDeleteSentConfirm"/,"bulk deletion must require its owned confirmation modal");
assert.match(app,/This cannot be undone\./,"bulk deletion must display irreversible-action warning");
assert.match(app,/Messages sent by other people and unsent queued or failed messages are not deleted\./,"confirmation must state the bounded sender-only scope");
assert.match(app,/let bulkMessageDeleteTail=Promise\.resolve\(\)/,"bulk deletion must have one serialized client request path");
assert.match(app,/while\(rounds\+\+<200\)[\s\S]*?deleteCloudMyMessagesForEveryone[\s\S]*?purgeLocalDisappearingMessageTraces\(firebaseUser\.uid,ids\)/,"client must consume bounded server pages and physically purge confirmed local rows");
assert.match(app,/bulkMessageDeleteProjection\.reserve\(cid,ids\)[\s\S]*?purgeLocalDisappearingMessageTraces\(firebaseUser\.uid,ids\)/,"server-confirmed IDs must be reserved against intermediate listener repaint before local purge");
assert.match(app,/bulkMessageDeleteProjection\.project\(conversationId,projection\.rows,[\s\S]*?authoritativeRemoteIds:remote\.map/,"direct projection must suppress confirmed IDs until server-backed absence");
assert.match(app,/bulkMessageDeleteProjection\.project\(groupId,projection\.rows,[\s\S]*?authoritativeRemoteIds:rows\.map/,"group projection must suppress confirmed IDs until server-backed absence");
assert.match(firebase,/callCloudFunction\("deleteMyMessagesForEveryoneV1"/,"firebase.js must remain the sole client callable bridge");
assert.match(functions,/export const deleteMyMessagesForEveryoneV1 = onCall[\s\S]*?messageDeleteCore\.deleteMyMessagesForEveryoneV1/,"Functions entry point must use the existing deletion core");
assert.match(core,/const BULK_DELETE_PAGE_SIZE=25/,"server work must be bounded per invocation");
assert.match(core,/listDirectMessageIdsBySender/,"server must select authoritative sender-owned direct rows");
assert.match(core,/listGroupMessageIdsBySender/,"server must select authoritative sender-owned group rows");
assert.match(core,/for\(const messageId of messageIds\)[\s\S]*?deleteOne/,"every bulk row must reuse the single-message authorization and trace-cleanup owner");
assert.match(adapter,/where\("senderUid","==",String\(senderUid\)\)\.limit\(Number\(limit\)\)/,"repository selection must be sender-bound and bounded");
assert.doesNotMatch(app,/deleteDoc\s*\(/,"bulk deletion must not grant client Firestore delete authority");

console.log("Mass sender-owned direct and group message deletion wiring gate passed");
