import assert from "node:assert/strict";
import {ACCOUNT_DM_E2EE_VERSION,ACCOUNT_DM_KDF_VERSION,encryptAccountDirectMessage,decryptAccountDirectMessage} from "./e2ee-account-message-crypto.js";

async function identity(uid,keyId){
  const pair=await crypto.subtle.generateKey({name:"ECDH",namedCurve:"P-256"},true,["deriveBits"]);
  const publicRaw=await crypto.subtle.exportKey("jwk",pair.publicKey);
  const pkcs8=await crypto.subtle.exportKey("pkcs8",pair.privateKey);
  const privateKey=await crypto.subtle.importKey("pkcs8",pkcs8,{name:"ECDH",namedCurve:"P-256"},false,["deriveBits"]);
  return{uid,keyId,privateKey,publicJwk:{kty:publicRaw.kty,crv:publicRaw.crv,x:publicRaw.x,y:publicRaw.y}};
}
function flip(text){const chars=text.split("");chars[chars.length-1]=chars[chars.length-1]==="A"?"B":"A";return chars.join("");}
async function expectCode(code,fn){let caught=null;try{await fn();}catch(error){caught=error;}assert.ok(caught,`Expected ${code}`);assert.equal(caught.code,code);}

const alice=await identity("uid-alice","key-alice-v1");
const bob=await identity("uid-bob","key-bob-v1");
const mallory=await identity("uid-mallory","key-mallory-v1");
const base={conversationId:"dm_uid-alice_uid-bob",messageId:"msg-0001",senderUid:alice.uid,recipientUid:bob.uid,senderKeyId:alice.keyId,recipientKeyId:bob.keyId};

let passed=0;
async function test(name,fn){await fn();passed++;console.log(`PASS ${passed}: ${name}`);}

await test("Alice -> Bob round trip",async()=>{
  const envelope=await encryptAccountDirectMessage({...base,text:"Hello Bob 👋",senderPrivateKey:alice.privateKey,recipientPublicJwk:bob.publicJwk});
  assert.equal(envelope.e2ee,ACCOUNT_DM_E2EE_VERSION);
  assert.equal(envelope.kdfVersion,ACCOUNT_DM_KDF_VERSION);
  assert.equal(await decryptAccountDirectMessage({...base,envelope,recipientPrivateKey:bob.privateKey,senderPublicJwk:alice.publicJwk}),"Hello Bob 👋");
});

await test("Bob -> Alice round trip",async()=>{
  const context={conversationId:base.conversationId,messageId:"msg-0002",senderUid:bob.uid,recipientUid:alice.uid,senderKeyId:bob.keyId,recipientKeyId:alice.keyId};
  const envelope=await encryptAccountDirectMessage({...context,text:"Reply",senderPrivateKey:bob.privateKey,recipientPublicJwk:alice.publicJwk});
  assert.equal(await decryptAccountDirectMessage({...context,envelope,recipientPrivateKey:alice.privateKey,senderPublicJwk:bob.publicJwk}),"Reply");
});

const envelope=await encryptAccountDirectMessage({...base,text:"authenticated payload",senderPrivateKey:alice.privateKey,recipientPublicJwk:bob.publicJwk});

