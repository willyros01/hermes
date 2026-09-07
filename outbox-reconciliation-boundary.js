export const OUTBOX_RECONCILIATION_TIMEOUT_MS=12000;
export const OUTBOX_RECONCILIATION_TIMEOUT_CODE="OUTBOX_RECONCILIATION_TIMEOUT";

export function awaitBoundedOutboxReconciliation(work,{timeoutMs=OUTBOX_RECONCILIATION_TIMEOUT_MS,setTimer=setTimeout,clearTimer=clearTimeout}={}){
  if(!work||typeof work.then!=="function")throw new Error("Outbox reconciliation promise is required.");
  if(!Number.isFinite(timeoutMs)||timeoutMs<1)throw new Error("Outbox reconciliation timeout must be positive.");
  return new Promise((resolve,reject)=>{
    let settled=false;
    const timer=setTimer(()=>{
      if(settled)return;
      settled=true;
      const error=new Error("Firebase did not respond in time. The message remains safely queued.");
      error.code=OUTBOX_RECONCILIATION_TIMEOUT_CODE;
      reject(error);
    },timeoutMs);
    Promise.resolve(work).then(value=>{
      if(settled)return;
      settled=true;
      clearTimer(timer);
      resolve(value);
    },error=>{
      if(settled)return;
      settled=true;
      clearTimer(timer);
      reject(error);
    });
  });
}

export function isOutboxReconciliationTimeout(error){
  return error?.code===OUTBOX_RECONCILIATION_TIMEOUT_CODE;
}

export function planTimedOutOutboxRequeue({outboxRecords=[],messagesByConversation={}}={}){
  const unattemptedIds=new Set(outboxRecords.filter(record=>record?.sendAttempted!==true).map(record=>String(record.id)));
  const requeueIds=[];
  for(const list of Object.values(messagesByConversation||{})){
    for(const message of Array.isArray(list)?list:[]){
      const id=String(message?.id??"");
      if(message?.state==="sending"&&unattemptedIds.has(id))requeueIds.push(id);
    }
  }
  return Object.freeze([...new Set(requeueIds)]);
}
