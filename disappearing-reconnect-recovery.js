import {planLocalDisappearingConvergence} from "./disappearing-local-convergence.js";

function key(value){return String(value??"").trim();}
function rows(value){return Array.isArray(value)?value:[];}

// Pure restart/reconnect decision owner. Network/server reads stay in firebase.js;
// IndexedDB and Outbox mutation stay in app.js. This planner only decides which
// persisted Outbox IDs are already server-accepted, safely purgeable, replayable,
// or blocked pending authoritative server evidence.
export function planReconnectOutboxConvergence({messagesByConversation={},outboxRecords=[],authoritativeRemoteIdsByConversation={}}={}){
  const acceptedOutboxDeleteIds=[];
  const purgeMessageIds=[];
  const replayMessageIds=[];
  const blockedMessageIds=[];
  const seen=new Set();

  for(const record of rows(outboxRecords)){
    const messageId=key(record?.messageId??record?.id);
    const conversationId=key(record?.conversationId??record?.groupId);
    if(!messageId||!conversationId||seen.has(messageId))continue;
    seen.add(messageId);

    if(!Object.prototype.hasOwnProperty.call(authoritativeRemoteIdsByConversation,conversationId)){
      blockedMessageIds.push(messageId);
      continue;
    }

    const remoteIds=new Set(rows(authoritativeRemoteIdsByConversation[conversationId]).map(key).filter(Boolean));
    if(remoteIds.has(messageId)){
      acceptedOutboxDeleteIds.push(messageId);
      continue;
    }

    const localRows=rows(messagesByConversation?.[conversationId]);
    const local=localRows.find(row=>key(row?.id)===messageId)||null;
    const convergence=planLocalDisappearingConvergence({
      localMessages:local?[local]:[],
      authoritativeRemoteIds:[...remoteIds],
      outboxMessageIds:[messageId]
    });
    if(convergence.purgeMessageIds.includes(messageId)){
      purgeMessageIds.push(messageId);
      continue;
    }

    // Only work that has never been observed server-backed may be replayed.
    // Unexpected absence of an already-server-backed ordinary row fails closed.
    if(!local||local.serverBacked!==true)replayMessageIds.push(messageId);
    else blockedMessageIds.push(messageId);
  }

  return Object.freeze({
    acceptedOutboxDeleteIds:Object.freeze(acceptedOutboxDeleteIds),
    purgeMessageIds:Object.freeze(purgeMessageIds),
    replayMessageIds:Object.freeze(replayMessageIds),
    blockedMessageIds:Object.freeze(blockedMessageIds)
  });
}

export const DISAPPEARING_RECONNECT_RECOVERY_V1=Object.freeze({
  requiresServerReadBeforeReplay:true,
  serverPresentOutboxIsAccepted:true,
  priorServerBackedDisappearingAbsenceCanPurge:true,
  neverServerBackedAbsenceCanReplay:true,
  cacheOnlyAuthority:false,
  clientClockIsAuthority:false,
  createsTombstones:false,
  postCommitPreObservationCrashGapClosed:false
});
