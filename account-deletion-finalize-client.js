import {completeCloudMyAccountDeletion,signOutFidunio,getFirebaseUser} from "./firebase.js";
import {eraseAccountStorageForDeletion} from "./account-storage.js";
import {clearLocalSecurityForAccountDeletion} from "./local-security.js";

export async function completeSelfAccountDeletion(){
  const user=getFirebaseUser();if(!user)throw new Error("Sign in first.");
  const uid=user.uid;
  const result=await completeCloudMyAccountDeletion();
  let localCleanupWarning="";
  try{
    await eraseAccountStorageForDeletion(uid);
    await clearLocalSecurityForAccountDeletion(uid);
  }catch(error){
    console.error("FIDUNIO account was deleted but local cleanup did not finish",error);
    localCleanupWarning="The account was deleted, but this installation could not erase all local data. Remove FIDUNIO from this device before another person uses it.";
  }
  try{await signOutFidunio();}catch{}
  return{...(result||{deleted:true}),localCleanupWarning};
}
