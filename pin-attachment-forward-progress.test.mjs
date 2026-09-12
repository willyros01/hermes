import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {awaitBoundedLocalPinVerification,LOCAL_PIN_VERIFICATION_TIMEOUT_CODE} from "./local-pin-verification-boundary.js";
import {scheduleAttachmentOutboxRetryIfPending} from "./outbox-reconciliation-boundary.js";

{
  let fireTimeout;
  const bounded=awaitBoundedLocalPinVerification(new Promise(()=>{}),{setTimer(callback){fireTimeout=callback;return 4;},clearTimer(){}});
  fireTimeout();
  await assert.rejects(bounded,error=>{
    assert.equal(error.code,LOCAL_PIN_VERIFICATION_TIMEOUT_CODE);
    assert.match(error.message,/try again/i);
    return true;
  });
}

{
  let scheduled=0;
  assert.equal(await scheduleAttachmentOutboxRetryIfPending({messageId:"photo-1",readOutboxMessage:async id=>({id}),scheduleRetry:()=>scheduled++}),true);
  assert.equal(scheduled,1,"a still-pending direct attachment must reuse the existing reconnect retry owner");
  assert.equal(await scheduleAttachmentOutboxRetryIfPending({messageId:"photo-2",readOutboxMessage:async()=>undefined,scheduleRetry:()=>scheduled++}),false);
  assert.equal(scheduled,1,"a confirmed sent attachment must not schedule redundant recovery");
}

const app=readFileSync(new URL("./app.js",import.meta.url),"utf8");
const worker=readFileSync(new URL("./service-worker.js",import.meta.url),"utf8");
assert.match(app,/awaitBoundedLocalPinVerification\(verifyLocalPin\(pinInput\.value\(\)\)\)/,"PIN unlock must be bounded at the UI owner");
assert.match(app,/catch\(err\)[\s\S]*?unlockError=err\?\.message[\s\S]*?render\(\)/,"a stalled PIN check must restore an interactive unlock screen");
assert.match(app,/if\(!c\.cloudGroup\)await scheduleAttachmentOutboxRetryIfPending\(\{messageId:row\.messageId,readOutboxMessage:getOutboxMessage,scheduleRetry:scheduleReconnectRecovery\}\)/,"only a direct attachment still in Outbox may schedule existing recovery");
assert.match(worker,/\.\/local-pin-verification-boundary\.js/);
assert.match(worker,/SHELL_REVISION="1\.1\.39-pin-attachment-forward-progress"/);
console.log("PIN and direct-attachment forward-progress gate passed");
