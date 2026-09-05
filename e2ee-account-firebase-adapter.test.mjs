import fs from "node:fs";
import { createFirebaseAccountE2EEIdentityStore } from "./e2ee-account-firebase-adapter.js";

const rows=[];
async function test(name,fn){try{await fn();rows.push([name,true]);console.log("PASS",name);}catch(e){rows.push([name,false]);console.error("FAIL",name,e?.message||e);}}
async function expectFail(name,fn){await test(name,async()=>{let failed=false;try{await fn();}catch{failed=true;}if(!failed)throw new Error("unexpected success");});}

const calls=[];
const fakeApi={
  async readCloudAccountE2EEIdentity(uid){calls.push(["read",uid]);return{keyId:"k1",revision:3};},
  async createCloudAccountE2EEIdentity(uid,privateIdentity,publicIdentity){calls.push(["create",uid,privateIdentity,publicIdentity]);return{revision:1};},
  async updateCloudAccountE2EENormalWrapper(uid,keyId,expectedRevision,normalWrapper){calls.push(["update",uid,keyId,expectedRevision,normalWrapper]);return{revision:expectedRevision+1};}
};
const store=createFirebaseAccountE2EEIdentityStore(fakeApi);

await test("adapter exposes only identity-store operations",()=>{const keys=Object.keys(store).sort().join(",");if(keys!=="createIdentity,readIdentity,updateNormalWrapper")throw new Error(keys);});
await test("readIdentity delegates exact uid",async()=>{const r=await store.readIdentity("u1");if(r.keyId!=="k1"||calls.at(-1)[1]!=="u1")throw new Error("bad read delegation");});
await test("createIdentity delegates private and public records unchanged",async()=>{const priv={keyId:"k1"},pub={uid:"u1",keyId:"k1"};const r=await store.createIdentity({uid:"u1",privateIdentity:priv,publicIdentity:pub});const c=calls.at(-1);if(r.revision!==1||c[0]!=="create"||c[1]!=="u1"||c[2]!==priv||c[3]!==pub)throw new Error("bad create delegation");});
await test("updateNormalWrapper delegates keyId and expected revision",async()=>{const wrapper={version:1};const r=await store.updateNormalWrapper({uid:"u1",keyId:"k1",expectedRevision:7,normalWrapper:wrapper});const c=calls.at(-1);if(r.revision!==8||c[0]!=="update"||c[1]!=="u1"||c[2]!=="k1"||c[3]!==7||c[4]!==wrapper)throw new Error("bad update delegation");});
await expectFail("missing read API rejected",()=>Promise.resolve(createFirebaseAccountE2EEIdentityStore({...fakeApi,readCloudAccountE2EEIdentity:null})));
await expectFail("missing create API rejected",()=>Promise.resolve(createFirebaseAccountE2EEIdentityStore({...fakeApi,createCloudAccountE2EEIdentity:null})));
await expectFail("missing update API rejected",()=>Promise.resolve(createFirebaseAccountE2EEIdentityStore({...fakeApi,updateCloudAccountE2EENormalWrapper:null})));
await test("adapter module does not initialize Firebase",()=>{const src=fs.readFileSync("e2ee-account-firebase-adapter.js","utf8");if(/initializeApp\s*\(/.test(src)||/getFirestore\s*\(/.test(src))throw new Error("independent Firebase initialization found");});
await test("central firebase.js exports required bounded API",()=>{const src=fs.readFileSync("firebase.js","utf8");for(const name of ["readCloudAccountE2EEIdentity","createCloudAccountE2EEIdentity","updateCloudAccountE2EENormalWrapper","getCloudAccountE2EEPublicKey"]){if(!src.includes(`export async function ${name}`))throw new Error(`missing ${name}`);}});
await test("central create path uses one Firestore transaction",()=>{const src=fs.readFileSync("firebase.js","utf8");const start=src.indexOf("export async function createCloudAccountE2EEIdentity");const end=src.indexOf("export async function updateCloudAccountE2EENormalWrapper",start);const section=src.slice(start,end);if(!section.includes("runTransaction")||!section.includes('"users",uid,"e2ee","identity"')||!section.includes('"e2eePublicKeys",uid'))throw new Error("atomic central create contract missing");});
await test("central normal update compares keyId and revision",()=>{const src=fs.readFileSync("firebase.js","utf8");const start=src.indexOf("export async function updateCloudAccountE2EENormalWrapper");const end=src.indexOf("export async function getCloudAccountE2EEPublicKey",start);const section=src.slice(start,end);if(!section.includes("current.keyId!==keyId")||!section.includes("current.revision!==expectedRevision")||!section.includes("revision:expectedRevision+1"))throw new Error("compare/update contract missing");});

const failed=rows.filter(([,ok])=>!ok);console.log(`\n${rows.length-failed.length}/${rows.length} Firebase adapter contract assertions passed.`);if(failed.length)process.exitCode=1;
