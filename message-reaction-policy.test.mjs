import assert from "node:assert/strict";
import {MESSAGE_REACTION_CHOICES,normalizeMessageReaction,nextMessageReactions,applyMessageReactionIntent,summarizeMessageReactions,listMessageReactionAuthors} from "./message-reaction-policy.js";

assert.deepEqual(MESSAGE_REACTION_CHOICES,["👍","❤️","😂","😮","😢","🙏"]);
assert.equal(normalizeMessageReaction("👍"),"👍");
assert.equal(normalizeMessageReaction("🔥"),null);
const original={alice:"👍"};
const added=nextMessageReactions(original,"bob","❤️");
assert.deepEqual(original,{alice:"👍"});
assert.deepEqual(added,{alice:"👍",bob:"❤️"});
assert.deepEqual(nextMessageReactions(added,"bob","❤️"),{alice:"👍"});
assert.deepEqual(nextMessageReactions(added,"bob","😂"),{alice:"👍",bob:"😂"});
assert.throws(()=>nextMessageReactions({},"bob","🔥"),/Unsupported/);

// A single tap may be evaluated more than once by Firestore runTransaction.
// Retrying must never alternate apply → remove or remove → apply.
const before={alice:"👍",bob:"😮"};
const firstApply=applyMessageReactionIntent(before,"bob","🙏","apply");
assert.deepEqual(firstApply,{alice:"👍",bob:"🙏"});
assert.deepEqual(applyMessageReactionIntent(firstApply,"bob","🙏","apply"),firstApply);
assert.deepEqual(before,{alice:"👍",bob:"😮"});
const firstRemove=applyMessageReactionIntent(firstApply,"bob","🙏","remove");
assert.deepEqual(firstRemove,{alice:"👍"});
assert.deepEqual(applyMessageReactionIntent(firstRemove,"bob","🙏","remove"),firstRemove);
// A late remove must not erase a different, newer emoji from another device.
assert.deepEqual(applyMessageReactionIntent(before,"bob","🙏","remove"),before);
assert.throws(()=>applyMessageReactionIntent({},"bob","🙏","toggle"),/intent/);
assert.throws(()=>applyMessageReactionIntent({},"bob","🔥","apply"),/Unsupported/);
assert.deepEqual(summarizeMessageReactions({alice:"👍",bob:"👍",cara:"❤️"},"bob"),[
  {emoji:"👍",count:2,mine:true},
  {emoji:"❤️",count:1,mine:false}
]);

const namedMembers=[{id:"alice",name:"Alice Example"},{id:"bob",name:"Bob B"}];
assert.deepEqual(listMessageReactionAuthors({alice:"🙏",bob:"🙏",cara:"❤️"},"🙏",namedMembers,"bob"),["Alice Example","You"]);
assert.deepEqual(listMessageReactionAuthors({alice:"🙏",cara:"🙏"},"🙏",namedMembers),["Alice Example","Former member"]);
assert.deepEqual(listMessageReactionAuthors({alice:"🙏"},"🔥",namedMembers),[]);
assert.deepEqual(listMessageReactionAuthors({alice:"🙏"},"😂",namedMembers),[]);
assert.deepEqual(listMessageReactionAuthors({alice:"🙏"},"🙏",[],"alice"),["You"]);
console.log("Message reaction policy tests passed");
