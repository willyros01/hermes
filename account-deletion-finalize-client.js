import {getFirebaseUser,signOutFidunio} from "./firebase.js";
import {eraseAccountStorageForDeletion} from "./account-storage.js";
import {clearLocalSecurityForAccountDeletion} from "./local-security.js";

const REGION="us-central1",PROJECT="fidunio-fef13";
function endpoint(){return `https://${REGION}-${PROJECT}.cloudfunctions.net/completeMyAccountDeletionV1`;}
export async function completeSelfAccountDeletion(){
  const user=getFirebaseUser();if(!user)throw new Error("Sign in first.");
  const uid=user.uid,token=await user.getIdToken();
  const response=await fetch(endpoint(),{method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${token}`},body:JSON.stringify({data:{}})});
  let body=null;try{body=await response.json();}catch{}
  if(!response.ok||body?.error)throw new Error(body?.error?.message||`Account deletion service failed (${response.status}).`);
  let localCleanupWarning="";
  try{
    await eraseAccountStorageForDeletion(uid);
    await clearLocalSecurityForAccountDeletion(uid);
  }catch(error){
    console.error("FIDUNIO account was deleted but local cleanup did not finish",error);
    localCleanupWarning="The account was deleted, but this installation could not erase all local data. Remove FIDUNIO from this device before another person uses it.";
  }
  try{await signOutFidunio();}catch{}
  return{...(body?.result??body?.data??{deleted:true}),localCleanupWarning};
}
