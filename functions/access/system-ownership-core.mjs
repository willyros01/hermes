const fail=(code,message)=>{const error=new Error(message);error.code=code;throw error;};
const clean=value=>String(value||"").trim();

export function createSystemOwnershipCore({repo}={}){
  if(!repo)throw new Error("System ownership repository is required.");
  return Object.freeze({
    async transferSystemOwnershipV1({authUid,data}={}){
      const uid=clean(authUid),targetUid=clean(data?.targetUid);
      if(!uid)fail("AUTH_REQUIRED","Authentication is required.");
      if(!targetUid||targetUid===uid)fail("INVALID_INPUT","Choose another active administrator.");
      const [access,caller,target]=await Promise.all([repo.readAccess(),repo.readProfile(uid),repo.readProfile(targetUid)]);
      if(!access||String(access.ownerUid||"")!==uid||String(caller?.systemRole||"")!=="owner")fail("DELETE_DENIED","Only the current FIDUNIO Owner may transfer system ownership.");
      if(!target||String(target.systemRole||"")!=="admin"||target.active===false||["suspended","deactivated"].includes(String(target.status||"active")))fail("DELETE_DENIED","Ownership can be transferred only to an active FIDUNIO Administrator.");
      await repo.transfer({fromUid:uid,toUid:targetUid});
      return Object.freeze({transferred:true,ownerUid:targetUid});
    }
  });
}
