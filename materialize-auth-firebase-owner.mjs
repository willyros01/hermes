// One-shot rebuild materializer: make firebase.js the sole Firebase SDK owner. Trigger after workflow registration.
import fs from "node:fs";

const firebasePath="firebase.js",authPath="auth-ui-clean.js",gatePath="runtime-authority-gate.test.mjs";
let firebase=fs.readFileSync(firebasePath,"utf8");
let auth=fs.readFileSync(authPath,"utf8");
let gate=fs.readFileSync(gatePath,"utf8");

function replaceOnce(source,from,to,label){
  const first=source.indexOf(from);
  if(first<0)throw new Error(`${label}: anchor missing`);
  if(source.indexOf(from,first+from.length)>=0)throw new Error(`${label}: anchor not unique`);
  return source.slice(0,first)+to+source.slice(first+from.length);
}
function replaceRange(source,start,end,replacement,label){
  const a=source.indexOf(start);if(a<0)throw new Error(`${label}: start anchor missing`);
  const b=source.indexOf(end,a+start.length);if(b<0)throw new Error(`${label}: end anchor missing`);
  if(source.indexOf(start,a+start.length)>=0)throw new Error(`${label}: start anchor not unique`);
  return source.slice(0,a)+replacement+source.slice(b+end.length);
}

if(!firebase.includes("export async function sendFidunioPasswordReset")){
  firebase=replaceOnce(firebase,
    'export async function signOutFidunio(){const s=await ensureServices();await s.authSdk.signOut(s.auth);authUser=null;}\n',
    'export async function signOutFidunio(){const s=await ensureServices();await s.authSdk.signOut(s.auth);authUser=null;}\nexport async function sendFidunioPasswordReset(email){const s=await ensureServices();const mail=String(email||"").trim();if(!mail)throw new Error("Enter your email address first.");await s.authSdk.sendPasswordResetEmail(s.auth,mail);}\n',
    "central password reset API"
  );
}

auth=replaceOnce(auth,
  '  redeemFidunioInvitation,\n  signInFidunio\n} from "./firebase.js";',
  '  redeemFidunioInvitation,\n  signInFidunio,\n  sendFidunioPasswordReset\n} from "./firebase.js";',
  "auth central reset import"
);
auth=auth.replace('import {installSettingsLifecycleBridge} from "./settings-lifecycle-bridge.js";\n','');
auth=auth.replace('let resetApiPromise=null;\n','');
if(auth.includes('async function resetApi(){')){
  auth=replaceRange(auth,'async function resetApi(){','function canonicalJwk(jwk){','async function sendPasswordReset(email){return sendFidunioPasswordReset(email);}\nfunction canonicalJwk(jwk){',"remove auth SDK reset loader");
}
auth=auth.replace('  installSettingsLifecycleBridge();\n','');

if(/gstatic\.com\/firebasejs\//.test(auth))throw new Error("auth-ui-clean still contains direct Firebase SDK imports");
if(/settings-lifecycle-bridge/.test(auth)||/installSettingsLifecycleBridge/.test(auth))throw new Error("retired Settings bridge is still referenced by auth gate");

gate=gate.replace('  "auth-ui-clean.js",        // temporary password-reset helper\n','');
if(gate.includes('"auth-ui-clean.js"'))throw new Error("auth Firebase allowlist exception remains");

fs.writeFileSync(firebasePath,firebase);
fs.writeFileSync(authPath,auth);
fs.writeFileSync(gatePath,gate);
console.log("Centralized auth password reset and removed the final non-firebase.js SDK owner.");
