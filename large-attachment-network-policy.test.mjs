import assert from "node:assert/strict";
import fs from "node:fs";
import {
  LARGE_ATTACHMENT_THRESHOLD_BYTES,
  evaluateLargeAttachmentNetworkPolicy,
  isLargeAttachmentSize,
  readBrowserAttachmentNetworkState
} from "./large-attachment-network-policy.js";

assert.equal(LARGE_ATTACHMENT_THRESHOLD_BYTES,5*1024*1024,"large attachment threshold must remain exactly 5 MiB");
assert.equal(isLargeAttachmentSize(LARGE_ATTACHMENT_THRESHOLD_BYTES-1),false,"smaller than 5 MiB stays unrestricted");
assert.equal(isLargeAttachmentSize(LARGE_ATTACHMENT_THRESHOLD_BYTES),true,"5 MiB itself is large");

for(const networkType of ["cellular","CELLULAR","wimax"]){
  const decision=evaluateLargeAttachmentNetworkPolicy({enabled:true,size:LARGE_ATTACHMENT_THRESHOLD_BYTES,online:true,networkType});
  assert.equal(decision.allowed,false,`${networkType} must wait for Wi-Fi`);
  assert.equal(decision.waitForWifi,true);
}

for(const networkType of ["wifi","ethernet"]){
  const decision=evaluateLargeAttachmentNetworkPolicy({enabled:true,size:LARGE_ATTACHMENT_THRESHOLD_BYTES,online:true,networkType});
  assert.equal(decision.allowed,true,`${networkType} must proceed`);
}

for(const networkType of ["",undefined,"unknown","bluetooth","other"]){
  const decision=evaluateLargeAttachmentNetworkPolicy({enabled:true,size:LARGE_ATTACHMENT_THRESHOLD_BYTES,online:true,networkType});
  assert.equal(decision.allowed,false,`unknown/non-positive network type ${String(networkType)} must not silently proceed`);
  assert.equal(decision.reason,"network-unverified");
  assert.equal(decision.canOverride,true,"unverified network must expose only an explicit user override");
}

assert.equal(evaluateLargeAttachmentNetworkPolicy({enabled:true,size:LARGE_ATTACHMENT_THRESHOLD_BYTES,online:false,networkType:"wifi"}).allowed,false,"offline large attachment must wait even if a stale type says Wi-Fi");
assert.equal(evaluateLargeAttachmentNetworkPolicy({enabled:false,size:LARGE_ATTACHMENT_THRESHOLD_BYTES*2,online:true,networkType:"cellular"}).allowed,true,"disabled preference must not block");
assert.equal(evaluateLargeAttachmentNetworkPolicy({enabled:true,size:LARGE_ATTACHMENT_THRESHOLD_BYTES-1,online:false,networkType:"cellular"}).allowed,true,"small attachments remain outside this policy");
assert.deepEqual(readBrowserAttachmentNetworkState({onLine:true,connection:{type:"WiFi"}}),{online:true,networkType:"wifi"});
assert.deepEqual(readBrowserAttachmentNetworkState({onLine:false}),{online:false,networkType:""});

const app=fs.readFileSync(new URL("./app.js",import.meta.url),"utf8");
const serviceWorker=fs.readFileSync(new URL("./service-worker.js",import.meta.url),"utf8");
const version=fs.readFileSync(new URL("./version.js",import.meta.url),"utf8");

assert.match(app,/from "\.\/large-attachment-network-policy\.js"/,"app must import the policy owner");
assert.match(app,/let pendingLargeAttachmentSend=null;/,"only one in-memory waiting attachment owner is expected");
assert.match(app,/Another attachment is already waiting for Wi-Fi\./,"a second selection must be rejected while one waits");
assert.match(app,/projectSelectedAttachmentRecord\(record,"waiting-wifi"\)/,"blocked selection must project Waiting for Wi-Fi state");
assert.match(app,/Waiting for Wi-Fi/,"Waiting for Wi-Fi must be visible to the user");
assert.match(app,/cannot verify the network type.*explicit Send Anyway.*iPhone.*iPad.*Safari/is,"Data settings must explain Safari verification limitation and explicit override");
assert.match(app,/resumePendingLargeAttachmentSend\(\)/,"waiting send must have an automatic resume path");
assert.match(app,/attachmentNetworkConnection\?\.addEventListener\?\.\("change"/,"Network Information API change must trigger resume when available");
assert.match(app,/if\(key==="wifiAttachments"\)void resumePendingLargeAttachmentSend\(\);/,"preference change must trigger resume");

const policyCheck=app.indexOf("evaluateLargeAttachmentNetworkPolicy({");
const fileRead=app.indexOf("file.arrayBuffer()",policyCheck);
assert.ok(policyCheck>=0&&fileRead>policyCheck,"network policy must run before file bytes are read");

assert.match(serviceWorker,/\.\/large-attachment-network-policy\.js/,"service worker shell must cache the policy module");
assert.match(app,/Wi-Fi connection cannot be verified[\s\S]*Send Anyway/,"unknown network must require an explicit Send Anyway confirmation");
assert.match(serviceWorker,/1\.1\.42-large-attachment-network-verification/,"service-worker cache revision must advance");
assert.match(version,/version:\s*"1\.1\.42"/,"visible release must advance to 1.1.42");

console.log("Large attachment network policy and integration regression gate passed");
