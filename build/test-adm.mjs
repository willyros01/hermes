import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createAmazonADMDelivery} from '../functions/notification/adm-delivery.mjs';

const read=path=>fs.readFileSync(path,'utf8');
const plug=read('android-src/native/FidunioAdmPlugin.java');
const recv=read('android-src/native/FidunioAdmService.java');
const builder=read('build/android-build.sh');
const workflow=read('.github/workflows/android-apk.yml');
const adapter=read('notification-platform-adapter.js');
const lease=read('settings-lifecycle.js');
const backend=read('functions/index.mjs');
const direct=read('functions/notification/direct-message-notification-core.mjs');
const group=read('functions/notification/group-message-notification-core.mjs');

assert.match(plug,/A3LMessaging\.getToken/);
assert.match(plug,/provider","adm"/);
assert.match(plug,/takeRoute/);
assert.match(recv,/A3LMessagingService/);
assert.match(recv,/NotificationCompat/);
assert.match(recv,/fidunioConversationId/);
assert.match(builder,/bash build\/fadm\.sh/);
assert.match(workflow,/FIDUNIO_ADM_API_KEY:.*secrets\.FIDUNIO_ADM_API_KEY/);
assert.match(workflow,/\[ -z "\$FIDUNIO_ADM_API_KEY" \]/);
assert.match(adapter,/getNativeNotificationLeasePlatform/);
assert.match(adapter,/FidunioAdm/);
assert.match(lease,/getPlatform:getNativeNotificationLeasePlatform/);
assert.match(backend,/secrets:\[ADM_CLIENT_ID,ADM_CLIENT_SECRET\]/);
assert.match(direct,/row\.platform!=="android-adm"/);
assert.match(group,/row\.platform!=="android-adm"/);
assert.ok(!recv.includes('body=data.get("messageText")'));

let tokenCalls=0,sendCalls=0,lastPayload;
const fetcher=async(url,options)=>{
  if(url.endsWith('/auth/O2/token')){
    tokenCalls++;
    assert.match(options.body,/scope=messaging%3Apush/);
    return {ok:true,json:async()=>({access_token:'realistic-bearer-token',token_type:'bearer',expires_in:3600})};
  }
  assert.match(url,/\/messaging\/registrations\//);
  assert.equal(options.headers.Authorization,'Bearer realistic-bearer-token');
  sendCalls++;
  lastPayload=JSON.parse(options.body);
  return {ok:true,json:async()=>({})};
};
const sender=createAmazonADMDelivery({getCredentials:()=>({
  clientId:'example-client-id',clientSecret:'example-client-secret'}),fetcher});
const token='a'.repeat(50);
const data={type:'direct-message',conversationId:'group_1',messageId:'msg_2',notificationBody:'New message'};
assert.deepEqual(await sender.send({token,data}),{success:true,invalid:false});
await sender.send({token,data:{...data,type:'group-message'}});
assert.equal(tokenCalls,1,'OAuth tokens should be cached');
assert.equal(sendCalls,2);
assert.equal(lastPayload.priority,'normal');
assert.equal(lastPayload.expiresAfter,1800);
assert.deepEqual(Object.keys(lastPayload.data).sort(),['conversationId','messageId','notificationBody','type']);
await assert.rejects(sender.send({token,data:{...data,notificationBody:'Secret conversation text'}}),/private notification body/);
console.log('PASS: ADM native files, existing FCM separation, server OAuth/privacy, fail-closed signing gate');
