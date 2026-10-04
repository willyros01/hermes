import {getFirebaseUser,signOutFidunio} from "./firebase.js";

const REGION="us-central1",PROJECT="fidunio-fef13";
function endpoint(){return `https://${REGION}-${PROJECT}.cloudfunctions.net/completeMyAccountDeletionV1`;}
export async function completeSelfAccountDeletion(){
  const user=getFirebaseUser();if(!user)throw new Error("Sign in first.");
  const token=await user.getIdToken();
  const response=await fetch(endpoint(),{method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${token}`},body:JSON.stringify({data:{}})});
  let body=null;try{body=await response.json();}catch{}
  if(!response.ok||body?.error)throw new Error(body?.error?.message||`Account deletion service failed (${response.status}).`);
  try{await signOutFidunio();}catch{}
  return body?.result??body?.data??{deleted:true};
}
