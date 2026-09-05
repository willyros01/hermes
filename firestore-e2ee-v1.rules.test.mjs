// FIDUNIO E2EE v1 Firestore Security Rules gate.
// Run ONLY with Firebase Local Emulator Suite. Never points at production.
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, writeBatch, serverTimestamp } from "firebase/firestore";
import stagedRules from "./firestore-e2ee-v1-staged-rules.mjs";

const PROJECT_ID="demo-fidunio-e2ee-rules";
const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:stagedRules}});
const A="ownerA",B="ownerB",DISABLED="disabled";
const ctxA=env.authenticatedContext(A),ctxB=env.authenticatedContext(B),ctxD=env.authenticatedContext(DISABLED),anon=env.unauthenticatedContext();
const dbA=ctxA.firestore(),dbB=ctxB.firestore(),dbD=ctxD.firestore(),dbN=anon.firestore();
const results=[];
async function test(name,fn){try{await fn();results.push([name,true]);console.log("PASS",name);}catch(e){results.push([name,false]);console.error("FAIL",name,e?.message||e);}}
const keyA="test-key-ownerA-0001",keyB="test-key-ownerB-0001";
const normalWrapper=()=>({version:1,ciphertext:"AAAAAAAAAAAAAAAAAAAAAA",salt:"AAAAAAAAAAAAAAAAAAAAAA",iv:"AAAAAAAAAAAAAAAA",kdf:"PBKDF2-HMAC-SHA256",iterations:600000,wrappingAlgorithm:"AES-256-GCM"});
const recoveryWrapper=()=>({version:1,ciphertext:"AAAAAAAAAAAAAAAAAAAAAA",iv:"AAAAAAAAAAAAAAAA",wrappedRecoveryKey:"server-wrapped-ruk-test",wrappingAlgorithm:"AES-256-GCM",recoveryAuthorityVersion:1,metadata:{version:1}});
const privateIdentity=(keyId=keyA)=>({schemaVersion:1,identityVersion:1,keyId,keyAlgorithm:"ECDH-P256",normalWrapper:normalWrapper(),recoveryWrapper:recoveryWrapper(),state:"ACTIVE",revision:1,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
const publicIdentity=(uid,keyId=keyA)=>({uid,schemaVersion:1,identityVersion:1,keyId,keyAlgorithm:"ECDH-P256",publicJwk:{kty:"EC",crv:"P-256",x:"x-test",y:"y-test",ext:true,key_ops:[]},state:"ACTIVE",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
async function seed(){await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();await setDoc(doc(db,"users",A),{displayName:"Owner A",active:true,status:"active",systemRole:"user"});await setDoc(doc(db,"users",B),{displayName:"Owner B",active:true,status:"active",systemRole:"user"});await setDoc(doc(db,"users",DISABLED),{displayName:"Disabled",active:false,status:"suspended",systemRole:"user"});});}
await env.clearFirestore();await seed();
await test("private anon read denied",()=>assertFails(getDoc(doc(dbN,"users",A,"e2ee","identity"))));
await test("private other-user read denied",()=>assertFails(getDoc(doc(dbB,"users",A,"e2ee","identity"))));
await test("private valid owner create allowed",()=>assertSucceeds(setDoc(doc(dbA,"users",A,"e2ee","identity"),privateIdentity())));
await test("private owner read allowed",()=>assertSucceeds(getDoc(doc(dbA,"users",A,"e2ee","identity"))));
await test("private disabled owner read denied",()=>assertFails(getDoc(doc(dbD,"users",DISABLED,"e2ee","identity"))));
await test("private collection list denied",()=>assertFails(getDocs(collection(dbA,"users",A,"e2ee"))));
await test("private delete denied",()=>assertFails(deleteDoc(doc(dbA,"users",A,"e2ee","identity"))));
await test("private keyId update denied",()=>assertFails(updateDoc(doc(dbA,"users",A,"e2ee","identity"),{keyId:"replacement-key-0001",revision:2,updatedAt:serverTimestamp()})));
await test("private recovery wrapper update denied",()=>assertFails(updateDoc(doc(dbA,"users",A,"e2ee","identity"),{recoveryWrapper:{...recoveryWrapper(),ciphertext:"changed"},revision:2,updatedAt:serverTimestamp()})));
await test("private exact normal rewrap allowed",()=>assertSucceeds(updateDoc(doc(dbA,"users",A,"e2ee","identity"),{normalWrapper:{...normalWrapper(),ciphertext:"BBBBBBBBBBBBBBBBBBBBBB"},revision:2,updatedAt:serverTimestamp()})));
await test("private revision jump denied",()=>assertFails(updateDoc(doc(dbA,"users",A,"e2ee","identity"),{normalWrapper:normalWrapper(),revision:4,updatedAt:serverTimestamp()})));
await test("private unexpected plaintext field denied",()=>assertFails(setDoc(doc(dbB,"users",B,"e2ee","identity"),{...privateIdentity(keyB),pin:"123456"})));
await test("private wrong KDF denied",()=>assertFails(setDoc(doc(dbB,"users",B,"e2ee","identity"),{...privateIdentity(keyB),normalWrapper:{...normalWrapper(),kdf:"wrong"}})));
await test("public own valid create allowed",()=>assertSucceeds(setDoc(doc(dbA,"e2eePublicKeys",A),publicIdentity(A))));
await test("public registered correspondent read allowed",()=>assertSucceeds(getDoc(doc(dbB,"e2eePublicKeys",A))));
await test("public registered list allowed",()=>assertSucceeds(getDocs(collection(dbB,"e2eePublicKeys"))));
await test("public anon read denied",()=>assertFails(getDoc(doc(dbN,"e2eePublicKeys",A))));
await test("public disabled read denied",()=>assertFails(getDoc(doc(dbD,"e2eePublicKeys",A))));
await test("public update denied",()=>assertFails(updateDoc(doc(dbA,"e2eePublicKeys",A),{state:"REPLACED",updatedAt:serverTimestamp()})));
await test("public delete denied",()=>assertFails(deleteDoc(doc(dbA,"e2eePublicKeys",A))));
await test("other user cannot create public key for owner",()=>assertFails(setDoc(doc(dbB,"e2eePublicKeys",B),{...publicIdentity(A,keyB),uid:A})));
await test("public private-JWK d rejected",()=>assertFails(setDoc(doc(dbB,"e2eePublicKeys",B),{...publicIdentity(B,keyB),publicJwk:{...publicIdentity(B,keyB).publicJwk,d:"PRIVATE"}})));
await test("public unexpected field rejected",()=>assertFails(setDoc(doc(dbB,"e2eePublicKeys",B),{...publicIdentity(B,keyB),unexpected:true})));
await test("atomic invalid public leaves no private residue",async()=>{const refP=doc(dbB,"users",B,"e2ee","identity"),refU=doc(dbB,"e2eePublicKeys",B),batch=writeBatch(dbB);batch.set(refP,privateIdentity(keyB));batch.set(refU,{...publicIdentity(B,keyB),publicJwk:{...publicIdentity(B,keyB).publicJwk,d:"PRIVATE"}});await assertFails(batch.commit());const snap=await getDoc(refP);if(snap.exists())throw new Error("private residue remained");});
const failed=results.filter(([,ok])=>!ok);console.log(`\n${results.length-failed.length}/${results.length} executable core assertions passed.`);await env.cleanup();if(failed.length)process.exitCode=1;
