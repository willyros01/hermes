import fs from "node:fs";
const adapter=fs.readFileSync(new URL("./e2ee-account-group-firebase-adapter.js",import.meta.url),"utf8");
const service=fs.readFileSync(new URL("./e2ee-account-group-service.js",import.meta.url),"utf8");
const runtime=fs.readFileSync(new URL("./e2ee-account-group-runtime.js",import.meta.url),"utf8");
function must(ok,msg){if(!ok)throw new Error(msg);console.log("PASS",msg);}
must(adapter.includes('from "./firebase.js"'),"group adapter delegates to central Firebase owner");
must(!adapter.includes("firebase-app")&&!adapter.includes("initializeApp("),"group adapter does not initialize Firebase");
for(const name of ["readCloudGroupAuthority","getCloudAccountE2EEPublicKey","createCloudGroupEpochRecord","readCloudGroupEpochRecord","sendCloudEncryptedGroupMessage","subscribeCloudGroupMessages"])must(adapter.includes(name),`adapter wires ${name}`);
must(adapter.includes("readRetainedGroupMessages")&&adapter.includes("if(meta.fromCache)return"),"history source read requires a server-backed central Firebase snapshot");
must(service.includes('createAccountGroupE2EERuntime'),"service uses sole group runtime");
must(service.includes('getAccountE2EERuntimeIdentity'),"service uses durable account runtime identity");
must(!service.includes("deviceId"),"service has no device-identity dependency");
must(runtime.includes("revalidateQueued"),"runtime exposes queued epoch revalidation");
must(runtime.includes('transport.readRetainedGroupMessages(gid)'),"runtime obtains history sources from transport authority");
must(/createHistoryGrant\(\{groupId,grantId,targetUid,boundary\}\)/.test(runtime),"history grant API accepts intent only, not caller source rows");
console.log("Group E2EE service ownership wiring passes");