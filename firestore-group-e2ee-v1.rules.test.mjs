import { readFileSync } from "node:fs";
import { initializeTestEnvironment,assertFails,assertSucceeds } from "@firebase/rules-unit-testing";
import { doc,getDoc,setDoc,serverTimestamp,writeBatch } from "firebase/firestore";
const rules=readFileSync(new URL("./firestore.rules",import.meta.url),"utf8"),PROJECT_ID="demo-fidunio-group-e2ee-rules";
const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules}}),A="groupOwnerA",B="groupMemberB",OUT="groupOutsider";
const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore(),dbO=env.authenticatedContext(OUT).firestore(),results=[];
async function test(name,fn){try{await fn();results.push([name,true]);console.log("PASS",name);}catch(e){results.push([name,false]);console.error("FAIL",name,e?.message||e);}}
const keyA="group-key-ownerA-0001",keyB="group-key-memberB-0001";
async function seed(){await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();for(const uid of [A,B,OUT])await setDoc(doc(db,"users",uid),{displayName:uid,active:true,status:"active",systemRole:"user"});for(const [uid,key,x,y] of [[A,keyA,"xA","yA"],[B,keyB,"xB","yB"]])await setDoc(doc(db,"e2eePublicKeys",uid),{uid,schemaVersion:1,identityVersion:1,keyId:key,keyAlgorithm:"ECDH-P256",publicJwk:{kty:"EC",crv:"P-256",x,y},state:"ACTIVE",createdAt:new Date(),updatedAt:new Date()});await setDoc(doc(db,"groups","g1"),{type:"group",name:"Encrypted Group",ownerUid:A,createdByUid:A,memberUids:[A,B],adminUids:[A],historyPolicy:"fromJoin",groupVersion:1,keyEpoch:0,createdAt:new Date(),updatedAt:new Date()});for(const [uid,role] of [[A,"owner"],[B,"member"]])await setDoc(doc(db,"groups","g1","members",uid),{uid,displayName:uid,role,joinedAt:new Date(),historyFrom:new Date(),addedByUid:A,active:true});});}
function epoch(){return{format:"fidunio-group-key-v1",groupId:"g1",keyEpoch:1,createdByUid:A,createdByKeyId:keyA,memberKeyIds:{[A]:keyA,[B]:keyB},envelopes:{[A]:{senderKeyId:keyA,recipientKeyId:keyA,ciphertext:"AAAAAAAAAAAAAAAAAAAAAA",iv:"AAAAAAAAAAAAAAAA"},[B]:{senderKeyId:keyA,recipientKeyId:keyB,ciphertext:"BBBBBBBBBBBBBBBBBBBBBB",iv:"BBBBBBBBBBBBBBBB"}},createdAt:serverTimestamp()};}
function msg(extra={}){return{e2ee:4,groupFormat:"fidunio-group-message-v1",keyEpoch:1,senderUid:A,senderKeyId:keyA,ciphertext:"AAAAAAAAAAAAAAAAAAAAAA",iv:"AAAAAAAAAAAAAAAA",state:"sent",createdAt:serverTimestamp(),...extra};}
await env.clearFirestore();await seed();
await test("01 member can read group",()=>assertSucceeds(getDoc(doc(dbB,"groups","g1"))));
await test("02 outsider cannot read group",()=>assertFails(getDoc(doc(dbO,"groups","g1"))));
await test("03 plaintext group message denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","plain"),{senderUid:A,state:"sent",text:"never",createdAt:serverTimestamp()})));
await test("04 epoch cannot be created without atomic group advance",()=>assertFails(setDoc(doc(dbA,"groups","g1","epochs","1"),epoch())));
await test("05 admin atomically advances epoch and creates envelopes",async()=>{const b=writeBatch(dbA);b.update(doc(dbA,"groups","g1"),{keyEpoch:1,updatedAt:serverTimestamp()});b.set(doc(dbA,"groups","g1","epochs","1"),epoch());return assertSucceeds(b.commit());});
await test("06 member reads epoch",()=>assertSucceeds(getDoc(doc(dbB,"groups","g1","epochs","1"))));
await test("07 outsider cannot read epoch",()=>assertFails(getDoc(doc(dbO,"groups","g1","epochs","1"))));
await test("08 valid encrypted group message succeeds",()=>assertSucceeds(setDoc(doc(dbA,"groups","g1","messages","m1"),msg())));
await test("09 plaintext field on encrypted message denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m2"),msg({text:"leak"}))));
await test("10 stale epoch message denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m3"),msg({keyEpoch:0}))));
await test("11 sender key mismatch denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m4"),msg({senderKeyId:keyB}))));
await test("12 member can write own delivered receipt",()=>assertSucceeds(setDoc(doc(dbB,"groups","g1","messages","m1","receipts",B),{uid:B,state:"delivered",updatedAt:serverTimestamp()})));
await test("13 member can advance own receipt to read",()=>assertSucceeds(setDoc(doc(dbB,"groups","g1","messages","m1","receipts",B),{uid:B,state:"read",updatedAt:serverTimestamp()})));
await test("14 member cannot write another account receipt",()=>assertFails(setDoc(doc(dbB,"groups","g1","messages","m1","receipts",A),{uid:A,state:"read",updatedAt:serverTimestamp()})));
await test("15 outsider cannot write receipt",()=>assertFails(setDoc(doc(dbO,"groups","g1","messages","m1","receipts",OUT),{uid:OUT,state:"read",updatedAt:serverTimestamp()})));
const failed=results.filter(([,ok])=>!ok);console.log(`\n${results.length-failed.length}/${results.length} group E2EE assertions passed.`);await env.cleanup();if(failed.length)process.exitCode=1;
