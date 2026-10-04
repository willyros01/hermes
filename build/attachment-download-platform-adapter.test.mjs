import assert from 'node:assert/strict';
import {downloadPlatformAttachmentBytes} from '../attachment-download-platform-adapter.js';
import {createAttachmentReceiveService} from '../attachment-receive-service.js';
import {encryptAttachmentBytes} from '../e2ee-account-attachment-crypto.js';
const url='https://firebasestorage.googleapis.com/v0/b/fidunio-fef13.firebasestorage.app/o/a%2Fb?alt=media&token=fixture';
const native={protocol:'capacitor:',capacitor:{getPlatform:()=> 'ios',isNativePlatform:()=>true}};
const base={storageBucket:'fidunio-fef13.firebasestorage.app',platformOptions:native};
let calls=0;
const bridge=data=>({Plugins:{CapacitorHttp:{request:async options=>{calls++;assert.equal(options.method,'GET');assert.equal(options.headers?.['Cache-Control'],'no-cache, no-store');assert.equal(options.disableRedirects,true);assert.equal(options.shouldEncodeUrlParams,false);return {status:200,data};}}}});
const decode=x=>JSON.parse(new TextDecoder().decode(x));
assert.deepEqual(decode(await downloadPlatformAttachmentBytes(url,{...base,capacitor:bridge({fixture:true}),fetchImpl:()=>{throw Error('WKWebView fetch must not run');}})),{fixture:true});
assert.deepEqual(decode(await downloadPlatformAttachmentBytes(url,{...base,capacitor:bridge('{"chunk":true}')})),{chunk:true});
let webCalls=0;assert.deepEqual(decode(await downloadPlatformAttachmentBytes(url,{platformOptions:{protocol:'https:'},capacitor:bridge({}),fetchImpl:async(value,opts)=>{webCalls++;assert.equal(value,url);assert.equal(opts.cache,'no-store');return new Response('{"web":true}');}})),{web:true});assert.equal(webCalls,1);
await assert.rejects(downloadPlatformAttachmentBytes(url,{...base,capacitor:{}}),{code:'storage/native-transport-unavailable'});
for(const bad of ['http://firebasestorage.googleapis.com/v0/b/fidunio-fef13.firebasestorage.app/o/a?alt=media','https://evil.example/a','https://firebasestorage.googleapis.com/v0/b/other/o/a?alt=media'])await assert.rejects(downloadPlatformAttachmentBytes(bad,{...base,capacitor:bridge({})}),{code:'storage/invalid-download-url'});
await assert.rejects(downloadPlatformAttachmentBytes(url,{...base,capacitor:{Plugins:{CapacitorHttp:{request:async()=>({status:403,data:'denied'})}}}}),{code:'storage/http-403'});
await assert.rejects(downloadPlatformAttachmentBytes(url,{...base,capacitor:bridge('oversize'),maxBytes:2}),{code:'storage/object-too-large'});
await assert.rejects(downloadPlatformAttachmentBytes(url,{...base,capacitor:{Plugins:{CapacitorHttp:{request:()=>new Promise(()=>{})}}},timeoutMs:5}),{code:'storage/fetch-timeout'});
const beforeAbortCalls=calls;
const preAborted=new AbortController();preAborted.abort();
await assert.rejects(downloadPlatformAttachmentBytes(url,{...base,capacitor:bridge({}),signal:preAborted.signal}),{code:'storage/fetch-aborted'});
assert.equal(calls,beforeAbortCalls);
const activeAbort=new AbortController();
const activeAbortPromise=downloadPlatformAttachmentBytes(url,{...base,capacitor:{Plugins:{CapacitorHttp:{request:()=>new Promise(()=>{})}}},signal:activeAbort.signal,timeoutMs:1000});
activeAbort.abort();
await assert.rejects(activeAbortPromise,{code:'storage/fetch-aborted'});
console.log('PASS: native bridge, unchanged web fetch, URL bounds, errors, size, timeout, abort and cache semantics');
// Pass a multi-chunk encrypted photo through each transport and the unchanged
// receiver. Verify exact bytes and reject a tampered ciphertext.
const bytes=Uint8Array.from({length:400000},(_,i)=>i%251);
const encrypted=await encryptAttachmentBytes({attachmentId:'transport-fixture',bytes,meta:{name:'fixture.png',type:'image/png'}});
const objects=[encrypted.manifest,...encrypted.chunks];
const paths={manifest:'0',chunks:encrypted.chunks.map((_,i)=>String(i+1))};
const descriptor={fidunioAttachment:1,attachmentId:'transport-fixture',key:encrypted.key,kind:'photo',type:'image/png',storagePaths:paths};
for(const mode of ['web','native']){
  const transport=async index=>{
    const data=objects[Number(index)];
    return decode(await downloadPlatformAttachmentBytes(url,mode==='native'?{...base,capacitor:bridge(Number(index)===0?data:JSON.stringify(data))}:{platformOptions:{protocol:'https:'},fetchImpl:async()=>new Response(JSON.stringify(data))}));
  };
  const receiver=createAttachmentReceiveService({downloadEncryptedAttachment:async p=>({manifest:await transport(p.manifest),chunks:await Promise.all(p.chunks.map(transport))})});
  const photo=await receiver.receive(descriptor);
  assert.deepEqual(new Uint8Array(await photo.blob.arrayBuffer()),bytes);receiver.releaseAll();
}
const corrupted=structuredClone(encrypted);corrupted.chunks[0].ciphertext='AAAA';
const receiver=createAttachmentReceiveService({downloadEncryptedAttachment:async()=>corrupted});
await assert.rejects(receiver.receive(descriptor),/verification or decryption failed/);
console.log('PASS: web/native multi-chunk encrypted photo round trip and tamper rejection');

// Native video download regression: exercise enough encrypted chunks to catch
// transport/truncation failures that a small photo fixture cannot expose.
const videoBytes=Uint8Array.from({length:3*1024*1024+123},(_,i)=>(i*17)%251);
const videoEncrypted=await encryptAttachmentBytes({attachmentId:'native-video-fixture',bytes:videoBytes,meta:{name:'fixture.mp4',type:'video/mp4'}});
const videoObjects=[videoEncrypted.manifest,...videoEncrypted.chunks];
const videoPaths={manifest:'0',chunks:videoEncrypted.chunks.map((_,i)=>String(i+1))};
const videoDescriptor={fidunioAttachment:1,attachmentId:'native-video-fixture',key:videoEncrypted.key,kind:'video',type:'video/mp4',storagePaths:videoPaths};
const videoTransport=async index=>decode(await downloadPlatformAttachmentBytes(url,{...base,capacitor:bridge(Number(index)===0?videoObjects[0]:JSON.stringify(videoObjects[Number(index)]))}));
const videoReceiver=createAttachmentReceiveService({downloadEncryptedAttachment:async p=>({manifest:await videoTransport(p.manifest),chunks:await Promise.all(p.chunks.map(videoTransport))})});
const video=await videoReceiver.receive(videoDescriptor);
assert.equal(video.type,'video/mp4');assert.equal(video.kind,'video');assert.equal(video.size,videoBytes.byteLength);assert.deepEqual(new Uint8Array(await video.blob.arrayBuffer()),videoBytes);videoReceiver.releaseAll();
console.log('PASS: native encrypted video round trip across multi-megabyte chunk set');
