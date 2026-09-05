// FIDUNIO account-authoritative direct-message Firestore rules gate.
// Emulator-only. Never point this suite at the live Firebase project.
import {readFileSync} from "node:fs";
import {initializeTestEnvironment,assertFails,assertSucceeds} from "@firebase/rules-unit-testing";
import {doc,setDoc,updateDoc,serverTimestamp} from "firebase/firestore";

const rules=readFileSync(new URL("./firestore.rules",import.meta.url),"utf8");
const PROJECT_ID="demo-fidunio-account-message-rules";
const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules}});
const A="ownerA",B="ownerB",C="ownerC";
const keyA="test-key-ownerA-0001",keyB="test-key-ownerB-0001";
const ctxA=env.authenticatedContext(A),ctxB=env.authenticatedContext(B),ctxC=env.authenticatedContext(C);
const dbA=ctxA.firestore(),dbB=ctxB.firestore(),dbC=ctxC.firestore();
const results=[];
async function test(name,fn){try{await fn();results.push([name,true]);console.log("PASS",name);}catch(error){results.push([name,false]);console.error("FAIL",name,error?.message||error);}}
function publicIdentity(uid,keyId){return{uid,schemaVersion:1,identityVersion:1,keyId,keyAlgorithm:"ECDH-P256",publicJwk:{kty:"EC",crv:"P-256",x:"x-test",y:"y-test"},state:"ACTIVE",createdAt:new Date(),updatedAt:new Date()};}
function v3(senderUid,senderKeyId,recipientKeyId){return{senderUid,senderName:senderUid===A?"Owner A":"Owner B",timeLabel:"12:00 PM",state:"sent",createdAt:serverTimestamp(),text:"",e2ee:3,kdfVersion:1,senderKeyId,recipientKeyId,ciphertext:"AAAAAAAAAAAAAAAAAAAAAA",iv:"AAAAAAAAAAAAAAAA"};}
async function seed(){await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();await setDoc(doc(db,"users",A),{displayName:"Owner A",active:true,status:"active",systemRole:"user"});await setDoc(doc(db,"users",B),{displayName:"Owner B",active:true,status:"active",systemRole:"user"});await setDoc(doc(db,"users",C),{displayName:"Owner C",active:true,status:"active",systemRole:"user"});await setDoc(doc(db,"e2eePublicKeys",A),publicIdentity(A,keyA));await setDoc(doc(db,"e2eePublicKeys",B),publicIdentity(B,keyB));await setDoc(doc(db,"conversations","dm-v3"),{type:"direct",members:[A,B],memberNames:{[A]:"Owner A",[B]:"Owner B"},createdAt:new Date(),updatedAt:new Date()});await setDoc(doc(db,"conversations","dm-no-key"),{type:"direct",members:[A,C],memberNames:{[A]:"Owner A",[C]:"Owner C"},createdAt:new Date(),updatedAt:new Date()});});}

await env.clearFirestore();await seed();

await test("01 valid A to B account message allowed",()=>assertSucceeds(setDoc(doc(dbA,"conversations","dm-v3","messages","m01"),v3(A,keyA,keyB))));
await test("02 valid B to A account message allowed",()=>assertSucceeds(setDoc(doc(dbB,"conversations","dm-v3","messages","m02"),v3(B,keyB,keyA))));
await test("03 non-member create denied",()=>assertFails(setDoc(doc(dbC,"conversations","dm-v3","messages","m03"),v3(C,"test-key-ownerC-0001",keyA))));
await test("04 sender UID spoof denied",()=>assertFails(setDoc(doc(dbA,"conversations","dm-v3","messages","m04"),v3(B,keyA,keyB))));
await test("05 wrong sender keyId denied",()=>assertFails(setDoc(doc(dbA,"conversations","dm-v3","messages","m05"),v3(A,"wrong-sender-key-0001",keyB))));
await test("06 wrong recipient keyId denied",()=>assertFails(setDoc(doc(dbA,"conversations","dm-v3","messages","m06"),v3(A,keyA,"wrong-recipient-0001"))));
await test("07 missing recipient public identity denied",()=>assertFails(setDoc(doc(dbA,"conversations","dm-no-key","messages","m07"),v3(A,keyA,"test-key-ownerC-0001"))));
await test("08 plaintext leakage denied",()=>assertFails(setDoc(doc(dbA,"conversations","dm-v3","messages","m08"),{...v3(A,keyA,keyB),text:"plaintext"})));
await test("09 device envelope fields denied",()=>assertFails(setDoc(doc(dbA,"conversations","dm-v3","messages","m09"),{...v3(A,keyA,keyB),envelopes:{legacy:{}},recipientDeviceIds:["legacy"]})));
await test("10 unexpected field denied",()=>assertFails(setDoc(doc(dbA,"conversations","dm-v3","messages","m10"),{...v3(A,keyA,keyB),unexpected:true})));
await test("11 wrong KDF version denied",()=>assertFails(setDoc(doc(dbA,"conversations","dm-v3","messages","m11"),{...v3(A,keyA,keyB),kdfVersion:2})));
await test("12 malformed ciphertext alphabet denied",()=>assertFails(setDoc(doc(dbA,"conversations","dm-v3","messages","m12"),{...v3(A,keyA,keyB),ciphertext:"AAAAAAAAAAAA+AAAAAAAAA"})));
await test("13 wrong IV length denied",()=>assertFails(setDoc(doc(dbA,"conversations","dm-v3","messages","m13"),{...v3(A,keyA,keyB),iv:"AAAAAAAAAAAAAAA"})));
await test("14 client-created timestamp denied",()=>assertFails(setDoc(doc(dbA,"conversations","dm-v3","messages","m14"),{...v3(A,keyA,keyB),createdAt:new Date(0)})));
await test("15 receipt state update remains allowed",()=>assertSucceeds(updateDoc(doc(dbB,"conversations","dm-v3","messages","m01"),{state:"delivered"})));
await test("16 receipt update cannot mutate ciphertext",()=>assertFails(updateDoc(doc(dbB,"conversations","dm-v3","messages","m01"),{state:"read",ciphertext:"BBBBBBBBBBBBBBBBBBBBBB"})));
await test("17 legacy e2ee v2 create remains allowed",()=>assertSucceeds(setDoc(doc(dbA,"conversations","dm-v3","messages","m17"),{senderUid:A,senderName:"Owner A",timeLabel:"12:01 PM",state:"sent",createdAt:serverTimestamp(),text:"",e2ee:2,ciphertext:"",iv:"",envelopes:{legacyDevice:{ciphertext:"legacy",iv:"legacy"}},recipientDeviceIds:["legacyDevice"],senderDeviceId:"legacyDevice",senderDevicePublicJwk:{kty:"EC",crv:"P-256",x:"x",y:"y"}})));
await test("18 legacy plaintext create remains allowed",()=>assertSucceeds(setDoc(doc(dbA,"conversations","dm-v3","messages","m18"),{senderUid:A,state:"sent",createdAt:serverTimestamp(),text:"legacy regression"})));

const failed=results.filter(([,ok])=>!ok);
console.log(`\n${results.length-failed.length}/${results.length} account-message rule assertions passed.`);
await env.cleanup();
if(failed.length)process.exitCode=1;
