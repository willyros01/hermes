import fs from "node:fs";

const app=fs.readFileSync("app.js","utf8");
const sw=fs.readFileSync("service-worker.js","utf8");

function count(source,needle){let n=0,i=0;while((i=source.indexOf(needle,i))>=0){n++;i+=needle.length;}return n;}
function exactlyOne(needle,label){const n=count(app,needle);if(n!==1)throw new Error(`${label}: expected exactly one app.js anchor, found ${n}`);}
function presentInSw(needle,label){if(!sw.includes(needle))throw new Error(`${label}: service-worker transform definition is missing`);}

// The rebuild empty-state change is deliberately outside these legacy transform
// anchors. Until each transform is materialized/replaced, prove its source anchor
// remains deterministic instead of silently allowing String.replace() to no-op.
exactlyOne('async function resolvePeerUidForConversation(conversationId){','device-envelope helper insertion');
exactlyOne('        if(m.e2ee){\n          if(peerKey){try{text=await decryptCloudText(m,peerKey,conversationId);}catch{text="[Encrypted message — key unavailable]";}}\n          else text="[Encrypted message — key unavailable]";\n        }','legacy receive/decrypt replacement');
exactlyOne('  if(cloud && c?.peerUid){\n    await peerPublicKeyForConversation(conversationId,{refresh:true});\n    if(peerTrustStatus(c.peerUid)==="changed"){\n      state.modal={type:"conversationSecurity",peerUid:c.peerUid,conversationId};\n      render();\n      return;\n    }\n  }','direct-send trust replacement');
exactlyOne('function renderNewGroup(){','group UI start anchor');
exactlyOne('function renderGroupName(){','group UI middle anchor');
exactlyOne('function renderChat(){','group UI end anchor');

presentInSw('const helperNeedle=`async function resolvePeerUidForConversation(conversationId){`;','device-envelope helper transform');
presentInSw('const newGroupStart=source.indexOf(`function renderNewGroup(){`)','group UI transform');

for(const forbidden of ['Maria Santos','John Cruz','Family Group','Sample local contacts']){
  if(app.includes(forbidden))throw new Error(`prototype marker remains in authoritative app.js: ${forbidden}`);
}
if(!app.includes('conversations:[]')||!app.includes('messages:{}')||!app.includes('selectedId:null'))throw new Error('empty production defaults are not authoritative');


// Group foundation is now authoritative raw source; only the group UI replacement remains in SW.
for(const required of [
  "listCloudUsers,",
  "createCloudGroup,",
  "subscribeMyGroups",
  "let cloudGroupUnsub = null;",
  "function mergeCloudGroup(remote){",
  "function beginCloudGroupSubscription(){",
  "beginCloudGroupSubscription();",
  "if(c?.cloudGroup){alert(\"Group messaging is intentionally disabled until group E2EE is implemented.\");return;}"
]){if(!app.includes(required))throw new Error(`materialized group foundation missing: ${required}`);}
for(const forbidden of [
  "source=source.replace(`  getCloudUserDevices",
  "source=source.replace(`let cloudConversationUnsub = null;`",
  "source=source.replace(`function stopCloudMessageSubscription(){`",
  "source=source.replace(`        beginCloudConversationSubscription();`",
  "source=source.replace(`        if(cloudConversationUnsub)",
  "source=source.replace(`  const cloud=!!c?.cloud;`"
]){if(sw.includes(forbidden))throw new Error(`obsolete SW group foundation transform remains: ${forbidden}`);}

console.log('PASS runtime transform anchors remain deterministic with materialized group foundation');
