// FIDUNIO group E2EE v1 Firestore Security Rules gate.
// This suite intentionally tests the exact repository firestore.rules source.
// Until the group rule implementation lands, the current deny-all message rule
// is the expected baseline and this file records the executable transition gate.
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const rules=readFileSync(new URL("./firestore.rules",import.meta.url),"utf8");
const PROJECT_ID="demo-fidunio-group-e2ee-rules";
const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules}});
const A="groupOwnerA",B="groupMemberB",OUT="groupOutsider";
const dbA=env.authenticatedContext(A).firestore();
const dbB=env.authenticatedContext(B).firestore();
const dbO=env.authenticatedContext(OUT).firestore();
const results=[];
async function test(name,fn){try{await fn();results.push([name,true]);console.log("PASS",name);}catch(e){results.push([name,false]);console.error("FAIL",name,e?.message||e);}}

async function seed(){
  await env.withSecurityRulesDisabled(async c=>{
    const db=c.firestore();
    for(const uid of [A,B,OUT])await setDoc(doc(db,"users",uid),{displayName:uid,active:true,status:"active",systemRole:"user"});
    await setDoc(doc(db,"e2eePublicKeys",A),{uid:A,schemaVersion:1,identityVersion:1,keyId:"group-key-ownerA-0001",keyAlgorithm:"ECDH-P256",publicJwk:{kty:"EC",crv:"P-256",x:"xA",y:"yA"},state:"ACTIVE",createdAt:new Date(),updatedAt:new Date()});
    await setDoc(doc(db,"e2eePublicKeys",B),{uid:B,schemaVersion:1,identityVersion:1,keyId:"group-key-memberB-0001",keyAlgorithm:"ECDH-P256",publicJwk:{kty:"EC",crv:"P-256",x:"xB",y:"yB"},state:"ACTIVE",createdAt:new Date(),updatedAt:new Date()});
    await setDoc(doc(db,"groups","g1"),{type:"group",name:"Encrypted Group",ownerUid:A,createdByUid:A,memberUids:[A,B],adminUids:[A],historyPolicy:"fromJoin",groupVersion:1,keyEpoch:0,createdAt:new Date(),updatedAt:new Date()});
    await setDoc(doc(db,"groups","g1","members",A),{uid:A,displayName:A,role:"owner",joinedAt:new Date(),historyFrom:new Date(),addedByUid:A,active:true});
    await setDoc(doc(db,"groups","g1","members",B),{uid:B,displayName:B,role:"member",joinedAt:new Date(),historyFrom:new Date(),addedByUid:A,active:true});
  });
}

await env.clearFirestore();await seed();

await test("01 member can read group",()=>assertSucceeds(getDoc(doc(dbB,"groups","g1"))));
await test("02 outsider cannot read group",()=>assertFails(getDoc(doc(dbO,"groups","g1"))));
await test("03 current baseline denies plaintext group message",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","plain"),{senderUid:A,state:"sent",text:"must never pass",createdAt:serverTimestamp()})));
await test("04 current baseline denies fake e2ee4 before epoch implementation",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","fake"),{e2ee:4,groupFormat:"fidunio-group-message-v1",keyEpoch:1,senderUid:A,senderKeyId:"group-key-ownerA-0001",ciphertext:"AAAAAAAAAAAAAAAAAAAAAA",iv:"AAAAAAAAAAAAAAAA",state:"sent",createdAt:serverTimestamp()})));
await test("05 current baseline denies epoch record before rules implementation",()=>assertFails(setDoc(doc(dbA,"groups","g1","epochs","1"),{format:"fidunio-group-key-v1",groupId:"g1",keyEpoch:1,createdByUid:A,createdByKeyId:"group-key-ownerA-0001",memberKeyIds:{[A]:"group-key-ownerA-0001",[B]:"group-key-memberB-0001"},envelopes:{},createdAt:serverTimestamp()})));

const failed=results.filter(([,ok])=>!ok);
console.log(`\n${results.length-failed.length}/${results.length} group baseline assertions passed.`);
await env.cleanup();
if(failed.length)process.exitCode=1;
