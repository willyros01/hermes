import fs from "node:fs/promises";
import assert from "node:assert/strict";

const firebaseSource=await fs.readFile(new URL("./firebase.js",import.meta.url),"utf8");
const adapterSource=await fs.readFile(new URL("./firebase-platform-adapter.js",import.meta.url),"utf8");
const authSource=await fs.readFile(new URL("./auth-ui-clean.js",import.meta.url),"utf8");
const capacitor=JSON.parse(await fs.readFile(new URL("./capacitor.config.json",import.meta.url),"utf8"));
const pkg=JSON.parse(await fs.readFile(new URL("./package.json",import.meta.url),"utf8"));

assert.match(firebaseSource,/firebase-app-check\.js/);
assert.match(firebaseSource,/firebase-functions\.js/);
assert.match(firebaseSource,/getFunctions\(app,"us-central1"\)/);
assert.match(firebaseSource,/httpsCallable\(s\.functions,name\)/);
assert.match(firebaseSource,/await createPlatformFirebaseAppCheck/);
assert.match(firebaseSource,/6LfLaqstAAAAANNkEghVZ26a4vv8hXwC7KDI9rma/);
assert.doesNotMatch(firebaseSource,/ReCaptchaEnterpriseProvider|ReCaptchaV3Provider|CustomProvider|initializeAppCheck\(/);

assert.match(adapterSource,/ReCaptchaEnterpriseProvider/);
assert.match(adapterSource,/CustomProvider/);
assert.match(adapterSource,/FirebaseAppCheck/);
assert.match(adapterSource,/plugin\.initialize\(\{isTokenAutoRefreshEnabled:true\}\)/);
assert.match(adapterSource,/plugin\.getToken\(\{forceRefresh:false\}\)/);
assert.match(adapterSource,/initializeAppCheck/);
assert.match(adapterSource,/isTokenAutoRefreshEnabled\s*:\s*true/);
assert.match(adapterSource,/app-attest-devicecheck-native-bridge-standby-fail-open/);
assert.match(adapterSource,/continuing because backend enforcement is OFF/);
assert.doesNotMatch(adapterSource,/iosAppCheck:"deferred-app-attest-devicecheck"/);

const initializeAppAt=firebaseSource.indexOf("initializeApp(firebaseConfig)");
const initializeAppCheckAt=firebaseSource.indexOf("await createPlatformFirebaseAppCheck(");
const getAuthAt=firebaseSource.indexOf("createPlatformFirebaseAuth({app,authSdk})");
const getFirestoreAt=firebaseSource.indexOf("getFirestore(app)");
assert.ok(initializeAppAt>=0,"firebase.js must initialize the single Firebase app");
assert.ok(initializeAppCheckAt>initializeAppAt,"platform App Check bootstrap must bind to the initialized central app");
assert.ok(getAuthAt>initializeAppCheckAt,"App Check bootstrap must complete before Auth is exposed");
assert.ok(getFirestoreAt>initializeAppCheckAt,"App Check bootstrap must complete before Firestore is exposed");
assert.match(firebaseSource,/export async function ensureFirebaseAuthSession\(\)/);
assert.match(firebaseSource,/await user\.getIdToken\(\)/);
assert.doesNotMatch(firebaseSource,/getIdToken\(true\)/);

assert.equal(pkg.dependencies?.["@capacitor-firebase/app-check"],"8.5.2");
assert.equal(capacitor.experimental?.ios?.spm?.packageOptions?.["@capacitor-firebase/app-check"]?.symlink,true);

assert.doesNotMatch(authSource,/firebase-app-check\.js/);
assert.doesNotMatch(authSource,/initializeFidunioAppCheck/);
assert.match(authSource,/initFirebase\(user=>/);

try{
  await fs.access(new URL("./firebase-app-check.js",import.meta.url));
  assert.fail("firebase-app-check.js second owner must be removed");
}catch(err){
  if(err?.code!=="ENOENT")throw err;
}

console.log("FIDUNIO App Check central owner validates web reCAPTCHA Enterprise and native App Attest/DeviceCheck bridge");
