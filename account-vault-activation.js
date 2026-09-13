export async function activateVerifiedAccountVault({candidate,readBefore,writeCandidate,verifyCandidate,commitCandidate,restoreBefore}={}){
  for(const [name,fn] of Object.entries({readBefore,writeCandidate,verifyCandidate,commitCandidate,restoreBefore}))if(typeof fn!=="function")throw new Error(`Missing FIDUNIO Vault activation operation: ${name}`);
  const before=await readBefore();await writeCandidate(candidate,before);
  try{await verifyCandidate(candidate);await commitCandidate(candidate);return{activated:true};}
  catch(error){await restoreBefore(before);const failure=new Error(`FIDUNIO Vault activation failed and the previous installation was restored: ${error?.message||error}`);failure.cause=error;throw failure;}
}
