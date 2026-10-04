import assert from "node:assert/strict";
import {evaluateMessageSafety,assertMessageSafety,MESSAGE_SAFETY_POLICY} from "./message-safety-policy.js";

for(const text of [
  "Hello, are we still meeting at 7?",
  "I could kill for a cup of coffee.",
  "The history book discusses murder and war.",
  "Please remove me from this group."
]) assert.equal(evaluateMessageSafety(text).allowed,true,text);

for(const text of [
  "I will kill you",
  "I'm going to hurt you",
  "kill yourself",
  "send me nudes or else",
  "CSAM"
]) assert.equal(evaluateMessageSafety(text).allowed,false,text);

assert.throws(()=>assertMessageSafety("I will murder you"),err=>err?.code==="MESSAGE_SAFETY_BLOCKED");
assert.equal(MESSAGE_SAFETY_POLICY.plaintextLeavesDevice,false);
assert.equal(MESSAGE_SAFETY_POLICY.userDisableAllowed,false);
console.log("PASS: local message safety policy blocks high-confidence abusive text before encryption without a server plaintext path");
