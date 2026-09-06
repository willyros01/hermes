import {normalizeDisappearSelection} from "./disappearing-content-policy.js";

// Pure local-convergence decision owner. This module never opens IndexedDB,
// mutates app state, calls Firebase, or uses a device clock as purge authority.
// It only interprets an explicitly server-backed absence supplied by the
// UID-scoped local storage/application owner.
function id(value){return String(value??"").trim();}
function ids(values){return new Set((values||[]).map(id).filter(Boolean));}
function isPending(row){return ["queued","sending","failed"].includes(String(row?.state||""));}
function isDisappearing(row){
  try{return normalizeDisappearSelection(row?.disappearAfterSeconds)!==null;}
  catch{return false;}
}

export function planLocalDisappearingConvergence({localMessages=[],authoritativeRemoteIds=[],outboxMessageIds=[]}={}){
  const remote=ids(authoritativeRemoteIds),outbox=ids(outboxMessageIds),purge=[];
  for(const row of localMessages||[]){
    const messageId=id(row?.id);
    if(!messageId||remote.has(messageId)||!isDisappearing(row))continue;
    // A locally queued message that has never been observed from the server is
    // legitimate pending work, not evidence of an expired cloud source.
    // `serverBacked` is deliberately explicit so cache-only rows cannot invent
    // authoritative absence after an offline cold start.
    if(row?.serverBacked!==true)continue;
    if(isPending(row)&&row?.serverBacked!==true)continue;
    purge.push(messageId);
  }
  purge.sort();
  const purgeSet=new Set(purge);
  return Object.freeze({
    purgeMessageIds:Object.freeze(purge),
    purgeOutboxMessageIds:Object.freeze([...outbox].filter(x=>purgeSet.has(x)).sort()),
    retainedMessageIds:Object.freeze((localMessages||[]).map(x=>id(x?.id)).filter(x=>x&&!purgeSet.has(x)))
  });
}

export function applyLocalDisappearingProjection(messages,purgeMessageIds){
  const purge=ids(purgeMessageIds);
  return (messages||[]).filter(row=>!purge.has(id(row?.id)));
}

export const DISAPPEARING_LOCAL_CONVERGENCE_V1=Object.freeze({
  requiresServerBackedAbsence:true,
  cacheOnlyAbsenceIsAuthority:false,
  clientClockIsAuthority:false,
  pendingNeverServerBackedIsRetained:true,
  createsTombstones:false
});
