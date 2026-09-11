import assert from "node:assert/strict";
import {createMessageDeleteCallableCore} from "./message-delete-callable-core.mjs";

const events=[];
let source={senderUid:"u1",memberUids:["u1","u2"]};
const core=createMessageDeleteCallableCore({
  messageRepo:{listDirectMessageIdsBySender:async()=>["m1","m2"],listGroupMessageIdsBySender:async()=>["gm1","gm2"],readDirectMessage:async()=>source,deleteDirectMessage:async input=>events.push(["message",input]),readGroupMessage:async()=>source,deleteGroupMessage:async input=>events.push(["group-message",input])},
  attachmentRepo:{deleteMessageObjects:async input=>events.push(["attachments",input])}
});
const removed=await core.deleteDirectMessageForEveryoneV1({authUid:"u1",data:{conversationId:"c1",messageId:"m1"}});
assert.equal(removed.deleted,true);
assert.deepEqual(events.map(x=>x[0]),["attachments","message"],"attachment traces must be deleted before the source message");
await assert.rejects(()=>core.deleteDirectMessageForEveryoneV1({authUid:"u2",data:{conversationId:"c1",messageId:"m1"}}),e=>e.code==="DELETE_DENIED");
await assert.rejects(()=>core.deleteDirectMessageForEveryoneV1({authUid:"",data:{conversationId:"c1",messageId:"m1"}}),e=>e.code==="AUTH_REQUIRED");
await assert.rejects(()=>core.deleteDirectMessageForEveryoneV1({authUid:"u1",data:{conversationId:"../c1",messageId:"m1"}}),e=>e.code==="INVALID_INPUT");
source=null;
assert.equal((await core.deleteDirectMessageForEveryoneV1({authUid:"u1",data:{conversationId:"c1",messageId:"m1"}})).alreadyAbsent,true);
source={senderUid:"u1",memberUids:["u1","u2","u3"]};events.length=0;
const groupRemoved=await core.deleteDirectMessageForEveryoneV1({authUid:"u1",data:{conversationId:"g1",messageId:"gm1",messageKind:"group"}});
assert.equal(groupRemoved.deleted,true);
assert.deepEqual(events.map(x=>x[0]),["attachments","group-message"],"group attachments must be removed before the authoritative group message and traces");
await assert.rejects(()=>core.deleteDirectMessageForEveryoneV1({authUid:"u2",data:{conversationId:"g1",messageId:"gm1",messageKind:"group"}}),e=>e.code==="DELETE_DENIED");
events.length=0;
const bulkDirect=await core.deleteMyMessagesForEveryoneV1({authUid:"u1",data:{conversationId:"c1"}});
assert.deepEqual(bulkDirect,{deleted:true,deletedCount:2,deletedMessageIds:["m1","m2"],hasMore:false});
assert.deepEqual(events.map(x=>x[0]),["attachments","message","attachments","message"],"bulk direct delete must preserve attachment-before-source order for every message");
events.length=0;
const bulkGroup=await core.deleteMyMessagesForEveryoneV1({authUid:"u1",data:{conversationId:"g1",messageKind:"group"}});
assert.deepEqual(bulkGroup.deletedMessageIds,["gm1","gm2"]);
assert.deepEqual(events.map(x=>x[0]),["attachments","group-message","attachments","group-message"],"bulk group delete must use the trace-cleaning group owner for every message");
await assert.rejects(()=>core.deleteMyMessagesForEveryoneV1({authUid:"",data:{conversationId:"c1"}}),e=>e.code==="AUTH_REQUIRED");
console.log("Controlled sender-only direct, group, and bounded bulk message deletion core passed");
