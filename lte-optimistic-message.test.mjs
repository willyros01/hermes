import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync(new URL("./app.js",import.meta.url),"utf8");
const start=app.indexOf("async function sendCurrent(){");
const end=app.indexOf("function serializeReconnectRecovery",start);
assert.ok(start>=0&&end>start,"sendCurrent boundary must exist");
const send=app.slice(start,end);
const stage=send.indexOf("state.messages[conversationId].push(m);");
const optimistic=send.indexOf("c.time=m.time;\n  render();");
const directQueue=send.indexOf("await queueOutboxMessage(conversationId,m);");
const groupQueue=send.indexOf("await queueGroupTextForApp({");
assert.ok(stage>=0&&optimistic>stage,"outgoing row must be staged before optimistic render");
assert.ok(directQueue>optimistic,"direct Outbox persistence must begin only after the local bubble renders");
assert.ok(groupQueue>optimistic,"group Outbox persistence must begin only after the local bubble renders");
assert.match(send,/let stagedMessage=null;[\s\S]*const m=stagedMessage=stampOutgoingDisappearSelection/);
assert.match(send,/catch\(err\)\{[\s\S]*if\(stagedMessage\)\{[\s\S]*stagedMessage\.state="failed";[\s\S]*persistSoon\(\);[\s\S]*render\(\{background:true\}\);/);
assert.doesNotMatch(send,/if\(stagedMessage\)[\s\S]{0,160}currentBox\.value=text/,"an already-visible failed attempt must not silently repopulate the composer");
console.log("LTE optimistic outgoing-message gate passed");
