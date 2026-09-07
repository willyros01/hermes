import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync(new URL("./app.js",import.meta.url),"utf8");
assert.match(app,/markCloudConversationRead\(conversationId\)\.catch/,"opening a direct chat must explicitly advance incoming messages to Read");
assert.match(app,/snapshot processing, so an initial cache snapshot cannot suppress Read/,"the cache-to-server receipt boundary must remain documented in the owner");
console.log("Direct Read-receipt recovery gate passed");
