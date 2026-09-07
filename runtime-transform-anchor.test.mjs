import fs from "node:fs";
const app=fs.readFileSync("app.js","utf8"),sw=fs.readFileSync("service-worker.js","utf8"),settings=fs.readFileSync("settings-lifecycle.js","utf8");
for(const forbidden of ["transformApp(","source.replace(","helperNeedle","buildDeviceEnvelopes","decryptDeviceEnvelope"])if(sw.includes(forbidden))throw new Error(`semantic service-worker transform remains: ${forbidden}`);
for(const required of ["decryptAccountDirectMessage","m.e2ee===3","recipientKeyId","senderKeyId","kdfVersion"])if(!app.includes(required)&&!fs.readFileSync("firebase.js","utf8").includes(required))throw new Error(`historical v3 read anchor missing: ${required}`);
if(app.includes("prepareAccountDirectMessage("))throw new Error("basic direct text must not reintroduce an account-key send prerequisite");
for(const required of ["let mutationTail=Promise.resolve()","let generation=0","function esc(","changeAccountPasswordWithE2EE"])if(!settings.includes(required))throw new Error(`Settings local authority anchor missing: ${required}`);
for(const forbidden of ["Maria Santos","John Cruz","Family Group","Sample local contacts"])if(app.includes(forbidden))throw new Error(`prototype marker remains: ${forbidden}`);
if(!app.includes("conversations:[]")||!app.includes("messages:{}")||!app.includes("selectedId:null"))throw new Error("empty production defaults are not authoritative");
console.log("PASS raw runtime is authoritative; service worker contains no semantic transforms");
