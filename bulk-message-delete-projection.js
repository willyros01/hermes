function key(value){return String(value??"").trim();}

// Memory-only convergence owner for server-confirmed mass deletion. Firestore
// may deliver intermediate snapshots while the backend removes a page one row
// at a time. Confirmed IDs stay suppressed until a full server-backed snapshot
// proves each source absent. Nothing is persisted and no delete authority lives
// here.
export function createBulkMessageDeleteProjectionOwner(){
  const pendingByConversation=new Map();

  return Object.freeze({
    reserve(conversationId,messageIds){
      const cid=key(conversationId);
      if(!cid)return 0;
      const pending=pendingByConversation.get(cid)||new Set();
      for(const value of messageIds||[]){const id=key(value);if(id)pending.add(id);}
      if(pending.size)pendingByConversation.set(cid,pending);
      return pending.size;
    },
    project(conversationId,rows,{authoritative=false,authoritativeRemoteIds=[]}={}){
      const cid=key(conversationId),input=Array.isArray(rows)?rows:[];
      const pending=pendingByConversation.get(cid);
      if(!pending?.size)return Object.freeze({rows:Object.freeze([...input]),affected:false,pendingCount:0});
      const affected=true;
      if(authoritative){
        const remoteIds=new Set((authoritativeRemoteIds||[]).map(key).filter(Boolean));
        for(const id of [...pending])if(!remoteIds.has(id))pending.delete(id);
      }
      const visible=input.filter(row=>!pending.has(key(row?.id)));
      if(!pending.size)pendingByConversation.delete(cid);
      return Object.freeze({rows:Object.freeze(visible),affected,pendingCount:pending.size});
    },
    reset(){pendingByConversation.clear();}
  });
}
