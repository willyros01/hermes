import fs from "node:fs/promises";
const src=await fs.readFile(new URL("./e2ee-account-group-outbox.js",import.meta.url),"utf8");
const checks=[
  ["encrypted-local payload discriminator",src.includes('kind:"group-e2ee-v1"')],
  ["captures expected epoch",src.includes("expectedKeyEpoch:Number(epoch.keyEpoch)")],
  ["revalidates queued epoch",src.includes("revalidateQueuedAccountGroupMessage")],
  ["sends through group E2EE service",src.includes("sendAccountGroupMessage")],
  ["serialized write path",src.includes("tail.then(task,task)")],
  ["does not import Firebase",!src.includes('from "./firebase.js"')],
  ["does not own IndexedDB",!src.includes("indexedDB")]
];
for(const [name,ok] of checks){if(!ok)throw new Error(`FAIL: ${name}`);console.log(`PASS: ${name}`)}
console.log(`PASS: ${checks.length} group Outbox ownership assertions`);
