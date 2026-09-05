import { createAccountE2EEIdentityManager } from "./e2ee-account-identity-manager.js";
import { createFirebaseAccountE2EEIdentityStore } from "./e2ee-account-firebase-adapter.js";
import { createAccountE2EEAuthLifecycle } from "./e2ee-account-lifecycle.js";

// Recovery enrollment is deliberately unavailable until the reviewed Cloud Functions
// recovery boundary is live. Loading existing identity metadata does not use this path.
const recoveryService=Object.freeze({
  async protectRecoveryKey(){
    const error=new Error("Account E2EE recovery enrollment is not configured yet.");
    error.code="RECOVERY_NOT_CONFIGURED";
    throw error;
  }
});

const identityStore=createFirebaseAccountE2EEIdentityStore();
const manager=createAccountE2EEIdentityManager({identityStore,recoveryService});
const lifecycle=createAccountE2EEAuthLifecycle({manager});

export function bindAuthenticatedAccountE2EE(uid){return lifecycle.bindAuthenticatedUid(uid);}
export function resetAccountE2EEForSignOut(){lifecycle.resetForSignOut();}
export function getAccountE2EELifecycleState(){return lifecycle.getLifecycleState();}
export function getAccountE2EERuntimeIdentity(){return manager.getRuntimeIdentity();}
