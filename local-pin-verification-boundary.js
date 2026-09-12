export const LOCAL_PIN_VERIFICATION_TIMEOUT_MS=12000;
export const LOCAL_PIN_VERIFICATION_TIMEOUT_CODE="LOCAL_PIN_VERIFICATION_TIMEOUT";

export function awaitBoundedLocalPinVerification(work,{timeoutMs=LOCAL_PIN_VERIFICATION_TIMEOUT_MS,setTimer=setTimeout,clearTimer=clearTimeout}={}){
  if(!work||typeof work.then!=="function")throw new Error("Local PIN verification promise is required.");
  if(!Number.isFinite(timeoutMs)||timeoutMs<1)throw new Error("Local PIN verification timeout must be positive.");
  return new Promise((resolve,reject)=>{
    let settled=false;
    const timer=setTimer(()=>{
      if(settled)return;
      settled=true;
      const error=new Error("PIN check did not finish. Please try again.");
      error.code=LOCAL_PIN_VERIFICATION_TIMEOUT_CODE;
      reject(error);
    },timeoutMs);
    Promise.resolve(work).then(value=>{
      if(settled)return;
      settled=true;
      clearTimer(timer);
      resolve(value);
    },error=>{
      if(settled)return;
      settled=true;
      clearTimer(timer);
      reject(error);
    });
  });
}
