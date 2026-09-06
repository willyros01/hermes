import { readFileSync } from "node:fs";
import { initializeTestEnvironment,assertFails,assertSucceeds } from "@firebase/rules-unit-testing";
import { doc,getDoc,setDoc,serverTimestamp,writeBatch,deleteDoc } from "firebase/firestore";
const rules=readFileSync(new URL("./firestore.rules",import.meta.url),"utf8"),PROJECT_ID="demo-fidunio-group-e2ee-rules";
const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules}}),A="groupOwnerA",B="groupMemberB",OUT="groupOutsider";
const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore(),dbO=env.authenticatedContext(OUT).firestore(),results=[];
async function test(name,fn){try{await fn();results.push([name,true]);console.log("PASS",name);}catch(e){results.push([name,false]);console.error("FAIL",name,e?.message||e);}}
const keyA="group-key-ownerA-0001",keyB="group-key-memberB-0001";let m1CreatedAt=null;
async function seed(){await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();for(const uid of [A,B,OUT])await setDoc(doc(db,"users",uid),{displayName:uid,active:true,status:"active",systemRole:"user"});for(const [uid,key,x,y] of [[A,keyA,"xA","yA"],[B,keyB,"xB","yB"]])await setDoc(doc(db,"e2eePublicKeys",uid),{uid,schemaVersion:1,identityVersion:1,keyId:key,keyAlgorithm:"ECDH-P256",publicJwk:{kty:"EC",crv:"P-256",x,y},state:"ACTIVE",createdAt:new Date(),updatedAt:new Date()});await setDoc(doc(db,"groups","g1"),{type:"group",name:"Encrypted Group",ownerUid:A,createdByUid:A,memberUids:[A,B],adminUids:[A],historyPolicy:"fromJoin",groupVersion:1,keyEpoch:0,createdAt:new Date(),updatedAt:new Date()});for(const [uid,role] of [[A,"owner"],[B,"member"]])await setDoc(doc(db,"groups","g1","members",uid),{uid,displayName:uid,role,joinedAt:new Date(),historyFrom:new Date(),addedByUid:A,active:true});});}
function epoch(){return{format:"fidunio-group-key-v1",groupId:"g1",keyEpoch:1,createdByUid:A,createdByKeyId:keyA,memberKeyIds:{[A]:keyA,[B]:keyB},envelopes:{[A]:{senderKeyId:keyA,recipientKeyId:keyA,ciphertext:"AAAAAAAAAAAAAAAAAAAAAA",iv:"AAAAAAAAAAAAAAAA"},[B]:{senderKeyId:keyA,recipientKeyId:keyB,ciphertext:"BBBBBBBBBBBBBBBBBBBBBB",iv:"BBBBBBBBBBBBBBBB"}},createdAt:serverTimestamp()};}
function msg(extra={}){return{e2ee:4,groupFormat:"fidunio-group-message-v1",keyEpoch:1,senderUid:A,senderKeyId:keyA,ciphertext:"AAAAAAAAAAAAAAAAAAAAAA",iv:"AAAAAAAAAAAAAAAA",state:"sent",createdAt:serverTimestamp(),receiptRevision:0,...extra};}
function grant(id="hg1",extra={}){return{format:"fidunio-group-history-grant-v1",version:1,groupId:"g1",grantId:id,grantorUid:A,grantorKeyId:keyA,targetUid:B,targetKeyId:keyB,boundaryKind:"beginning",boundaryAt:null,firstSharedMessageId:"m1",firstSharedAt:m1CreatedAt,totalCopies:1,status:"building",createdAt:serverTimestamp(),activatedAt:null,...extra};}
function grantCopy(id="hg1",extra={}){return{format:"fidunio-group-history-grant-copy-v1",version:1,groupId:"g1",grantId:id,sourceMessageId:"m1",sourceCreatedAt:m1CreatedAt,grantorUid:A,grantorKeyId:keyA,targetUid:B,targetKeyId:keyB,envelope:{format:"fidunio-group-history-grant-v1",version:1,grantorKeyId:keyA,targetKeyId:keyB,ciphertext:"AAAAAAAAAAAAAAAAAAAAAA",iv:"AAAAAAAAAAAAAAAA"},createdAt:serverTimestamp(),...extra};}
await env.clearFirestore();await seed();
await test("01 member can read group",()=>assertSucceeds(getDoc(doc(dbB,"groups","g1"))));
await test("02 outsider cannot read group",()=>assertFails(getDoc(doc(dbO,"groups","g1"))));
await test("03 plaintext group message denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","plain"),{senderUid:A,state:"sent",text:"never",createdAt:serverTimestamp()})));
await test("04 epoch cannot be created without atomic group advance",()=>assertFails(setDoc(doc(dbA,"groups","g1","epochs","1"),epoch())));
await test("05 admin atomically advances epoch and creates envelopes",async()=>{const b=writeBatch(dbA);b.update(doc(dbA,"groups","g1"),{keyEpoch:1,updatedAt:serverTimestamp()});b.set(doc(dbA,"groups","g1","epochs","1"),epoch());return assertSucceeds(b.commit());});
await test("06 member reads epoch",()=>assertSucceeds(getDoc(doc(dbB,"groups","g1","epochs","1"))));
await test("07 outsider cannot read epoch",()=>assertFails(getDoc(doc(dbO,"groups","g1","epochs","1"))));
await test("08 valid encrypted group message succeeds",async()=>{await assertSucceeds(setDoc(doc(dbA,"groups","g1","messages","m1"),msg()));m1CreatedAt=(await getDoc(doc(dbA,"groups","g1","messages","m1"))).data().createdAt;});
await test("09 disappearing duration allowed as outer metadata",()=>assertSucceeds(setDoc(doc(dbA,"groups","g1","messages","m-disappear"),msg({disappearAfterSeconds:3600}))));
await test("09a zero disappearing duration denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m-disappear-zero"),msg({disappearAfterSeconds:0}))));
await test("09b over-max disappearing duration denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m-disappear-max"),msg({disappearAfterSeconds:31536001}))));
await test("09c non-integer disappearing duration denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m-disappear-float"),msg({disappearAfterSeconds:1.5}))));
await test("10 plaintext field on encrypted message denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m2"),msg({text:"leak"}))));
await test("11 stale epoch message denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m3"),msg({keyEpoch:0}))));
await test("12 sender key mismatch denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m4"),msg({senderKeyId:keyB}))));
await test("13 standalone delivered receipt without parent barrier is denied",()=>assertFails(setDoc(doc(dbB,"groups","g1","messages","m1","receipts",B),{uid:B,state:"delivered",updatedAt:serverTimestamp()})));
await test("13a member atomically writes own delivered receipt and advances parent revision",async()=>{const b=writeBatch(dbB);b.update(doc(dbB,"groups","g1","messages","m1"),{receiptRevision:1});b.set(doc(dbB,"groups","g1","messages","m1","receipts",B),{uid:B,state:"delivered",updatedAt:serverTimestamp()});return assertSucceeds(b.commit());});
await test("14 read transition without readAt is denied",()=>assertFails(setDoc(doc(dbB,"groups","g1","messages","m1","receipts",B),{uid:B,state:"read",updatedAt:serverTimestamp()})));
await test("15 standalone first Read without parent barrier is denied",()=>assertFails(setDoc(doc(dbB,"groups","g1","messages","m1","receipts",B),{uid:B,state:"read",updatedAt:serverTimestamp(),readAt:serverTimestamp()})));
await test("15a member first Read atomically stores server-backed readAt and advances parent revision",async()=>{const b=writeBatch(dbB);b.update(doc(dbB,"groups","g1","messages","m1"),{receiptRevision:2});b.set(doc(dbB,"groups","g1","messages","m1","receipts",B),{uid:B,state:"read",updatedAt:serverTimestamp(),readAt:serverTimestamp()});return assertSucceeds(b.commit());});
await test("16 repeat Read cannot move first-read timestamp",()=>assertFails(setDoc(doc(dbB,"groups","g1","messages","m1","receipts",B),{uid:B,state:"read",updatedAt:serverTimestamp(),readAt:serverTimestamp()})));
await test("17 member cannot write another account receipt",()=>assertFails(setDoc(doc(dbB,"groups","g1","messages","m1","receipts",A),{uid:A,state:"read",updatedAt:serverTimestamp(),readAt:serverTimestamp()})));
await test("18 outsider cannot write receipt",()=>assertFails(setDoc(doc(dbO,"groups","g1","messages","m1","receipts",OUT),{uid:OUT,state:"read",updatedAt:serverTimestamp(),readAt:serverTimestamp()})));

