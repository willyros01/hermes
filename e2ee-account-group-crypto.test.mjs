import { webcrypto } from "node:crypto";
globalThis.crypto=webcrypto;
if(!globalThis.btoa)globalThis.btoa=s=>Buffer.from(s,"binary").toString("base64");
if(!globalThis.atob)globalThis.atob=s=>Buffer.from(s,"base64").toString("binary");
import {createGroupEpoch,unwrapGroupEpoch,encryptAccountGroupMessage,decryptAccountGroupMessage} from "./e2ee-account-group-crypto.js";

async function identity(uid,keyId){const pair=await crypto.subtle.generateKey({name:"ECDH",namedCurve:"P-256"},true,["deriveBits"]);const pub=await crypto.subtle.exportKey("jwk",pair.publicKey);return{uid,keyId,privateKey:pair.privateKey,publicJwk:{kty:pub.kty,crv:pub.crv,x:pub.x,y:pub.y}};}
function ok(v,m){if(!v)throw new Error(m);}
async function rejects(fn,m){let failed=false;try{await fn();}catch{failed=true;}ok(failed,m);}
const A=await identity("A","account-key-owner-A-0001"),B=await identity("B","account-key-member-B-0001");
const epoch=await createGroupEpoch({groupId:"g1",keyEpoch:1,creatorUid:A.uid,creatorKeyId:A.keyId,creatorPrivateKey:A.privateKey,members:[{uid:A.uid,keyId:A.keyId,publicJwk:A.publicJwk},{uid:B.uid,keyId:B.keyId,publicJwk:B.publicJwk}]});
ok(epoch.record.format==="fidunio-group-key-v1","epoch format");ok(Object.keys(epoch.record.envelopes).length===2,"member envelopes");
const keyB=await unwrapGroupEpoch({record:epoch.record,uid:B.uid,keyId:B.keyId,privateKey:B.privateKey,creatorPublicJwk:A.publicJwk});
const envelope=await encryptAccountGroupMessage({text:"encrypted hello",groupId:"g1",messageId:"m1",keyEpoch:1,senderUid:A.uid,senderKeyId:A.keyId,epochKey:epoch.runtimeKey});
ok(envelope.e2ee===4&&envelope.groupFormat==="fidunio-group-message-v1","message format");
const plain=await decryptAccountGroupMessage({envelope,groupId:"g1",messageId:"m1",senderUid:A.uid,epochKey:keyB});ok(plain==="encrypted hello","round trip");
await rejects(()=>decryptAccountGroupMessage({envelope,groupId:"g1",messageId:"wrong",senderUid:A.uid,epochKey:keyB}),"AAD must bind message id");
await rejects(()=>unwrapGroupEpoch({record:epoch.record,uid:B.uid,keyId:"wrong-key-id-0000",privateKey:B.privateKey,creatorPublicJwk:A.publicJwk}),"recipient keyId binding");
const tampered={...envelope,ciphertext:envelope.ciphertext.slice(0,-1)+(envelope.ciphertext.endsWith("A")?"B":"A")};
await rejects(()=>decryptAccountGroupMessage({envelope:tampered,groupId:"g1",messageId:"m1",senderUid:A.uid,epochKey:keyB}),"ciphertext authentication");
console.log("6/6 group E2EE crypto assertions passed.");
