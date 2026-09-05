// One-shot rebuild materializer: explicit Settings lifecycle ownership. Idempotent finalizer.
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

if(!app.includes('import { mountSettingsLifecycle } from "./settings-lifecycle.js";')){
  app=replaceOnce(
    app,
    'import { mountNewMessageRecipientPicker } from "./new-message-owner.js";',
    'import { mountNewMessageRecipientPicker } from "./new-message-owner.js";\nimport { mountSettingsLifecycle } from "./settings-lifecycle.js";',
    "Settings owner import"
  );
}
if(!app.includes('  mountSettingsLifecycle();\n}\nfunction settingRow(label,key){')){
  app=replaceOnce(
    app,
    '\n}\nfunction settingRow(label,key){',
    '\n  mountSettingsLifecycle();\n}\nfunction settingRow(label,key){',
    "explicit Settings post-render hook"
  );
}

if(gate.includes('"settings-lifecycle-bridge.js" // temporary Settings compatibility bridge')){
  gate=gate.replace('  "settings-lifecycle-bridge.js" // temporary Settings compatibility bridge\n','');
}
const appCheck='if(!/mainSignOutMarkup/.test(app)||!/bindMainSignOut/.test(app))throw new Error("main-screen Sign Out must remain an explicit app projection.");';
if(!gate.includes('if(!/mountSettingsLifecycle/.test(app))throw new Error("app.js must call the explicit Settings lifecycle owner.");')){
  if(!gate.includes(appCheck))throw new Error("runtime authority app check anchor missing");
  gate=gate.replace(appCheck,appCheck+'\nif(!/mountSettingsLifecycle/.test(app))throw new Error("app.js must call the explicit Settings lifecycle owner.");');
}

if(fs.existsSync(bridgePath))fs.unlinkSync(bridgePath);
if(!app.includes('mountSettingsLifecycle'))throw new Error("Settings lifecycle hook is not materialized");
if(gate.includes('settings-lifecycle-bridge.js'))throw new Error("Settings bridge still remains in authority allowlist");
fs.writeFileSync(appPath,app);
fs.writeFileSync(gatePath,gate);
console.log("Explicit Settings lifecycle ownership finalized; observer bridge retired.");
