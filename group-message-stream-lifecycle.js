export function createGroupMessageStreamLifecycle(){
  let generation=0,activeGroupId=null,failure=null;
  const current=token=>!!token&&token.generation===generation&&token.groupId===activeGroupId;
  return Object.freeze({
    isCurrent(token){return current(token);},
    canReuse(groupId){return activeGroupId!==null&&activeGroupId===String(groupId||"");},
    open(groupId){const id=String(groupId||"");if(!id)throw new Error("Group ID is required.");activeGroupId=id;generation++;return Object.freeze({groupId:id,generation});},
    close(){activeGroupId=null;generation++;},
    reject(token,error,{terminal=false,source="group"}={}){
      if(!current(token))return Object.freeze({accepted:false,terminal:false,message:""});
      const message=error?.message||String(error);
      failure=Object.freeze({groupId:token.groupId,message,source:String(source||"group")});
      if(terminal){activeGroupId=null;generation++;}
      return Object.freeze({accepted:true,terminal:terminal===true,message});
    },
    confirmServerSnapshot(token,meta={}){
      if(!current(token)||meta.fromCache===true||meta.hasPendingWrites===true)return false;
      if(failure?.groupId!==token.groupId)return false;
      failure=null;return true;
    },
    errorFor(groupId){return failure?.groupId===String(groupId||"")?failure.message:"";}
  });
}
