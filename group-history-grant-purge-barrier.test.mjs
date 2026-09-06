import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const firebase=await readFile(new URL("./firebase.js",import.meta.url),"utf8");
const rules=await readFile(new URL("./firestore.rules",import.meta.url),"utf8");
const start=firebase.indexOf("export async function beginCloudGroupHistoryGrant");
const end=firebase.indexOf("export async function writeCloudGroupHistoryGrantCopies",start);
assert.ok(start>=0&&end>start,"beginCloudGroupHistoryGrant source boundary is required");
const begin=firebase.slice(start,end);
assert.match(begin,/const now=s\.fsSdk\.serverTimestamp\(\)/,"history grant begin must establish one server timestamp");
assert.match(begin,/tx\.update\(groupRef,\{updatedAt:now\}\)/,"new history grant must touch group authority in the same transaction");
assert.match(begin,/tx\.set\(grantRef,\{\.\.\.grant,createdAt:now,activatedAt:null\}\)/,"grant creation must share the same transactional barrier timestamp");
assert.match(rules,/function historyGrantBarrier\(groupId\)/,"rules must define the history-grant purge barrier");
assert.match(rules,/allow create: if isGroupAdmin\(groupId\)&&validHistoryGrantCreate\(groupId,grantId,request\.resource\.data\)&&historyGrantBarrier\(groupId\)/,"history grant create must require the barrier");
console.log("PASS group history-grant purge barrier source/rules authority");
