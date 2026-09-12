import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const settings=readFileSync("settings-lifecycle.js","utf8");
const firebase=readFileSync("firebase.js","utf8");
const worker=readFileSync("service-worker.js","utf8");
const workflow=readFileSync(".github/workflows/rebuild-baseline-security.yml","utf8");

for(const exact of [
  `function inviteSubject(){return "You're invited to join FIDUNIO";}`,
  `You're invited to FIDUNIO — Private Messaging`,
  `has invited you to join FIDUNIO, an invitation-only private messaging app for one-to-one and group conversations.`,
  `Your role: \${role}`,
  `Invitation expires: \${invite.expiresAt.toLocaleString()}`,
  `JOIN FIDUNIO\\n\${invite.link}`,
  `This invitation is personal and can be used only once. After your account is created, the invitation becomes invalid. Please do not forward the invitation link.`,
  `QUICK START GUIDE\\n\${guideUrl()}`,
  `The guide explains account setup, privacy and security basics, messaging, device identity, and PIN/biometric unlocking.`,
  `FIDUNIO • Private Messaging`
])assert.ok(settings.includes(exact),`missing accepted invitation text: ${exact}`);

assert.ok(settings.includes('invite.invitedByName||"A FIDUNIO administrator"'),"letter must personalize the inviter with the accepted fallback");
assert.doesNotMatch(settings,/function inviteMessage\(invite\)\{return `You are invited to FIDUNIO as/,"terse replacement must stay removed");
assert.match(settings,/navigator\.clipboard\.writeText\(text\)/,"Copy Invitation must use the restored letter");
assert.match(settings,/mailto:\?subject=\$\{encodeURIComponent\(inviteSubject\(\)\)\}&body=\$\{encodeURIComponent\(inviteMessage\(invite\)\)\}/,"Email Invitation must use the restored subject and letter");
assert.match(settings,/navigator\.share\(\{title:inviteSubject\(\),text:inviteMessage\(invite\)\}\)/,"Share must use the restored subject and letter");
assert.match(firebase,/return\{id,token,role,invitedByName,expiresAt:expires,link:inviteLink\(token\)\}/,"new invitations must return the authoritative inviter name already written to Firestore");
assert.match(worker,/SHELL_REVISION="1\.1\.41-large-attachment-network-policy"/);
assert.match(workflow,/node invitation-letter-restoration\.test\.mjs/);
console.log("Accepted full invitation letter restoration gate passed");
