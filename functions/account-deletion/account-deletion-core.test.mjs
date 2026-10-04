import assert from "node:assert/strict";
import {createAccountDeletionCore} from "./account-deletion-core.mjs";

function makeRepo(overrides={}){
  const events=[];
  return{
    events,
    readRequest:async()=>({status:"pending",cleanupStatus:"complete"}),
    inspectAuthority:async()=>({systemOwner:false,ownedGroups:[],groupMemberships:[]}),
    markProcessing:async()=>events.push("processing"),
    closeDirectConversations:async()=>events.push("close-direct"),
    deletePersonalData:async()=>events.push("delete-data"),
    deleteAuthUser:async()=>events.push("delete-auth"),
    deleteRequest:async()=>events.push("delete-request"),
    ...overrides
  };
}
let repo=makeRepo(),core=createAccountDeletionCore({repo});
assert.deepEqual(await core.completeMyAccountDeletionV1({authUid:"u1"}),{deleted:true});
assert.deepEqual(repo.events,["processing","close-direct","delete-data","delete-auth","delete-request"]);
repo=makeRepo({inspectAuthority:async()=>({systemOwner:true,ownedGroups:[],groupMemberships:[]})});
core=createAccountDeletionCore({repo});
await assert.rejects(()=>core.completeMyAccountDeletionV1({authUid:"u1"}),/system ownership/);
repo=makeRepo({inspectAuthority:async()=>({systemOwner:false,ownedGroups:["g1"],groupMemberships:["g1"]})});
core=createAccountDeletionCore({repo});
await assert.rejects(()=>core.completeMyAccountDeletionV1({authUid:"u1"}),/group/);
repo=makeRepo({readRequest:async()=>({status:"pending",cleanupStatus:"required"})});
core=createAccountDeletionCore({repo});
await assert.rejects(()=>core.completeMyAccountDeletionV1({authUid:"u1"}),/preparation is incomplete/);
console.log("PASS: final account deletion enforces cleanup and ownership barriers and deletes Auth last");
