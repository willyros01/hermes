import {planLocalDisappearingConvergence,applyLocalDisappearingProjection} from "./disappearing-local-convergence.js";

function key(value){return String(value??"").trim();}
function pending(row){return ["queued","sending","failed"].includes(String(row?.state||""));}
function isAuthoritativeSource(row){return row?.authoritativeSource!==false;}

// Pure projection owner for server-vs-cache convergence. The caller supplies
// snapshot metadata from the sole Firebase subscription owner; this helper
// never calls Firebase, IndexedDB, a clock, or a retry path. Group history
// grant-only rows are projection material, not proof that the source exists.
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

  const authoritativeSourceRows=remote.filter(isAuthoritativeSource);
  const remoteIds=authoritativeSourceRows.map(row=>key(row?.id)).filter(Boolean);
  const convergence=planLocalDisappearingConvergence({localMessages:existing,authoritativeRemoteIds:remoteIds,outboxMessageIds});
  const purgeSet=new Set(convergence.purgeMessageIds);
  const authoritativeRemote=remote.filter(row=>!(row?.authoritativeSource===false&&purgeSet.has(key(row?.id)))).map(row=>({...row,serverBacked:isAuthoritativeSource(row)}));
  const afterPurge=applyLocalDisappearingProjection(existing,convergence.purgeMessageIds);
  const remoteSet=new Set(authoritativeRemote.map(row=>key(row?.id)).filter(Boolean));
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
  grantOnlyRowsAreSourceAuthority:false,
  preservesNeverServerBackedPending:true,
  clientClockIsAuthority:false,
  createsTombstones:false
});
