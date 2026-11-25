/*
 * FIDUNIO app-state platform adapter (one module, same name on every device).
 *
 * Tells the main program when FIDUNIO leaves the screen and when it comes back.
 *   iPhone/iPad and Android apps: the native app's own signals (Capacitor "pause" /
 *            "resume" and the App plugin's appStateChange). The web page's hidden /
 *            visible signals do not always arrive inside the native apps.
 *   Web:     nothing extra; the page's own visibility signals are used by the caller.
 * Both callbacks are safe to call more than once.
 */
function isNative(){try{return globalThis.Capacitor?.isNativePlatform?.()===true;}catch{return false;}}

let installed=false;
export function watchAppLeaveAndReturn({onLeave,onReturn}){
  if(installed||typeof onLeave!=="function"||typeof onReturn!=="function")return false;
  installed=true;
  /* "pause"/"resume" are only ever sent by the native apps; listening on the web is harmless. */
  document.addEventListener("pause",()=>onLeave());
  document.addEventListener("resume",()=>onReturn());
  try{
    const app=isNative()?globalThis.Capacitor?.Plugins?.App:null;
    if(app?.addListener)Promise.resolve(app.addListener("appStateChange",state=>{if(state?.isActive)onReturn();else onLeave();})).catch(()=>{});
  }catch{}
  return true;
}
