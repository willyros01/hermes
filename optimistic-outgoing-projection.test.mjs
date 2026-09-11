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

owner.stage("group-2",{id:"cancelled",mine:true,state:"sending"});
assert.equal(owner.release("group-2","cancelled"),true);
assert.deepEqual(owner.project("group-2",[]),[],"explicit deletion releases the reservation");

owner.stage("group-3",{id:"hidden",mine:true,state:"failed"});
assert.deepEqual(owner.project("group-3",[],{isHidden:id=>id==="hidden"}),[],"Delete for Me cannot be reversed by optimistic projection");
assert.equal(OPTIMISTIC_OUTGOING_PROJECTION_V1.createsTransportAuthority,false);
assert.equal(OPTIMISTIC_OUTGOING_PROJECTION_V1.groupOnly,true);

const app=readFileSync(new URL("./app.js",import.meta.url),"utf8");
const groupSubscription=app.slice(app.indexOf("function beginCloudGroupMessageSubscription"),app.indexOf("/* FIDUNIO direct-message E2EE foundation */"));
const directSubscription=app.slice(app.indexOf("function beginCloudMessageSubscription"),app.indexOf("function planPartialDirectMessageProjection"));
const send=app.slice(app.indexOf("async function sendCurrent"),app.indexOf("function serializeReconnectRecovery"));
const attachment=app.slice(app.indexOf("async function sendSelectedAttachmentFile"),app.indexOf("async function chooseAndSendAttachment"));
assert.match(groupSubscription,/optimisticOutgoingProjection\.project\(/,"group listener must retain the group-only reservation");
assert.doesNotMatch(directSubscription,/optimisticOutgoingProjection/,"accepted direct listener projection must remain outside the group-only owner");
assert.match(send,/if\(cloudGroup\)optimisticOutgoingProjection\.stage\(conversationId,m\)/,"only group text may stage in the group-only owner");
assert.match(attachment,/if\(c\.cloudGroup\)optimisticOutgoingProjection\.stage\(c\.id,stagedMessage\)/,"only group attachments may stage in the group-only owner");
assert.equal((app.match(/optimisticOutgoingProjection\.project\(/g)||[]).length,1,"the group-only owner must have exactly one projection integration");
console.log("Group-only optimistic projection and direct-isolation gate passed");
