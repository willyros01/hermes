import assert from "node:assert/strict";
import {createDirectMessageDeliveryOwner} from "./direct-message-delivery-owner.js";

let releaseFirst;
const firstGate=new Promise(resolve=>{releaseFirst=resolve;});
const order=[];
let active=0,maxActive=0;
const owner=createDirectMessageDeliveryOwner({deliver:async(rows,meta)=>{
  active++;maxActive=Math.max(maxActive,active);
  order.push(meta.priorityMessageId||rows[0]);
  if(rows[0]==="snapshot-1")await firstGate;
  active--;
  return{value:{projectedMessageIds:rows},maintenance:[async()=>{order.push(`maintenance:${rows[0]}`);} ]};
}});

owner.offerSnapshot(["snapshot-1"]);
owner.offerSnapshot(["snapshot-2"]);
owner.offerSnapshot(["snapshot-3"]);
const priority=owner.offerPriority("message-priority",["message-priority"]);
await Promise.resolve();
releaseFirst();
assert.deepEqual((await priority).projectedMessageIds,["message-priority"]);
await new Promise(resolve=>setTimeout(resolve,0));
assert.deepEqual(order,["snapshot-1","message-priority","snapshot-3","maintenance:snapshot-3"],"priority must run at the first safe boundary, snapshots must coalesce, and only latest maintenance may settle");
assert.equal(maxActive,1,"delivery callbacks must never overlap");

let deliveredBy="first";
const transferred=createDirectMessageDeliveryOwner({deliver:async()=>deliveredBy});
transferred.setCallbacks(async()=>"replacement");
assert.equal(await transferred.offerPriority("message",[{id:"message"}]),"replacement","warm re-entry must transfer callback ownership without creating another owner");

console.log("Direct-message priority delivery owner passed");
