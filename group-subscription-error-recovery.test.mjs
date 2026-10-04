import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync("app.js","utf8");

assert.match(app,/let cloudGroupSubscriptionError = "";/);
assert.match(app,/subscribeMyGroups\(firebaseUser\.uid,\(rows,meta=\{\}\)=>\{cloudGroupSyncPending=false;cloudGroupSubscriptionError="";/);
assert.match(app,/err=>\{cloudGroupSyncPending=false;cloudGroupSubscriptionError=err\?\.message\|\|String\(err\);/);
assert.match(app,/groupMessageStreamLifecycle\.errorFor\(c\.id\)\|\|cloudGroupSubscriptionError\|\|firebaseError/);

const groupSubscription=app.slice(app.indexOf("function beginCloudGroupSubscription()"),app.indexOf("function stopPeerDisplayNameSubscription()"));
assert.doesNotMatch(groupSubscription,/firebaseError=err/);

console.log("PASS: recovered group subscription clears only its scoped stale error");
