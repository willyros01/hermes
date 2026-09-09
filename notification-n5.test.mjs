import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeNotificationRoute,notificationRouteFromUrl,urlWithoutNotificationRoute,FIDUNIO_NOTIFICATION_ROUTE_MESSAGE} from "./notification-routing.js";

const route=normalizeNotificationRoute({type:"direct-message",conversationId:"conv-12345678",messageId:"msg-12345678"});
assert.deepEqual({...route},{type:"direct-message",conversationId:"conv-12345678",messageId:"msg-12345678"});
assert.equal(normalizeNotificationRoute({type:"group-message",conversationId:"c",messageId:"m"}),null);
assert.equal(notificationRouteFromUrl("https://example.test/hermes/?fidunioNotification=direct-message&conversationId=conv-12345678&messageId=msg-12345678")?.conversationId,"conv-12345678");
assert.equal(urlWithoutNotificationRoute("https://example.test/hermes/?fidunioNotification=direct-message&conversationId=c&messageId=m&keep=1#x"),"/hermes/?keep=1#x");
assert.equal(FIDUNIO_NOTIFICATION_ROUTE_MESSAGE,"fidunio-notification-route");

const sw=readFileSync("service-worker.js","utf8"),app=readFileSync("app.js","utf8"),version=readFileSync("version.js","utf8");
assert.match(sw,/addEventListener\("notificationclick"/);
assert.match(sw,/event\.notification\.close\(\)/);
assert.match(sw,/clients\.matchAll\(\{type:"window",includeUncontrolled:true\}\)/);
assert.match(sw,/client\.postMessage\(\{type:"fidunio-notification-route",route\}\)/);
assert.match(sw,/clients\.openWindow/);
assert.match(sw,/fidunioNotification/);
assert.doesNotMatch(sw,/decrypt|markCloudConversationRead|updateCloudMessageState/);
assert.match(app,/notificationRouteFromUrl/);
assert.match(app,/navigator\.serviceWorker\.addEventListener\("message"/);
assert.match(app,/getCloudConversation\(route\.conversationId,firebaseUser\.uid\)/);
assert.match(app,/beginCloudMessageSubscription\(c\.id,\{force:true\}\)/);
assert.match(app,/state\.selectedId=c\.id;state\.route="chat"/);
assert.doesNotMatch(app,/pendingNotificationRoute[\s\S]{0,500}state\.messages\[/);
assert.match(sw,/SHELL_REVISION="1\.1\.6-fcm-n5-routing"/);
assert.match(version,/version: "1\.1\.6"/);
console.log("FCM N5 notification tap routing gate passed");
