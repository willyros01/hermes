import {getFirebaseUser} from "./firebase.js";
import {FIDUNIO_LEGAL_POLICY} from "./legal-policy.js";

const REGION="us-central1",PROJECT="fidunio-fef13";
function endpoint(name){return `https://${REGION}-${PROJECT}.cloudfunctions.net/${name}`;}
async function invoke(name,data={}){
  const user=getFirebaseUser();if(!user)throw new Error("Sign in first.");
  const token=await user.getIdToken();
  const response=await fetch(endpoint(name),{method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${token}`},body:JSON.stringify({data})});
  let body=null;try{body=await response.json();}catch{}
  if(!response.ok||body?.error)throw new Error(body?.error?.message||`FIDUNIO policy service failed (${response.status}).`);
  return body?.result??body?.data??body;
}
export function readLegalAcceptance(){return invoke("getLegalAcceptanceV1",{});}
export function acceptLegalPolicy(){return invoke("acceptLegalPolicyV1",{termsVersion:FIDUNIO_LEGAL_POLICY.termsVersion,privacyVersion:FIDUNIO_LEGAL_POLICY.privacyVersion});}
