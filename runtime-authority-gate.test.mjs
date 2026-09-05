import { readdir, readFile } from "node:fs/promises";

const entries=await readdir(".",{withFileTypes:true});
const jsFiles=entries
  .filter(e=>e.isFile()&&/\.(?:js|mjs)$/.test(e.name))
  .map(e=>e.name)
  .filter(name=>!name.endsWith(".test.mjs"));

const firebaseSdkAllow=new Set([
  "firebase.js",            // sole target Firebase service owner
  "auth-ui-clean.js",       // temporary password-reset helper; consolidate later
  "profile-sync.js"         // temporary live profile listener; consolidate later
]);
const observerAllow=new Set([
  "main-screen-polish.js",  // temporary sign-out/display-name compatibility overlay
  "settings-lifecycle-bridge.js" // temporary Settings compatibility bridge
]);

const unexpectedFirebase=[];
const unexpectedObservers=[];
for(const name of jsFiles){
  const source=await readFile(name,"utf8");
  if(/gstatic\.com\/firebasejs\//.test(source)&&!firebaseSdkAllow.has(name))unexpectedFirebase.push(name);
  if(/\bMutationObserver\b/.test(source)&&!observerAllow.has(name))unexpectedObservers.push(name);
}

if(unexpectedFirebase.length){
  throw new Error(`Unexpected direct Firebase SDK ownership outside allowlist: ${unexpectedFirebase.join(", ")}`);
}
if(unexpectedObservers.length){
  throw new Error(`Unexpected MutationObserver repair path outside allowlist: ${unexpectedObservers.join(", ")}`);
}

const bootstrap=await readFile("bootstrap.js","utf8");
if(/MutationObserver/.test(bootstrap))throw new Error("bootstrap.js must remain observer-free.");
if(/new-message-polish/.test(bootstrap))throw new Error("bootstrap.js must not revive superseded New Message polish.");

const app=await readFile("app.js","utf8");
if(!/mountNewMessageRecipientPicker/.test(app))throw new Error("app.js must keep explicit New Message recipient owner hook.");
if(!/const contacts=\[\]/.test(app))throw new Error("Prototype contact seed must not return to app.js.");

console.log("Runtime authority gate passed.");
console.log("Known temporary Firebase SDK exceptions:",[...firebaseSdkAllow].filter(x=>x!=="firebase.js").join(", "));
console.log("Known temporary observer exceptions:",[...observerAllow].join(", "));
