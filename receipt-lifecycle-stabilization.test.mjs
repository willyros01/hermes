import fs from "node:fs";
import assert from "node:assert/strict";

const app=fs.readFileSync("app.js","utf8");
const group=fs.readFileSync("e2ee-account-group-conversation.js","utf8");
const directWrites=(app.match(/updateCloudMessageState\(conversationId,m\.id,\"read\"\)/g)||[]).length;

assert.equal(directWrites,0,"app must not race the bulk receipt owner with per-message writes");
assert.match(app,/unreadIncoming\.length[\s\S]*?markCloudConversationRead\(conversationId\)/,"displayed unread messages must use one bulk receipt owner");
assert.match(app,/unlockPinAlreadyMounted[\s\S]*?if\(unlockPinAlreadyMounted\)return/,"background callbacks must not remount a PIN entry in progress");
assert.match(app,/visibilitychange/);
assert.match(app,/pageshow/);
assert.match(app,/function requestAppActivation\(reason\)/);
assert.doesNotMatch(app,/ensureActiveCloudMessageSubscription\(true\)/,"lifecycle activation must reuse the owned subscription instead of force-replacing it");
assert.match(app,/let cloudGroupMessageConversationId\s*=\s*null/,"group messaging must retain the active conversation identity");
assert.match(app,/cloudGroupMessageConversationId[\s\S]*?===wanted\)return/,"repeated activation must reuse the active group stream");
assert.match(group,/subscribeCloudGroupReceipts/);
assert.match(group,/const priorities=new Map\(\)/,"group delivery must use the owned keyed priority queue");
assert.match(group,/offerSnapshot\(rawRows,snapshotMeta\)/,"listener snapshots must re-enter the same group delivery owner");
assert.match(group,/const priority=priorities\.values\(\)\.next\(\)\.value;[\s\S]*?if\(!pendingSnapshot\)break/,"priority messages must be processed before a coalesced listener snapshot");
assert.match(group,/isOpen\(\)\?\"read\":\"delivered\"/);

assert.match(group,/if\(closed\)return;[\s\S]*?for\(const messageId of receiptUpdates\)\{if\(closed\)return;/,"a replaced group stream must not continue receipt maintenance");
assert.match(group,/offerPriority[\s\S]*?if\(closed\)\{reject\(new Error\("Group message delivery owner closed\."\)\);return;\}/,"a late priority read must settle after its stream is replaced");

console.log("Receipt and lifecycle stabilization anchors passed");
