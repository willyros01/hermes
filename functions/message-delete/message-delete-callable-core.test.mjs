import assert from "node:assert/strict";
import {createMessageDeleteCallableCore} from "./message-delete-callable-core.mjs";

const events=[];
let source={senderUid:"u1",memberUids:["u1","u2"]};
const core=createMessageDeleteCallableCore({
  messageRepo:{readDirectMessage:async()=>source,deleteDirectMessage:async input=>events.push(["message",input])},
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
console.log("Controlled sender-only direct-message deletion core passed");
