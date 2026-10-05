import assert from "node:assert/strict";
import {createAccountDeletionCore} from "./account-deletion-core.mjs";

function makeRepo(overrides={}){
  const events=[];
  return{
    events,
    readRequest:async()=>({status:"pending",cleanupStatus:"complete"}),
    createRequest:async()=>events.push("create-request"),
    markCleanupComplete:async()=>events.push("cleanup-complete"),
    cancelRequest:async()=>events.push("cancel-request"),
    inspectAuthority:async()=>({systemOwner:false,ownedGroups:[],groupMemberships:[]}),
    markProcessing:async()=>events.push("processing"),
    closeDirectConversations:async()=>events.push("close-direct"),
    deletePersonalData:async()=>events.push("delete-data"),
    deleteAuthUser:async()=>events.push("delete-auth"),
    deleteRequest:async()=>events.push("delete-request"),
    ...overrides
  };
}
repo=makeRepo({readRequest:async()=>null});
core=createAccountDeletionCore({repo});
assert.equal(await core.getMyAccountDeletionRequestV1({authUid:"u1"}),null);
assert.deepEqual(await core.requestMyAccountDeletionV1({authUid:"u1"}),{status:"pending",alreadyPending:false});
assert.deepEqual(repo.events,["create-request"]);

repo=makeRepo({readRequest:async()=>({status:"pending",cleanupStatus:"required"})});
core=createAccountDeletionCore({repo});
assert.deepEqual(await core.markMyAccountDeletionCleanupCompleteV1({authUid:"u1"}),{status:"pending",cleanupStatus:"complete"});
assert.deepEqual(repo.events,["cleanup-complete"]);

repo=makeRepo({readRequest:async()=>({status:"pending",cleanupStatus:"required"})});
core=createAccountDeletionCore({repo});
assert.deepEqual(await core.cancelMyAccountDeletionRequestV1({authUid:"u1"}),{status:"cancelled"});
assert.deepEqual(repo.events,["cancel-request"]);

let repo=makeRepo(),core=createAccountDeletionCore({repo});
assert.deepEqual(await core.completeMyAccountDeletionV1({authUid:"u1"}),{deleted:true});
assert.deepEqual(repo.events,["processing","close-direct","delete-data","delete-auth","delete-request"]);
repo=makeRepo({inspectAuthority:async()=>({systemOwner:true,ownedGroups:[],groupMemberships:[]})});
core=createAccountDeletionCore({repo});
await assert.rejects(()=>core.completeMyAccountDeletionV1({authUid:"u1"}),/system ownership/);
repo=makeRepo({inspectAuthority:async()=>({systemOwner:false,ownedGroups:["g1"],groupMemberships:["g1"]})});
core=createAccountDeletionCore({repo});
await assert.rejects(()=>core.completeMyAccountDeletionV1({authUid:"u1"}),/group/);
repo=makeRepo({readRequest:async()=>({status:"processing",cleanupStatus:"complete"})});
core=createAccountDeletionCore({repo});
assert.deepEqual(await core.completeMyAccountDeletionV1({authUid:"u1"}),{deleted:true});
assert.deepEqual(repo.events,["close-direct","delete-data","delete-auth","delete-request"]);
console.log("PASS: processing request retries final cleanup without re-marking processing");
repo=makeRepo({readRequest:async()=>({status:"pending",cleanupStatus:"required"})});
core=createAccountDeletionCore({repo});
await assert.rejects(()=>core.completeMyAccountDeletionV1({authUid:"u1"}),/preparation is incomplete/);
console.log("PASS: final account deletion enforces cleanup and ownership barriers and deletes Auth last");
