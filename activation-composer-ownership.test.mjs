import fs from "node:fs";
import assert from "node:assert/strict";

const app=fs.readFileSync("app.js","utf8");

assert.match(app,/function requestAppActivation\(reason\)/,"one activation owner must serialize startup and resume");
assert.match(app,/if\(appActivationPromise\)return appActivationPromise/,"duplicate lifecycle signals must join the active owner");
assert.match(app,/while\(appActivationReasons\.size\)/,"signals raised during activation must remain queued until the owner drains them");
assert.doesNotMatch(app,/appActivationFollowUp/,"activation serialization must not use a follow-up busy flag");
assert.equal((app.match(/applyPendingNotificationRoute\(\)/g)||[]).length,2,"notification routing must have one definition and one activation-owner caller");
for(const reason of ["unlock","firebase-auth-ready","firebase-auth-signed-out","initial-hydration","foreground","online","offline","service-worker-message"]){
  assert.ok(app.includes(`"${reason}"`),`${reason} must signal the activation owner`);
}
assert.doesNotMatch(app,/notificationInboxLoaded/,"the installation inbox must be re-read on each eligible activation");
assert.doesNotMatch(app,/if\(state\.route==="settings"\)\s*renderSettings\(\)/,"async Firebase callbacks must project through the render owner");
assert.equal((app.match(/renderSettings\(\)/g)||[]).length,1,"Settings projection must only be entered by the central render dispatcher");
assert.match(app,/render\(\{background:!routed\}\)/,"activation owner must render only after routing decision");
assert.match(app,/if\(routed\)await finalizePendingNotificationRoute\(routed\)/,"notification record must be consumed only after routed render");

assert.match(app,/const composerStateByConversation=new Map\(\)/,"composer drafts must have one per-conversation state owner");
assert.match(app,/data-conversation-id=/,"composer ownership must be bound to the exact conversation");
assert.match(app,/function captureComposerStateFromDom\(\)/);
assert.match(app,/function restoreComposerState\(conversationId/);
assert.match(app,/function patchActiveChatProjection\(\)/,"background projections need an owned non-structural chat path");
assert.match(app,/if\(background&&patchActiveChatProjection\(\)\)return/,"background updates must not replace an active composer");
assert.match(app,/draft:box\.value/);
assert.match(app,/selectionStart/);
assert.match(app,/selectionEnd/);
assert.match(app,/box\.focus\(\{preventScroll:true\}\)/);
assert.match(app,/windowScrollY/);
assert.match(app,/chatScrollTop/);
assert.ok((app.match(/render\(\{background:true\}\)/g)||[]).length>=10,"cloud, attachment and Outbox callbacks must request composer-safe projection");

console.log("Activation and composer single-owner gate passed");
