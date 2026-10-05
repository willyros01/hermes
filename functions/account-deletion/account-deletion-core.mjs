const fail=(code,message)=>{const error=new Error(message);error.code=code;throw error;};
const clean=value=>String(value||"").trim();

export function createAccountDeletionCore({repo}={}){
  if(!repo)throw new Error("Account deletion repository is required.");
  return Object.freeze({
    async getMyAccountDeletionRequestV1({authUid}={}){
      const uid=clean(authUid);if(!uid)fail("AUTH_REQUIRED","Authentication is required.");
      const request=await repo.readRequest(uid);
      return request?Object.freeze({uid,...request}):null;
    },
    async requestMyAccountDeletionV1({authUid}={}){
      const uid=clean(authUid);if(!uid)fail("AUTH_REQUIRED","Authentication is required.");
      const existing=await repo.readRequest(uid);
      if(existing&&["pending","processing"].includes(existing.status))return Object.freeze({status:existing.status,alreadyPending:true});
      await repo.createRequest(uid);
      return Object.freeze({status:"pending",alreadyPending:false});
    },
    async markMyAccountDeletionCleanupCompleteV1({authUid}={}){
      const uid=clean(authUid);if(!uid)fail("AUTH_REQUIRED","Authentication is required.");
      const request=await repo.readRequest(uid);
      if(!request||request.status!=="pending"||request.cleanupStatus!=="required")fail("DELETE_DENIED","There is no pending deletion request requiring cleanup.");
      await repo.markCleanupComplete(uid);
      return Object.freeze({status:"pending",cleanupStatus:"complete"});
    },
    async cancelMyAccountDeletionRequestV1({authUid}={}){
      const uid=clean(authUid);if(!uid)fail("AUTH_REQUIRED","Authentication is required.");
      const request=await repo.readRequest(uid);
      if(!request||request.status!=="pending"||request.cleanupStatus!=="required")fail("DELETE_DENIED","This deletion request can no longer be cancelled.");
      await repo.cancelRequest(uid);
      return Object.freeze({status:"cancelled"});
    },
    async completeMyAccountDeletionV1({authUid}={}){
      const uid=clean(authUid);if(!uid)fail("AUTH_REQUIRED","Authentication is required.");
      const request=await repo.readRequest(uid);
      if(!request||!["pending","processing"].includes(request.status)||request.cleanupStatus!=="complete")fail("DELETE_DENIED","Account deletion preparation is incomplete.");
      const authority=await repo.inspectAuthority(uid);
      if(authority.systemOwner)fail("DELETE_DENIED","Transfer FIDUNIO system ownership before deleting this account.");
      if(authority.ownedGroups.length)fail("DELETE_DENIED","Delete or transfer every group you own before deleting this account.");
      if(authority.groupMemberships.length)fail("DELETE_DENIED","Leave every group before deleting this account.");
      if(request.status==="pending")await repo.markProcessing(uid);
      await repo.closeDirectConversations(uid);
      await repo.deletePersonalData(uid);
      await repo.deleteAuthUser(uid);
      await repo.deleteRequest(uid);
      return Object.freeze({deleted:true});
    }
  });
}
