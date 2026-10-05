import {getCloudLegalAcceptance,acceptCloudLegalPolicy,getFirebaseUser} from "./firebase.js";
import {FIDUNIO_LEGAL_POLICY,legalAcceptanceIsCurrent} from "./legal-policy.js";

function key(){
  const uid=getFirebaseUser()?.uid||"";
  if(!uid)throw new Error("Authenticated account is required before reviewing FIDUNIO terms.");
  return `fidunio.legalAcceptance.${uid}`;
}
function localRow(){
  try{
    const row=JSON.parse(localStorage.getItem(key())||"null");
    return legalAcceptanceIsCurrent(row)?row:null;
  }catch{return null;}
}
function saveLocal(){
  const row={
    accepted:true,
    termsVersion:FIDUNIO_LEGAL_POLICY.termsVersion,
    privacyVersion:FIDUNIO_LEGAL_POLICY.privacyVersion,
    acceptedAt:new Date().toISOString(),
    source:"device"
  };
  localStorage.setItem(key(),JSON.stringify(row));
  return row;
}

export async function readLegalAcceptance(){
  const local=localRow();
  if(local){
    // Do not make app startup depend on a newly deployed callable. Best-effort
    // server synchronization may happen after the user has already accepted.
    acceptCloudLegalPolicy({
      termsVersion:FIDUNIO_LEGAL_POLICY.termsVersion,
      privacyVersion:FIDUNIO_LEGAL_POLICY.privacyVersion
    }).catch(err=>console.warn("Legal acceptance server sync deferred",err));
    return local;
  }
  try{
    const cloud=await getCloudLegalAcceptance();
    if(cloud?.accepted===true||legalAcceptanceIsCurrent(cloud)){
      localStorage.setItem(key(),JSON.stringify(cloud));
      return cloud;
    }
    return cloud;
  }catch(err){
    console.warn("Legal acceptance server read unavailable; showing local first-use gate",err);
    return {accepted:false,serverUnavailable:true};
  }
}

export async function acceptLegalPolicy(){
  // Persist acceptance locally first so a missing/unavailable legal callable can
  // never lock an authenticated user out of FIDUNIO.
  const local=saveLocal();
  try{
    const cloud=await acceptCloudLegalPolicy({
      termsVersion:FIDUNIO_LEGAL_POLICY.termsVersion,
      privacyVersion:FIDUNIO_LEGAL_POLICY.privacyVersion
    });
    return cloud||local;
  }catch(err){
    console.warn("Legal acceptance saved locally; server synchronization deferred",err);
    return local;
  }
}
