/* 2026-11-24: Android Back swipe/key must go back inside FIDUNIO, and move
 * FIDUNIO to the background only when there is nothing to go back to. */
import assert from "node:assert/strict";
import fs from "node:fs";
let listener=null,minimized=0;
globalThis.location={protocol:"https:",hostname:"localhost"};
Object.defineProperty(globalThis,"navigator",{value:{userAgent:"Mozilla/5.0 (Linux; Android 14; Pixel 9)"},configurable:true});
globalThis.Capacitor={isNativePlatform:()=>true,getPlatform:()=>"android",Plugins:{App:{addListener:(name,fn)=>{assert.equal(name,"backButton");listener=fn;return{remove(){}};},minimizeApp:async()=>{minimized++;}}}};
const {installBackGesture}=await import("./back-platform-adapter.js");
let answer=true,calls=0;
assert.equal(installBackGesture({handleBack:()=>{calls++;return answer;}}),true);
await listener();assert.equal(calls,1);assert.equal(minimized,0,"handled inside FIDUNIO: stays in front");
answer=false;await listener();assert.equal(minimized,1,"nothing to go back to: FIDUNIO moves to the background");
answer=()=>{throw new Error("x")};await listener();
const app=fs.readFileSync("app.js","utf8");
assert.match(app,/function handleAndroidBack\(\)\{\n  if\(!state\.unlocked\)return false;/,"Back never bypasses the lock screen");
assert.match(app,/installBackGesture\(\{handleBack:handleAndroidBack\}\)/);
assert.ok(fs.readFileSync("build/www-files.txt","utf8").split(/\r?\n/).includes("back-platform-adapter.js"));
/* iOS and web: no listener. */
globalThis.Capacitor.getPlatform=()=>"ios";
const fresh=await import("./back-platform-adapter.js?ios");
assert.equal(fresh.installBackGesture({handleBack:()=>true}),false,"iOS is unaffected");
console.log("Android Back gesture gate passed");
