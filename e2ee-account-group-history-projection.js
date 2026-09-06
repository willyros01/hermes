function asDate(v){const d=v instanceof Date?v:v?.toDate?.()||new Date(v);return d instanceof Date&&!Number.isNaN(d.getTime())?d:null;}

// Pure projection helper: ordinary retained group rows stay authoritative for
// sender/receipt metadata. A separately granted copy may replace only an
// undecryptable ordinary-row body with the grant plaintext for the same source
// message ID. Grant-only rows are explicitly NOT source-authoritative: they
// must never make a physically purged source message appear server-present.
export function mergeGroupHistoryProjection(liveRows,grantedRows){
  const grantsById=new Map((Array.isArray(grantedRows)?grantedRows:[]).map(row=>[String(row.id),row]));
  const merged=[];
  for(const row of Array.isArray(liveRows)?liveRows:[]){
    const grant=grantsById.get(String(row.id));
    if(grant&&!row.decryptAvailable){
      merged.push({...row,text:grant.text,createdAt:asDate(grant.createdAt)||asDate(row.createdAt),granted:true,historyGrantId:grant.historyGrantId,authoritativeSource:true});
    }else{
      merged.push({...row,createdAt:asDate(row.createdAt),authoritativeSource:true});
    }
    grantsById.delete(String(row.id));
  }
  for(const grant of grantsById.values())merged.push({id:grant.id,mine:false,senderUid:null,text:grant.text,time:"",state:"sent",cloud:true,e2ee:4,keyEpoch:null,createdAt:asDate(grant.createdAt),decryptAvailable:true,granted:true,historyGrantId:grant.historyGrantId,authoritativeSource:false});
  merged.sort((a,b)=>{const at=a.createdAt?.getTime?.()??Number.MAX_SAFE_INTEGER,bt=b.createdAt?.getTime?.()??Number.MAX_SAFE_INTEGER;return at-bt||String(a.id).localeCompare(String(b.id));});
  return merged.map(({decryptAvailable,...row})=>row);
}
