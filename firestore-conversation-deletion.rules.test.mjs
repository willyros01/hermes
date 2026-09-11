import {readFileSync} from "node:fs";
import {initializeTestEnvironment,assertFails,assertSucceeds} from "@firebase/rules-unit-testing";
import {deleteDoc,doc,getDoc,setDoc,updateDoc,serverTimestamp} from "firebase/firestore";

const rules=readFileSync(new URL("./firestore.rules",import.meta.url),"utf8");
const env=await initializeTestEnvironment({projectId:"demo-fidunio-conversation-delete-rules",firestore:{rules}});
const A="owner-a",B="member-b",dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
let failed=0;
async function test(name,work){try{await work();console.log("PASS",name);}catch(error){failed++;console.error("FAIL",name,error?.message||error);}}

await env.withSecurityRulesDisabled(async context=>{
  const db=context.firestore(),now=new Date();
  await setDoc(doc(db,"users",A),{displayName:"Owner A",active:true,status:"active",systemRole:"user"});
  await setDoc(doc(db,"users",B),{displayName:"Member B",active:true,status:"active",systemRole:"user"});
  await setDoc(doc(db,"conversations","deleting-direct"),{type:"direct",members:[A,B],memberNames:{[A]:"Owner A",[B]:"Member B"},createdAt:now,updatedAt:now,deletionState:"deleting",deletionRequestedByUid:A,deletionRequestedAt:now});
  await setDoc(doc(db,"groups","deleting-group"),{type:"group",name:"Deleting Group",ownerUid:A,createdByUid:A,memberUids:[A,B],adminUids:[A],createdAt:now,updatedAt:now,historyPolicy:"fromJoin",groupVersion:1,keyEpoch:0,deletionState:"deleting",deletionRequestedByUid:A,deletionRequestedAt:now});
});

await test("direct participants can still read the deletion-barrier parent",()=>assertSucceeds(getDoc(doc(dbB,"conversations","deleting-direct"))));
await test("direct message creation is frozen after the barrier",()=>assertFails(setDoc(doc(dbA,"conversations","deleting-direct","messages","m1"),{senderUid:A,state:"sent",createdAt:serverTimestamp(),text:"must not send"})));
await test("direct parent updates are frozen after the barrier",()=>assertFails(updateDoc(doc(dbA,"conversations","deleting-direct"),{updatedAt:serverTimestamp()})));
await test("direct client root delete remains denied",()=>assertFails(deleteDoc(doc(dbA,"conversations","deleting-direct"))));
await test("group members can still read the deletion-barrier parent",()=>assertSucceeds(getDoc(doc(dbB,"groups","deleting-group"))));
await test("group owner updates are frozen after the barrier",()=>assertFails(updateDoc(doc(dbA,"groups","deleting-group"),{name:"Changed"})));
await test("group client root delete remains denied",()=>assertFails(deleteDoc(doc(dbA,"groups","deleting-group"))));

await env.cleanup();
if(failed)process.exitCode=1;
