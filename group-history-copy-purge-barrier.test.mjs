import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const firebase=await readFile(new URL("./firebase.js",import.meta.url),"utf8");
const rules=await readFile(new URL("./firestore.rules",import.meta.url),"utf8");
const start=firebase.indexOf("export async function writeCloudGroupHistoryGrantCopies");
const end=firebase.indexOf("export async function activateCloudGroupHistoryGrant",start);
assert.ok(start>=0&&end>start,"writeCloudGroupHistoryGrantCopies source boundary is required");
const write=firebase.slice(start,end);
assert.match(write,/const now=s\.fsSdk\.serverTimestamp\(\)/,"history copy chunk must establish one server timestamp");
assert.match(write,/batch\.update\(groupRef,\{updatedAt:now\}\)/,"new history copy chunk must touch group authority in the same batch");
assert.match(write,/batch\.set\(ref,\{\.\.\.row,createdAt:now\}\)/,"history copies must share the batch barrier timestamp");
assert.match(rules,/allow create: if isGroupAdmin\(groupId\)&&validHistoryGrantCopy\(groupId,grantId,messageId,request\.resource\.data\)&&historyGrantBarrier\(groupId\)/,"history grant copy create must require the group purge barrier");
console.log("PASS group history-copy purge barrier source/rules authority");
