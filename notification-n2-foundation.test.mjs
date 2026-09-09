import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {deriveNotificationStatus,NOTIFICATION_STATUS,assertOpaqueNotificationRoute} from "./notification-policy.js";
import {createNotificationRegistrationOwner} from "./notification-registration.js";

const firebase=readFileSync("firebase.js","utf8"),registration=readFileSync("notification-registration.js","utf8"),sw=readFileSync("service-worker.js","utf8");
assert.match(firebase,/firebase-messaging\.js/);
assert.match(firebase,/getFidunioNotificationCapability/);
assert.match(firebase,/getFidunioMessagingToken/);
assert.match(firebase,/deleteFidunioMessagingToken/);
assert.equal((firebase.match(/initializeApp\(/g)||[]).length,1);
assert.doesNotMatch(registration,/firebase-app|firebase-firestore|initializeApp|getFirestore/);
assert.match(registration,/enableFromUserGesture/);

assert.equal(deriveNotificationStatus({supported:false}),NOTIFICATION_STATUS.UNSUPPORTED);
assert.equal(deriveNotificationStatus({supported:true,permission:"denied",enabled:true,configured:true}),NOTIFICATION_STATUS.DENIED);
assert.deepEqual(assertOpaqueNotificationRoute({type:"direct",conversationId:"c1",messageId:"m1"}),{type:"direct",conversationId:"c1",messageId:"m1"});
assert.throws(()=>assertOpaqueNotificationRoute({type:"x",conversationId:"c1"}));

let tokenDeletes=0,writes=[],permissionCalls=0;
const owner=createNotificationRegistrationOwner({
  getCapability:async()=>({supported:true,permission:"granted"}),
  getToken:async()=>"t".repeat(80),
  deleteToken:async()=>{tokenDeletes++;return true;},
  readRegistration:async()=>writes.at(-1)||null,
  writeRegistration:async row=>{writes.push(row);},
  deleteRegistration:async()=>{writes=[];},
  getConfigured:()=>true,
  requestPermission:()=>{permissionCalls++;return Promise.resolve("granted");},
  getServiceWorkerRegistration:async()=>({scope:"/"}),
  getInstallationId:()=>"install-12345678",
  getPlatform:()=>"ios-pwa"
});
await owner.enableFromUserGesture({uid:"u1",vapidKey:"public"});
assert.equal(permissionCalls,1);
assert.equal(writes.length,1);
assert.equal((await owner.getStatus("u1")).status,"ready");
await owner.disable({uid:"u1"});
assert.equal(tokenDeletes,1);
assert.match(sw,/firebase-messaging\.js/);
console.log("FCM N2 ownership foundation gate passed");
