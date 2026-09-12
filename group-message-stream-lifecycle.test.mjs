import assert from "node:assert/strict";
import fs from "node:fs";
import {createGroupMessageStreamLifecycle} from "./group-message-stream-lifecycle.js";

const lifecycle=createGroupMessageStreamLifecycle(),first=lifecycle.open("g1");
assert.equal(lifecycle.canReuse("g1"),true,"one live stream is reused");
assert.deepEqual(lifecycle.reject(first,new Error("denied"),{source:"messages",terminal:true}),{accepted:true,terminal:true,message:"denied"});
assert.equal(lifecycle.canReuse("g1"),false,"terminal Firestore failure must mark the stream dead");
assert.equal(lifecycle.errorFor("g1"),"denied","failure remains scoped to its group");
const replacement=lifecycle.open("g1");
assert.equal(lifecycle.isCurrent(first),false,"replacement invalidates the prior callback generation");
assert.equal(lifecycle.isCurrent(replacement),true,"replacement owns the current callbacks");
assert.equal(lifecycle.confirmServerSnapshot(replacement,{fromCache:true}),false,"cache cannot prove recovery");
assert.equal(lifecycle.confirmServerSnapshot(replacement,{fromCache:false,hasPendingWrites:false}),true,"server snapshot proves recovery");
assert.equal(lifecycle.errorFor("g1"),"","successful recovery clears the scoped error");
assert.equal(lifecycle.reject(first,new Error("late"),{terminal:true}).accepted,false,"late callbacks cannot terminate a replacement stream");
lifecycle.reject(replacement,new Error("receipt"),{source:"receipts",terminal:false});
assert.equal(lifecycle.canReuse("g1"),true,"nonterminal receipt/decrypt errors do not kill the message stream");
lifecycle.close();assert.equal(lifecycle.reject(replacement,new Error("closed"),{terminal:true}).accepted,false,"closed callbacks are ignored");

const conversation=fs.readFileSync(new URL("./e2ee-account-group-conversation.js",import.meta.url),"utf8");
const app=fs.readFileSync(new URL("./app.js",import.meta.url),"utf8");
assert.match(conversation,/source:"messages",terminal:true/,"message listener errors must be identified as terminal");
assert.match(conversation,/source:"receipts",terminal:false/,"receipt listener errors must stay nonterminal");
assert.match(app,/confirmServerSnapshot\(token,meta\)/,"app must clear failure only through authoritative recovery");
assert.match(app,/if\(!groupMessageStreamLifecycle\.isCurrent\(token\)\)return/,"late same-group snapshots must not reach projection");
assert.ok((app.match(/if\(!groupMessageStreamLifecycle\.isCurrent\(token\)\)return/g)||[]).length>=3,"async projection boundaries must revalidate the active generation");
assert.match(app,/if\(outcome\.terminal\)\{closeGroupForApp\(\);cloudGroupMessageConversationId=null;\}/,"terminal stream must release the same-group reuse guard");
console.log("Group message stream terminal recovery gate passed");
