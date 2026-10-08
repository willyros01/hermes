import assert from "node:assert/strict";
import {createSystemOwnershipCore} from "./system-ownership-core.mjs";
let transferred=null;
const make=(overrides={})=>({
 readAccess:async()=>({ownerUid:"owner"}),
 readProfile:async uid=>uid==="owner"?{systemRole:"owner",active:true,status:"active"}:{systemRole:"admin",active:true,status:"active"},
 transfer:async value=>{transferred=value;},
 ...overrides
});
let core=createSystemOwnershipCore({repo:make()});
assert.deepEqual(await core.transferSystemOwnershipV1({authUid:"owner",data:{targetUid:"admin"}}),{transferred:true,ownerUid:"admin"});
assert.deepEqual(transferred,{fromUid:"owner",toUid:"admin"});
core=createSystemOwnershipCore({repo:make({readProfile:async uid=>uid==="owner"?{systemRole:"owner",active:true}:{systemRole:"user",active:true}})});
await assert.rejects(()=>core.transferSystemOwnershipV1({authUid:"owner",data:{targetUid:"user"}}),/Administrator/);
core=createSystemOwnershipCore({repo:make({readAccess:async()=>({ownerUid:"someone-else"})})});
await assert.rejects(()=>core.transferSystemOwnershipV1({authUid:"owner",data:{targetUid:"admin"}}),/current FIDUNIO Owner/);
console.log("PASS: system ownership transfer requires current owner and active administrator");
