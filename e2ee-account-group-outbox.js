import {ensureAccountGroupEpoch,sendAccountGroupMessage,revalidateQueuedAccountGroupMessage} from "./e2ee-account-group-service.js";
import {normalizeDisappearSelection} from "./disappearing-content-policy.js";

// Group Outbox orchestration owner. Local persistence stays injected so this
// module never owns IndexedDB or Firebase. A queued plaintext exists only
// inside the caller's encrypted local Outbox record.
let tail=Promise.resolve();
function serial(task){const run=tail.then(task,task);tail=run.catch(()=>{});return run;}

export async function prepareQueuedAccountGroupMessage({groupId,messageId,text,disappearAfterSeconds=null}){
  if(!groupId||!messageId)throw new Error("Group and message IDs are required.");
  if(!String(text||"").trim())throw new Error("Group message text is required.");
  const epoch=await ensureAccountGroupEpoch(String(groupId));
  const duration=normalizeDisappearSelection(disappearAfterSeconds);
  return{kind:"group-e2ee-v1",groupId:String(groupId),messageId:String(messageId),text:String(text),expectedKeyEpoch:Number(epoch.authority?.keyEpoch),disappearAfterSeconds:duration};
}

export function flushQueuedAccountGroupMessage(payload){
  return serial(async()=>{
    if(payload?.kind!=="group-e2ee-v1")throw new Error("Unsupported group Outbox payload.");
    const queuedEpoch=Number.isInteger(payload.expectedKeyEpoch)?payload.expectedKeyEpoch:null;
    const check=await revalidateQueuedAccountGroupMessage({groupId:payload.groupId,queuedEpoch});
    // Membership/epoch changes invalidate the old expectation. Runtime send
    // always encrypts against the current epoch, so stale queued plaintext is
    // re-encrypted rather than replaying obsolete ciphertext.
    const result=await sendAccountGroupMessage({groupId:payload.groupId,messageId:payload.messageId,text:payload.text,disappearAfterSeconds:payload.disappearAfterSeconds??null});
    return{...result,reEncryptedForCurrentEpoch:queuedEpoch===null||check.changed,previousKeyEpoch:queuedEpoch};
  });
}

export function resetAccountGroupOutboxQueue(){tail=Promise.resolve();}
