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
exactlyOne('  getCloudUserDevices\n} from "./firebase.js";','group Firebase import tail');
exactlyOne('let cloudConversationUnsub = null;','group runtime state insertion');
exactlyOne('function stopCloudMessageSubscription(){','group subscription insertion');
exactlyOne('function renderNewGroup(){','group UI start anchor');
exactlyOne('function renderGroupName(){','group UI middle anchor');
exactlyOne('function renderChat(){','group UI end anchor');
exactlyOne('  const cloud=!!c?.cloud;','cloud-group send guard anchor');

presentInSw('const helperNeedle=`async function resolvePeerUidForConversation(conversationId){`;','device-envelope helper transform');
presentInSw('const newGroupStart=source.indexOf(`function renderNewGroup(){`)','group UI transform');
presentInSw('source=source.replace(`  const cloud=!!c?.cloud;`','group send guard transform');

for(const forbidden of ['Maria Santos','John Cruz','Family Group','Sample local contacts']){
  if(app.includes(forbidden))throw new Error(`prototype marker remains in authoritative app.js: ${forbidden}`);
}
if(!app.includes('conversations:[]')||!app.includes('messages:{}')||!app.includes('selectedId:null'))throw new Error('empty production defaults are not authoritative');

console.log('PASS runtime transform anchors remain deterministic after empty-state materialization');
