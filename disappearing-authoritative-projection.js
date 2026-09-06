import {planLocalDisappearingConvergence,applyLocalDisappearingProjection} from "./disappearing-local-convergence.js";

function key(value){return String(value??"").trim();}
function pending(row){return ["queued","sending","failed"].includes(String(row?.state||""));}

// Pure projection owner for server-vs-cache convergence. The caller supplies
// snapshot metadata from the sole Firebase subscription owner; this helper
// never calls Firebase, IndexedDB, a clock, or a retry path.
export function planAuthoritativeMessageProjection({existingRows=[],remoteRows=[],snapshotMeta={},outboxMessageIds=[]}={}){
  const existing=Array.isArray(existingRows)?existingRows:[];
  const remote=Array.isArray(remoteRows)?remoteRows:[];
  if(snapshotMeta?.fromCache===true){
    const byId=new Map(existing.map(row=>[key(row?.id),row]).filter(([id])=>id));
    for(const row of remote){
      const id=key(row?.id);if(!id)continue;
      const prior=byId.get(id);
      byId.set(id,prior?{...prior,...row,serverBacked:prior.serverBacked===true}:{...row,serverBacked:false});
    }
    return Object.freeze({rows:Object.freeze([...byId.values()]),purgeMessageIds:Object.freeze([]),purgeOutboxMessageIds:Object.freeze([]),authoritative:false});
  }

  const authoritativeRemote=remote.map(row=>({...row,serverBacked:true}));
  const remoteIds=authoritativeRemote.map(row=>key(row?.id)).filter(Boolean);
  const convergence=planLocalDisappearingConvergence({localMessages:existing,authoritativeRemoteIds:remoteIds,outboxMessageIds});
  const afterPurge=applyLocalDisappearingProjection(existing,convergence.purgeMessageIds);
  const remoteSet=new Set(remoteIds);
  const legitimatePending=afterPurge.filter(row=>row?.mine&&pending(row)&&row?.serverBacked!==true&&!remoteSet.has(key(row?.id)));
  return Object.freeze({
    rows:Object.freeze([...authoritativeRemote,...legitimatePending]),
    purgeMessageIds:convergence.purgeMessageIds,
    purgeOutboxMessageIds:convergence.purgeOutboxMessageIds,
    authoritative:true
  });
}

export const DISAPPEARING_AUTHORITATIVE_PROJECTION_V1=Object.freeze({
  cacheSnapshotCanPurge:false,
  serverSnapshotMarksRemoteServerBacked:true,
  preservesNeverServerBackedPending:true,
  clientClockIsAuthority:false,
  createsTombstones:false
});
