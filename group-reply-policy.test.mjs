import assert from "node:assert/strict";
import {encodeGroupReplyDescriptor,groupReplyVisibleText,parseGroupReplyDescriptor,GROUP_REPLY_PREVIEW_LIMIT} from "./group-reply-policy.js";

const encoded=encodeGroupReplyDescriptor({
  replyToMessageId:"msg-123",
  replyToSender:"Alice",
  replyPreview:"Earlier group message",
  text:"This is my reply"
});
const parsed=parseGroupReplyDescriptor(encoded);
assert.equal(parsed.replyToMessageId,"msg-123");
assert.equal(parsed.replyToSender,"Alice");
assert.equal(parsed.replyPreview,"Earlier group message");
assert.equal(parsed.text,"This is my reply");
assert.equal(groupReplyVisibleText(encoded),"This is my reply");
assert.equal(groupReplyVisibleText("ordinary group text"),"ordinary group text");
assert.equal(parseGroupReplyDescriptor('{"fidunioReply":2,"text":"bad","replyToMessageId":"x"}'),null);
assert.equal(parseGroupReplyDescriptor('{"fidunioReply":1,"text":"bad"}'),null);
assert.throws(()=>encodeGroupReplyDescriptor({replyToMessageId:"",text:"reply"}),/target message ID/i);
assert.throws(()=>encodeGroupReplyDescriptor({replyToMessageId:"x",text:"   "}),/reply text/i);
const longPreview="x".repeat(GROUP_REPLY_PREVIEW_LIMIT+40);
assert.equal(parseGroupReplyDescriptor(encodeGroupReplyDescriptor({replyToMessageId:"x",replyPreview:longPreview,text:"ok"})).replyPreview.length,GROUP_REPLY_PREVIEW_LIMIT);
console.log("Group reply descriptor policy passes");
