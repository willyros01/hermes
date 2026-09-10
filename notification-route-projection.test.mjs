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

console.log("Notification cold-route, immediate projection, and newest-message gates passed");
