import { readdir, readFile } from "node:fs/promises";

const entries=await readdir(".",{withFileTypes:true});
const jsFiles=entries
  .filter(e=>e.isFile()&&/\.(?:js|mjs)$/.test(e.name))
  .map(e=>e.name)
  .filter(name=>!name.endsWith(".test.mjs"));

// firebase.js is the sole runtime Firebase SDK/service owner, including App Check.
const firebaseSdkAllow=new Set([
  "firebase.js",
]);
const observerAllow=new Set([
]);

const unexpectedFirebase=[];
const unexpectedObservers=[];
for(const name of jsFiles){
  const source=await readFile(name,"utf8");

  // service-worker.js contains literal JavaScript source strings that it still
  // injects into app.js. Those strings can contain gstatic Firebase imports,
  // but the service worker itself is not acquiring Firebase services here.
  // Its semantic transforms are guarded separately by runtime-transform-anchor.
  const ownsFirebaseSdk=name!=="service-worker.js"&&/gstatic\.com\/firebasejs\//.test(source);
  if(ownsFirebaseSdk&&!firebaseSdkAllow.has(name))unexpectedFirebase.push(name);
  if(/\bMutationObserver\b/.test(source)&&!observerAllow.has(name))unexpectedObservers.push(name);
}

if(unexpectedFirebase.length){
  throw new Error(`Unexpected direct Firebase SDK ownership outside allowlist: ${unexpectedFirebase.join(", ")}`);
}
if(unexpectedObservers.length){
  throw new Error(`Unexpected MutationObserver repair path outside allowlist: ${unexpectedObservers.join(", ")}`);
}

const firebase=await readFile("firebase.js","utf8");
if(!/firebase-app-check\.js/.test(firebase)||!/initializeAppCheck\s*\(/.test(firebase)||!/ReCaptchaEnterpriseProvider/.test(firebase))throw new Error("firebase.js must own App Check initialization.");
const appAt=firebase.indexOf("initializeApp(firebaseConfig)");
const appCheckAt=firebase.indexOf("initializeAppCheck(app");
const authAt=firebase.indexOf("getAuth(app)");
const firestoreAt=firebase.indexOf("getFirestore(app)");
if(appAt<0||appCheckAt<=appAt||authAt<=appCheckAt||firestoreAt<=appCheckAt)throw new Error("Central App Check must initialize after the single app and before Auth/Firestore services.");

if(jsFiles.includes("firebase-app-check.js"))throw new Error("firebase-app-check.js second Firebase owner must remain deleted.");

const bootstrap=await readFile("bootstrap.js","utf8");
if(/MutationObserver/.test(bootstrap))throw new Error("bootstrap.js must remain observer-free.");
if(/new-message-polish/.test(bootstrap))throw new Error("bootstrap.js must not revive superseded New Message polish.");
if(/profile-sync|main-screen-polish/.test(bootstrap))throw new Error("bootstrap.js must not revive retired main-screen projection overlays.");

const app=await readFile("app.js","utf8");
if(!/mountNewMessageRecipientPicker/.test(app))throw new Error("app.js must keep explicit New Message recipient owner hook.");
if(!/const contacts=\[\]/.test(app))throw new Error("Prototype contact seed must not return to app.js.");
if(!/subscribeUserDisplayNames/.test(app))throw new Error("app.js must use central peer display-name subscription.");
if(!/mainSignOutMarkup/.test(app)||!/bindMainSignOut/.test(app))throw new Error("main-screen Sign Out must remain an explicit app projection.");
if(!/mountSettingsLifecycle/.test(app))throw new Error("app.js must call the explicit Settings lifecycle owner.");
if(!/bindAuthenticatedAccountE2EE/.test(app)||!/resetAccountE2EEForSignOut/.test(app))throw new Error("app.js must bind/reset account E2EE from the Firebase auth lifecycle.");

console.log("Runtime authority gate passed.");
console.log("Bounded Firebase SDK owners:",[...firebaseSdkAllow].join(", "));
console.log("Known temporary observer exceptions:",[...observerAllow].join(", "));
