import fs from "node:fs";
import assert from "node:assert/strict";

const app=fs.readFileSync("app.js","utf8");
const auth=fs.readFileSync("auth-ui-clean.js","utf8");
const firebase=fs.readFileSync("firebase.js","utf8");

assert.match(firebase,/export function subscribeFidunioBlockedUsers/);
assert.match(app,/beginBlockedUsersSubscription\(\)/);
assert.match(app,/directConversationBlockedByMe/);
assert.match(app,/You blocked this user\. Direct sending, attachments, reactions, and read receipts are disabled/);
assert.match(app,/if\(directConversationBlockedByMe\(activeConversation\)\)throw new Error\(blockedDirectMessage\(\)\)/);
assert.match(app,/if\(directConversationBlockedByMe\(c\)\)return alert\(blockedDirectMessage\(\)\)/);
assert.match(app,/canReact=.*!directConversationBlockedByMe\(conversation\)/);
assert.match(app,/visibleConversation=.*directConversationBlockedByMe\(visibleConversation\).*return Promise\.resolve\(false\)/s);
assert.match(app,/placeholder="\$\{blockedByMe\?"Blocked — unblock in Settings → Safety":"Type a message…"\}"/);

assert.match(app,/const showPinFallback=!security\.hasBiometric\|\|unlockPinFallbackVisible/);
assert.match(app,/security\.hasBiometric&&!showPinFallback\?'<button class="secondary" id="showPinFallbackBtn"/);
assert.match(app,/if\(!\/\^\\d\{6\}\$\/\.test\(pin\)\)/);
assert.match(app,/Enter your six-digit FIDUNIO PIN\./);
assert.match(app,/unlockPinFallbackVisible=true;\s*render\(\);/);

assert.match(auth,/let showPinFallback=!security\.hasBiometric/);
assert.match(auth,/sessionShowPinBtn/);
assert.match(auth,/security\.hasBiometric&&!showPinFallback/);
assert.match(auth,/if\(!\/\^\\d\{6\}\$\/\.test\(pin\)\)/);
assert.match(auth,/Enter your six-digit FIDUNIO PIN\./);

console.log("PASS: blocked-direct client barrier and Face ID-first/PIN fallback source contract");
