import {sealAccountVault,openAccountVault,MAX_ACCOUNT_VAULT_BYTES} from "./account-vault-format.js";
import {withAccountVaultRecoveryAuthority} from "./e2ee-account-runtime.js";

function safeName(value){return String(value||"account").replace(/[^A-Za-z0-9._-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,48)||"account";}
export function createAccountVaultOwner({getIdentity,capturePayload,activatePayload}={}){
  if(typeof getIdentity!=="function"||typeof capturePayload!=="function"||typeof activatePayload!=="function")throw new Error("FIDUNIO Vault owner dependencies are incomplete.");
  let tail=Promise.resolve();
  function serialize(work){const run=tail.then(work,work);tail=run.catch(()=>{});return run;}
  return Object.freeze({
    create(pin){return serialize(async()=>{
      const identity=getIdentity();if(!identity?.uid||!identity?.keyId||!identity?.revision)throw new Error("Unlock FIDUNIO Security before creating a recovery file.");
      const payload=await capturePayload(identity);
      const serialized=await withAccountVaultRecoveryAuthority({pin,operation:recoveryUnlockKey=>sealAccountVault({uid:identity.uid,keyId:identity.keyId,identityRevision:identity.revision,payload,recoveryUnlockKey})});
      return{blob:new Blob([serialized],{type:"application/vnd.fidunio.vault+json"}),filename:`FIDUNIO-${safeName(identity.uid)}-${new Date().toISOString().slice(0,10)}.fidunio`};
    })},
    restore(file,pin){return serialize(async()=>{
      if(!file||Number(file.size)>MAX_ACCOUNT_VAULT_BYTES)throw new Error("Choose a FIDUNIO Vault file no larger than 25 MiB.");
      const identity=getIdentity();if(!identity?.uid||!identity?.keyId||!identity?.revision)throw new Error("Unlock FIDUNIO Security before restoring a recovery file.");
      const serialized=await file.text();
      const opened=await withAccountVaultRecoveryAuthority({pin,operation:recoveryUnlockKey=>openAccountVault({serialized,expectedUid:identity.uid,expectedKeyId:identity.keyId,currentIdentityRevision:identity.revision,recoveryUnlockKey})});
      return activatePayload(opened.payload,opened.metadata);
    })}
  });
}
