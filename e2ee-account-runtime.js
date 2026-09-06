import { createAccountE2EEIdentityManager } from "./e2ee-account-identity-manager.js";
import { createFirebaseAccountE2EEIdentityStore } from "./e2ee-account-firebase-adapter.js";
import { createAccountE2EEAuthLifecycle } from "./e2ee-account-lifecycle.js";
import { createAccountE2EERecoveryClient } from "./e2ee-account-recovery-client.js";
import { enrollCloudE2EERecovery,startCloudE2EERecovery,completeCloudE2EERecovery } from "./firebase.js";

const recoveryClient=createAccountE2EERecoveryClient({enroll:enrollCloudE2EERecovery,start:startCloudE2EERecovery,complete:completeCloudE2EERecovery});
const identityStore=createFirebaseAccountE2EEIdentityStore();
const manager=createAccountE2EEIdentityManager({identityStore,recoveryService:recoveryClient});
const lifecycle=createAccountE2EEAuthLifecycle({manager});

export function bindAuthenticatedAccountE2EE(uid){return lifecycle.bindAuthenticatedUid(uid);}
export function resetAccountE2EEForSignOut(){lifecycle.resetForSignOut();}
export function getAccountE2EELifecycleState(){return lifecycle.getLifecycleState();}
export function getAccountE2EERuntimeIdentity(){return manager.getRuntimeIdentity();}
export function enrollAccountE2EE({uid,password,pin}){return manager.enroll({uid,password,pin});}
export function unlockAccountE2EE({uid,password,pin}){return manager.unlock({uid,password,pin});}
export async function recoverAccountE2EE({uid,newPassword,pin}){
  const recovered=await recoveryClient.recoverKey({pin});
  try{return await manager.recover({uid,recoveryUnlockKey:recovered.recoveryUnlockKey,newPassword,pin});}
  finally{recovered.recoveryUnlockKey.fill(0);}
}
