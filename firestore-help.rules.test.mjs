/* HELP rules against the local Firestore emulator (demo project only). */
import fs from "node:fs";
import assert from "node:assert/strict";
import {initializeTestEnvironment,assertSucceeds,assertFails} from "@firebase/rules-unit-testing";
import {doc,setDoc,updateDoc,getDoc,deleteDoc,serverTimestamp,collection,query,where,getDocs} from "firebase/firestore";
const rules=fs.readFileSync(process.env.HELP_RULES||"/tmp/merged.rules","utf8");
const env=await initializeTestEnvironment({projectId:"demo-fidunio-help-rules",firestore:{rules,host:"127.0.0.1",port:8080}});
await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();
  for(const [uid,name] of [["kid","Lucas"],["mom","Mom"],["dad","Dad"],["eve","Eve"]])
    await setDoc(doc(db,"users/"+uid),{displayName:name,email:uid+"@x.invalid",systemRole:"user",active:true,status:"active"});
});
const as=uid=>env.authenticatedContext(uid).firestore();
const kid=as("kid"),mom=as("mom"),eve=as("eve");
const settings={enabled:true,helperUids:["mom","dad"],protected:false,updatedAt:serverTimestamp()};
async function tryOrReport(label,p,expectOk){try{await p;if(!expectOk)throw new Error(label+" should have been refused");}catch(e){if(expectOk)throw new Error(label+" refused: "+e.message);}}
await tryOrReport("own settings",setDoc(doc(kid,"helpSettings/kid"),settings),true);
await tryOrReport("6 helpers",setDoc(doc(kid,"helpSettings/kid"),{...settings,helperUids:["a","b","c","d","e","f"]}),false);
await tryOrReport("someone else's settings",setDoc(doc(eve,"helpSettings/kid"),settings),false);
await tryOrReport("read someone else's settings",getDoc(doc(eve,"helpSettings/kid")),false);
const alert={senderUid:"kid",helperUids:["mom","dad"],state:"open",test:false,acks:{},createdAt:serverTimestamp()};
await tryOrReport("alert to chosen helpers",setDoc(doc(kid,"helpAlerts/a1"),alert),true);
await tryOrReport("alert to a stranger",setDoc(doc(kid,"helpAlerts/a2"),{...alert,helperUids:["eve"]}),false);
await tryOrReport("alert in someone else's name",setDoc(doc(eve,"helpAlerts/a3"),{...alert,senderUid:"kid"}),false);
await tryOrReport("helper reads alert",getDoc(doc(mom,"helpAlerts/a1")),true);
await tryOrReport("stranger reads alert",getDoc(doc(eve,"helpAlerts/a1")),false);
await tryOrReport("helper lists own alerts",getDocs(query(collection(mom,"helpAlerts"),where("helperUids","array-contains","mom"),where("state","==","open"))),true);
await tryOrReport("helper says I'm on it",updateDoc(doc(mom,"helpAlerts/a1"),{"acks.mom":{at:serverTimestamp()}}),true);
await tryOrReport("helper answers for someone else",updateDoc(doc(mom,"helpAlerts/a1"),{"acks.dad":{at:serverTimestamp()}}),false);
await tryOrReport("helper closes the alert",updateDoc(doc(mom,"helpAlerts/a1"),{state:"safe",closedAt:serverTimestamp()}),false);
await tryOrReport("sender says I'm safe",updateDoc(doc(kid,"helpAlerts/a1"),{state:"safe",closedAt:serverTimestamp()}),true);
await tryOrReport("reopen a closed alert",updateDoc(doc(kid,"helpAlerts/a1"),{state:"open"}),false);
await tryOrReport("delete an alert",deleteDoc(doc(kid,"helpAlerts/a1")),false);
await tryOrReport("HELP off: no alert",(async()=>{await setDoc(doc(kid,"helpSettings/kid"),{...settings,enabled:false});await setDoc(doc(kid,"helpAlerts/a4"),alert);})(),false);
await env.cleanup();
console.log("HELP rules gate passed");
