import assert from "node:assert/strict";
import {createBulkMessageDeleteProjectionOwner} from "./bulk-message-delete-projection.js";

const owner=createBulkMessageDeleteProjectionOwner();
owner.reserve("direct-1",["m1","m2"]);

let result=owner.project("direct-1",[{id:"m1"},{id:"m2"}],{authoritative:true,authoritativeRemoteIds:["m1","m2"]});
assert.deepEqual(result.rows,[],"a pre-delete server snapshot must not repaint confirmed deleted rows");
assert.equal(result.pendingCount,2);

result=owner.project("direct-1",[{id:"m2"}],{authoritative:true,authoritativeRemoteIds:["m2"]});
assert.deepEqual(result.rows,[],"an intermediate server snapshot must not repaint the later-deleted row");
assert.equal(result.pendingCount,1,"server-backed absence may release only the already absent ID");

result=owner.project("direct-1",[],{authoritative:false,authoritativeRemoteIds:[]});
assert.equal(result.pendingCount,1,"cache or partial absence must not release convergence state");

result=owner.project("direct-1",[],{authoritative:true,authoritativeRemoteIds:[]});
assert.deepEqual(result.rows,[]);
assert.equal(result.pendingCount,0,"the final authoritative snapshot releases the memory-only suppression");

owner.reserve("group-1",["g1"]);
assert.deepEqual(owner.project("other",[{id:"g1"}],{authoritative:true,authoritativeRemoteIds:["g1"]}).rows,[{id:"g1"}],"suppression must be conversation-scoped");
owner.reset();
assert.deepEqual(owner.project("group-1",[{id:"g1"}],{authoritative:true,authoritativeRemoteIds:["g1"]}).rows,[{id:"g1"}],"sign-out reset must release memory-only state");

console.log("Bulk message-delete projection convergence passed");
