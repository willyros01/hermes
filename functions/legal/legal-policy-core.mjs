const fail=(code,message)=>{const error=new Error(message);error.code=code;throw error;};
const clean=value=>String(value||"").trim();

export function createLegalPolicyCore({repo,termsVersion,privacyVersion,now=()=>new Date()}={}){
  if(!repo||!termsVersion||!privacyVersion)throw new Error("Legal policy dependencies are required.");
  return Object.freeze({
    async getLegalAcceptanceV1({authUid}={}){
      const uid=clean(authUid);if(!uid)fail("AUTH_REQUIRED","Authentication is required.");
      const row=await repo.read(uid);
      return Object.freeze({
        accepted:!!row&&row.termsVersion===termsVersion&&row.privacyVersion===privacyVersion,
        termsVersion,
        privacyVersion,
        acceptedAt:row?.acceptedAt?.toMillis?.()??row?.acceptedAtMs??null
      });
    },
    async acceptLegalPolicyV1({authUid,data}={}){
      const uid=clean(authUid);if(!uid)fail("AUTH_REQUIRED","Authentication is required.");
      if(clean(data?.termsVersion)!==termsVersion||clean(data?.privacyVersion)!==privacyVersion)fail("INVALID_INPUT","The legal policy version changed. Reload and review the current terms.");
      await repo.write(uid,{uid,termsVersion,privacyVersion,acceptedAt:now()});
      return Object.freeze({accepted:true,termsVersion,privacyVersion});
    }
  });
}
