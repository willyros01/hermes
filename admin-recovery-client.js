import {getFirebaseUser} from "./firebase.js";

const REGION="us-central1",PROJECT="fidunio-fef13";
function endpoint(name){return `https://${REGION}-${PROJECT}.cloudfunctions.net/${name}`;}
async function invoke(name,data={}){
  const user=getFirebaseUser();if(!user)throw new Error("Sign in first.");
  const idToken=await user.getIdToken();
  const response=await fetch(endpoint(name),{method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${idToken}`},body:JSON.stringify({data})});
  let body=null;try{body=await response.json();}catch{}
  if(!response.ok||body?.error){const message=body?.error?.message||`Recovery service request failed (${response.status}).`;throw new Error(message);}
  return body?.result??body?.data??body;
}
export function createAdminRecoveryAuthorization(targetUid){return invoke("createAdminRecoveryAuthorizationV1",{targetUid:String(targetUid||"")});}
export function listAdminRecoveryAuthorizations(targetUid){return invoke("listAdminRecoveryAuthorizationsV1",{targetUid:String(targetUid||"")});}
export function revokeAdminRecoveryAuthorization(authorizationId){return invoke("revokeAdminRecoveryAuthorizationV1",{authorizationId:String(authorizationId||"")});}
export function startAdminAuthorizedRecovery({token}){return invoke("startAdminAuthorizedRecoveryV1",{token:String(token||"")});}
export function completeAdminAuthorizedRecovery(data){return invoke("completeAdminAuthorizedRecoveryV1",data);}
