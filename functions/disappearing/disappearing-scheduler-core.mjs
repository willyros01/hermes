export function classifyDisappearingMessagePath(path){
  const p=String(path||'').split('/');
  if(p.length!==4||p[2]!=='messages')return null;
  if(p[0]==='conversations')return Object.freeze({kind:'direct',conversationId:p[1],messageId:p[3]});
  if(p[0]==='groups')return Object.freeze({kind:'group',groupId:p[1],messageId:p[3]});
  return null;
}
export async function runDisappearingPurgeSweep({db,executor,limit=200,logger=console}={}){
  if(!db?.collectionGroup||!executor?.purgeDirect||!executor?.purgeGroup)throw new Error('Disappearing scheduler dependencies are incomplete.');
  const bounded=Math.max(1,Math.min(500,Number(limit)||200));
  const snap=await db.collectionGroup('messages').where('disappearingPurgeVersion','==',1).limit(bounded).get();
  const result={examined:0,purged:0,retained:0,deferred:0,ignored:0};
  for(const doc of snap.docs||[]){
    const target=classifyDisappearingMessagePath(doc.ref?.path);if(!target){result.ignored++;continue;}
    result.examined++;
    try{
      const out=target.kind==='direct'?await executor.purgeDirect(target):await executor.purgeGroup(target);
      if(out?.purged)result.purged++;else result.retained++;
    }catch(error){
      if(['STALE_PURGE_BASIS','PURGE_TRACE_TOO_LARGE'].includes(String(error?.code||''))){result.deferred++;logger.warn?.('FIDUNIO disappearing purge deferred',{path:doc.ref?.path,code:error.code});continue;}
      logger.error?.('FIDUNIO disappearing purge candidate failed',{path:doc.ref?.path,code:error?.code||'INTERNAL',message:error?.message||String(error)});throw error;
    }
  }
  return Object.freeze(result);
}
