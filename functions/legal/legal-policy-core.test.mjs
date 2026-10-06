import assert from "node:assert/strict";
import {createLegalPolicyCore} from "./legal-policy-core.mjs";
let row=null;
const core=createLegalPolicyCore({
  repo:{read:async()=>row,write:async(uid,next)=>{row={...next,acceptedAtMs:next.acceptedAt.getTime()};}},
  termsVersion:"t1",privacyVersion:"p1",now:()=>new Date(1234)
});
let result=await core.getLegalAcceptanceV1({authUid:"u1"});
assert.equal(result.accepted,false);
await assert.rejects(()=>core.acceptLegalPolicyV1({authUid:"u1",data:{termsVersion:"old",privacyVersion:"p1"}}),/policy version changed/i);
result=await core.acceptLegalPolicyV1({authUid:"u1",data:{termsVersion:"t1",privacyVersion:"p1"}});
assert.equal(result.accepted,true);
result=await core.getLegalAcceptanceV1({authUid:"u1"});
assert.equal(result.accepted,true);
assert.equal(result.acceptedAt,1234);
await assert.rejects(()=>core.getLegalAcceptanceV1({authUid:""}),/Authentication/);
console.log("PASS: legal policy core requires current version and authenticated acceptance");
