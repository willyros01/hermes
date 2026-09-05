import assert from "node:assert/strict";
import {createAccountDirectMessageService} from "./e2ee-account-message-service.js";
import {encryptAccountDirectMessage} from "./e2ee-account-message-crypto.js";

async function identity(uid,keyId){
  const pair=await crypto.subtle.generateKey({name:"ECDH",namedCurve:"P-256"},true,["deriveBits"]);
  const publicRaw=await crypto.subtle.exportKey("jwk",pair.publicKey);
  const pkcs8=await crypto.subtle.exportKey("pkcs8",pair.privateKey);
  const privateKey=await crypto.subtle.importKey("pkcs8",pkcs8,{name:"ECDH",namedCurve:"P-256"},false,["deriveBits"]);
  const publicJwk={kty:publicRaw.kty,crv:publicRaw.crv,x:publicRaw.x,y:publicRaw.y};
  return{uid,keyId,privateKey,publicJwk,publicRecord:{uid,schemaVersion:1,identityVersion:1,keyId,keyAlgorithm:"ECDH-P256",publicJwk,state:"ACTIVE"}};
}
async function expectCode(code,fn){let error=null;try{await fn();}catch(caught){error=caught;}assert.ok(error,`Expected ${code}`);assert.equal(error.code,code);}
const alice=await identity("uid-alice","account-key-alice-0001");
const bob=await identity("uid-bob","account-key-bob-00001");
let runtime={uid:alice.uid,keyId:alice.keyId,privateKey:alice.privateKey};
let records=new Map([[alice.uid,alice.publicRecord],[bob.uid,bob.publicRecord]]);
const service=createAccountDirectMessageService({getRuntimeIdentity:()=>runtime,getPublicIdentity:async uid=>records.get(uid)||null});
let passed=0;
async function test(name,fn){await fn();passed++;console.log(`PASS ${passed}: ${name}`);}
const base={uid:alice.uid,peerUid:bob.uid,conversationId:"dm_uid-alice_uid-bob",messageId:"msg-1"};

await test("READY account prepares exact v3 envelope",async()=>{const env=await service.prepareOutgoing({...base,text:"hello"});assert.deepEqual(Object.keys(env).sort(),["ciphertext","e2ee","iv","kdfVersion","recipientKeyId","senderKeyId"].sort());assert.equal(env.senderKeyId,alice.keyId);assert.equal(env.recipientKeyId,bob.keyId);assert.equal(env.e2ee,3);});
await test("incoming v3 decrypts with account identities",async()=>{const row=await encryptAccountDirectMessage({text:"from bob",conversationId:base.conversationId,messageId:"msg-bob",senderUid:bob.uid,recipientUid:alice.uid,senderKeyId:bob.keyId,recipientKeyId:alice.keyId,senderPrivateKey:bob.privateKey,recipientPublicJwk:alice.publicJwk});assert.equal(await service.decryptIncoming({...base,messageId:"msg-bob",row}),"from bob");});
await test("missing runtime identity fails closed",async()=>{const saved=runtime;runtime=null;await expectCode("ACCOUNT_E2EE_NOT_READY",()=>service.prepareOutgoing({...base,text:"x"}));runtime=saved;});
await test("runtime for another UID fails closed",async()=>{const saved=runtime;runtime={uid:bob.uid,keyId:bob.keyId,privateKey:bob.privateKey};await expectCode("ACCOUNT_E2EE_NOT_READY",()=>service.prepareOutgoing({...base,text:"x"}));runtime=saved;});
await test("missing peer identity fails closed",async()=>{const saved=records;records=new Map([[alice.uid,alice.publicRecord]]);await expectCode("PEER_IDENTITY_UNAVAILABLE",()=>service.prepareOutgoing({...base,text:"x"}));records=saved;});
await test("peer UID mismatch is rejected",async()=>{const saved=records;records=new Map([[bob.uid,{...bob.publicRecord,uid:"uid-other"}]]);await expectCode("PEER_IDENTITY_INVALID",()=>service.prepareOutgoing({...base,text:"x"}));records=saved;});
await test("peer public JWK with extra field is rejected",async()=>{const saved=records;records=new Map([[bob.uid,{...bob.publicRecord,publicJwk:{...bob.publicJwk,ext:true}}]]);await expectCode("PEER_IDENTITY_INVALID",()=>service.prepareOutgoing({...base,text:"x"}));records=saved;});
await test("inactive peer identity is rejected",async()=>{const saved=records;records=new Map([[bob.uid,{...bob.publicRecord,state:"REVOKED"}]]);await expectCode("PEER_IDENTITY_INVALID",()=>service.prepareOutgoing({...base,text:"x"}));records=saved;});
await test("non-v3 incoming format is never silently downgraded",()=>expectCode("UNSUPPORTED_MESSAGE_FORMAT",()=>service.decryptIncoming({...base,row:{e2ee:2}})));
await test("service never calls peer lookup when local account is not READY",async()=>{let calls=0;const failClosed=createAccountDirectMessageService({getRuntimeIdentity:()=>null,getPublicIdentity:async()=>{calls++;return bob.publicRecord;}});await expectCode("ACCOUNT_E2EE_NOT_READY",()=>failClosed.prepareOutgoing({...base,text:"x"}));assert.equal(calls,0);});

assert.equal(passed,10);
console.log(`${passed}/10 account direct-message service assertions passed.`);
