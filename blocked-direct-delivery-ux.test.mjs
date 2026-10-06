import fs from "node:fs";
import assert from "node:assert/strict";

const firebase=fs.readFileSync("firebase.js","utf8");
const app=fs.readFileSync("app.js","utf8");

assert.match(firebase,/code==="permission-denied"\|\|code==="firestore\/permission-denied"/,
  "direct send must recognize Firestore permission denial");
assert.match(firebase,/safe\.code="fidunio\/direct-delivery-denied"/,
  "direct send must translate the raw permission denial into a bounded delivery error");
assert.match(firebase,/Message could not be delivered to this conversation\./,
  "blocked delivery must use privacy-safe user text");
assert.match(firebase,/safe\.code="fidunio\/direct-start-denied"/,
  "blocked direct conversation creation must map permission denial to a privacy-safe error");
assert.match(firebase,/Conversation could not be started\./,
  "blocked conversation creation must not expose raw Firestore permission text");
assert.match(firebase,/safe\.code="fidunio\/direct-action-denied"/,
  "blocked direct reaction must map permission denial to a privacy-safe error");
assert.match(firebase,/This action could not be completed for this conversation\./,
  "blocked direct reaction must not expose raw Firestore permission text");

assert.match(app,/const deliveryDenied=err\?\.code==="fidunio\/direct-delivery-denied"/,
  "Outbox must recognize terminal blocked delivery");
assert.match(app,/m\.failureReason="delivery-denied"/,
  "blocked delivery must be marked as a bounded terminal failure");
assert.match(app,/await removeOutboxMessage\(payload\.messageId\)/,
  "blocked delivery must not remain queued for automatic retry");
assert.match(app,/firebaseError="";/,
  "blocked delivery must not be presented as a Firebase connection problem");
assert.doesNotMatch(app,/alert\("Missing or insufficient permissions\."/,
  "raw Firestore permission text must not be hard-coded into the user path");

console.log("PASS: blocked direct conversation, delivery and reaction denials are privacy-safe; rejected sends are terminal and not mislabeled as connectivity failures");
