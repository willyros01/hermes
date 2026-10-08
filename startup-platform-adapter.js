/*
 * FIDUNIO startup presentation adapter.
 * The shared bootstrap owns sequencing; this adapter owns platform-specific
 * startup timeout/failure presentation only.
 */
import {isNativeIOSRuntime} from "./platform-runtime.js";

export function createPlatformStartupWatchdog({host,timeoutMs=30000,reload=()=>location.reload(),platformOptions}={}){
  if(!isNativeIOSRuntime(platformOptions)||!host)return Object.freeze({fail:()=>{},clear:()=>{}});
  const show=message=>{
    if(!host.isConnected)return;
    host.querySelector(".startup-spinner")?.remove();
    const title=host.querySelector("strong");if(title)title.textContent="FIDUNIO could not finish starting";
    const detail=host.querySelector("span");if(detail)detail.textContent=message;
    if(!host.querySelector("button")){
      const retry=document.createElement("button");retry.className="primary";retry.textContent="Retry Startup";
      retry.addEventListener("click",reload);host.append(retry);
    }
  };
  const timer=setTimeout(()=>show("Sign-in is taking longer than expected. Check your connection and retry. Your secure data has not been reset."),timeoutMs);
  return Object.freeze({fail:()=>show("Sign-in could not be loaded. Check your connection and retry. Your secure data has not been reset."),clear:()=>clearTimeout(timer)});
}

export const STARTUP_PLATFORM_ADAPTER_V1=Object.freeze({
  sharedOwner:"bootstrap-sequencing",
  webPresentation:"none",
  iosPresentation:"bounded-startup-watchdog",
});
