import assert from "node:assert/strict";
import {createGroupMessageNotificationCore,deriveGroupRecipientUids} from "./group-message-notification-core.mjs";

assert.deepEqual(deriveGroupRecipientUids({group:{type:"group",memberUids:["sender","u2","u3","u2"]},message:{senderUid:"sender"}}),["u2","u3"]);
assert.throws(()=>deriveGroupRecipientUids({group:{type:"group",memberUids:["u2"]},message:{senderUid:"sender"}}));

const calls=[],deleted=[],listed=[];
const core=createGroupMessageNotificationCore({
  groupRepo:{get:async id=>({id,type:"group",memberUids:["sender","u2","u3"]})},
  profileRepo:{getDisplayName:async uid=>uid==="sender"?"Authoritative Alice":""},
  deviceRepo:{
    listActive:async uid=>{listed.push(uid);return uid==="u2"
      ?[{installationId:"u2-private",fcmToken:"a".repeat(80),enabled:true,showSenderName:false},{installationId:"u2-disabled",fcmToken:"x".repeat(80),enabled:false}]
      :[{installationId:"u3-named",fcmToken:"b".repeat(80),enabled:true,showSenderName:true}];},
    deleteIfTokenMatches:async(...args)=>{deleted.push(args);return true;}
  },
  messaging:{sendEachForMulticast:async payload=>{calls.push(payload);return payload.tokens[0][0]==="a"
    ?{successCount:1,failureCount:0,responses:[{success:true}]}
    :{successCount:0,failureCount:1,responses:[{success:false,error:{code:"messaging/registration-token-not-registered"}}]};}},
  logger:{warn(){}}
});

const result=await core.handleCreatedMessage({groupId:"group-1",messageId:"message-1",message:{senderUid:"sender",text:"PLAINTEXT-MUST-NOT-LEAK",ciphertext:"SECRET-CIPHERTEXT",senderName:"Untrusted Name"}});
assert.deepEqual(listed,["u2","u3"]);
assert.equal(result.recipientCount,2);
assert.equal(result.sent,1);
assert.equal(result.pruned,1);
assert.equal(calls.length,2);
assert.deepEqual(calls[0].data,{type:"group-message",conversationId:"group-1",messageId:"message-1",notificationBody:"New message"});
assert.deepEqual(calls[1].data,{type:"group-message",conversationId:"group-1",messageId:"message-1",notificationBody:"New message from Authoritative Alice"});
for(const payload of calls){assert.equal("notification" in payload,false);assert.deepEqual(payload.webpush,{headers:{Urgency:"high"}});assert.doesNotMatch(JSON.stringify(payload),/PLAINTEXT-MUST-NOT-LEAK|SECRET-CIPHERTEXT|Untrusted Name|u2|u3/);}
assert.deepEqual(deleted,[["u3","u3-named","b".repeat(80)]]);

let sent=false;
const empty=createGroupMessageNotificationCore({groupRepo:{get:async()=>({type:"group",memberUids:["s"]})},profileRepo:{getDisplayName:async()=>""},deviceRepo:{listActive:async()=>[],deleteIfTokenMatches:async()=>false},messaging:{sendEachForMulticast:async()=>{sent=true;}}});
const emptyResult=await empty.handleCreatedMessage({groupId:"g",messageId:"m",message:{senderUid:"s"}});
assert.equal(emptyResult.status,"no-active-installations");
assert.equal(sent,false);

const batchSizes=[];
const batched=createGroupMessageNotificationCore({
  groupRepo:{get:async()=>({type:"group",memberUids:["sender","recipient"]})},
  profileRepo:{getDisplayName:async()=>""},
  deviceRepo:{
    listActive:async()=>Array.from({length:501},(_,index)=>({installationId:`device-${index}`,fcmToken:`token-${String(index).padStart(4,"0")}-${"z".repeat(24)}`,enabled:true,showSenderName:false})),
    deleteIfTokenMatches:async()=>false
  },
  messaging:{sendEachForMulticast:async payload=>{batchSizes.push(payload.tokens.length);return{successCount:payload.tokens.length,failureCount:0,responses:payload.tokens.map(()=>({success:true}))};}}
});
const batchedResult=await batched.handleCreatedMessage({groupId:"group-batch",messageId:"message-batch",message:{senderUid:"sender"}});
assert.deepEqual(batchSizes,[500,1]);
assert.equal(batchedResult.sent,501);
console.log("FCM group notification membership, fan-out, privacy, and stale-token gates passed");
