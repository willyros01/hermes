import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
if(!globalThis.crypto)globalThis.crypto=webcrypto;
if(!globalThis.btoa)globalThis.btoa=value=>Buffer.from(value,"binary").toString("base64");
if(!globalThis.atob)globalThis.atob=value=>Buffer.from(value,"base64").toString("binary");
import {sealAccountVault,openAccountVault,MAX_ACCOUNT_VAULT_BYTES} from "./account-vault-format.js";
import {reconcileAccountVaultPayload} from "./account-vault-reconciliation.js";
import {activateVerifiedAccountVault} from "./account-vault-activation.js";

const uid="account-a",keyId="key-a",identityRevision=7,ruk=crypto.getRandomValues(new Uint8Array(32));
const payload={appState:{conversations:[{id:"direct-1",type:"direct",cloud:true},{id:"group-1",type:"group",cloud:true}],messages:{"direct-1":[{id:"kept",serverBacked:true,state:"read"},{id:"deleted",serverBacked:true,state:"read"},{id:"attempted",mine:true,state:"queued"}],"group-1":[{id:"group-kept",serverBacked:true,state:"read"}]},selectedId:"direct-1"},history:[{conversationId:"direct-1",messages:[{id:"kept"},{id:"deleted"}]},{conversationId:"group-1",messages:[{id:"group-kept"}]}],outbox:[{id:"accepted",messageId:"accepted",conversationId:"direct-1",payload:{text:"already there"},sendAttempted:true},{id:"attempted",messageId:"attempted",conversationId:"direct-1",payload:{text:"ambiguous"},sendAttempted:true},{id:"fresh",messageId:"fresh",conversationId:"direct-1",payload:{text:"unsent"},sendAttempted:false}]};
const sealed=await sealAccountVault({uid,keyId,identityRevision,payload,recoveryUnlockKey:ruk,createdAt:1700000000000});
const opened=await openAccountVault({serialized:sealed,expectedUid:uid,expectedKeyId:keyId,currentIdentityRevision:8,recoveryUnlockKey:ruk});
assert.equal(opened.payload.uid,uid);assert.equal(opened.payload.keyId,keyId);assert.equal(opened.metadata.identityRevision,7);
await assert.rejects(()=>openAccountVault({serialized:sealed,expectedUid:"other",expectedKeyId:keyId,currentIdentityRevision:8,recoveryUnlockKey:ruk}),/another account/);
await assert.rejects(()=>openAccountVault({serialized:sealed,expectedUid:uid,expectedKeyId:"other",currentIdentityRevision:8,recoveryUnlockKey:ruk}),/different encryption identity/);
await assert.rejects(()=>openAccountVault({serialized:sealed,expectedUid:uid,expectedKeyId:keyId,currentIdentityRevision:6,recoveryUnlockKey:ruk}),/newer unverified identity revision/);
const wrong=crypto.getRandomValues(new Uint8Array(32));await assert.rejects(()=>openAccountVault({serialized:sealed,expectedUid:uid,expectedKeyId:keyId,currentIdentityRevision:8,recoveryUnlockKey:wrong}),/could not be authenticated/);
const tampered=JSON.parse(sealed);tampered.ciphertext=tampered.ciphertext.slice(0,-2)+(tampered.ciphertext.endsWith("AA")?"BB":"AA");await assert.rejects(()=>openAccountVault({serialized:JSON.stringify(tampered),expectedUid:uid,expectedKeyId:keyId,currentIdentityRevision:8,recoveryUnlockKey:ruk}),/could not be authenticated/);
await assert.rejects(()=>openAccountVault({serialized:"{",expectedUid:uid,expectedKeyId:keyId,currentIdentityRevision:8,recoveryUnlockKey:ruk}),/corrupt or truncated/);
await assert.rejects(()=>openAccountVault({serialized:"x".repeat(MAX_ACCOUNT_VAULT_BYTES+1),expectedUid:uid,expectedKeyId:keyId,currentIdentityRevision:8,recoveryUnlockKey:ruk}),/empty or too large/);

const reconciled=await reconcileAccountVaultPayload({payload:opened.payload,readDirectIds:async()=>["kept","accepted"],readGroupIds:async()=>["group-kept"]});
assert.deepEqual(reconciled.appState.messages["direct-1"].map(x=>x.id),["kept","attempted"]);assert.deepEqual(reconciled.history[0].messages.map(x=>x.id),["kept"]);
assert.deepEqual(reconciled.outbox.map(x=>x.id),["attempted","fresh"]);assert.equal(reconciled.appState.messages["direct-1"].find(x=>x.id==="attempted").state,"failed");
const denied=await reconcileAccountVaultPayload({payload:opened.payload,readDirectIds:async()=>{throw new Error("denied")},readGroupIds:async()=>["group-kept"]});assert.equal(denied.appState.conversations.some(x=>x.id==="direct-1"),false);assert.equal(denied.outbox.length,0);
let live={value:"before"},transition=null;await activateVerifiedAccountVault({candidate:{value:"candidate"},readBefore:async()=>structuredClone(live),writeCandidate:async(value,before)=>{transition=before;live=structuredClone(value);},verifyCandidate:async()=>assert.equal(live.value,"candidate"),commitCandidate:async()=>{transition=null;},restoreBefore:async before=>{live=structuredClone(before);transition=null;}});assert.equal(live.value,"candidate");assert.equal(transition,null);
live={value:"before"};transition=null;await assert.rejects(()=>activateVerifiedAccountVault({candidate:{value:"bad"},readBefore:async()=>structuredClone(live),writeCandidate:async(value,before)=>{transition=before;live=structuredClone(value);},verifyCandidate:async()=>{throw new Error("reread failed")},commitCandidate:async()=>{transition=null;},restoreBefore:async before=>{live=structuredClone(before);transition=null;}}),/previous installation was restored/);assert.equal(live.value,"before");assert.equal(transition,null);
console.log("Portable FIDUNIO Vault cryptography, binding, tamper rejection, cloud reconciliation, deletion convergence, and Outbox replay barriers pass");
