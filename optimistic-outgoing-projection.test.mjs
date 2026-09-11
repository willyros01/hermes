import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createOptimisticOutgoingProjectionOwner,OPTIMISTIC_OUTGOING_PROJECTION_V1} from "./optimistic-outgoing-projection.js";

const owner=createOptimisticOutgoingProjectionOwner();
const sending={id:"local-1",mine:true,text:"visible immediately",state:"sending",serverBacked:false};
owner.stage("group-1",sending);

assert.deepEqual(owner.project("group-1",[]),[sending],"an empty authoritative snapshot cannot erase the staged Sending bubble");
assert.deepEqual(owner.project("group-1",[{id:"remote-1",text:"other"}]).map(row=>row.id),["remote-1","local-1"],"new server rows merge without erasing the staged Sending bubble");
const confirmed={id:"local-1",mine:true,text:"visible immediately",state:"sent",serverBacked:true};
assert.deepEqual(owner.project("group-1",[confirmed]),[confirmed],"the exact authoritative row replaces and releases the reservation");
assert.deepEqual(owner.project("group-1",[]),[],"a confirmed reservation is not resurrected");

owner.stage("direct-1",{id:"cancelled",mine:true,state:"sending"});
assert.equal(owner.release("direct-1","cancelled"),true);
assert.deepEqual(owner.project("direct-1",[]),[],"explicit deletion releases the reservation");

owner.stage("direct-2",{id:"hidden",mine:true,state:"failed"});
assert.deepEqual(owner.project("direct-2",[],{isHidden:id=>id==="hidden"}),[],"Delete for Me cannot be reversed by optimistic projection");
assert.equal(OPTIMISTIC_OUTGOING_PROJECTION_V1.createsTransportAuthority,false);

const app=readFileSync(new URL("./app.js",import.meta.url),"utf8");
assert.match(app,/optimisticOutgoingProjection\.stage\(conversationId,m\)[\s\S]*?state\.messages\[conversationId\]\.push\(m\)[\s\S]*?render\(\)/,"text send must reserve and paint before asynchronous Outbox work");
assert.match(app,/optimisticOutgoingProjection\.stage\(c\.id,stagedMessage\)[\s\S]*?state\.messages\[c\.id\]\.push\(stagedMessage\)[\s\S]*?render\(\)/,"attachment send must use the same visible reservation boundary");
assert.equal((app.match(/optimisticOutgoingProjection\.project\(/g)||[]).length,2,"direct and group listener projections must share the owner");
console.log("Optimistic outgoing projection gate passed");
