import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync("app.js","utf8");
const firebase=readFileSync("firebase.js","utf8");
const group=readFileSync("e2ee-account-group-conversation.js","utf8");
const rules=readFileSync("firestore.rules","utf8");
const styles=readFileSync("styles.css","utf8");
const sw=readFileSync("service-worker.js","utf8");

assert.match(app,/setCloudMessageReaction/);
assert.match(app,/message-reaction-section/);
assert.match(app,/MESSAGE_REACTION_CHOICES/);
assert.match(app,/summarizeMessageReactions/);
assert.equal((app.match(/row\.onpointerdown=/g)||[]).length,1,"existing long-press owner must remain singular");
assert.match(firebase,/runTransaction\(s\.db/);
assert.match(firebase,/applyMessageReactionIntent/);
assert.match(app,/myReaction===button\.dataset\.reaction\?"remove":"apply"/);
assert.doesNotMatch(firebase,/nextMessageReactions/,"Firestore transaction must never toggle on retry");
assert.match(group,/reactions:row\.reactions/);
assert.match(rules,/validDirectReactionUpdate/);
assert.match(rules,/validGroupReactionUpdate/);
assert.match(rules,/affectedKeys\(\)\.hasOnly\(\["reactions"\]\)/);
assert.match(styles,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
assert.match(sw,/message-reaction-policy\.js/);
assert.ok(!app.includes("emoji-composer"));

assert.match(app,/listMessageReactionAuthors\(/);
assert.match(app,/modal\.type==="reactionDetails"/);
assert.match(app,/message-reaction-chip\[data-reaction\]/);
assert.match(app,/if\(e\.target!==row\)return/);
assert.match(styles,/reaction-authors-list/);

assert.match(app,/const pendingWebReactionPreviews=new Map\(\)/);
assert.match(app,/reconcileWebReactionPreviews\(conversationId,remote\)/);
assert.match(app,/reconcileWebReactionPreviews\(groupId,rows\)/);
assert.match(app,/pendingWebReactionPreviews\.set\(key,pending\)/);
assert.match(app,/pendingWebReactionPreviews\.delete\(key\)/);
assert.match(app,/state\.modal=null;host\.remove\(\);render\(\{background:true\}\);\s*try\{\s*await setCloudMessageReaction/);
assert.match(app,/applyMessageReactionIntent\(m\.reactions,pendingPreview\.uid/);

console.log("Message reaction wiring tests passed");
