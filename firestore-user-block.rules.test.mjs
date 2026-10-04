import {readFileSync} from "node:fs";
import {initializeTestEnvironment,assertFails,assertSucceeds} from "@firebase/rules-unit-testing";
import {doc,getDoc,getDocs,setDoc,deleteDoc,serverTimestamp,collection} from "firebase/firestore";

const rules=readFileSync(new URL("./firestore.rules",import.meta.url),"utf8");
const env=await initializeTestEnvironment({projectId:"demo-fidunio-block-rules",firestore:{rules}});
const A="user-a",B="user-b",C="user-c";
const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore(),dbC=env.authenticatedContext(C).firestore();
let bad=0;async function t(name,fn){try{await fn();console.log("PASS",name);}catch(e){bad++;console.error("FAIL",name,e.message);}}
await env.withSecurityRulesDisabled(async c=>{
 const db=c.firestore();
 for(const [uid,name] of [[A,"A"],[B,"B"],[C,"C"]])await setDoc(doc(db,"users",uid),{displayName:name,email:uid+"@example.test",systemRole:"user",active:true,status:"active"});
 await setDoc(doc(db,"e2eePublicKeys",A),{uid:A,schemaVersion:1,identityVersion:1,keyId:"a".repeat(16),keyAlgorithm:"ECDH-P256",publicJwk:{kty:"EC",crv:"P-256",x:"x",y:"y"},state:"ACTIVE",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
 await setDoc(doc(db,"e2eePublicKeys",B),{uid:B,schemaVersion:1,identityVersion:1,keyId:"b".repeat(16),keyAlgorithm:"ECDH-P256",publicJwk:{kty:"EC",crv:"P-256",x:"x",y:"y"},state:"ACTIVE",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
});
const blockAB=doc(dbA,"users",A,"blocks",B);
await t("user blocks another user",()=>assertSucceeds(setDoc(blockAB,{blockedUid:B,createdAt:serverTimestamp()})));
await t("owner lists own blocks",()=>assertSucceeds(getDocs(collection(dbA,"users",A,"blocks"))));
await t("other user cannot read block record",()=>assertFails(getDoc(doc(dbB,"users",A,"blocks",B))));
await t("other user cannot create block for owner",()=>assertFails(setDoc(doc(dbB,"users",A,"blocks",C),{blockedUid:C,createdAt:serverTimestamp()})));
await t("cannot block self",()=>assertFails(setDoc(doc(dbA,"users",A,"blocks",A),{blockedUid:A,createdAt:serverTimestamp()})));
await t("blocked pair cannot create direct conversation from blocker",()=>assertFails(setDoc(doc(dbA,"conversations","dm-blocked-a"),{type:"direct",members:[A,B],memberNames:{[A]:"A",[B]:"B"},createdAt:serverTimestamp(),updatedAt:serverTimestamp()})));
await t("blocked pair cannot create direct conversation from blocked user",()=>assertFails(setDoc(doc(dbB,"conversations","dm-blocked-b"),{type:"direct",members:[A,B],memberNames:{[A]:"A",[B]:"B"},createdAt:serverTimestamp(),updatedAt:serverTimestamp()})));
await t("unrelated pair can create direct conversation",()=>assertSucceeds(setDoc(doc(dbC,"conversations","dm-open"),{type:"direct",members:[C,B],memberNames:{[C]:"C",[B]:"B"},createdAt:serverTimestamp(),updatedAt:serverTimestamp()})));
await t("owner can unblock",()=>assertSucceeds(deleteDoc(blockAB)));
await t("pair can create direct conversation after unblock",()=>assertSucceeds(setDoc(doc(dbA,"conversations","dm-unblocked"),{type:"direct",members:[A,B],memberNames:{[A]:"A",[B]:"B"},createdAt:serverTimestamp(),updatedAt:serverTimestamp()})));
await env.cleanup();if(bad)process.exitCode=1;
