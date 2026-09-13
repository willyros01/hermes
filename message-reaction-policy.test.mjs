import assert from "node:assert/strict";
import {MESSAGE_REACTION_CHOICES,normalizeMessageReaction,nextMessageReactions,summarizeMessageReactions} from "./message-reaction-policy.js";

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
assert.deepEqual(summarizeMessageReactions({alice:"👍",bob:"👍",cara:"❤️"},"bob"),[
  {emoji:"👍",count:2,mine:true},
  {emoji:"❤️",count:1,mine:false}
]);
console.log("Message reaction policy tests passed");