await test("19 membership change without matching epoch denied",async()=>{const b=writeBatch(dbA);b.update(doc(dbA,"groups","g1"),{memberUids:[A],keyEpoch:2,updatedAt:serverTimestamp()});b.delete(doc(dbA,"groups","g1","members",B));return assertFails(b.commit());});
await test("20 admin atomic removal plus new epoch succeeds",async()=>{const e2={...epoch(),keyEpoch:2,memberKeyIds:{[A]:keyA},envelopes:{[A]:{senderKeyId:keyA,recipientKeyId:keyA,ciphertext:"CCCCCCCCCCCCCCCCCCCCCC",iv:"CCCCCCCCCCCCCCCC"}}};const b=writeBatch(dbA);b.update(doc(dbA,"groups","g1"),{memberUids:[A],adminUids:[A],keyEpoch:2,updatedAt:serverTimestamp()});b.delete(doc(dbA,"groups","g1","members",B));b.set(doc(dbA,"groups","g1","epochs","2"),e2);return assertSucceeds(b.commit());});
await test("21 removed member cannot read new epoch",()=>assertFails(getDoc(doc(dbB,"groups","g1","epochs","2"))));

await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();const g=await getDoc(doc(db,"groups","g1"));await setDoc(doc(db,"groups","g1"),{...g.data(),memberUids:[A,B],adminUids:[A],updatedAt:new Date()});await setDoc(doc(db,"groups","g1","members",B),{uid:B,displayName:B,role:"member",joinedAt:new Date(),historyFrom:new Date(),addedByUid:A,active:true});});
await test("22 non-admin cannot create history grant",()=>assertFails(setDoc(doc(dbB,"groups","g1","historyGrants","hg0"),{...grant("hg0"),grantorUid:B,grantorKeyId:keyB,targetUid:A,targetKeyId:keyA})));
await test("23 admin cannot grant history to outsider",()=>assertFails(setDoc(doc(dbA,"groups","g1","historyGrants","hg-out"),grant("hg-out",{targetUid:OUT,targetKeyId:"missing"}))));
await test("24 timestamp grant cannot start before requested boundary",()=>assertFails(setDoc(doc(dbA,"groups","g1","historyGrants","hg-late"),grant("hg-late",{boundaryKind:"timestamp",boundaryAt:new Date(m1CreatedAt.toMillis()+60000)}))));
await test("25a admin history grant without basis-visible group touch denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","historyGrants","hg-no-barrier"),grant("hg-no-barrier"))));
await test("25 admin creates building beginning grant with group barrier",async()=>{const b=writeBatch(dbA);b.update(doc(dbA,"groups","g1"),{updatedAt:serverTimestamp()});b.set(doc(dbA,"groups","g1","historyGrants","hg1"),grant());return assertSucceeds(b.commit());});
await test("26 target cannot read building grant",()=>assertFails(getDoc(doc(dbB,"groups","g1","historyGrants","hg1"))));
await test("27a standalone history copy without basis-visible group touch denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","historyGrants","hg1","messages","m1"),grantCopy())));
await test("27 admin writes bounded history copy with group barrier while building",async()=>{const b=writeBatch(dbA);b.update(doc(dbA,"groups","g1"),{updatedAt:serverTimestamp()});b.set(doc(dbA,"groups","g1","historyGrants","hg1","messages","m1"),grantCopy());return assertSucceeds(b.commit());});
await test("28 target cannot read copy before activation",()=>assertFails(getDoc(doc(dbB,"groups","g1","historyGrants","hg1","messages","m1"))));
await test("29 grantor activates completed grant metadata",async()=>{const before=await getDoc(doc(dbA,"groups","g1","historyGrants","hg1"));return assertSucceeds(setDoc(doc(dbA,"groups","g1","historyGrants","hg1"),{...before.data(),status:"active",activatedAt:serverTimestamp()}));});
await test("30 target reads active grant",()=>assertSucceeds(getDoc(doc(dbB,"groups","g1","historyGrants","hg1"))));
await test("31 target reads active granted message copy",()=>assertSucceeds(getDoc(doc(dbB,"groups","g1","historyGrants","hg1","messages","m1"))));
await test("32 outsider cannot read active history grant",()=>assertFails(getDoc(doc(dbO,"groups","g1","historyGrants","hg1"))));

const failed=results.filter(([,ok])=>!ok);console.log(`\n${results.length-failed.length}/${results.length} group E2EE assertions passed.`);await env.cleanup();if(failed.length)process.exitCode=1;
