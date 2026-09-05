import fs from "node:fs";

const appPath="app.js",swPath="service-worker.js",gatePath="runtime-transform-anchor.test.mjs";
let app=fs.readFileSync(appPath,"utf8");
let sw=fs.readFileSync(swPath,"utf8");
let gate=fs.readFileSync(gatePath,"utf8");

const blockStart='  const newGroupStart=source.indexOf(`function renderNewGroup(){`),groupNameStart=source.indexOf(`function renderGroupName(){`),chatStart=source.indexOf(`function renderChat(){`);';
const groupUiStart='    const groupUi=`';
const groupUiEnd='`;\n    source=source.slice(0,newGroupStart)+groupUi+source.slice(chatStart);';
const headersAnchor='  const headers=new Headers(response.headers);';

const blockIndex=sw.indexOf(blockStart);
if(blockIndex<0)throw new Error("group UI transform block start missing");
const uiStart=sw.indexOf(groupUiStart,blockIndex);
if(uiStart<0)throw new Error("group UI template start missing");
const uiContentStart=uiStart+groupUiStart.length;
const uiEnd=sw.indexOf(groupUiEnd,uiContentStart);
if(uiEnd<0)throw new Error("group UI template end missing");
const headersIndex=sw.indexOf(headersAnchor,uiEnd);
if(headersIndex<0)throw new Error("service-worker response header anchor missing");

// The service worker stores generated app.js source inside a template literal,
// so nested app template markers are escaped there. Decode only those two
// deliberate escaping forms; leave all other JavaScript bytes unchanged.
const escapedUi=sw.slice(uiContentStart,uiEnd);
const groupUi=escapedUi.replace(/\\`/g,"`").replace(/\\\$\{/g,"${");

const newGroupStart=app.indexOf('function renderNewGroup(){');
const groupNameStart=app.indexOf('function renderGroupName(){',newGroupStart);
const chatStart=app.indexOf('function renderChat(){',groupNameStart);
if(newGroupStart<0||groupNameStart<=newGroupStart||chatStart<=groupNameStart)throw new Error("app.js group placeholder anchors are invalid");
if(!app.slice(newGroupStart,chatStart).includes("Group setup is not available yet"))throw new Error("expected raw group placeholder is missing; refusing ambiguous materialization");

app=app.slice(0,newGroupStart)+groupUi+app.slice(chatStart);

// With group foundation already in raw app.js, this entire remaining block is
// only the group UI semantic rewrite. Remove it so the service worker no longer
// changes group behavior.
sw=sw.slice(0,blockIndex)+sw.slice(headersIndex);

// Transform anchor gate now protects only the legacy E2EE transforms and proves
// the group UI is raw source rather than service-worker-injected behavior.
gate=gate.replace("presentInSw('const newGroupStart=source.indexOf(`function renderNewGroup(){`)','group UI transform');\n","");
const consoleNeedle="console.log('PASS runtime transform anchors remain deterministic with materialized group foundation');";
if(!gate.includes(consoleNeedle))throw new Error("runtime transform gate materialized-foundation anchor missing");
const uiChecks='\n// Group creation UI is now authoritative raw source and absent from service-worker semantics.\nfor(const required of [\n  "Search FIDUNIO users",\n  "Select at least 2 people for the group.",\n  "function renderGroupName(){",\n  "Create Group",\n  "Real group messaging remains disabled until group E2EE is implemented."\n]){if(!app.includes(required))throw new Error(`materialized group UI missing: ${required}`);}\nif(app.includes("Group setup is not available yet"))throw new Error("obsolete raw group placeholder remains");\nif(sw.includes("const newGroupStart=source.indexOf(`function renderNewGroup(){`)"))throw new Error("service-worker group UI transform remains");\n';
gate=gate.replace(consoleNeedle,uiChecks+"\nconsole.log('PASS runtime transform anchors remain deterministic with group UI fully materialized');");

fs.writeFileSync(appPath,app);
fs.writeFileSync(swPath,sw);
fs.writeFileSync(gatePath,gate);
console.log("Materialized remaining group creation UI and removed the final non-cryptographic group service-worker transform.");
