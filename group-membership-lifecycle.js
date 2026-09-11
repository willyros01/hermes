export const GROUP_MEMBER_DIRECTORY_TIMEOUT_MS=12000;

export function cloudGroupIdsMissingFromAuthoritativeSnapshot(conversations,remoteGroups,snapshotMeta={}){
  if(snapshotMeta.fromCache===true||snapshotMeta.hasPendingWrites===true)return[];
  const present=new Set((remoteGroups||[]).map(group=>String(group?.id||"")).filter(Boolean));
  return(conversations||[])
    .filter(conversation=>conversation?.cloudGroup===true&&!present.has(String(conversation.id)))
    .map(conversation=>String(conversation.id));
}

export async function awaitBoundedGroupMemberDirectory(promise,{timeoutMs=GROUP_MEMBER_DIRECTORY_TIMEOUT_MS,setTimer=globalThis.setTimeout,clearTimer=globalThis.clearTimeout}={}){
  if(!Number.isFinite(timeoutMs)||timeoutMs<1)throw new Error("Group member directory timeout must be positive.");
  let timer;
  try{
    return await Promise.race([
      Promise.resolve(promise),
      new Promise((_,reject)=>{timer=setTimer(()=>{const error=new Error("FIDUNIO users did not load in time. Check your connection and try again.");error.code="group-member-directory-timeout";reject(error);},timeoutMs);})
    ]);
  }finally{if(timer!==undefined)clearTimer(timer);}
}
