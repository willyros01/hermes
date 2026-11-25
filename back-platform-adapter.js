/*
 * FIDUNIO Back platform adapter (one module, same name on every device).
 *
 * The main program hands ONE callback (handleBack) that decides what Back means.
 *   Android: the Back swipe and the Back key arrive through the Capacitor App plugin;
 *            when FIDUNIO has nothing left to go back to, FIDUNIO moves to the
 *            background (it is not closed), Android's normal behaviour.
 *   iPhone/iPad and web: no system Back to listen to; nothing is installed.
 * Answer to the main program on every device: true when a listener was installed.
 */
function isNativeAndroid(){try{const c=globalThis.Capacitor;return c?.isNativePlatform?.()===true&&c?.getPlatform?.()==="android";}catch{return false;}}

let installed=false;
export function installBackGesture({handleBack}){
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
  })).catch(error=>{installed=false;console.warn("FIDUNIO Back listener failed",error);});
  return true;
}
