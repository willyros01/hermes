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
assert.match(plug,/p\.contains\("ADM"\)/);
assert.match(plug,/p\.contains\("FCM"\)/);
assert.match(plug,/ret\.put\("provider",p\)/);
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

// Runtime regression: Wire-style A3L detection must produce a provider-matched
// lease token, never silently assume FCM when ADM detection fails.
const {getNativeMessagingToken,getNativeNotificationLeasePlatform,
  getNativeNotificationCapability,requestNativeNotificationPermission}=
  await import('../notification-platform-adapter.js');
let runtime='android',provider='adm',fcmTokenCalls=0,admTokenCalls=0;
const amazonToken='A'.repeat(64),googleToken='F'.repeat(64);
const admBridge={
  available:async()=>({supported:['adm','fcm'].includes(provider),provider,permission:'granted'}),
  register:async()=>{admTokenCalls++;return {provider:'adm',token:amazonToken};}
};
const googleBridge={
  isSupported:async()=>({isSupported:true}),
  checkPermissions:async()=>({receive:'granted'}),
  requestPermissions:async()=>({receive:'granted'}),
  getToken:async()=>{fcmTokenCalls++;return{token:googleToken};}
};
globalThis.Capacitor={isNativePlatform:()=>true,getPlatform:()=>runtime,
  Plugins:{FidunioAdm:admBridge,FirebaseMessaging:googleBridge}};
assert.deepEqual(await getNativeNotificationCapability(),{supported:true,permission:'granted'});
assert.equal(await requestNativeNotificationPermission(),'granted');
assert.equal(await getNativeMessagingToken(),amazonToken);
assert.equal(getNativeNotificationLeasePlatform(),'android-adm');
assert.equal(admTokenCalls,1,'ADM pending token must be reused');
assert.equal(fcmTokenCalls,0,'Amazon device must never request an FCM token');
provider='fcm';
assert.deepEqual(await getNativeNotificationCapability(),{supported:true,permission:'granted'});
assert.equal(await getNativeMessagingToken(),googleToken);
assert.equal(getNativeNotificationLeasePlatform(),'android-native');
assert.equal(fcmTokenCalls,1);
provider='';
assert.deepEqual(await getNativeNotificationCapability(),{supported:false,permission:'unsupported'});
await assert.rejects(getNativeMessagingToken(),/Neither Amazon ADM nor Google FCM/);
assert.equal(fcmTokenCalls,1,'Unknown Android provider must not fall back to FCM');
admBridge.available=async()=>{throw Error('A3L failed');};
await assert.rejects(getNativeMessagingToken(),/provider detection failed/);
assert.equal(fcmTokenCalls,1,'Failed A3L lookup must not fall back to FCM');
runtime='ios';
assert.equal(await getNativeMessagingToken(),googleToken);
assert.equal(getNativeNotificationLeasePlatform(),'ios-native');
console.log('PASS: actual provider ADM/FCM token lease routing, unknown fail-closed, iOS preserved');

// The native Settings UI must reject stale/expired/cross-provider registrations.
const {confirmedNativeNotificationLease}=await import('../notification-native-status-policy.js');
const now=1750000000000,installId='install-android-0001',uid='user-1',leaseId='lease-1';
const row={ownerUid:uid,installationId:installId,leaseId,fcmToken:amazonToken,enabled:true,platform:'android-adm',leaseUntilMs:now+100000};
const retainedLease={uid,installationId:installId,leaseId,fcmToken:amazonToken};
const valid=registration=>confirmedNativeNotificationLease({uid,provider:'adm',registration,retainedLease,nowMs:now});
assert.equal(valid(row),true);
assert.equal(valid({...row,platform:'android-native'}),false);
assert.equal(valid({...row,leaseUntilMs:now-1}),false);
assert.equal(valid({...row,leaseId:'old'}),false);
assert.equal(valid({...row,ownerUid:'different'}),false);
assert.equal(valid({...row,leaseUntilMs:undefined,leaseId:undefined}),false);
assert.equal(confirmedNativeNotificationLease({uid,provider:'adm',registration:row,retainedLease:null,nowMs:now}),false);
assert.equal(confirmedNativeNotificationLease({uid,provider:'fcm',registration:row,retainedLease,nowMs:now}),false);
assert.equal(confirmedNativeNotificationLease({uid,provider:'',registration:row,retainedLease,nowMs:now}),false);
console.log('PASS: Fire native status needs current authenticated and matching provider lease');
