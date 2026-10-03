import {shouldUseWebServiceWorker,isNativeIOSRuntime} from "./platform-runtime.js";
/* FIDUNIO deterministic bootstrap. Account/auth owners run before app.js. */
export async function ensureFidunioServiceWorker(){
  if(!shouldUseWebServiceWorker())throw new Error("The web service worker is not used inside the FIDUNIO iOS app.");
  if(!("serviceWorker" in navigator))throw new Error("Service workers are not supported on this device/browser.");
  const registration=await navigator.serviceWorker.register("./service-worker.js",{scope:"./",type:"module"});
  await registration.update().catch(()=>{});
  return registration;
}

let serviceWorkerRegistrationPromise=null;
export function getFidunioServiceWorkerRegistration(){
  if(!serviceWorkerRegistrationPromise)serviceWorkerRegistrationPromise=ensureFidunioServiceWorker();
  return serviceWorkerRegistrationPromise;
}

/* Start service-worker ownership immediately, but do not block secure app startup.
   Notification registration awaits navigator.serviceWorker.ready after this owner
   has deterministically established the registration. */
if(shouldUseWebServiceWorker())getFidunioServiceWorkerRegistration().catch(err=>console.warn("FIDUNIO service worker registration failed",err));

document.addEventListener("click",event=>{
  const button=event.target.closest?.("button");
  if(!button||button.disabled)return;
  queueMicrotask(()=>{
    if(!button.disabled||!button.isConnected)return;
    button.classList.add("is-busy");
    button.setAttribute("aria-busy","true");
    const watch=()=>{
      if(button.isConnected&&button.disabled){requestAnimationFrame(watch);return;}
      button.classList.remove("is-busy");
      button.removeAttribute("aria-busy");
    };
    requestAnimationFrame(watch);
  });
},true);
// Bootstrap owns only the initial startup host until auth-ui replaces it.
const startupHost=document.querySelector(".startup-shell");
function showNativeStartupFailure(message){
  if(!isNativeIOSRuntime()||!startupHost?.isConnected)return;
  startupHost.querySelector(".startup-spinner")?.remove();
  startupHost.querySelector("strong").textContent="FIDUNIO could not finish starting";
  startupHost.querySelector("span").textContent=message;
  if(!startupHost.querySelector("button")){
    const retry=document.createElement("button");retry.className="primary";
    retry.textContent="Retry Startup";retry.addEventListener("click",()=>location.reload());
    startupHost.append(retry);
  }
}
const startupTimer=isNativeIOSRuntime()?setTimeout(()=>showNativeStartupFailure("Sign-in is taking longer than expected. Check your connection and retry. Your secure data has not been reset."),30000):null;
try{
  const {startAccountGuard}=await import("./account-guard.js");
  await startAccountGuard();
  const {runAuthGate}=await import("./auth-ui-clean.js");
  await runAuthGate();
}catch(error){
  console.error("FIDUNIO startup failed",error);
  showNativeStartupFailure("Sign-in could not be loaded. Check your connection and retry. Your secure data has not been reset.");
}finally{if(startupTimer!==null)clearTimeout(startupTimer);}
