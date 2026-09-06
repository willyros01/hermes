import assert from "node:assert/strict";
import {mergeAccountGroupRows,projectAccountGroupConversation} from "./e2ee-account-group-projection.js";

const existing=[
  {id:"server-old",mine:false,text:"old",state:"read"},
  {id:"queued-1",mine:true,text:"offline",state:"queued"},
  {id:"failed-1",mine:true,text:"retry",state:"failed"},
  {id:"server-1",mine:true,text:"local stale",state:"sending"}
];
const remote=[
  {id:"server-1",mine:true,text:"confirmed",state:"delivered",time:"10:00"},
  {id:"server-2",mine:false,text:"latest",state:"read",time:"10:01"}
];
const merged=mergeAccountGroupRows(existing,remote);
assert.deepEqual(merged.map(x=>x.id),["server-1","server-2","queued-1","failed-1"]);
assert.equal(merged.find(x=>x.id==="server-1").state,"delivered");
assert.equal(merged.some(x=>x.id==="server-old"),false,"server-authoritative rows remove stale cached history");
const projected=projectAccountGroupConversation({id:"g1",name:"Family",preview:"old"},existing,remote);
assert.equal(projected.conversation.cloudGroup,true);
assert.equal(projected.conversation.type,"group");
assert.equal(projected.conversation.preview,"retry","pending local Outbox remains visible after remote rows");
assert.equal(projected.messages.length,4);
assert.throws(()=>projectAccountGroupConversation(null,[],[]),/identity/i);
console.log("PASS deterministic group projection preserves pending Outbox and accepts server authority");
