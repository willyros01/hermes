// One serialized delivery owner per direct conversation. Live Firestore
// snapshots are coalesced to the newest value. A keyed notification message is
// processed at the next safe boundary before snapshot maintenance.
export function createDirectMessageDeliveryOwner({deliver,onError=()=>{}}={}){
  if(typeof deliver!=="function")throw new Error("Direct-message delivery callback is required.");
  let currentDeliver=deliver,currentError=onError;
  let pendingSnapshot=null,pendingMaintenance=null,running=null,closed=false;
  const priorities=new Map();

  const nextWork=()=>{
    const priority=priorities.values().next().value;
    if(priority){priorities.delete(priority.key);return priority;}
    if(pendingSnapshot){const snapshot=pendingSnapshot;pendingSnapshot=null;return snapshot;}
    if(!pendingMaintenance)return null;
    const step=pendingMaintenance.steps.shift();
    if(!pendingMaintenance.steps.length)pendingMaintenance=null;
    return{kind:"maintenance",step};
  };
  const rejectPriorities=error=>{
    for(const item of priorities.values())for(const waiter of item.waiters)waiter.reject(error);
    priorities.clear();
  };
  const start=()=>{
    if(closed||running)return running;
    running=(async()=>{
      while(!closed){
        const work=nextWork();if(!work)break;
        try{
          if(work.kind==="maintenance"){await work.step();continue;}
          const result=await currentDeliver(work.rows,work.meta);
          const value=result?.value??result;
          const steps=(Array.isArray(result?.maintenance)?result.maintenance:[]).filter(step=>typeof step==="function");
          if(steps.length)pendingMaintenance={steps};
          if(work.kind==="priority")for(const waiter of work.waiters)waiter.resolve(value);
        }catch(error){
          if(work.kind==="priority")for(const waiter of work.waiters)waiter.reject(error);
          if(work.kind==="maintenance")pendingMaintenance=null;
          try{currentError?.(error);}catch{}
        }
      }
    })().finally(()=>{
      running=null;
      // Work can arrive after the loop observes empty but before release.
      if(!closed&&(priorities.size||pendingSnapshot||pendingMaintenance))start();
    });
    return running;
  };

  return Object.freeze({
    setCallbacks(nextDeliver,nextError=()=>{}){
      if(typeof nextDeliver!=="function")throw new Error("Direct-message delivery callback is required.");
      currentDeliver=nextDeliver;currentError=nextError;
    },
    offerSnapshot(rows,meta={}){
      if(closed)return false;
      pendingSnapshot={kind:"snapshot",rows,meta};start();return true;
    },
    offerPriority(key,rows,meta={}){
      if(closed)return Promise.reject(new Error("Direct-message delivery owner is closed."));
      const normalized=String(key||"");
      if(!normalized)return Promise.reject(new Error("Priority message ID is required."));
      return new Promise((resolve,reject)=>{
        const item=priorities.get(normalized)||{kind:"priority",key:normalized,rows,meta,waiters:[]};
        item.rows=rows;item.meta={...meta,partial:true,priorityMessageId:normalized};item.waiters.push({resolve,reject});
        priorities.set(normalized,item);start();
      });
    },
    close(error=new Error("Direct-message delivery owner closed.")){
      closed=true;pendingSnapshot=null;pendingMaintenance=null;rejectPriorities(error);
    }
  });
}
