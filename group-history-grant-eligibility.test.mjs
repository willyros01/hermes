import fs from "node:fs";
const runtime=fs.readFileSync("e2ee-account-group-runtime.js","utf8");
function ok(name,value){if(!value)throw new Error(`FAIL: ${name}`);console.log(`PASS: ${name}`);}
ok("grant source filters to current E2EE v4 group envelopes",/filter\(row=>Number\(row\?\.e2ee\)===4&&row\?\.groupFormat===\"fidunio-group-message-v1\"\)/.test(runtime));
ok("legacy-only selection fails clearly before Firestore write",runtime.includes("No current encrypted retained history is available to share for this selection."));
ok("grant boundary still applies after eligibility filter",/filter\(x=>b.kind===\"beginning\"\|\|x.createdAt.getTime\(\)>=b.at.getTime\(\)\)/.test(runtime));
console.log("Group history grant eligibility gate passed.");
