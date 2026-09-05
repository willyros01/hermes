// One-shot rebuild materializer: explicit Settings lifecycle ownership. Retry after bridge-retirement workflow fix.
import fs from "node:fs";

const appPath="app.js",gatePath="runtime-authority-gate.test.mjs",bridgePath="settings-lifecycle-bridge.js";
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
  'import { mountNewMessageRecipientPicker } from "./new-message-owner.js";',
  'import { mountNewMessageRecipientPicker } from "./new-message-owner.js";\nimport { mountSettingsLifecycle } from "./settings-lifecycle.js";',
  "Settings owner import"
);

app=replaceOnce(
  app,
  '  if(copyBtn) copyBtn.onclick=async()=>{\n    try{await navigator.clipboard.writeText(firebaseUser.uid);copyBtn.textContent="Copied";}catch{alert(firebaseUser.uid);}\n  };\n}\nfunction settingRow(label,key){',
  '  if(copyBtn) copyBtn.onclick=async()=>{\n    try{await navigator.clipboard.writeText(firebaseUser.uid);copyBtn.textContent="Copied";}catch{alert(firebaseUser.uid);}\n  };\n  mountSettingsLifecycle();\n}\nfunction settingRow(label,key){',
  "explicit Settings post-render hook"
);

if(!gate.includes('"settings-lifecycle-bridge.js" // temporary Settings compatibility bridge'))throw new Error("Settings bridge allowlist anchor missing");
gate=gate.replace('  "settings-lifecycle-bridge.js" // temporary Settings compatibility bridge\n','');
const appCheck='if(!/mainSignOutMarkup/.test(app)||!/bindMainSignOut/.test(app))throw new Error("main-screen Sign Out must remain an explicit app projection.");';
if(!gate.includes(appCheck))throw new Error("runtime authority app check anchor missing");
gate=gate.replace(appCheck,appCheck+'\nif(!/mountSettingsLifecycle/.test(app))throw new Error("app.js must call the explicit Settings lifecycle owner.");');

if(!fs.existsSync(bridgePath))throw new Error("Settings lifecycle bridge missing before retirement; refusing ambiguous cleanup");
fs.unlinkSync(bridgePath);
fs.writeFileSync(appPath,app);
fs.writeFileSync(gatePath,gate);
console.log("Materialized explicit Settings lifecycle hook and retired observer bridge.");
