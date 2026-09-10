import assert from "node:assert/strict";
import {createDirectMessageNotificationCore,deriveDirectRecipientUid,isInvalidNotificationTokenError} from "./direct-message-notification-core.mjs";

assert.equal(deriveDirectRecipientUid({conversation:{type:"direct",members:["u1","u2"]},message:{senderUid:"u1"}}),"u2");
assert.throws(()=>deriveDirectRecipientUid({conversation:{type:"group",members:["u1","u2"]},message:{senderUid:"u1"}}));
assert.equal(isInvalidNotificationTokenError({code:"messaging/registration-token-not-registered"}),true);

const calls=[];
const deleted=[];
const core=createDirectMessageNotificationCore({
  conversationRepo:{get:async id=>({id,type:"direct",members:["sender","recipient"]})},
  profileRepo:{getDisplayName:async uid=>uid==="sender"?"Authoritative Alice":""},
  deviceRepo:{
    listActive:async()=>[
      {installationId:"install-a",fcmToken:"a".repeat(80),enabled:true,showSenderName:false},
      {installationId:"install-b",fcmToken:"b".repeat(80),enabled:true,showSenderName:true}
    ],
    deleteIfTokenMatches:async(...args)=>{deleted.push(args);return true;}
  },
  messaging:{sendEachForMulticast:async payload=>{
    calls.push(payload);
    return payload.tokens[0][0]==="a"
      ?{successCount:1,failureCount:0,responses:[{success:true}]}
      :{successCount:0,failureCount:1,responses:[{success:false,error:{code:"messaging/registration-token-not-registered"}}]};
  }},
  logger:{warn(){}}
});

const result=await core.handleCreatedMessage({
  conversationId:"dm-1",
  messageId:"m-1",
  message:{senderUid:"sender",ciphertext:"SECRET-CIPHERTEXT",senderName:"Untrusted Message Name",text:"PLAINTEXT-MUST-NOT-LEAK"}
});

assert.equal(result.recipientUid,"recipient");
assert.equal(result.sent,1);
assert.equal(result.pruned,1);
assert.equal(calls.length,2);
assert.equal("notification" in calls[0],false);
assert.equal("notification" in calls[1],false);
assert.deepEqual(calls[0].data,{type:"direct-message",conversationId:"dm-1",messageId:"m-1",notificationBody:"New message"});
assert.deepEqual(calls[1].data,{type:"direct-message",conversationId:"dm-1",messageId:"m-1",notificationBody:"New message from Authoritative Alice"});
for(const payload of calls){
  assert.deepEqual(payload.webpush,{headers:{Urgency:"high"}});
  const serialized=JSON.stringify(payload);
  assert.doesNotMatch(serialized,/PLAINTEXT-MUST-NOT-LEAK|SECRET-CIPHERTEXT|Untrusted Message Name/);
}
assert.deepEqual(deleted,[["recipient","install-b","b".repeat(80)]]);

let sent=false;
const noDevices=createDirectMessageNotificationCore({
  conversationRepo:{get:async()=>({type:"direct",members:["s","r"]})},
  profileRepo:{getDisplayName:async()=>"Sender"},
  deviceRepo:{listActive:async()=>[],deleteIfTokenMatches:async()=>false},
  messaging:{sendEachForMulticast:async()=>{sent=true;}}
});
const noResult=await noDevices.handleCreatedMessage({conversationId:"c",messageId:"m",message:{senderUid:"s"}});
assert.equal(noResult.status,"no-active-installations");
assert.equal(sent,false);
console.log("FCM direct data-only notification privacy gate passed");
