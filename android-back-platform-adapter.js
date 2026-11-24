/*
 * FIDUNIO Android Back gesture adapter (2026-11-24, owner requirement).
 *
 * Android's Back swipe (and the 3-button Back key) arrive here through the
 * Capacitor App plugin. FIDUNIO decides what Back means through ONE app-owned
 * callback (handleBack); when FIDUNIO has nothing left to go back to, Android's
 * normal behaviour applies: FIDUNIO moves to the background (it is not closed).
 * iOS and the web app are unaffected (no listener is installed there).
 */
/* Self-contained check: the ios and main branches' platform-runtime.js has no Android detection. */
function isNativeAndroid(){try{const c=globalThis.Capacitor;return c?.isNativePlatform?.()===true&&c?.getPlatform?.()==="android";}catch{return false;}}

let installed=false;
export function installAndroidBackGesture({handleBack}){
  if(installed||typeof handleBack!=="function"||!isNativeAndroid())return false;
  const app=globalThis.Capacitor?.Plugins?.App;
  if(!app?.addListener)return false;
  installed=true;
  let busy=false;
  Promise.resolve(app.addListener("backButton",async()=>{
    if(busy)return;
    busy=true;
    try{
      let handled=false;
      try{handled=await handleBack();}catch(error){console.warn("FIDUNIO Back handling failed",error);}
      if(!handled)await app.minimizeApp?.();
    }finally{busy=false;}
  })).catch(error=>{installed=false;console.warn("FIDUNIO Android Back listener failed",error);});
  return true;
}
