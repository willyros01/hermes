import fs from "node:fs";
const adapter=fs.readFileSync(new URL("./e2ee-account-group-firebase-adapter.js",import.meta.url),"utf8");
const service=fs.readFileSync(new URL("./e2ee-account-group-service.js",import.meta.url),"utf8");
const runtime=fs.readFileSync(new URL("./e2ee-account-group-runtime.js",import.meta.url),"utf8");
function must(ok,msg){if(!ok)throw new Error(msg);console.log("PASS",msg);}
must(adapter.includes('from "./firebase.js"'),"group adapter delegates to central Firebase owner");
must(!adapter.includes("firebase-app")&&!adapter.includes("initializeApp("),"group adapter does not initialize Firebase");
for(const name of ["readCloudGroupAuthority","getCloudAccountE2EEPublicKey","createCloudGroupEpochRecord","readCloudGroupEpochRecord","sendCloudEncryptedGroupMessage"])must(adapter.includes(name),`adapter wires ${name}`);
must(service.includes('createAccountGroupE2EERuntime'),"service uses sole group runtime");
must(service.includes('getAccountE2EERuntimeIdentity'),"service uses durable account runtime identity");
must(!service.includes("deviceId"),"service has no device-identity dependency");
must(runtime.includes("revalidateQueued"),"runtime exposes queued epoch revalidation");
console.log("Group E2EE service ownership wiring passes");
