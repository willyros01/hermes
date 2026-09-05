// FIDUNIO E2EE v1 Firestore Security Rules gate.
// Run ONLY with Firebase Local Emulator Suite. Never points at production.
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, writeBatch, serverTimestamp } from "firebase/firestore";
import stagedRules from "./firestore-e2ee-v1-schema-tightening-candidate.mjs";

const PROJECT_ID="demo-fidunio-e2ee-rules";
const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:stagedRules}});
const A="ownerA",B="ownerB",DISABLED="disabled";
const ctxA=env.authenticatedContext(A),ctxB=env.authenticatedContext(B),ctxD=env.authenticatedContext(DISABLED),anon=env.unauthenticatedContext();
const dbA=ctxA.firestore(),dbB=ctxB.firestore(),dbD=ctxD.firestore(),dbN=anon.firestore();
const results=[];
async function test(name,fn){try{await fn();results.push([name,true]);console.log("PASS",name);}catch(e){results.push([name,false]);console.error("FAIL",name,e?.message||e);}}
const keyA="test-key-ownerA-0001",keyB="test-key-ownerB-0001";
const normalWrapper=()=>({version:1,ciphertext:"AAAAAAAAAAAAAAAAAAAAAA",salt:"AAAAAAAAAAAAAAAAAAAAAA",iv:"AAAAAAAAAAAAAAAA",kdf:"PBKDF2-HMAC-SHA256",iterations:600000,wrappingAlgorithm:"AES-256-GCM"});
const recoveryWrapper=()=>({version:1,ciphertext:"AAAAAAAAAAAAAAAAAAAAAA",iv:"AAAAAAAAAAAAAAAA",wrappedRecoveryKey:"server-wrapped-ruk-test",wrappingAlgorithm:"AES-256-GCM",recoveryAuthorityVersion:1,recoveryKeyIv:"AAAAAAAAAAAAAAAA",recoveryKeyWrappingAlgorithm:"HMAC-SHA256+A256GCM"});
const privateIdentity=(keyId=keyA)=>({schemaVersion:1,identityVersion:1,keyId,keyAlgorithm:"ECDH-P256",normalWrapper:normalWrapper(),recoveryWrapper:recoveryWrapper(),state:"ACTIVE",revision:1,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
const publicIdentity=(uid,keyId=keyA)=>({uid,schemaVersion:1,identityVersion:1,keyId,keyAlgorithm:"ECDH-P256",publicJwk:{kty:"EC",crv:"P-256",x:"x-test",y:"y-test"},state:"ACTIVE",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
async function seed(){await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();await setDoc(doc(db,"users",A),{displayName:"Owner A",active:true,status:"active",systemRole:"user"});await setDoc(doc(db,"users",B),{displayName:"Owner B",active:true,status:"active",systemRole:"user"});await setDoc(doc(db,"users",DISABLED),{displayName:"Disabled",active:false,status:"suspended",systemRole:"user"});await setDoc(doc(db,"invitations","public-test"),{status:"pending",role:"user",invitedByUid:A,createdAt:new Date(),expiresAt:new Date(Date.now()+86400000)});});}
await env.clearFirestore();await seed();

await test("01 private anon read denied",()=>assertFails(getDoc(doc(dbN,"users",A,"e2ee","identity"))));
await test("02 private other-user read denied",()=>assertFails(getDoc(doc(dbB,"users",A,"e2ee","identity"))));
await test("03 private valid owner create allowed",()=>assertSucceeds(setDoc(doc(dbA,"users",A,"e2ee","identity"),privateIdentity())));
await test("04 private owner read allowed",()=>assertSucceeds(getDoc(doc(dbA,"users",A,"e2ee","identity"))));
await test("05 private disabled owner read denied",()=>assertFails(getDoc(doc(dbD,"users",DISABLED,"e2ee","identity"))));
await test("06 private collection list denied",()=>assertFails(getDocs(collection(dbA,"users",A,"e2ee"))));
await test("07 private delete denied",()=>assertFails(deleteDoc(doc(dbA,"users",A,"e2ee","identity"))));
await test("08 private keyId update denied",()=>assertFails(updateDoc(doc(dbA,"users",A,"e2ee","identity"),{keyId:"replacement-key-0001",revision:2,updatedAt:serverTimestamp()})));
await test("09 private recovery wrapper update denied",()=>assertFails(updateDoc(doc(dbA,"users",A,"e2ee","identity"),{recoveryWrapper:{...recoveryWrapper(),ciphertext:"changed"},revision:2,updatedAt:serverTimestamp()})));
await test("10 private exact normal rewrap allowed",()=>assertSucceeds(updateDoc(doc(dbA,"users",A,"e2ee","identity"),{normalWrapper:{...normalWrapper(),ciphertext:"BBBBBBBBBBBBBBBBBBBBBB"},revision:2,updatedAt:serverTimestamp()})));
await test("11 private revision jump denied",()=>assertFails(updateDoc(doc(dbA,"users",A,"e2ee","identity"),{normalWrapper:normalWrapper(),revision:4,updatedAt:serverTimestamp()})));
await test("12 private unexpected plaintext field denied",()=>assertFails(setDoc(doc(dbB,"users",B,"e2ee","identity"),{...privateIdentity(keyB),pin:"123456"})));
await test("13 private wrong KDF denied",()=>assertFails(setDoc(doc(dbB,"users",B,"e2ee","identity"),{...privateIdentity(keyB),normalWrapper:{...normalWrapper(),kdf:"wrong"}})));
await test("14 private wrong wrapper version denied",()=>assertFails(setDoc(doc(dbB,"users",B,"e2ee","identity"),{...privateIdentity(keyB),normalWrapper:{...normalWrapper(),version:2}})));
await test("15 private wrong key algorithm denied",()=>assertFails(setDoc(doc(dbB,"users",B,"e2ee","identity"),{...privateIdentity(keyB),keyAlgorithm:"X25519"})));
await test("16 private wrong state denied",()=>assertFails(setDoc(doc(dbB,"users",B,"e2ee","identity"),{...privateIdentity(keyB),state:"REPLACED"})));
await test("17 private revision zero create denied",()=>assertFails(setDoc(doc(dbB,"users",B,"e2ee","identity"),{...privateIdentity(keyB),revision:0})));
await test("18 private createdAt client value denied",()=>assertFails(setDoc(doc(dbB,"users",B,"e2ee","identity"),{...privateIdentity(keyB),createdAt:new Date(0)})));

await test("19 public own valid create allowed",()=>assertSucceeds(setDoc(doc(dbA,"e2eePublicKeys",A),publicIdentity(A))));
await test("20 public registered correspondent read allowed",()=>assertSucceeds(getDoc(doc(dbB,"e2eePublicKeys",A))));
await test("21 public registered list allowed",()=>assertSucceeds(getDocs(collection(dbB,"e2eePublicKeys"))));
await test("22 public anon read denied",()=>assertFails(getDoc(doc(dbN,"e2eePublicKeys",A))));
await test("23 public disabled read denied",()=>assertFails(getDoc(doc(dbD,"e2eePublicKeys",A))));
await test("24 public update denied",()=>assertFails(updateDoc(doc(dbA,"e2eePublicKeys",A),{state:"REPLACED",updatedAt:serverTimestamp()})));
await test("25 public delete denied",()=>assertFails(deleteDoc(doc(dbA,"e2eePublicKeys",A))));
await test("26 other user cannot create public key for owner",()=>assertFails(setDoc(doc(dbB,"e2eePublicKeys",B),{...publicIdentity(A,keyB),uid:A})));
await test("27 public private-JWK d rejected",()=>assertFails(setDoc(doc(dbB,"e2eePublicKeys",B),{...publicIdentity(B,keyB),publicJwk:{...publicIdentity(B,keyB).publicJwk,d:"PRIVATE"}})));
await test("28 public unexpected field rejected",()=>assertFails(setDoc(doc(dbB,"e2eePublicKeys",B),{...publicIdentity(B,keyB),unexpected:true})));
await test("29 public wrong curve rejected",()=>assertFails(setDoc(doc(dbB,"e2eePublicKeys",B),{...publicIdentity(B,keyB),publicJwk:{...publicIdentity(B,keyB).publicJwk,crv:"P-384"}})));
await test("30 public createdAt client value denied",()=>assertFails(setDoc(doc(dbB,"e2eePublicKeys",B),{...publicIdentity(B,keyB),createdAt:new Date(0)})));

await test("31 atomic invalid public leaves no private residue",async()=>{const refP=doc(dbB,"users",B,"e2ee","identity"),refU=doc(dbB,"e2eePublicKeys",B),batch=writeBatch(dbB);batch.set(refP,privateIdentity(keyB));batch.set(refU,{...publicIdentity(B,keyB),publicJwk:{...publicIdentity(B,keyB).publicJwk,d:"PRIVATE"}});await assertFails(batch.commit());const snap=await getDoc(refP);if(snap.exists())throw new Error("private residue remained");});
await test("32 atomic invalid private leaves no public residue",async()=>{const refP=doc(dbB,"users",B,"e2ee","identity"),refU=doc(dbB,"e2eePublicKeys",B),batch=writeBatch(dbB);batch.set(refP,{...privateIdentity(keyB),pin:"123456"});batch.set(refU,publicIdentity(B,keyB));await assertFails(batch.commit());const snap=await getDoc(refU);if(snap.exists())throw new Error("public residue remained");});
await test("33 atomic valid private+public create allowed",async()=>{const refP=doc(dbB,"users",B,"e2ee","identity"),refU=doc(dbB,"e2eePublicKeys",B),batch=writeBatch(dbB);batch.set(refP,privateIdentity(keyB));batch.set(refU,publicIdentity(B,keyB));await assertSucceeds(batch.commit());});
await test("34 duplicate private create denied",()=>assertFails(setDoc(doc(dbB,"users",B,"e2ee","identity"),privateIdentity(keyB))));

await test("35 regression invitation get still allowed",()=>assertSucceeds(getDoc(doc(dbN,"invitations","public-test"))));
await test("36 regression registered profile read still allowed",()=>assertSucceeds(getDoc(doc(dbA,"users",B))));
await test("37 regression direct conversation create still allowed",()=>assertSucceeds(setDoc(doc(dbA,"conversations","dm-regression"),{type:"direct",members:[A,B],memberNames:{[A]:"Owner A",[B]:"Owner B"},createdAt:serverTimestamp(),updatedAt:serverTimestamp()})));
await test("38 regression direct message create still allowed",()=>assertSucceeds(setDoc(doc(dbA,"conversations","dm-regression","messages","m1"),{senderUid:A,state:"sent",text:"regression",createdAt:serverTimestamp()})));
await test("39 regression legacy device create still allowed",()=>assertSucceeds(setDoc(doc(dbA,"users",A,"devices","legacy-device"),{uid:A,deviceId:"legacy-device",e2eeVersion:1,publicJwk:{kty:"EC",crv:"P-256",x:"x",y:"y"},fingerprint:"test"})));
await test("40 regression group create still allowed",()=>assertSucceeds(setDoc(doc(dbA,"groups","group-regression"),{type:"group",name:"Regression Group",ownerUid:A,createdByUid:A,memberUids:[A,B],adminUids:[A],historyPolicy:"fromJoin",groupVersion:1,keyEpoch:0,createdAt:serverTimestamp(),updatedAt:serverTimestamp()})));

await env.clearFirestore();await seed();
await test("41 recovery wrapper generic metadata rejected",()=>assertFails(setDoc(doc(dbB,"users",B,"e2ee","identity"),{...privateIdentity(keyB),recoveryWrapper:{...recoveryWrapper(),metadata:{unexpected:true}}})));
await test("42 public JWK ext/key_ops rejected",()=>assertFails(setDoc(doc(dbB,"e2eePublicKeys",B),{...publicIdentity(B,keyB),publicJwk:{...publicIdentity(B,keyB).publicJwk,ext:true,key_ops:[]}})));

const failed=results.filter(([,ok])=>!ok);console.log(`\n${results.length-failed.length}/${results.length} assertions passed.`);await env.cleanup();if(failed.length)process.exitCode=1;
