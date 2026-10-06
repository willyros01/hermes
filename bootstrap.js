import {ensurePlatformBackgroundRegistration,getPlatformBackgroundRegistration,startPlatformBackground} from "./background-platform-adapter.js";
import {createPlatformStartupWatchdog} from "./startup-platform-adapter.js";
/* FIDUNIO deterministic bootstrap. Account/auth owners run before app.js. */
export async function ensureFidunioServiceWorker(){return ensurePlatformBackgroundRegistration();}
export function getFidunioServiceWorkerRegistration(){return getPlatformBackgroundRegistration();}

/* Start the platform background owner immediately, without blocking secure startup.
   Web uses the real Service Worker; native iOS remains behind the same adapter. */
startPlatformBackground();

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
// Bootstrap owns sequencing; the platform adapter owns native startup presentation.
const startupHost=document.querySelector(".startup-shell");
let startupWatchdog=createPlatformStartupWatchdog({host:startupHost});
try{
  // App-family contract: first launch shows Terms before account/auth startup.
  const {ensureStartupTermsAccepted}=await import("./legal-startup-gate.js");
  // Reading/declining Terms is user time, not an authentication timeout.
  startupWatchdog.clear();
  await ensureStartupTermsAccepted();
  // Bootstrap explicitly restores its own host after the legal screen yields.
  if(startupHost&&!startupHost.isConnected)document.querySelector("#app").replaceChildren(startupHost);
  startupWatchdog=createPlatformStartupWatchdog({host:startupHost});
  const {startAccountGuard}=await import("./account-guard.js");
  await startAccountGuard();
  const {runAuthGate}=await import("./auth-ui-clean.js");
  await runAuthGate();
}catch(error){
  console.error("FIDUNIO startup failed",error);
  startupWatchdog.fail();
}finally{startupWatchdog.clear();}
