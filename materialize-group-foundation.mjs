import fs from "node:fs";

const appPath="app.js";
const swPath="service-worker.js";
const gatePath="runtime-transform-anchor.test.mjs";
let app=fs.readFileSync(appPath,"utf8");
let sw=fs.readFileSync(swPath,"utf8");
let gate=fs.readFileSync(gatePath,"utf8");

function replaceOnce(source,from,to,label){
  const first=source.indexOf(from);
  if(first<0)throw new Error(`${label}: source anchor missing`);
  if(source.indexOf(from,first+from.length)>=0)throw new Error(`${label}: source anchor is not unique`);
  return source.slice(0,first)+to+source.slice(first+from.length);
}
function removeOnce(source,needle,label){return replaceOnce(source,needle,"",label);}

// 1. Central Firebase group APIs become explicit app.js imports.
app=replaceOnce(
  app,
  '  getCloudUserDevices\n} from "./firebase.js";',
  '  getCloudUserDevices,\n  listCloudUsers,\n  createCloudGroup,\n  subscribeMyGroups\n} from "./firebase.js";',
  "group Firebase imports"
);

// 2. Group subscription state becomes authoritative raw source.
app=replaceOnce(
  app,
  'let cloudConversationUnsub = null;',
  'let cloudConversationUnsub = null;\nlet cloudGroupUnsub = null;\nlet groupCandidates = [];',
  "group runtime state"
);

// 3. Firestore group metadata subscription becomes raw app.js behavior.
const groupFunctions='function mergeCloudGroup(remote){\n  const existing=state.conversations.find(c=>String(c.id)===String(remote.id));\n  const item={...remote,type:"group",cloudGroup:true,unread:existing?.unread||0,preview:remote.preview||existing?.preview||"Group • messaging pending E2EE",time:remote.time||existing?.time||""};\n  if(existing)Object.assign(existing,item);else state.conversations.unshift(item);\n  if(!state.messages[item.id])state.messages[item.id]=[];\n  return existing||item;\n}\nfunction beginCloudGroupSubscription(){\n  if(cloudGroupUnsub){cloudGroupUnsub();cloudGroupUnsub=null;}\n  if(!firebaseUser)return;\n  cloudGroupUnsub=subscribeMyGroups(firebaseUser.uid,rows=>{rows.forEach(mergeCloudGroup);persistSoon();if(state.route==="messages"||state.route==="chat"||state.route==="groupInfo")render();},err=>{firebaseError=err?.message||String(err);});\n}\n';
app=replaceOnce(app,'function stopCloudMessageSubscription(){',groupFunctions+'function stopCloudMessageSubscription(){',"group subscription functions");

// 4. Auth lifecycle explicitly starts/stops group subscription.
app=replaceOnce(app,'        beginCloudConversationSubscription();','        beginCloudConversationSubscription();\n        beginCloudGroupSubscription();',"group subscription start");
app=replaceOnce(app,'        if(cloudConversationUnsub){cloudConversationUnsub();cloudConversationUnsub=null;}','        if(cloudConversationUnsub){cloudConversationUnsub();cloudConversationUnsub=null;}\n        if(cloudGroupUnsub){cloudGroupUnsub();cloudGroupUnsub=null;}',"group subscription stop");

// 5. Cloud group transport stays fail-closed in authoritative source.
app=replaceOnce(app,'  const cloud=!!c?.cloud;','  const cloud=!!c?.cloud;\n  if(c?.cloudGroup){alert("Group messaging is intentionally disabled until group E2EE is implemented.");return;}',"cloud group send guard");

