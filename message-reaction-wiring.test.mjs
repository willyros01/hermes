import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync("app.js","utf8");
const firebase=readFileSync("firebase.js","utf8");
const group=readFileSync("e2ee-account-group-conversation.js","utf8");
const rules=readFileSync("firestore.rules","utf8");
const styles=readFileSync("styles.css","utf8");
const sw=readFileSync("service-worker.js","utf8");
const version=readFileSync("version.js","utf8");

assert.match(app,/setCloudMessageReaction/);
assert.match(app,/message-reaction-section/);
assert.match(app,/MESSAGE_REACTION_CHOICES/);
assert.match(app,/summarizeMessageReactions/);
assert.equal((app.match(/row\.onpointerdown=/g)||[]).length,1,"existing long-press owner must remain singular");
assert.match(firebase,/runTransaction\(s\.db/);
assert.match(firebase,/nextMessageReactions/);
assert.match(group,/reactions:row\.reactions/);
assert.match(rules,/validDirectReactionUpdate/);
assert.match(rules,/validGroupReactionUpdate/);
assert.match(rules,/affectedKeys\(\)\.hasOnly\(\["reactions"\]\)/);
assert.match(styles,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
assert.match(sw,/1\.1\.43-message-reactions/);
assert.match(version,/1\.1\.43/);
assert.ok(!app.includes("emoji-composer"));
console.log("Message reaction wiring tests passed");
