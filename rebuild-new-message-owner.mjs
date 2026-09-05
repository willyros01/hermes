import fs from "node:fs";

const appPath="app.js",bootstrapPath="bootstrap.js",versionPath="version.js";
let app=fs.readFileSync(appPath,"utf8");
let bootstrap=fs.readFileSync(bootstrapPath,"utf8");
let version=fs.readFileSync(versionPath,"utf8");

const localSecurityImportEnd='} from "./local-security.js";';
if(!app.includes(localSecurityImportEnd))throw new Error("app import anchor missing");
app=app.replace(localSecurityImportEnd,`${localSecurityImportEnd}\nimport { mountNewMessageRecipientPicker } from "./new-message-owner.js";`);

const hostNeedle='<h2>Start a Conversation</h2>\n          ${cloudEnabled?`<p class="small-note">Choose another FIDUNIO user.</p>';
if(!app.includes(hostNeedle))throw new Error("New Message host anchor missing");
app=app.replace(hostNeedle,'<h2>Choose a Person</h2>\n          <div id="fidunioRecipientPickerHost"></div>\n          ${cloudEnabled?`<p class="small-note">Select a FIDUNIO user by display name.</p>');

const handlerTail='    }catch(err){alert("Could not create the conversation: "+(err?.message||err));cloudBtn.disabled=false;cloudBtn.textContent="Start Conversation";}\n  };\n}\n\nfunction renderNewGroup(){';
if(!app.includes(handlerTail))throw new Error("New Message mount anchor missing");
app=app.replace(handlerTail,'    }catch(err){alert("Could not create the conversation: "+(err?.message||err));cloudBtn.disabled=false;cloudBtn.textContent="Start Conversation";}\n  };\n  if(cloudEnabled&&cloudBtn){\n    mountNewMessageRecipientPicker({\n      host:document.querySelector("#fidunioRecipientPickerHost"),\n      uidInput:document.querySelector("#peerUid"),\n      startButton:cloudBtn\n    }).catch(err=>console.warn("New Message recipient picker unavailable",err));\n  }\n}\n\nfunction renderNewGroup(){');

bootstrap=bootstrap.replace('await import("./new-message-polish.js");\n','');
if(bootstrap.includes('new-message-polish.js'))throw new Error("obsolete New Message bootstrap import remained");

if(!version.includes('version: "0.9.6.0"'))throw new Error("expected 0.9.6.0 version anchor missing");
version=version.replace('version: "0.9.6.0"','version: "0.9.6.1"');

for(const required of ['mountNewMessageRecipientPicker','fidunioRecipientPickerHost','function renderNewGroup(){','const cloud=!!c?.cloud;']){
  if(!app.includes(required))throw new Error(`required app anchor missing: ${required}`);
}

fs.writeFileSync(appPath,app);
fs.writeFileSync(bootstrapPath,bootstrap);
fs.writeFileSync(versionPath,version);
console.log("Materialized explicit New Message recipient lifecycle.");
