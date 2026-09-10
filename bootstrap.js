/* FIDUNIO deterministic bootstrap. Account/auth owners run before app.js. */
export async function ensureFidunioServiceWorker(){
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
getFidunioServiceWorkerRegistration().catch(err=>console.warn("FIDUNIO service worker registration failed",err));

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
const {startAccountGuard}=await import("./account-guard.js");
await startAccountGuard();
const {runAuthGate}=await import("./auth-ui-clean.js");
await runAuthGate();
