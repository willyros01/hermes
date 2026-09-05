// FIDUNIO E2EE v1 Firestore Security Rules gate.
// Run ONLY with Firebase Local Emulator Suite. Never points at production.
import fs from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from "@firebase/rules-unit-testing";
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs,
  writeBatch, serverTimestamp
} from "firebase/firestore";

const PROJECT_ID="demo-fidunio-e2ee-rules";
const rules=fs.readFileSync("firestore.rules","utf8");
const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules}});
const A="ownerA",B="ownerB",DISABLED="disabled";
const ctxA=env.authenticatedContext(A),ctxB=env.authenticatedContext(B),ctxD=env.authenticatedContext(DISABLED),anon=env.unauthenticatedContext();
const dbA=ctxA.firestore(),dbB=ctxB.firestore(),dbD=ctxD.firestore(),dbN=anon.firestore();
const results=[];
async function test(name,fn){try{await fn();results.push([name,true]);console.log("PASS",name);}catch(e){results.push([name,false]);console.error("FAIL",name,e?.message||e);}}
const normalWrapper=()=>({schemaVersion:1,wrapperVersion:1,kdf:"PBKDF2-HMAC-SHA256",iterations:600000,salt:"AAAAAAAAAAAAAAAAAAAAAA",wrappingAlgorithm:"AES-256-GCM",iv:"AAAAAAAAAAAAAAAA",ciphertext:"AAAAAAAAAAAAAAAAAAAAAA"});
const recoveryWrapper=()=>({schemaVersion:1,wrapperVersion:1,wrappingAlgorithm:"AES-256-GCM",iv:"AAAAAAAAAAAAAAAA",ciphertext:"AAAAAAAAAAAAAAAAAAAAAA",wrappedRecoveryKey:"server-wrapped",metadata:{version:1}});
const privateIdentity=()=>({schemaVersion:1,identityVersion:1,keyId:"test-key-A",keyAlgorithm:"ECDH-P256",normalWrapper:normalWrapper(),recoveryWrapper:recoveryWrapper(),state:"ACTIVE",revision:1,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
const publicIdentity=uid=>({uid,schemaVersion:1,identityVersion:1,keyId:"test-key-A",keyAlgorithm:"ECDH-P256",publicJwk:{kty:"EC",crv:"P-256",x:"x-test",y:"y-test",ext:true,key_ops:[]},state:"ACTIVE",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
async function seed(){await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();await setDoc(doc(db,"users",A),{displayName:"Owner A",active:true,systemRole:"user"});await setDoc(doc(db,"users",B),{displayName:"Owner B",active:true,systemRole:"user"});await setDoc(doc(db,"users",DISABLED),{displayName:"Disabled",active:false,systemRole:"user"});});}
await env.clearFirestore();await seed();
await test("private anon read denied",()=>assertFails(getDoc(doc(dbN,"users",A,"e2ee","identity"))));
await test("private other-user read denied",()=>assertFails(getDoc(doc(dbB,"users",A,"e2ee","identity"))));
await test("private valid owner create allowed",()=>assertSucceeds(setDoc(doc(dbA,"users",A,"e2ee","identity"),privateIdentity())));
await test("private owner read allowed",()=>assertSucceeds(getDoc(doc(dbA,"users",A,"e2ee","identity"))));
await test("private disabled owner read denied",()=>assertFails(getDoc(doc(dbD,"users",DISABLED,"e2ee","identity"))));
await test("private collection list denied",()=>assertFails(getDocs(collection(dbA,"users",A,"e2ee"))));
await test("private delete denied",()=>assertFails(deleteDoc(doc(dbA,"users",A,"e2ee","identity"))));
await test("private keyId update denied",()=>assertFails(updateDoc(doc(dbA,"users",A,"e2ee","identity"),{keyId:"replacement",revision:2,updatedAt:serverTimestamp()})));
await test("private recovery wrapper update denied",()=>assertFails(updateDoc(doc(dbA,"users",A,"e2ee","identity"),{recoveryWrapper:{...recoveryWrapper(),ciphertext:"changed"},revision:2,updatedAt:serverTimestamp()})));
await test("private exact normal rewrap allowed",()=>assertSucceeds(updateDoc(doc(dbA,"users",A,"e2ee","identity"),{normalWrapper:{...normalWrapper(),ciphertext:"BBBBBBBBBBBBBBBBBBBBBB"},revision:2,updatedAt:serverTimestamp()})));
await test("private revision jump denied",()=>assertFails(updateDoc(doc(dbA,"users",A,"e2ee","identity"),{normalWrapper:normalWrapper(),revision:4,updatedAt:serverTimestamp()})));
await test("public own valid create allowed",()=>assertSucceeds(setDoc(doc(dbA,"e2eePublicKeys",A),publicIdentity(A))));
await test("public registered correspondent read allowed",()=>assertSucceeds(getDoc(doc(dbB,"e2eePublicKeys",A))));
await test("public anon read denied",()=>assertFails(getDoc(doc(dbN,"e2eePublicKeys",A))));
await test("public disabled read denied",()=>assertFails(getDoc(doc(dbD,"e2eePublicKeys",A))));
await test("public update denied",()=>assertFails(updateDoc(doc(dbA,"e2eePublicKeys",A),{state:"REPLACED",updatedAt:serverTimestamp()})));
await test("public delete denied",()=>assertFails(deleteDoc(doc(dbA,"e2eePublicKeys",A))));
await test("other user cannot create public key for owner",()=>assertFails(setDoc(doc(dbB,"e2eePublicKeys",B),{...publicIdentity(A),uid:A})));
await test("public private-JWK d rejected",()=>assertFails(setDoc(doc(dbB,"e2eePublicKeys",B),{...publicIdentity(B),keyId:"test-key-B",publicJwk:{...publicIdentity(B).publicJwk,d:"PRIVATE"}})));
await test("atomic invalid public leaves no private residue",async()=>{const refP=doc(dbB,"users",B,"e2ee","identity"),refU=doc(dbB,"e2eePublicKeys",B),batch=writeBatch(dbB);batch.set(refP,{...privateIdentity(),keyId:"test-key-B"});batch.set(refU,{...publicIdentity(B),keyId:"test-key-B",publicJwk:{...publicIdentity(B).publicJwk,d:"PRIVATE"}});await assertFails(batch.commit());const snap=await getDoc(refP);if(snap.exists())throw new Error("private residue remained");});
const failed=results.filter(([,ok])=>!ok);console.log(`\n${results.length-failed.length}/${results.length} executable core assertions passed.`);await env.cleanup();if(failed.length)process.exitCode=1;
