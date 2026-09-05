/*
 * Temporary scoped adapter for the legacy app.js renderer.
 *
 * This is intentionally NOT a document/global MutationObserver and does not
 * rediscover or repair child features. It watches only direct child replacement
 * of #app, the single structural renderer resource, and invokes the one Settings
 * owner after app.js replaces that root. All Settings feature writes remain in
 * settings-lifecycle.js.
 *
 * Remove this adapter when app.js exposes an explicit post-render Settings hook.
 */
import {mountSettingsLifecycle} from "./settings-lifecycle.js";

let installed=false;
let queued=false;

function mountIfSettings(){
  queued=false;
  const app=document.querySelector("#app");
  if(!app?.querySelector(":scope > .app-shell .content.settings"))return;
  mountSettingsLifecycle();
}

export function installSettingsLifecycleBridge(){
  if(installed)return;
  installed=true;
  const app=document.querySelector("#app");
  if(!app)return;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    queueMicrotask(mountIfSettings);
  });
  observer.observe(app,{childList:true});
  mountIfSettings();
}
