import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync(new URL("./app.js",import.meta.url),"utf8");
const firebase=readFileSync(new URL("./firebase.js",import.meta.url),"utf8");
const version=readFileSync(new URL("./version.js",import.meta.url),"utf8");
assert.match(app,/unreadIncoming\.length[\s\S]*?markCloudConversationRead\(conversationId\)/,"displayed unread messages must advance through the sole bulk receipt owner");
assert.equal((app.match(/markCloudConversationRead\(conversationId\)/g)||[]).length,1,"the direct chat must have exactly one receipt owner");
assert.match(firebase,/onSnapshot\(q,\{includeMetadataChanges:true\},snap=>/,"the receiver must be notified when a cached display becomes server-confirmed");
assert.match(firebase,/fromCache:!!snap\.metadata\?\.fromCache,hasPendingWrites:!!snap\.metadata\?\.hasPendingWrites/,"reused listeners must preserve real snapshot authority");
assert.match(app,/if\(rows\.some\(m=>m\.e2ee&&m\.e2ee!==3\)\)/,"plain messages must not wait for compatibility-key lookup before receipts");
assert.match(firebase,/markCloudConversationRead[\s\S]*?getDocsFromServer\(q\)[\s\S]*?Promise\.all\(pending\.map/,"open-chat receipt recovery must use server authority and surface write failure");
assert.doesNotMatch(app,/!meta\.fromCache\s*&&\s*state\.route==="chat"/,"displayed incoming messages must not wait for snapshot metadata before writing Read");
assert.match(app,/Read receipt failed:/,"receipt failures must be visible instead of silently swallowed");
assert.match(version,/version: "0\.9\.9\.9g"/,"device candidates must have a visible distinct version");
console.log("Direct Read-receipt recovery gate passed");
