const FORMAT="fidunio-portable-account-vault";
const SCHEMA_VERSION=1;
export const MAX_ACCOUNT_VAULT_BYTES=25*1024*1024;

function bytesToB64(bytes){let raw="";for(const b of bytes)raw+=String.fromCharCode(b);return btoa(raw).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");}
function b64ToBytes(value){const text=String(value||"");if(!/^[A-Za-z0-9_-]+$/.test(text))throw new Error("FIDUNIO Vault contains invalid encrypted data.");const raw=atob(text.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-text.length%4)%4));return Uint8Array.from(raw,c=>c.charCodeAt(0));}
function utf8(value){return new TextEncoder().encode(String(value));}
function clean(value,label,max=256){const text=String(value||"").trim();if(!text||text.length>max)throw new Error(`FIDUNIO Vault ${label} is invalid.`);return text;}
function metadata({uid,keyId,identityRevision,createdAt,salt}){return{format:FORMAT,schemaVersion:SCHEMA_VERSION,uid:clean(uid,"account"),keyId:clean(keyId,"key"),identityRevision:Number(identityRevision),createdAt:Number(createdAt),kdf:"HKDF-SHA256",wrappingAlgorithm:"AES-256-GCM",payloadAlgorithm:"AES-256-GCM",salt:bytesToB64(salt)};}
function aad(meta,purpose){return utf8(JSON.stringify({format:meta.format,schemaVersion:meta.schemaVersion,uid:meta.uid,keyId:meta.keyId,identityRevision:meta.identityRevision,createdAt:meta.createdAt,purpose}));}
function validateMetadata(value){
  if(!value||value.format!==FORMAT||value.schemaVersion!==SCHEMA_VERSION)throw new Error("This is not a supported FIDUNIO Vault file.");
  const uid=clean(value.uid,"account"),keyId=clean(value.keyId,"key"),identityRevision=Number(value.identityRevision),createdAt=Number(value.createdAt);
  if(!Number.isSafeInteger(identityRevision)||identityRevision<1||!Number.isFinite(createdAt)||createdAt<=0)throw new Error("FIDUNIO Vault identity metadata is invalid.");
  if(value.kdf!=="HKDF-SHA256"||value.wrappingAlgorithm!=="AES-256-GCM"||value.payloadAlgorithm!=="AES-256-GCM")throw new Error("FIDUNIO Vault cryptography is unsupported.");
  const salt=b64ToBytes(value.salt);if(salt.length!==16)throw new Error("FIDUNIO Vault salt is invalid.");
  return{...value,uid,keyId,identityRevision,createdAt,salt};
}
async function deriveWrappingKey(recoveryUnlockKey,meta){
  const ruk=recoveryUnlockKey instanceof Uint8Array?recoveryUnlockKey:new Uint8Array(recoveryUnlockKey||[]);if(ruk.length!==32)throw new Error("FIDUNIO recovery authority is invalid.");
  const material=await crypto.subtle.importKey("raw",ruk,{name:"HKDF"},false,["deriveKey"]);
  const salt=meta.salt instanceof Uint8Array?meta.salt:b64ToBytes(meta.salt);
  return crypto.subtle.deriveKey({name:"HKDF",hash:"SHA-256",salt,info:utf8(`fidunio-vault-v1:${meta.uid}:${meta.keyId}`)},material,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
function validatePayload(value,meta){
  if(!value||value.schemaVersion!==1||value.uid!==meta.uid||value.keyId!==meta.keyId||Number(value.identityRevision)!==meta.identityRevision)throw new Error("FIDUNIO Vault payload binding is invalid.");
  if(!value.appState||typeof value.appState!=="object"||!Array.isArray(value.history)||!Array.isArray(value.outbox))throw new Error("FIDUNIO Vault payload is incomplete.");
  if(value.history.length>10000||value.outbox.length>5000)throw new Error("FIDUNIO Vault exceeds safe record limits.");
  return value;
}

export async function sealAccountVault({uid,keyId,identityRevision,payload,recoveryUnlockKey,createdAt=Date.now()}={}){
  const salt=crypto.getRandomValues(new Uint8Array(16)),meta=metadata({uid,keyId,identityRevision,createdAt,salt});
  if(!Number.isSafeInteger(meta.identityRevision)||meta.identityRevision<1)throw new Error("Account identity revision is invalid.");
  const normalized=validatePayload({...payload,schemaVersion:1,uid:meta.uid,keyId:meta.keyId,identityRevision:meta.identityRevision},meta);
  const vaultKeyBytes=crypto.getRandomValues(new Uint8Array(32));
  try{
    const wrappingKey=await deriveWrappingKey(recoveryUnlockKey,meta),vaultKey=await crypto.subtle.importKey("raw",vaultKeyBytes,{name:"AES-GCM"},false,["encrypt","decrypt"]);
    const keyIv=crypto.getRandomValues(new Uint8Array(12)),payloadIv=crypto.getRandomValues(new Uint8Array(12));
    const wrappedKey=await crypto.subtle.encrypt({name:"AES-GCM",iv:keyIv,additionalData:aad(meta,"vault-key")},wrappingKey,vaultKeyBytes);
    const ciphertext=await crypto.subtle.encrypt({name:"AES-GCM",iv:payloadIv,additionalData:aad(meta,"payload")},vaultKey,utf8(JSON.stringify(normalized)));
    const envelope={...meta,salt:bytesToB64(salt),keyIv:bytesToB64(keyIv),wrappedKey:bytesToB64(new Uint8Array(wrappedKey)),payloadIv:bytesToB64(payloadIv),ciphertext:bytesToB64(new Uint8Array(ciphertext))};
    const serialized=JSON.stringify(envelope);if(utf8(serialized).byteLength>MAX_ACCOUNT_VAULT_BYTES)throw new Error("FIDUNIO Vault is too large to save safely.");return serialized;
  }finally{vaultKeyBytes.fill(0);}
}

export async function openAccountVault({serialized,expectedUid,expectedKeyId,currentIdentityRevision,recoveryUnlockKey}={}){
  const text=String(serialized||"");if(!text||utf8(text).byteLength>MAX_ACCOUNT_VAULT_BYTES)throw new Error("FIDUNIO Vault file is empty or too large.");
  let raw;try{raw=JSON.parse(text);}catch{throw new Error("FIDUNIO Vault file is corrupt or truncated.");}
  const meta=validateMetadata(raw);if(meta.uid!==clean(expectedUid,"account"))throw new Error("This FIDUNIO Vault belongs to another account.");if(meta.keyId!==clean(expectedKeyId,"key"))throw new Error("This FIDUNIO Vault belongs to a different encryption identity.");
  const current=Number(currentIdentityRevision);if(!Number.isSafeInteger(current)||current<1||meta.identityRevision>current)throw new Error("This FIDUNIO Vault has a newer unverified identity revision.");
  const keyIv=b64ToBytes(raw.keyIv),payloadIv=b64ToBytes(raw.payloadIv),wrappedKey=b64ToBytes(raw.wrappedKey),ciphertext=b64ToBytes(raw.ciphertext);if(keyIv.length!==12||payloadIv.length!==12||wrappedKey.length<32||ciphertext.length<16)throw new Error("FIDUNIO Vault encrypted fields are invalid.");
  try{
    const wrappingKey=await deriveWrappingKey(recoveryUnlockKey,meta),vaultKeyBytes=new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:keyIv,additionalData:aad(meta,"vault-key")},wrappingKey,wrappedKey));
    try{const vaultKey=await crypto.subtle.importKey("raw",vaultKeyBytes,{name:"AES-GCM"},false,["decrypt"]);const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:payloadIv,additionalData:aad(meta,"payload")},vaultKey,ciphertext);return{metadata:{uid:meta.uid,keyId:meta.keyId,identityRevision:meta.identityRevision,createdAt:meta.createdAt},payload:validatePayload(JSON.parse(new TextDecoder().decode(plain)),meta)};}finally{vaultKeyBytes.fill(0);}
  }catch(error){if(/newer|another account|different encryption/.test(String(error?.message||"")))throw error;throw new Error("FIDUNIO Vault could not be authenticated. The file, account, or PIN may not match.");}
}
