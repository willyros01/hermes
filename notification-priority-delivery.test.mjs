import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync("app.js","utf8");
const firebase=readFileSync("firebase.js","utf8");
const worker=readFileSync("service-worker.js","utf8");

const routeStart=app.indexOf("async function applyPendingNotificationRoute");
const routeEnd=app.indexOf("async function finalizePendingNotificationRoute",routeStart);
const routeOwner=app.slice(routeStart,routeEnd);
assert.ok(routeStart>=0&&routeEnd>routeStart,"notification activation owner must exist");
assert.match(routeOwner,/setUnlockTransitionStatus\("Opening message…"\)/,
  "PIN transition must stay covered while the keyed message is prepared");
const subscribe=routeOwner.indexOf("beginCloudMessageSubscription(c.id,{force:true})");
const prioritize=routeOwner.indexOf("await awaitBoundedNotificationMessage(groupRoute?prioritizeGroupMessageForApp(c.id,route.messageId):prioritizeConversationMessage(c.id,firebaseUser.uid,route.messageId))");
const reveal=routeOwner.indexOf('state.selectedId=c.id;state.route="chat"');
assert.ok(subscribe>=0&&prioritize>subscribe&&reveal>prioritize,
  "the existing stream and exact priority read must run before chat is revealed");
assert.match(routeOwner,/messageReady=notificationMessageHasProjected\(route\)[\s\S]*?return\{route,messageIds:[^}]+messageReady\}/,
  "activation must report exact keyed-message readiness");
assert.match(app,/if\(routed\?\.messageReady&&notificationRouteHasRendered\(routed\.route\)\)await finalizePendingNotificationRoute\(routed\)/,
  "the semaphore must remain set until the notified row and exact composer are mounted");
assert.match(app,/querySelectorAll\("#chatArea \[data-message-id\]"\)/,
  "completion must verify the exact notified row in the DOM");
assert.match(app,/Loading new message…/,
  "a bounded miss must remain visible and retain the pending semaphore");

const directStart=app.indexOf("function beginCloudMessageSubscription");
const directEnd=app.indexOf("async function initializeFirebaseLayer",directStart);
const directOwner=app.slice(directStart,directEnd);
assert.match(directOwner,/const outboxIds=meta\.partial===true\?\[\]:\(await getOutboxRecords\(\)\)/,
  "keyed priority display must not wait for IndexedDB Outbox maintenance");
assert.match(directOwner,/meta\.partial===true\s*\?planPartialDirectMessageProjection/,
  "the exact server row must merge without pretending to be authoritative history");
assert.match(directOwner,/render\(\{background:true\}\)[\s\S]*?maintenance:\[/,
  "visible projection must precede cache, persistence and receipt maintenance");
assert.match(directOwner,/requestAppActivation\("notification-message-projected"\)/,
  "a later listener delivery must wake the sole activation owner");

assert.match(firebase,/export async function prioritizeConversationMessage[\s\S]*?getDocFromServer\(s\.fsSdk\.doc\(s\.db,"conversations",key,"messages",id\)\)[\s\S]*?current!==stream[\s\S]*?stream\.owner\.offerPriority/,
  "the targeted read must rejoin the unchanged per-conversation owner");
assert.equal((firebase.match(/onSnapshot\(q,\{includeMetadataChanges:true\}/g)||[]).length,1,
  "direct-message delivery must retain one listener implementation");
assert.match(worker,/"\.\/direct-message-delivery-owner\.js"/,
  "the installed PWA shell must cache the delivery-owner module");
assert.match(worker,/SHELL_REVISION="1\.1\.31-direct-projection-restore"/);

console.log("Notification priority semaphore integration gate passed");
