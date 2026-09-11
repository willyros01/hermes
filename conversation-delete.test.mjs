import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createConversationDeleteCallableCore} from "./functions/conversation-delete/conversation-delete-callable-core.mjs";

const calls=[];
const core=createConversationDeleteCallableCore({
  conversationRepo:{
    async beginDeletion(input){calls.push(["begin",input]);if(input.conversationId==="missing")return{alreadyAbsent:true};return{alreadyAbsent:false};},
    async listAttachmentRows(input){calls.push(["list",input]);return[{messageId:"m1",senderUid:"u1"},{messageId:"m2",senderUid:"u2"}];},
    async deleteConversationTree(input){calls.push(["tree",input]);}
  },
  attachmentRepo:{async deleteMessageObjects(input){calls.push(["attachment",input]);}}
});

await assert.rejects(()=>core.deleteConversationForEveryoneV1({data:{conversationId:"abc"}}),error=>error.code==="AUTH_REQUIRED");
await assert.rejects(()=>core.deleteConversationForEveryoneV1({authUid:"u1",data:{conversationId:"bad/id"}}),error=>error.code==="INVALID_INPUT");
const result=await core.deleteConversationForEveryoneV1({authUid:"u1",data:{conversationId:"direct_1",conversationKind:"direct"}});
assert.deepEqual(result,{deleted:true,alreadyAbsent:false,deletedMessageCount:2});
assert.equal(calls[0][0],"begin","server authority must be reserved before any cleanup");
assert.equal(calls.at(-1)[0],"tree","conversation tree must be removed only after attachment cleanup");
assert.equal(calls.filter(([kind])=>kind==="attachment").length,2);
const absent=await core.deleteConversationForEveryoneV1({authUid:"u1",data:{conversationId:"missing",conversationKind:"group"}});
assert.deepEqual(absent,{deleted:true,alreadyAbsent:true,deletedMessageCount:0});

const app=readFileSync(new URL("./app.js",import.meta.url),"utf8");
const firebase=readFileSync(new URL("./firebase.js",import.meta.url),"utf8");
const functions=readFileSync(new URL("./functions/index.mjs",import.meta.url),"utf8");
const adapter=readFileSync(new URL("./functions/conversation-delete/conversation-delete-firestore-admin-adapter.mjs",import.meta.url),"utf8");
const rules=readFileSync(new URL("./firestore.rules",import.meta.url),"utf8");
assert.match(app,/Conversation actions/);
assert.match(app,/Type DELETE to confirm/);
assert.match(app,/deleteCloudConversationForEveryone/);
assert.match(app,/purgeLocalConversationTraces/);
assert.match(firebase,/deleteConversationForEveryoneV1/);
assert.match(functions,/conversationDeleteCore\.deleteConversationForEveryoneV1/);
assert.match(adapter,/Only the group owner may permanently delete the group/);
assert.match(adapter,/deletionState:"deleting"/);
assert.match(adapter,/recursiveDelete/);
assert.match(rules,/function conversationWritable[\s\S]*?!\("deletionState" in/);
assert.match(rules,/function groupWritable[\s\S]*?!\("deletionState" in/);
assert.match(rules,/allow delete: if false/,"client Firestore deletion must remain denied");
assert.doesNotMatch(app,/deleteDoc\s*\(/,"the app must not gain direct Firestore delete authority");

console.log("Permanent shared conversation deletion authority gate passed");
