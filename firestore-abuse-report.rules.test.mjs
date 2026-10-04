import {readFileSync} from "node:fs";
import {initializeTestEnvironment,assertFails,assertSucceeds} from "@firebase/rules-unit-testing";
import {collection,doc,getDoc,getDocs,query,setDoc,updateDoc,serverTimestamp} from "firebase/firestore";

const rules=readFileSync(new URL("./firestore.rules",import.meta.url),"utf8");
const env=await initializeTestEnvironment({projectId:"demo-fidunio-abuse-report-rules",firestore:{rules}});
const U="user-a",A="admin-a",B="user-b";
const dbU=env.authenticatedContext(U).firestore(),dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore(),dbN=env.unauthenticatedContext().firestore();
let bad=0;async function t(name,fn){try{await fn();console.log("PASS",name);}catch(e){bad++;console.error("FAIL",name,e.message);}}
await env.withSecurityRulesDisabled(async c=>{
 const db=c.firestore();
 await setDoc(doc(db,"users",U),{displayName:"User",email:"u@example.test",systemRole:"user",active:true,status:"active"});
 await setDoc(doc(db,"users",A),{displayName:"Admin",email:"a@example.test",systemRole:"admin",active:true,status:"active"});
 await setDoc(doc(db,"users",B),{displayName:"Other",email:"b@example.test",systemRole:"user",active:true,status:"active"});
});
const reportRef=doc(dbU,"abuseReports","report-one");
const valid={reporterUid:U,targetUid:B,category:"harassment",details:"Repeated abusive messages.",status:"open",createdAt:serverTimestamp()};
await t("registered user creates own abuse report",()=>assertSucceeds(setDoc(reportRef,valid)));
await t("anonymous cannot create report",()=>assertFails(setDoc(doc(dbN,"abuseReports","anon"),{...valid,reporterUid:""})));
await t("user cannot forge reporter uid",()=>assertFails(setDoc(doc(dbU,"abuseReports","forged"),{...valid,reporterUid:B})));
await t("user cannot report self as target",()=>assertFails(setDoc(doc(dbU,"abuseReports","self"),{...valid,targetUid:U})));
await t("invalid category denied",()=>assertFails(setDoc(doc(dbU,"abuseReports","bad-category"),{...valid,category:"anything"})));
await t("oversized details denied",()=>assertFails(setDoc(doc(dbU,"abuseReports","too-long"),{...valid,details:"x".repeat(1001)})));
await t("reporter can get own report",()=>assertSucceeds(getDoc(doc(dbU,"abuseReports","report-one"))));
await t("unrelated user cannot get report",()=>assertFails(getDoc(doc(dbB,"abuseReports","report-one"))));
await t("non-admin cannot list reports",()=>assertFails(getDocs(query(collection(dbU,"abuseReports")))));
await t("admin can list reports",()=>assertSucceeds(getDocs(query(collection(dbA,"abuseReports")))));
await t("reporter cannot resolve own report",()=>assertFails(updateDoc(doc(dbU,"abuseReports","report-one"),{status:"resolved",adminNote:"",resolvedAt:serverTimestamp(),resolvedByUid:U})));
await t("admin resolves open report",()=>assertSucceeds(updateDoc(doc(dbA,"abuseReports","report-one"),{status:"resolved",adminNote:"reviewed",resolvedAt:serverTimestamp(),resolvedByUid:A})));
await env.cleanup();
if(bad)process.exitCode=1;
