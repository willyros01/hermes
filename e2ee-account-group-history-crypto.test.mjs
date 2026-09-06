import {webcrypto} from "node:crypto";
if(!globalThis.crypto)Object.defineProperty(globalThis,"crypto",{value:webcrypto,configurable:true});
if(!globalThis.btoa)globalThis.btoa=s=>Buffer.from(s,"binary").toString("base64");
if(!globalThis.atob)globalThis.atob=s=>Buffer.from(s,"base64").toString("binary");
import {encryptGroupHistoryGrantMessage,decryptGroupHistoryGrantMessage,GROUP_HISTORY_GRANT_FORMAT} from "./e2ee-account-group-history-crypto.js";
async function identity(uid,keyId){const pair=await crypto.subtle.generateKey({name:"ECDH",namedCurve:"P-256"},true,["deriveBits"]);const p=await crypto.subtle.exportKey("jwk",pair.publicKey);return{uid,keyId,privateKey:pair.privateKey,publicJwk:{kty:p.kty,crv:p.crv,x:p.x,y:p.y}};}
function ok(v,m){if(!v)throw new Error(m);}async function rejects(fn,m){let x=false;try{await fn();}catch{x=true;}ok(x,m);}
const A=await identity("admin","account-key-admin-0001"),B=await identity("member","account-key-member-0001"),C=await identity("other","account-key-other-0001");
const base={text:"history after chosen boundary",groupId:"g1",grantId:"grant-member-1",sourceMessageId:"m42",grantorUid:A.uid,grantorKeyId:A.keyId,grantorPrivateKey:A.privateKey,targetUid:B.uid,targetKeyId:B.keyId,targetPublicJwk:B.publicJwk};
const envelope=await encryptGroupHistoryGrantMessage(base);ok(envelope.format===GROUP_HISTORY_GRANT_FORMAT,"format");ok(!("text" in envelope),"no plaintext in envelope");
const plain=await decryptGroupHistoryGrantMessage({envelope,groupId:base.groupId,grantId:base.grantId,sourceMessageId:base.sourceMessageId,grantorUid:A.uid,grantorKeyId:A.keyId,targetUid:B.uid,targetKeyId:B.keyId,targetPrivateKey:B.privateKey,grantorPublicJwk:A.publicJwk});ok(plain===base.text,"round trip");
await rejects(()=>decryptGroupHistoryGrantMessage({envelope,groupId:"g1",grantId:base.grantId,sourceMessageId:"m41",grantorUid:A.uid,grantorKeyId:A.keyId,targetUid:B.uid,targetKeyId:B.keyId,targetPrivateKey:B.privateKey,grantorPublicJwk:A.publicJwk}),"source message boundary binding");
await rejects(()=>decryptGroupHistoryGrantMessage({envelope,groupId:"g1",grantId:"other-grant",sourceMessageId:base.sourceMessageId,grantorUid:A.uid,grantorKeyId:A.keyId,targetUid:B.uid,targetKeyId:B.keyId,targetPrivateKey:B.privateKey,grantorPublicJwk:A.publicJwk}),"grant binding");
await rejects(()=>decryptGroupHistoryGrantMessage({envelope,groupId:"g1",grantId:base.grantId,sourceMessageId:base.sourceMessageId,grantorUid:A.uid,grantorKeyId:A.keyId,targetUid:B.uid,targetKeyId:B.keyId,targetPrivateKey:C.privateKey,grantorPublicJwk:A.publicJwk}),"wrong target private key");
const tampered={...envelope,ciphertext:envelope.ciphertext.slice(0,-1)+(envelope.ciphertext.endsWith("A")?"B":"A")};await rejects(()=>decryptGroupHistoryGrantMessage({envelope:tampered,groupId:"g1",grantId:base.grantId,sourceMessageId:base.sourceMessageId,grantorUid:A.uid,grantorKeyId:A.keyId,targetUid:B.uid,targetKeyId:B.keyId,targetPrivateKey:B.privateKey,grantorPublicJwk:A.publicJwk}),"ciphertext authentication");
await rejects(()=>encryptGroupHistoryGrantMessage({...base,targetUid:A.uid,targetKeyId:A.keyId,targetPublicJwk:A.publicJwk}),"self grant rejected");
console.log("8/8 group history grant crypto assertions passed.");
