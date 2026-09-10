import assert from "node:assert/strict";
import fs from "node:fs";
import {groupPendingNotificationRoutes} from "./notification-pending-inbox.js";

const inbox=fs.readFileSync("notification-pending-inbox.js","utf8");
const worker=fs.readFileSync("service-worker.js","utf8");
const app=fs.readFileSync("app.js","utf8");
const settings=fs.readFileSync("settings-lifecycle.js","utf8");
const bootstrap=fs.readFileSync("bootstrap.js","utf8");
const auth=fs.readFileSync("auth-ui-clean.js","utf8");

assert.match(inbox,/fidunio-notification-pending-v1/);
assert.match(inbox,/keyPath:"messageId"/);
assert.match(inbox,/normalizeNotificationRoute/);
const grouped=groupPendingNotificationRoutes([
  {type:"direct-message",conversationId:"conversation-a",messageId:"message-a1"},
  {type:"direct-message",conversationId:"conversation-a",messageId:"message-a2"},
  {type:"direct-message",conversationId:"conversation-b",messageId:"message-b1"},
  {type:"group",conversationId:"rejected",messageId:"rejected"}
]);
assert.equal(grouped.length,2);
assert.deepEqual(grouped[0].messageIds,["message-a1","message-a2"]);
assert.equal(grouped[0].route.messageId,"message-a2");
assert.equal(grouped[1].route.conversationId,"conversation-b");
assert.match(worker,/await storePendingNotificationRoute\(envelope\.route\)/);
assert.match(worker,/storePendingNotificationRoute\(envelope\.route\)[\s\S]*showNotification/);
assert.match(app,/listPendingNotificationRoutes/);
assert.match(app,/hydrated\|\|!state\.unlocked\|\|!firebaseUser/);
assert.match(app,/notificationInbox/);
assert.match(app,/consumePendingNotificationRoutes/);
assert.doesNotMatch(worker,/notification-diagnostics/);
assert.doesNotMatch(app,/recordNotificationDiagnostic/);
assert.doesNotMatch(settings,/Notification Diagnostics/);
assert.doesNotMatch(bootstrap,/notification-diagnostics/);
assert.doesNotMatch(auth,/notification-diagnostics/);
console.log("Installation-local pending notification inbox gate passed");
