import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeNotificationRoute} from "./notification-routing.js";
import {notificationEnvelopeFromFcmPayload} from "./notification-background-policy.js";

const functionsIndex=readFileSync("functions/index.mjs","utf8");
const backend=readFileSync("functions/notification/group-message-notification-core.mjs","utf8");
const adapter=readFileSync("functions/notification/direct-message-notification-firestore-admin-adapter.mjs","utf8");
const app=readFileSync("app.js","utf8");
const firebase=readFileSync("firebase.js","utf8");
const groupOwner=readFileSync("e2ee-account-group-conversation.js","utf8");
const worker=readFileSync("service-worker.js","utf8");

assert.match(functionsIndex,/document:"groups\/\{groupId\}\/messages\/\{messageId\}"/);
assert.match(functionsIndex,/notifyGroupMessageCreatedV1/);
assert.match(functionsIndex,/serviceAccount:NOTIFICATION_SERVICE_ACCOUNT/);
assert.match(adapter,/db\.doc\(`groups\/\$\{groupId\}`\)\.get\(\)/);
assert.match(backend,/deriveGroupRecipientUids/);
assert.match(backend,/members\.filter\(uid=>uid!==senderUid\)/);
assert.match(backend,/deviceRepo\.listActive\(recipientUid\)/);
assert.match(backend,/MAX_MULTICAST_TOKENS=500/);
assert.match(backend,/data:\{type:"group-message",conversationId:groupId,messageId,notificationBody\}/);
assert.doesNotMatch(backend,/message\.text|message\.ciphertext|message\.senderName|notification:\{title/);

const route=normalizeNotificationRoute({type:"group-message",conversationId:"group-opaque",messageId:"message-opaque"});
assert.deepEqual({...route},{type:"group-message",conversationId:"group-opaque",messageId:"message-opaque"});
const envelope=notificationEnvelopeFromFcmPayload({data:{...route,notificationBody:"New message"}});
assert.deepEqual({...envelope.route},{...route});
assert.match(worker,/\["direct-message","group-message"\]\.includes\(value\?\.type\)/);

const routeStart=app.indexOf("async function applyPendingNotificationRoute");
const routeEnd=app.indexOf("async function finalizePendingNotificationRoute",routeStart);
const routeOwner=app.slice(routeStart,routeEnd);
assert.match(routeOwner,/const groupRoute=route\.type==="group-message"/);
assert.match(routeOwner,/getCloudGroupFromServer\(route\.conversationId,firebaseUser\.uid\)/);
assert.match(routeOwner,/beginCloudGroupMessageSubscription\(c\.id\)[\s\S]*?prioritizeGroupMessageForApp\(c\.id,route\.messageId\)/);
assert.match(routeOwner,/state\.selectedId=c\.id;state\.route="chat"/);
assert.equal((app.match(/applyPendingNotificationRoute\(\)/g)||[]).length,2);

assert.match(firebase,/export async function getCloudGroupFromServer[\s\S]*?getDocFromServer/);
assert.match(firebase,/export async function getCloudGroupMessageFromServer[\s\S]*?getDocFromServer/);
assert.match(groupOwner,/export function prioritizeAccountGroupConversationMessage/);
assert.match(groupOwner,/const priorities=new Map\(\)/);
assert.match(groupOwner,/if\(priority\)[\s\S]*?if\(!pendingSnapshot\)break/);
assert.match(groupOwner,/await onRows\?\.\(merged,meta\)/);
assert.doesNotMatch(groupOwner,/state\.|render\(/);

console.log("FCM N6 group notification single-owner and privacy integration gate passed");
