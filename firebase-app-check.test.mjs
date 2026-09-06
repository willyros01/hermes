import fs from "node:fs/promises";
import assert from "node:assert/strict";

const appCheckSource=await fs.readFile(new URL("./firebase-app-check.js",import.meta.url),"utf8");
const authSource=await fs.readFile(new URL("./auth-ui-clean.js",import.meta.url),"utf8");

assert.match(appCheckSource,/firebase-app-check\.js/);
assert.match(appCheckSource,/ReCaptchaEnterpriseProvider/);
assert.match(appCheckSource,/initializeAppCheck/);
assert.match(appCheckSource,/isTokenAutoRefreshEnabled\s*:\s*true/);
assert.match(appCheckSource,/6LfLaqstAAAAANNkEghVZ26a4vv8hXwC7KDI9rma/);
assert.doesNotMatch(appCheckSource,/ReCaptchaV3Provider/);
assert.doesNotMatch(appCheckSource,/initializeApp\s*\(/);

assert.match(authSource,/initializeFidunioAppCheck/);
assert.match(authSource,/await initializeFidunioAppCheck\(\)/);

const initFirebaseAt=authSource.indexOf("initFirebase(user=>");
const appCheckAt=authSource.indexOf("await initializeFidunioAppCheck()");
const firstFirestoreAt=authSource.indexOf("const info=await getFidunioAccessInfo()",appCheckAt);
assert.ok(initFirebaseAt>=0,"auth gate must initialize Firebase");
assert.ok(appCheckAt>initFirebaseAt,"App Check must initialize after the single Firebase app exists");
assert.ok(firstFirestoreAt>appCheckAt,"App Check must initialize before authenticated Firestore access");

console.log("FIDUNIO App Check integration anchors validated");
