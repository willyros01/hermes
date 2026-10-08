/*
 * FIDUNIO native biometric platform adapter.
 *
 * Shared lock/PIN state remains owned by local-security.js. This module only
 * bridges native iOS biometry and never owns unlock state or E2EE material.
 */
import {isNativeIOSRuntime} from "./platform-runtime.js";

function nativePlugin(){
  if(!isNativeIOSRuntime())return null;
  return globalThis.Capacitor?.Plugins?.BiometricAuthNative||null;
}

export async function nativeBiometricAvailability(){
  const plugin=nativePlugin();
  if(!plugin?.checkBiometry)return Object.freeze({available:false,type:"none",reason:"Native biometric plugin is unavailable."});
  try{
    const result=await plugin.checkBiometry();
    return Object.freeze({
      available:result?.isAvailable===true,
      type:String(result?.biometryType||"biometric"),
      reason:String(result?.reason||"")
    });
  }catch(error){
    return Object.freeze({available:false,type:"none",reason:error?.message||String(error)});
  }
}

export async function authenticateNativeBiometric(){
  const plugin=nativePlugin();
  if(!plugin?.internalAuthenticate)return false;
  const status=await nativeBiometricAvailability();
  if(!status.available)return false;
  try{
    await plugin.internalAuthenticate({
      reason:"Unlock FIDUNIO",
      cancelTitle:"Use PIN",
      allowDeviceCredential:false,
      iosFallbackTitle:"Use PIN"
    });
    return true;
  }catch{
    return false;
  }
}

export const NATIVE_BIOMETRIC_PLATFORM_ADAPTER_V1=Object.freeze({
  sharedOwner:"local-security",
  iosPlugin:"BiometricAuthNative",
  pinFallback:true,
  ownsUnlockState:false,
  ownsE2EE:false,
});
