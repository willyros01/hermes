import fs from "node:fs/promises";
import assert from "node:assert/strict";

const firebaseSource=await fs.readFile(new URL("./firebase.js",import.meta.url),"utf8");
const authSource=await fs.readFile(new URL("./auth-ui-clean.js",import.meta.url),"utf8");

assert.match(firebaseSource,/firebase-app-check\.js/);
assert.match(firebaseSource,/firebase-functions\.js/);
assert.match(firebaseSource,/getFunctions\(app,"us-central1"\)/);
assert.match(firebaseSource,/httpsCallable\(s\.functions,name\)/);
assert.match(firebaseSource,/ReCaptchaEnterpriseProvider/);
assert.match(firebaseSource,/initializeAppCheck/);
assert.match(firebaseSource,/isTokenAutoRefreshEnabled\s*:\s*true/);
assert.match(firebaseSource,/6LfLaqstAAAAANNkEghVZ26a4vv8hXwC7KDI9rma/);
assert.doesNotMatch(firebaseSource,/ReCaptchaV3Provider/);

const initializeAppAt=firebaseSource.indexOf("initializeApp(firebaseConfig)");
const initializeAppCheckAt=firebaseSource.indexOf("initializeAppCheck(app");
const getAuthAt=firebaseSource.indexOf("getAuth(app)");
const getFirestoreAt=firebaseSource.indexOf("getFirestore(app)");
assert.ok(initializeAppAt>=0,"firebase.js must initialize the single Firebase app");
assert.ok(initializeAppCheckAt>initializeAppAt,"App Check must bind to the initialized central app");
assert.ok(getAuthAt>initializeAppCheckAt,"App Check must initialize before Auth is exposed");
assert.ok(getFirestoreAt>initializeAppCheckAt,"App Check must initialize before Firestore is exposed");
assert.match(firebaseSource,/export async function refreshFirebaseAuthSession\(\)/);
assert.match(firebaseSource,/await user\.getIdToken\(true\)/,"Firebase session recovery must use the central Auth owner and force a current token");

assert.doesNotMatch(authSource,/firebase-app-check\.js/);
assert.doesNotMatch(authSource,/initializeFidunioAppCheck/);
assert.match(authSource,/initFirebase\(user=>/);

try{
  await fs.access(new URL("./firebase-app-check.js",import.meta.url));
  assert.fail("firebase-app-check.js second owner must be removed");
}catch(err){
  if(err?.code!=="ENOENT")throw err;
}

console.log("FIDUNIO App Check central-owner integration anchors validated");
