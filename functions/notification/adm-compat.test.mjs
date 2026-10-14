// Fail-closed compatibility regression tests; mock transports only.
import test from "node:test";
import assert from "node:assert/strict";
import {createAmazonADMDelivery} from "./adm-delivery.mjs";
import {createDirectMessageNotificationCore} from "./direct-message-notification-core.mjs";
import {createGroupMessageNotificationCore} from "./group-message-notification-core.mjs";

const token="A".repeat(80);
const fcm="F".repeat(80);
const msg={senderUid:"sender",text:"NEVER-LEAK-PLAINTEXT",ciphertext:"NEVER-LEAK-CIPHERTEXT"};
function clean(value){
  assert.doesNotMatch(JSON.stringify(value),/NEVER-LEAK|ciphertext|\.repeat/);
}

test("Amazon OAuth and encrypted-message-neutral payload",async()=>{
  const seen=[];
  const clientId="amzn1.application-oa2-client."+"x".repeat(36);
  const sender=createAmazonADMDelivery({
    getCredentials:()=>({clientId,clientSecret:"fake-private-for-mocks-only"}),
    fetcher:async (url,options)=>{
      seen.push({url,options});
      if(url.includes("/auth/O2/token"))return {ok:true,json:async()=>({
        token_type:"bearer",access_token:"mock-bearer-token-123",expires_in:3600})};
      return {ok:true,json:async()=>({})};
    }
  });
  const payload={type:"direct-message",conversationId:"dm.1",messageId:"m.1",notificationBody:"New message"};
  assert.deepEqual(await sender.send({token,data:payload}),{success:true,invalid:false});
  assert.equal(seen.length,2);
  assert.equal(new URLSearchParams(seen[0].options.body).get("client_id"),clientId);
  assert.equal(new URLSearchParams(seen[0].options.body).get("scope"),"messaging:push");
  assert.ok(seen[1].url.includes("/messaging/registrations/"));
  assert.deepEqual(JSON.parse(seen[1].options.body).data,payload);
  assert.equal(JSON.parse(seen[1].options.body).expiresAfter,1800);
  assert.equal(JSON.parse(seen[1].options.body).priority,"normal");
  clean(JSON.parse(seen[1].options.body));
  await sender.send({token,data:payload});
  assert.equal(seen.filter(x=>x.url.includes("/auth/O2/token")).length,1,"OAuth bearer should be reused");
  await assert.rejects(sender.send({token:"short",data:payload}),/Invalid ADM token/);
  await assert.rejects(sender.send({token,data:{...payload,notificationBody:"message text"}}),/approved private/);
});
test("direct routes Amazon only to ADM while preserving APNs and web FCM",async()=>{
  const fcmCalls=[],admCalls=[];
  const core=createDirectMessageNotificationCore({
    conversationRepo:{get:async()=>({type:"direct",members:["sender","recipient"]})},
    profileRepo:{getDisplayName:async()=>"Alice"},
    blockRepo:{isBlockedEitherDirection:async()=>false},
    deviceRepo:{listActive:async()=>[
      {enabled:true,platform:"ios",installationId:"ios",fcmToken:fcm,showSenderName:false},
      {enabled:true,platform:"android-adm",installationId:"fire",fcmToken:token,showSenderName:true}],
      deleteIfTokenMatches:async()=>false},
    messaging:{sendEachForMulticast:async p=>{fcmCalls.push(p);return {
      responses:[{success:true}],successCount:1,failureCount:0};}},
    admDelivery:{send:async p=>{admCalls.push(p);return {success:true};}}
  });
  const result=await core.handleCreatedMessage({conversationId:"dm1",messageId:"m1",message:msg});
  assert.equal(result.sent,2);
  assert.equal(result.failed,0);
  assert.equal(fcmCalls.length,1);
  assert.deepEqual(fcmCalls[0].tokens,[fcm]);
  assert.equal(fcmCalls[0].apns.payload.aps.alert.body,"New message");
  assert.deepEqual(admCalls,[{token,data:{
    type:"direct-message",conversationId:"dm1",messageId:"m1",
    notificationBody:"New message from Alice"}}]);
  clean(fcmCalls);
  clean(admCalls);
});
test("blocked direct messages never send to either provider",async()=>{
  const core=createDirectMessageNotificationCore({
    conversationRepo:{get:async()=>({type:"direct",members:["sender","recipient"]})},
    profileRepo:{getDisplayName:async()=>""},
    blockRepo:{isBlockedEitherDirection:async()=>true},
    deviceRepo:{listActive:async()=>{throw Error("no device lookup after block")},deleteIfTokenMatches:async()=>false},
    messaging:{sendEachForMulticast:async()=>{throw Error("blocked FCM")}},
    admDelivery:{send:async()=>{throw Error("blocked ADM")}}
  });
  assert.equal((await core.handleCreatedMessage({conversationId:"dm1",messageId:"m1",message:msg})).status,"blocked");
});
test("group routes Fire to ADM, without passing Amazon token to FCM",async()=>{
  const fcmCalls=[],admCalls=[];
  const core=createGroupMessageNotificationCore({
    groupRepo:{get:async()=>({type:"group",memberUids:["sender","recipient"]})},
    profileRepo:{getDisplayName:async()=>"Alice"},
    deviceRepo:{listActive:async()=>[
      {enabled:true,platform:"web",installationId:"web",fcmToken:fcm,showSenderName:false},
      {enabled:true,platform:"android-adm",installationId:"fire",fcmToken:token,showSenderName:false}],
      deleteIfTokenMatches:async()=>false},
    messaging:{sendEachForMulticast:async p=>{fcmCalls.push(p);return {
      responses:[{success:true}],successCount:1,failureCount:0};}},
    admDelivery:{send:async p=>{admCalls.push(p);return {success:true};}}
  });
  const result=await core.handleCreatedMessage({groupId:"grp1",messageId:"m1",message:msg});
  assert.equal(result.sent,2);
  assert.equal(result.failed,0);
  assert.equal(fcmCalls.length,1);
  assert.deepEqual(fcmCalls[0].tokens,[fcm]);
  assert.deepEqual(admCalls,[{token,data:{type:"group-message",conversationId:"grp1",
    messageId:"m1",notificationBody:"New message"}}]);
  clean(fcmCalls);
  clean(admCalls);
});
test("missing ADM sender never silently routes Fire token through FCM",async()=>{
  const calls=[];
  const core=createDirectMessageNotificationCore({
    conversationRepo:{get:async()=>({type:"direct",members:["sender","recipient"]})},
    profileRepo:{getDisplayName:async()=>""},
    blockRepo:{isBlockedEitherDirection:async()=>false},
    deviceRepo:{listActive:async()=>[
      {enabled:true,platform:"android-adm",installationId:"fire",fcmToken:token}],
      deleteIfTokenMatches:async()=>false},
    messaging:{sendEachForMulticast:async p=>{calls.push(p);return {successCount:0,failureCount:0};}},
    logger:{warn(){}}
  });
  const result=await core.handleCreatedMessage({conversationId:"dm1",messageId:"m1",message:msg});
  assert.equal(result.failed,1);
  assert.equal(calls.length,0);
});
