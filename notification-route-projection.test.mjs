import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync("app.js","utf8");
const firebase=readFileSync("firebase.js","utf8");

assert.match(firebase,/export async function getCloudConversationFromServer[\s\S]*?getDocFromServer\(/,"cold notification repair must expose one server-authoritative conversation read");
const routeStart=app.indexOf("async function applyPendingNotificationRoute");
const routeEnd=app.indexOf("async function finalizePendingNotificationRoute",routeStart);
const routeOwner=app.slice(routeStart,routeEnd);
assert.match(routeOwner,/if\(!c\?\.cloud\|\|c\?\.cloudGroup\|\|c\?\.type==="group"\)[\s\S]*?getCloudConversationFromServer/,
  "stale local conversation metadata must be resolved by server authority before rejection");
assert.match(app,/notificationRouteHasRendered\(routed\.route\)[\s\S]*?finalizePendingNotificationRoute/,
  "the inbox route must survive until the exact target chat is mounted");
assert.match(app,/render\(\{background:!routed,entry:!!routed\}\)/,
  "notification activation must identify an intentional latest-message entry to the render owner");

const subscriptionStart=app.indexOf("function beginCloudMessageSubscription");
const subscriptionEnd=app.indexOf("async function initializeFirebaseLayer",subscriptionStart);
const subscription=app.slice(subscriptionStart,subscriptionEnd);
const projected=subscription.indexOf("state.messages[conversationId]=merged;");
const visible=subscription.indexOf('render({background:true});',projected);
const cache=subscription.indexOf("await cacheCloudHistory(conversationId,merged);",projected);
const receipt=subscription.indexOf("await markCloudConversationRead(conversationId);",cache);
assert.ok(projected>=0&&visible>projected&&visible<cache&&cache<receipt,
  "new-message projection must paint before local durability and server receipt work");
assert.match(subscription,/const existingById=new Map[\s\S]*?prior\?\.cloud&&prior\.text[\s\S]*?text=prior\.text/,
  "receipt-only snapshots must reuse previously authenticated plaintext");

const composerStart=app.indexOf("function captureComposerStateFromDom");
const composerEnd=app.indexOf("function restoreComposerState",composerStart);
assert.doesNotMatch(app.slice(composerStart,composerEnd),/Scroll|NearBottom/,
  "per-conversation draft state must not persist viewport position across navigation");
assert.match(app,/function restoreChatViewport[\s\S]*?return scrollChatToLatest\(\)/,
  "new chat entry must target the latest message");
assert.match(app,/function scheduleChatViewportRestore[\s\S]*?generation!==chatRenderGeneration[\s\S]*?pendingChatViewport===viewport/,
  "only the newest render generation may complete and clear viewport intent");

const firebaseSubscriptionStart=firebase.indexOf("export function subscribeConversationMessages");
const firebaseSubscriptionEnd=firebase.indexOf("export function subscribeUserDisplayNames",firebaseSubscriptionStart);
const firebaseSubscription=firebase.slice(firebaseSubscriptionStart,firebaseSubscriptionEnd);
const existingStart=firebaseSubscription.indexOf("if(stream){");
const existingEnd=firebaseSubscription.indexOf("}else{",existingStart);
assert.doesNotMatch(firebaseSubscription.slice(existingStart,existingEnd),/\.getDocs\(/,
  "re-entry must transfer the live-listener callback without a competing full-history read");
assert.match(firebase,/function queueLatestMessageSnapshot[\s\S]*?stream\.pending=\{rows,meta\}[\s\S]*?while\(messageStreams\.get\(key\)===stream&&stream\.pending\)/,
  "the message-stream owner must coalesce pending snapshots to the newest value");
assert.doesNotMatch(firebaseSubscription,/delivery\.then/,
  "message snapshots must not form an unbounded FIFO projection backlog");

console.log("Notification route, latest-only projection, and deterministic newest-message gates passed");
