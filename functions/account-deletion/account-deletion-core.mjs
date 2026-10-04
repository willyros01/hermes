const fail=(code,message)=>{const error=new Error(message);error.code=code;throw error;};
const clean=value=>String(value||"").trim();

export function createAccountDeletionCore({repo}={}){
  if(!repo)throw new Error("Account deletion repository is required.");
  return Object.freeze({
    async completeMyAccountDeletionV1({authUid}={}){
      const uid=clean(authUid);if(!uid)fail("AUTH_REQUIRED","Authentication is required.");
      const request=await repo.readRequest(uid);
      if(!request||request.status!=="pending"||request.cleanupStatus!=="complete")fail("DELETE_DENIED","Account deletion preparation is incomplete.");
      const authority=await repo.inspectAuthority(uid);
      if(authority.systemOwner)fail("DELETE_DENIED","Transfer FIDUNIO system ownership before deleting this account.");
      if(authority.ownedGroups.length)fail("DELETE_DENIED","Delete or transfer every group you own before deleting this account.");
      if(authority.groupMemberships.length)fail("DELETE_DENIED","Leave every group before deleting this account.");
      await repo.markProcessing(uid);
      await repo.closeDirectConversations(uid);
      await repo.deletePersonalData(uid);
      await repo.deleteAuthUser(uid);
      await repo.deleteRequest(uid);
      return Object.freeze({deleted:true});
    }
  });
}
