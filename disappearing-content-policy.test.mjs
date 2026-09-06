import assert from "node:assert/strict";
import {recipientExpiryAt,recipientHasExpired,groupSourcePurgeEligible,firstReadReceiptMutation} from "./disappearing-content-policy.js";

const t0=new Date("2026-09-06T12:00:00Z");
assert.equal(recipientExpiryAt(t0,60).toISOString(),"2026-09-06T12:01:00.000Z");
assert.equal(recipientExpiryAt(null,60),null);
assert.equal(recipientHasExpired({readAt:t0,durationSeconds:60,now:new Date("2026-09-06T12:00:59Z")}),false);
assert.equal(recipientHasExpired({readAt:t0,durationSeconds:60,now:new Date("2026-09-06T12:01:00Z")}),true);
assert.equal(groupSourcePurgeEligible({recipientUids:["b","c"],receipts:[{uid:"b",state:"read",readAt:t0}],durationSeconds:60,now:new Date("2026-09-07T12:00:00Z")}),false,"unread group recipient must retain shared source");
assert.equal(groupSourcePurgeEligible({recipientUids:["b","c"],receipts:[{uid:"b",state:"read",readAt:t0},{uid:"c",state:"read",readAt:new Date("2026-09-06T13:00:00Z")}],durationSeconds:60,now:new Date("2026-09-06T13:00:30Z")}),false,"later reader keeps independent window");
assert.equal(groupSourcePurgeEligible({recipientUids:["b","c"],receipts:[{uid:"b",state:"read",readAt:t0},{uid:"c",state:"read",readAt:new Date("2026-09-06T13:00:00Z")}],durationSeconds:60,now:new Date("2026-09-06T13:01:00Z")}),true);
assert.deepEqual(firstReadReceiptMutation(null,"read"),{kind:"create",state:"read",setReadAt:true,preserveReadAt:false});
assert.deepEqual(firstReadReceiptMutation({state:"delivered"},"read"),{kind:"update",state:"read",setReadAt:true,preserveReadAt:false});
assert.deepEqual(firstReadReceiptMutation({state:"read",readAt:t0},"read"),{kind:"noop",preserveReadAt:true},"repeat read must never move first-read authority");
console.log("Disappearing content policy tests passed");
