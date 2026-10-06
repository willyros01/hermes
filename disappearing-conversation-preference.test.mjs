import assert from "node:assert/strict";
import {readConversationDisappearSelection,writeConversationDisappearSelection,DISAPPEARING_CONVERSATION_PREFERENCE_V1} from "./disappearing-conversation-preference.js";

let map={};
map=writeConversationDisappearSelection(map,"direct-a",300);
assert.equal(readConversationDisappearSelection(map,"direct-a"),300);
assert.equal(readConversationDisappearSelection(map,"direct-b"),null);
map=writeConversationDisappearSelection(map,"group-c",3600);
assert.equal(readConversationDisappearSelection(map,"direct-a"),300);
assert.equal(readConversationDisappearSelection(map,"group-c"),3600);
map=writeConversationDisappearSelection(map,"direct-a",null);
assert.equal(readConversationDisappearSelection(map,"direct-a"),null);
assert.equal(readConversationDisappearSelection(map,"group-c"),3600);
assert.equal(DISAPPEARING_CONVERSATION_PREFERENCE_V1.scope,"conversation");
console.log("PASS: disappearing-message compose preference is isolated per conversation");
