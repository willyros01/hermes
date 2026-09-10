import fs from "node:fs";
import assert from "node:assert/strict";

const app=fs.readFileSync("app.js","utf8");

assert.match(app,/function startAppActivationOwner\(\)/,"one activation owner must serialize startup and resume");
assert.match(app,/function requestAppActivation\(reason\)/,"all lifecycle sources must signal the activation owner");
assert.match(app,/return appActivationPromise\|\|startAppActivationOwner\(\)/,"duplicate lifecycle signals must join the active owner");
assert.match(app,/while\(appActivationReasons\.size\)/,"signals raised during activation must remain queued until the owner drains them");
assert.match(app,/\.finally\(\(\)=>\{[\s\S]*?appActivationPromise=null;[\s\S]*?if\(appActivationReasons\.size\)startAppActivationOwner\(\)/,
  "a signal queued at owner release must synchronously start the next serialized drain");
assert.doesNotMatch(app,/appActivationFollowUp/,"activation serialization must not use a follow-up busy flag");
assert.equal((app.match(/applyPendingNotificationRoute\(\)/g)||[]).length,2,"notification routing must have one definition and one activation-owner caller");
for(const reason of ["unlock","firebase-auth-ready","firebase-auth-signed-out","initial-hydration","foreground","online","offline","service-worker-message"]){
  assert.ok(app.includes(`"${reason}"`),`${reason} must signal the activation owner`);
}
assert.doesNotMatch(app,/notificationInboxLoaded/,"the installation inbox must be re-read on each eligible activation");
assert.doesNotMatch(app,/if\(state\.route==="settings"\)\s*renderSettings\(\)/,"async Firebase callbacks must project through the render owner");
assert.equal((app.match(/renderSettings\(\)/g)||[]).length,1,"Settings projection must only be entered by the central render dispatcher");
assert.match(app,/render\(\{background:!routed,entry:!!routed\}\)/,"activation owner must render only after routing decision and mark notification entry");
assert.match(app,/if\(routed&&notificationRouteHasRendered\(routed\.route\)\)await finalizePendingNotificationRoute\(routed\)/,"notification record must be consumed only after the exact target chat is mounted");

assert.match(app,/const composerStateByConversation=new Map\(\)/,"composer drafts must have one per-conversation state owner");
assert.match(app,/data-conversation-id=/,"composer ownership must be bound to the exact conversation");
assert.match(app,/function captureComposerStateFromDom\(\)/);
assert.match(app,/function restoreComposerState\(conversationId/);
assert.match(app,/function patchActiveChatProjection\(generation\)/,"background projections need an owned non-structural chat path");
assert.match(app,/if\(background&&patchActiveChatProjection\(generation\)\)return/,"background updates must not replace an active composer");
assert.match(app,/draft:box\.value/);
assert.match(app,/selectionStart/);
assert.match(app,/selectionEnd/);
assert.match(app,/box\.focus\(\{preventScroll:true\}\)/);
const composerCapture=app.slice(app.indexOf("function captureComposerStateFromDom"),app.indexOf("function restoreComposerState"));
assert.doesNotMatch(composerCapture,/windowScrollY|chatScrollTop|NearBottom/,"persistent draft state must not own navigation scroll");
assert.match(app,/function captureChatViewportFromDom\(\)/,"same-chat background projection needs one transient viewport owner");
assert.match(app,/function restoreChatViewport\(conversationId,snapshot\)/);
assert.match(app,/if\(!snapshot\|\|String\(snapshot\.conversationId\)!==String\(conversationId\)\)return scrollChatToLatest\(\)/,"intentional chat entry must open at the latest message");
assert.match(app,/const generation=\+\+chatRenderGeneration/,
  "every central render must invalidate older deferred viewport work");
assert.match(app,/if\(generation!==chatRenderGeneration\)return/,
  "a stale animation frame must not restore an older viewport");
assert.match(app,/const retained=String\(pendingChatViewport\?\.conversationId[\s\S]*?const viewport=retained\|\|captureChatViewportFromDom\(\)\|\|latestChatViewport/,
  "background projection must retain an unresolved intentional latest-message entry");
assert.ok((app.match(/render\(\{background:true\}\)/g)||[]).length>=10,"cloud, attachment and Outbox callbacks must request composer-safe projection");

console.log("Activation and composer single-owner gate passed");
