/*
 * FIDUNIO invitation platform-link adapter.
 *
 * Shared invitation validation/redemption remains in firebase.js/auth-ui-clean.js.
 * This adapter only receives native iOS Universal Links and extracts the same
 * existing invitation token that the web app receives from ?invite=.
 */
import {isNativeIOSRuntime} from "./platform-runtime.js";

export const FIDUNIO_INVITATION_UNIVERSAL_HOST="www.cuberoot-systems.com";
export const FIDUNIO_INVITATION_UNIVERSAL_PATH="/fidunio/join/";

function appPlugin(){
  if(!isNativeIOSRuntime())return null;
  return globalThis.Capacitor?.Plugins?.App||null;
}

export function invitationTokenFromUniversalUrl(value){
  let url;
  try{url=new URL(String(value||""));}catch{return"";}
  if(url.protocol!=="https:"||url.hostname!==FIDUNIO_INVITATION_UNIVERSAL_HOST)return"";
  const path=url.pathname.endsWith("/")?url.pathname:url.pathname+"/";
  if(path!==FIDUNIO_INVITATION_UNIVERSAL_PATH)return"";
  return String(url.searchParams.get("invite")||"").trim().replace(/\s+/g,"");
}

export async function readInitialNativeInvitationToken(){
  const plugin=appPlugin();
  if(!plugin?.getLaunchUrl)return"";
  try{
    const result=await plugin.getLaunchUrl();
    return invitationTokenFromUniversalUrl(result?.url);
  }catch(error){
    console.warn("FIDUNIO native invitation launch URL unavailable",error);
    return"";
  }
}

export function subscribeNativeInvitationLinks(handler){
  if(typeof handler!=="function")throw new Error("Invitation-link handler is required.");
  const plugin=appPlugin();
  if(!plugin?.addListener)return()=>{};
  let active=true,handle=null;
  Promise.resolve(plugin.addListener("appUrlOpen",event=>{
    if(!active)return;
    const token=invitationTokenFromUniversalUrl(event?.url);
    if(token)handler(token,event);
  })).then(value=>{handle=value;if(!active)handle?.remove?.();}).catch(error=>console.warn("FIDUNIO native invitation listener failed",error));
  return()=>{active=false;try{handle?.remove?.();}catch{}};
}

export const INVITATION_PLATFORM_LINK_ADAPTER_V1=Object.freeze({
  owner:"shared-invitation-auth-flow",
  nativePlugin:"Capacitor App",
  universalHost:FIDUNIO_INVITATION_UNIVERSAL_HOST,
  universalPath:FIDUNIO_INVITATION_UNIVERSAL_PATH,
  validatesInvitation:false,
  redeemsInvitation:false,
});
