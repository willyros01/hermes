import assert from "node:assert/strict";
import {createDirectMessageNotificationCore,deriveDirectRecipientUid,isInvalidNotificationTokenError} from "./direct-message-notification-core.mjs";

assert.equal(deriveDirectRecipientUid({conversation:{type:"direct",members:["u1","u2"]},message:{senderUid:"u1"}}),"u2");
assert.throws(()=>deriveDirectRecipientUid({conversation:{type:"group",members:["u1","u2"]},message:{senderUid:"u1"}}));
assert.equal(isInvalidNotificationTokenError({code:"messaging/registration-token-not-registered"}),true);

const calls=[],deleted=[];
const core=createDirectMessageNotificationCore({
  conversationRepo:{get:async id=>({id,type:"direct",members:["sender","recipient"]})},
  deviceRepo:{listActive:async uid=>[{installationId:"install-a",fcmToken:"a".repeat(80),enabled:true},{installationId:"install-b",fcmToken:"b".repeat(80),enabled:true}],deleteIfTokenMatches:async(...args)=>{deleted.push(args);return true;}},
  messaging:{sendEachForMulticast:async payload=>{calls.push(payload);return{successCount:1,failureCount:1,responses:[{success:true},{success:false,error:{code:"messaging/registration-token-not-registered"}}]};}},
  logger:{warn(){}}
});
const result=await core.handleCreatedMessage({conversationId:"dm-1",messageId:"m-1",message:{senderUid:"sender",ciphertext:"SECRET-CIPHERTEXT",senderName:"Private Sender",text:"PLAINTEXT-MUST-NOT-LEAK"}});
assert.equal(result.recipientUid,"recipient");assert.equal(result.sent,1);assert.equal(result.pruned,1);assert.equal(calls.length,1);
const payload=calls[0];
assert.deepEqual(payload.notification,{title:"FIDUNIO",body:"New message"});
assert.deepEqual(payload.data,{type:"direct-message",conversationId:"dm-1",messageId:"m-1"});
const serialized=JSON.stringify(payload);
assert.doesNotMatch(serialized,/PLAINTEXT-MUST-NOT-LEAK|SECRET-CIPHERTEXT|Private Sender/);
assert.deepEqual(deleted,[["recipient","install-b","b".repeat(80)]]);

let sent=false;
const noDevices=createDirectMessageNotificationCore({conversationRepo:{get:async()=>({type:"direct",members:["s","r"]})},deviceRepo:{listActive:async()=>[],deleteIfTokenMatches:async()=>false},messaging:{sendEachForMulticast:async()=>{sent=true;}}});
const noResult=await noDevices.handleCreatedMessage({conversationId:"c",messageId:"m",message:{senderUid:"s"}});assert.equal(noResult.status,"no-active-installations");assert.equal(sent,false);
console.log("FCM N4 direct notification server core gate passed");