// Remove only the corresponding service-worker transforms. The group UI
// replacement remains temporarily until its next bounded materialization step.
const swImport='  source=source.replace(`  getCloudUserDevices\n} from "./firebase.js";`,`  getCloudUserDevices,\n  listCloudUsers,\n  createCloudGroup,\n  subscribeMyGroups\n} from "./firebase.js";`);\n';
const swVars='  source=source.replace(`let cloudConversationUnsub = null;`,`let cloudConversationUnsub = null;\nlet cloudGroupUnsub = null;\nlet groupCandidates = [];`);\n';
const swFunctions='  source=source.replace(`function stopCloudMessageSubscription(){`,`function mergeCloudGroup(remote){\n  const existing=state.conversations.find(c=>String(c.id)===String(remote.id));\n  const item={...remote,type:"group",cloudGroup:true,unread:existing?.unread||0,preview:remote.preview||existing?.preview||"Group • messaging pending E2EE",time:remote.time||existing?.time||""};\n  if(existing)Object.assign(existing,item);else state.conversations.unshift(item);\n  if(!state.messages[item.id])state.messages[item.id]=[];\n  return existing||item;\n}\nfunction beginCloudGroupSubscription(){\n  if(cloudGroupUnsub){cloudGroupUnsub();cloudGroupUnsub=null;}\n  if(!firebaseUser)return;\n  cloudGroupUnsub=subscribeMyGroups(firebaseUser.uid,rows=>{rows.forEach(mergeCloudGroup);persistSoon();if(state.route==="messages"||state.route==="chat"||state.route==="groupInfo")render();},err=>{firebaseError=err?.message||String(err);});\n}\nfunction stopCloudMessageSubscription(){`);\n';
const swStart='  source=source.replace(`        beginCloudConversationSubscription();`,`        beginCloudConversationSubscription();\n        beginCloudGroupSubscription();`);\n';
const swStop='  source=source.replace(`        if(cloudConversationUnsub){cloudConversationUnsub();cloudConversationUnsub=null;}`,`        if(cloudConversationUnsub){cloudConversationUnsub();cloudConversationUnsub=null;}\n        if(cloudGroupUnsub){cloudGroupUnsub();cloudGroupUnsub=null;}`);\n';
const swGuard='  source=source.replace(`  const cloud=!!c?.cloud;`,`  const cloud=!!c?.cloud;\n  if(c?.cloudGroup){alert("Group messaging is intentionally disabled in FIDUNIO 0.9.1.1 until group E2EE is implemented.");return;}`);\n';
for(const [needle,label] of [[swImport,"SW group imports"],[swVars,"SW group state"],[swFunctions,"SW group subscription"],[swStart,"SW group start"],[swStop,"SW group stop"],[swGuard,"SW group send guard"]])sw=removeOnce(sw,needle,label);

// Update anchor gate: only the group UI remains a service-worker group transform.
for(const line of [
  "exactlyOne('  getCloudUserDevices\\n} from \"./firebase.js\";','group Firebase import tail');\n",
  "exactlyOne('let cloudConversationUnsub = null;','group runtime state insertion');\n",
  "exactlyOne('function stopCloudMessageSubscription(){','group subscription insertion');\n",
  "exactlyOne('  const cloud=!!c?.cloud;','cloud-group send guard anchor');\n",
  "presentInSw('source=source.replace(`  const cloud=!!c?.cloud;`','group send guard transform');\n"
])gate=gate.replace(line,"");

const materializedChecks='\n// Group foundation is now authoritative raw source; only the group UI replacement remains in SW.\nfor(const required of [\n  "listCloudUsers,",\n  "createCloudGroup,",\n  "subscribeMyGroups",\n  "let cloudGroupUnsub = null;",\n  "function mergeCloudGroup(remote){",\n  "function beginCloudGroupSubscription(){",\n  "beginCloudGroupSubscription();",\n  "if(c?.cloudGroup){alert(\\"Group messaging is intentionally disabled until group E2EE is implemented.\\");return;}"\n]){if(!app.includes(required))throw new Error(`materialized group foundation missing: ${required}`);}\nfor(const forbidden of [\n  "source=source.replace(`  getCloudUserDevices",\n  "source=source.replace(`let cloudConversationUnsub = null;`",\n  "source=source.replace(`function stopCloudMessageSubscription(){`",\n  "source=source.replace(`        beginCloudConversationSubscription();`",\n  "source=source.replace(`        if(cloudConversationUnsub)",\n  "source=source.replace(`  const cloud=!!c?.cloud;`"\n]){if(sw.includes(forbidden))throw new Error(`obsolete SW group foundation transform remains: ${forbidden}`);}\n';
const consoleAnchor="console.log('PASS runtime transform anchors remain deterministic after empty-state materialization');";
if(!gate.includes(consoleAnchor))throw new Error("runtime transform gate console anchor missing");
gate=gate.replace(consoleAnchor,materializedChecks+"\nconsole.log('PASS runtime transform anchors remain deterministic with materialized group foundation');");

for(const [name,source] of [[appPath,app],[swPath,sw],[gatePath,gate]])fs.writeFileSync(name,source);
console.log("Materialized non-cryptographic group runtime foundation and removed matching service-worker transforms.");
