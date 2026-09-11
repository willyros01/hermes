function key(value){return String(value??"").trim();}

// Memory-only owner for a send that has already been shown to the sender but
// has not yet appeared in an authoritative Firestore snapshot. Listener
// projection may merge newer server rows, but it cannot erase this local send.
export function createOptimisticOutgoingProjectionOwner(){
  const byConversation=new Map();

  function stage(conversationId,row){
    const cid=key(conversationId),messageId=key(row?.id);
    if(!cid||!messageId)throw new Error("Optimistic outgoing message identity is required.");
    const rows=byConversation.get(cid)||new Map();
    rows.set(messageId,row);
    byConversation.set(cid,rows);
    return row;
  }

  function project(conversationId,projectedRows,{isHidden=()=>false}={}){
    const cid=key(conversationId),rows=byConversation.get(cid);
    if(!rows)return[...(projectedRows||[])];
    const merged=new Map((projectedRows||[]).map(row=>[key(row?.id),row]).filter(([id])=>id));
    for(const [messageId,row] of rows){
      if(isHidden(messageId)){rows.delete(messageId);continue;}
      // Seeing the exact ID from Firebase completes the reservation. The
      // authoritative row wins and normal receipt projection continues.
      if(merged.has(messageId)){rows.delete(messageId);continue;}
      merged.set(messageId,row);
    }
    if(!rows.size)byConversation.delete(cid);
    return[...merged.values()];
  }

  function release(conversationId,messageId){
    const cid=key(conversationId),rows=byConversation.get(cid);
    if(!rows)return false;
    const removed=rows.delete(key(messageId));
    if(!rows.size)byConversation.delete(cid);
    return removed;
  }

  function reset(){byConversation.clear();}

  return Object.freeze({stage,project,release,reset});
}

export const OPTIMISTIC_OUTGOING_PROJECTION_V1=Object.freeze({
  memoryOnly:true,
  firestoreSnapshotCannotEraseStagedSend:true,
  authoritativeExactIdWins:true,
  createsTransportAuthority:false
});
