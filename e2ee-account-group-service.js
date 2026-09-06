import {createAccountGroupE2EERuntime} from "./e2ee-account-group-runtime.js";
import {createFirebaseAccountGroupE2EETransport} from "./e2ee-account-group-firebase-adapter.js";
import {getAccountE2EERuntimeIdentity} from "./e2ee-account-runtime.js";

const runtime=createAccountGroupE2EERuntime({
  identityProvider:getAccountE2EERuntimeIdentity,
  transport:createFirebaseAccountGroupE2EETransport()
});

export function ensureAccountGroupEpoch(groupId){return runtime.ensureEpoch(groupId);}
export function rotateAccountGroupEpoch(groupId){return runtime.rotateEpoch(groupId);}
export function renameAccountGroup(groupId,name){return runtime.renameGroup(groupId,name);}
export function addAccountGroupMember(groupId,targetUid){return runtime.changeMembership({groupId,operation:"add",targetUid});}
export function removeAccountGroupMember(groupId,targetUid){return runtime.changeMembership({groupId,operation:"remove",targetUid});}
export function leaveAccountGroup(groupId){const id=getAccountE2EERuntimeIdentity();if(!id?.uid)throw new Error("Account E2EE identity must be unlocked before leaving a group.");return runtime.changeMembership({groupId,operation:"leave",targetUid:id.uid});}
export function sendAccountGroupMessage({groupId,messageId,text}){return runtime.send({groupId,messageId,text});}
export function decryptAccountGroupMessage({groupId,messageId,row}){return runtime.decrypt({groupId,messageId,row});}
export function revalidateQueuedAccountGroupMessage({groupId,queuedEpoch}){return runtime.revalidateQueued({groupId,queuedEpoch});}
export function resetAccountGroupE2EEForSignOut(){runtime.resetForSignOut();}
