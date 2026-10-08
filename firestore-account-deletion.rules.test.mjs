import {readFileSync} from "node:fs";
import {initializeTestEnvironment,assertFails,assertSucceeds} from "@firebase/rules-unit-testing";
import {collection,doc,getDoc,getDocs,setDoc,updateDoc,serverTimestamp} from "firebase/firestore";

const rules=readFileSync(new URL("./firestore.rules",import.meta.url),"utf8");
const env=await initializeTestEnvironment({projectId:"demo-fidunio-account-deletion-rules",firestore:{rules}});
const U="user-a",A="admin-a",B="user-b";
const dbU=env.authenticatedContext(U).firestore(),dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
let bad=0;async function t(name,fn){try{await fn();console.log("PASS",name);}catch(e){bad++;console.error("FAIL",name,e.message);}}
await env.withSecurityRulesDisabled(async c=>{
 const db=c.firestore();
 await setDoc(doc(db,"users",U),{displayName:"User",email:"u@example.test",systemRole:"user",active:true,status:"active"});
 await setDoc(doc(db,"users",A),{displayName:"Admin",email:"a@example.test",systemRole:"admin",active:true,status:"active"});
 await setDoc(doc(db,"users",B),{displayName:"Other",email:"b@example.test",systemRole:"user",active:true,status:"active"});
});
const ref=doc(dbU,"accountDeletionRequests",U);
const valid={uid:U,status:"pending",cleanupStatus:"required",cleanupCompletedAt:null,contactEmail:"u@example.test",displayName:"User",requestedAt:serverTimestamp(),cancelledAt:null,completedAt:null};
await t("user initiates own deletion",()=>assertSucceeds(setDoc(ref,valid)));
await t("user reads own deletion request",()=>assertSucceeds(getDoc(ref)));
await t("other user cannot read deletion request",()=>assertFails(getDoc(doc(dbB,"accountDeletionRequests",U))));
await t("non-admin cannot list deletion requests",()=>assertFails(getDocs(collection(dbU,"accountDeletionRequests"))));
await t("admin lists deletion requests",()=>assertSucceeds(getDocs(collection(dbA,"accountDeletionRequests"))));
await t("other user cannot create deletion request for target",()=>assertFails(setDoc(doc(dbB,"accountDeletionRequests",U),{...valid})));
await t("user cannot forge completed request",()=>assertFails(setDoc(doc(dbU,"accountDeletionRequests","forged"),{...valid,uid:"forged",status:"completed",contactEmail:"x@example.test"})));
await t("user cancels pending request",()=>assertSucceeds(updateDoc(ref,{status:"cancelled",cancelledAt:serverTimestamp()})));
await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),"accountDeletionRequests",U),{uid:U,status:"pending",cleanupStatus:"required",cleanupCompletedAt:null,contactEmail:"u@example.test",displayName:"User",requestedAt:new Date(),cancelledAt:null,completedAt:null});});
await t("admin cannot process before client cleanup",()=>assertFails(updateDoc(doc(dbA,"accountDeletionRequests",U),{status:"processing",adminUpdatedAt:serverTimestamp(),adminUpdatedByUid:A})));
await t("requester marks client cleanup complete",()=>assertSucceeds(updateDoc(doc(dbU,"accountDeletionRequests",U),{cleanupStatus:"complete",cleanupCompletedAt:serverTimestamp()})));
await t("requester cannot cancel after destructive cleanup",()=>assertFails(updateDoc(doc(dbU,"accountDeletionRequests",U),{status:"cancelled",cancelledAt:serverTimestamp()})));
await t("admin marks request processing",()=>assertSucceeds(updateDoc(doc(dbA,"accountDeletionRequests",U),{status:"processing",adminUpdatedAt:serverTimestamp(),adminUpdatedByUid:A})));
await t("requester cannot mark request processing",()=>assertFails(updateDoc(doc(dbU,"accountDeletionRequests",U),{status:"processing",adminUpdatedAt:serverTimestamp(),adminUpdatedByUid:U})));
await t("admin marks processing request complete",()=>assertSucceeds(updateDoc(doc(dbA,"accountDeletionRequests",U),{status:"completed",adminUpdatedAt:serverTimestamp(),adminUpdatedByUid:A,completedAt:serverTimestamp()})));
await env.cleanup();if(bad)process.exitCode=1;
