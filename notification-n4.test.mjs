import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const fn=readFileSync("functions/index.mjs","utf8"),core=readFileSync("functions/notification/direct-message-notification-core.mjs","utf8"),sw=readFileSync("service-worker.js","utf8"),version=readFileSync("version.js","utf8");
assert.match(fn,/onDocumentCreated/);assert.match(fn,/conversations\/\{conversationId\}\/messages\/\{messageId\}/);assert.match(fn,/fidunio-notification@fidunio-fef13\.iam\.gserviceaccount\.com/);assert.match(fn,/directNotificationCore\.handleCreatedMessage/);
assert.match(core,/data:\{type:"direct-message",conversationId,messageId,notificationBody\}/);assert.match(core,/showSenderName===true/);assert.match(core,/profileRepo\.getDisplayName\(senderUid\)/);assert.doesNotMatch(core,/notification:\{title:/);assert.doesNotMatch(core,/message\.text|message\.ciphertext|message\.senderName/);
assert.match(sw,/firebase-messaging-sw\.js/);assert.match(sw,/onBackgroundMessage\(notificationMessaging/);assert.match(sw,/showNotification\(FIDUNIO_BACKGROUND_NOTIFICATION_TITLE/);assert.doesNotMatch(sw,/addEventListener\("push"/);assert.doesNotMatch(sw,/decrypt|markCloudConversationRead|updateCloudMessageState/);
assert.match(sw,/SHELL_REVISION="1\.1\.33-mass-delete-convergence"/);assert.match(version,/version: "1\.1\.33"/);
console.log("FCM N4 data-only service-worker notification ownership gate passed");