await test("envelope contains no plaintext",async()=>{
  assert.deepEqual(Object.keys(envelope).sort(),["ciphertext","e2ee","iv","kdfVersion","recipientKeyId","senderKeyId"].sort());
  assert.ok(!JSON.stringify(envelope).includes("authenticated payload"));
});
await test("wrong conversation fails authentication",()=>expectCode("DECRYPT_FAILED",()=>decryptAccountDirectMessage({...base,conversationId:"dm-other",envelope,recipientPrivateKey:bob.privateKey,senderPublicJwk:alice.publicJwk})));
await test("wrong message ID fails authentication",()=>expectCode("DECRYPT_FAILED",()=>decryptAccountDirectMessage({...base,messageId:"msg-other",envelope,recipientPrivateKey:bob.privateKey,senderPublicJwk:alice.publicJwk})));
await test("wrong sender UID fails authentication",()=>expectCode("DECRYPT_FAILED",()=>decryptAccountDirectMessage({...base,senderUid:"uid-other",envelope,recipientPrivateKey:bob.privateKey,senderPublicJwk:alice.publicJwk})));
await test("wrong recipient UID fails authentication",()=>expectCode("DECRYPT_FAILED",()=>decryptAccountDirectMessage({...base,recipientUid:"uid-other",envelope,recipientPrivateKey:bob.privateKey,senderPublicJwk:alice.publicJwk})));
await test("wrong sender public key fails authentication",()=>expectCode("DECRYPT_FAILED",()=>decryptAccountDirectMessage({...base,envelope,recipientPrivateKey:bob.privateKey,senderPublicJwk:mallory.publicJwk})));
await test("tampered ciphertext fails authentication",()=>expectCode("DECRYPT_FAILED",()=>decryptAccountDirectMessage({...base,envelope:{...envelope,ciphertext:flip(envelope.ciphertext)},recipientPrivateKey:bob.privateKey,senderPublicJwk:alice.publicJwk})));
await test("tampered IV fails authentication",()=>expectCode("DECRYPT_FAILED",()=>decryptAccountDirectMessage({...base,envelope:{...envelope,iv:flip(envelope.iv)},recipientPrivateKey:bob.privateKey,senderPublicJwk:alice.publicJwk})));
await test("sender keyId substitution is rejected",()=>expectCode("FORMAT_ERROR",()=>decryptAccountDirectMessage({...base,senderKeyId:"key-substitute",envelope,recipientPrivateKey:bob.privateKey,senderPublicJwk:alice.publicJwk})));
await test("recipient keyId substitution is rejected",()=>expectCode("FORMAT_ERROR",()=>decryptAccountDirectMessage({...base,recipientKeyId:"key-substitute",envelope,recipientPrivateKey:bob.privateKey,senderPublicJwk:alice.publicJwk})));
await test("unexpected envelope fields are rejected",()=>expectCode("FORMAT_ERROR",()=>decryptAccountDirectMessage({...base,envelope:{...envelope,text:"leak"},recipientPrivateKey:bob.privateKey,senderPublicJwk:alice.publicJwk})));
await test("malformed base64url is rejected",()=>expectCode("FORMAT_ERROR",()=>decryptAccountDirectMessage({...base,envelope:{...envelope,ciphertext:"not+base64"},recipientPrivateKey:bob.privateKey,senderPublicJwk:alice.publicJwk})));
await test("noncanonical public JWK fields are rejected",()=>expectCode("FORMAT_ERROR",()=>encryptAccountDirectMessage({...base,text:"x",senderPrivateKey:alice.privateKey,recipientPublicJwk:{...bob.publicJwk,ext:true}})));
await test("different peer private key cannot decrypt",()=>expectCode("DECRYPT_FAILED",()=>decryptAccountDirectMessage({...base,envelope,recipientPrivateKey:mallory.privateKey,senderPublicJwk:alice.publicJwk})));
await test("empty plaintext round trips",async()=>{
  const empty=await encryptAccountDirectMessage({...base,messageId:"msg-empty",text:"",senderPrivateKey:alice.privateKey,recipientPublicJwk:bob.publicJwk});
  assert.equal(await decryptAccountDirectMessage({...base,messageId:"msg-empty",envelope:empty,recipientPrivateKey:bob.privateKey,senderPublicJwk:alice.publicJwk}),"");
});
await test("unicode plaintext round trips exactly",async()=>{
  const text="FIDUNIO — café — 你好 — 🔐";
  const unicode=await encryptAccountDirectMessage({...base,messageId:"msg-unicode",text,senderPrivateKey:alice.privateKey,recipientPublicJwk:bob.publicJwk});
  assert.equal(await decryptAccountDirectMessage({...base,messageId:"msg-unicode",envelope:unicode,recipientPrivateKey:bob.privateKey,senderPublicJwk:alice.publicJwk}),text);
});

assert.equal(passed,18);
console.log(`${passed}/18 account direct-message crypto assertions passed.`);
