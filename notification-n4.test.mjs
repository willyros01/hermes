import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const fn=readFileSync("functions/index.mjs","utf8"),core=readFileSync("functions/notification/direct-message-notification-core.mjs","utf8"),sw=readFileSync("service-worker.js","utf8"),version=readFileSync("version.js","utf8");
assert.match(fn,/onDocumentCreated/);assert.match(fn,/conversations\/\{conversationId\}\/messages\/\{messageId\}/);assert.match(fn,/fidunio-notification@fidunio-fef13\.iam\.gserviceaccount\.com/);assert.match(fn,/directNotificationCore\.handleCreatedMessage/);
assert.match(core,/notification:\{title:FIDUNIO_NOTIFICATION_TITLE,body:FIDUNIO_NOTIFICATION_BODY\}/);assert.match(core,/data:\{type:"direct-message",conversationId,messageId\}/);assert.doesNotMatch(core,/message\.text|message\.ciphertext|message\.senderName/);
assert.match(sw,/addEventListener\("push"/);assert.match(sw,/showNotification\("FIDUNIO",\{body:"New message"/);assert.match(sw,/visibilityState==="visible"/);assert.doesNotMatch(sw,/decrypt|markCloudConversationRead|updateCloudMessageState/);
assert.match(sw,/SHELL_REVISION="1\.1\.6-fcm-n5-routing"/);assert.match(version,/version: "1\.1\.6"/);
console.log("FCM N4 direct background notification ownership gate passed");
