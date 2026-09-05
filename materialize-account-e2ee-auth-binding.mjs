// One-shot rebuild materializer: bind account-E2EE lookup/reset to the existing Firebase auth callback.
import fs from "node:fs";

const appPath="app.js",gatePath="runtime-authority-gate.test.mjs";
let app=fs.readFileSync(appPath,"utf8");
let gate=fs.readFileSync(gatePath,"utf8");

function replaceOnce(source,from,to,label){
  const first=source.indexOf(from);
  if(first<0)throw new Error(`${label}: anchor missing`);
  if(source.indexOf(from,first+from.length)>=0)throw new Error(`${label}: anchor not unique`);
  return source.slice(0,first)+to+source.slice(first+from.length);
}

app=replaceOnce(
  app,
  'import { mountSettingsLifecycle } from "./settings-lifecycle.js";',
  'import { mountSettingsLifecycle } from "./settings-lifecycle.js";\nimport { bindAuthenticatedAccountE2EE, resetAccountE2EEForSignOut } from "./e2ee-account-runtime.js";',
  "account E2EE runtime import"
);
app=replaceOnce(
  app,
  '      if(user){\n        publishMyE2EEKey().catch(err=>console.warn("Could not publish E2EE key",err));',
  '      if(user){\n        bindAuthenticatedAccountE2EE(user.uid).catch(err=>console.warn("Account E2EE identity lookup failed",err));\n        publishMyE2EEKey().catch(err=>console.warn("Could not publish E2EE key",err));',
  "authenticated account E2EE bind"
);
app=replaceOnce(
  app,
  '      }else{\n        if(cloudConversationUnsub){cloudConversationUnsub();cloudConversationUnsub=null;}',
  '      }else{\n        resetAccountE2EEForSignOut();\n        if(cloudConversationUnsub){cloudConversationUnsub();cloudConversationUnsub=null;}',
  "synchronous account E2EE sign-out reset"
);

const appCheck='if(!/mountSettingsLifecycle/.test(app))throw new Error("app.js must call the explicit Settings lifecycle owner.");';
if(!gate.includes(appCheck))throw new Error("runtime authority Settings check anchor missing");
gate=gate.replace(appCheck,appCheck+'\nif(!/bindAuthenticatedAccountE2EE/.test(app)||!/resetAccountE2EEForSignOut/.test(app))throw new Error("app.js must bind/reset account E2EE from the Firebase auth lifecycle.");');

for(const required of ["bindAuthenticatedAccountE2EE(user.uid)","resetAccountE2EEForSignOut()"]){if(!app.includes(required))throw new Error(`account E2EE auth binding missing: ${required}`);}
fs.writeFileSync(appPath,app);
fs.writeFileSync(gatePath,gate);
console.log("Materialized account E2EE identity lookup/reset into the existing Firebase auth lifecycle.");
