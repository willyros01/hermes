import assert from "node:assert/strict";
import {detectFidunioPlatform,FIDUNIO_PLATFORM,shouldUseWebPush,shouldUseWebAppCheck} from "./platform-runtime.js";
import {getBackgroundPlatformKind,getPlatformBackgroundRegistration,ensurePlatformBackgroundRegistration,subscribePlatformBackgroundMessages} from "./background-platform-adapter.js";
import {getNotificationPlatformCapabilities} from "./notification-platform-adapter.js";
import {getPlatformFirebaseSdkVersion,FIDUNIO_FIREBASE_SDK_VERSION} from "./firebase-platform-adapter.js";
import {downloadPlatformAttachmentBytes} from "./attachment-download-platform-adapter.js";

const web={capacitor:null,protocol:"https:"};
const native={capacitor:{isNativePlatform:()=>true,getPlatform:()=>"ios"},protocol:"capacitor:"};
assert.equal(detectFidunioPlatform(web),FIDUNIO_PLATFORM.WEB);
assert.equal(detectFidunioPlatform(native),FIDUNIO_PLATFORM.IOS_NATIVE);
assert.equal(shouldUseWebPush(web),true);
assert.equal(shouldUseWebAppCheck(web),true);
assert.equal(getBackgroundPlatformKind(web),"web-service-worker");
assert.equal(getBackgroundPlatformKind(native),"ios-native");
assert.equal(getNotificationPlatformCapabilities(web).registrationKind,"web-push");
assert.equal(getPlatformFirebaseSdkVersion(web),FIDUNIO_FIREBASE_SDK_VERSION.WEB);
assert.equal(getPlatformFirebaseSdkVersion(native),FIDUNIO_FIREBASE_SDK_VERSION.IOS_NATIVE);
assert.equal(await ensurePlatformBackgroundRegistration({platformOptions:native}),null);

let attempts=0;const events=new Map();
globalThis.navigator={serviceWorker:{
  register:async(url,options)=>{attempts++;assert.equal(url,"./service-worker.js");assert.equal(options.type,"module");if(attempts===1)throw new Error("offline");return {update:async()=>{}};},
  addEventListener:(name,cb)=>events.set(name,cb),
  removeEventListener:(name,cb)=>{if(events.get(name)===cb)events.delete(name);},
}};
await assert.rejects(getPlatformBackgroundRegistration({platformOptions:web}),/offline/);
await getPlatformBackgroundRegistration({platformOptions:web});
assert.equal(attempts,2,"failed registration must be retryable");
let received=null;
const stop=subscribePlatformBackgroundMessages(data=>received=data,{platformOptions:web});
events.get("message")({data:{type:"FIDUNIO_ROUTE"}});
assert.deepEqual(received,{type:"FIDUNIO_ROUTE"});
stop();assert.equal(events.has("message"),false);

const bytes=new Uint8Array([1,2,3,4]).buffer;
let fetchCount=0;
const downloaded=await downloadPlatformAttachmentBytes("https://example.invalid/object",{
 platformOptions:web,
 fetchImpl:async(url,options)=>{fetchCount++;assert.equal(options.cache,"no-store");return{ok:true,arrayBuffer:async()=>bytes};}
});
assert.deepEqual([...new Uint8Array(downloaded)],[1,2,3,4]);
assert.equal(fetchCount,1);
console.log("PASS: main-3 web adapters select browser transport, retry service-worker registration, and preserve attachment bytes");
