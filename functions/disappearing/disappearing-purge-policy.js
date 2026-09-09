import {normalizeDisappearSelection,recipientHasExpired} from "./disappearing-content-policy.js";

// Pure purge-decision owner. No Firebase, Admin SDK, DOM, storage, timers or deletes.
// `now` is an injected authority input. Production purge execution must supply
// server-side time; a device clock must never authorize a cloud deletion.

function uid(value){return String(value??"").trim();}
function unique(values){return [...new Set((values||[]).map(uid).filter(Boolean))];}
function receiptMap(receipts){return new Map((receipts||[]).map(row=>[uid(row?.uid),row]).filter(([id])=>id));}

export function directSourcePurgeDecision({message,recipientUid,now}={}){
  const duration=normalizeDisappearSelection(message?.disappearAfterSeconds);
  if(duration===null)return Object.freeze({eligible:false,reason:"not-disappearing",recipientUid:uid(recipientUid)});
  const recipient=uid(recipientUid);
  if(!recipient)throw new Error("Direct purge decision requires the recipient UID.");
  if(message?.state!=="read"||message?.readAt==null)return Object.freeze({eligible:false,reason:"recipient-unread",recipientUid:recipient});
  const expired=recipientHasExpired({readAt:message.readAt,durationSeconds:duration,now});
  return Object.freeze({eligible:expired,reason:expired?"recipient-expired":"recipient-window-active",recipientUid:recipient});
}

export function groupSourcePurgeDecision({message,epochMemberUids,currentMemberUids,receipts,now}={}){
  const duration=normalizeDisappearSelection(message?.disappearAfterSeconds);
  if(duration===null)return Object.freeze({eligible:false,reason:"not-disappearing",applicableRecipientUids:[],waitingRecipientUids:[],expiredRecipientUids:[],removedRecipientUids:[]});
  const sender=uid(message?.senderUid);
  if(!sender)throw new Error("Group purge decision requires the source sender UID.");

  const epochRecipients=unique(epochMemberUids).filter(id=>id!==sender);
  const current=new Set(unique(currentMemberUids));
  const applicable=epochRecipients.filter(id=>current.has(id));
  const removed=epochRecipients.filter(id=>!current.has(id));
  const byUid=receiptMap(receipts);
  const expired=[];
  const waiting=[];

  for(const recipient of applicable){
    const row=byUid.get(recipient);
    if(row?.state==="read"&&row?.readAt!=null&&recipientHasExpired({readAt:row.readAt,durationSeconds:duration,now}))expired.push(recipient);
    else waiting.push(recipient);
  }

  return Object.freeze({
    eligible:waiting.length===0,
    reason:waiting.length===0?"all-applicable-recipients-expired-or-removed":"recipient-entitlement-remains",
    applicableRecipientUids:Object.freeze([...applicable]),
    waitingRecipientUids:Object.freeze(waiting),
    expiredRecipientUids:Object.freeze(expired),
    removedRecipientUids:Object.freeze(removed)
  });
}
