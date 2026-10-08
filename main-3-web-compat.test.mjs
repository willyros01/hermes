import assert from "node:assert/strict";
import fs from "node:fs";
import {createPlatformStartupWatchdog} from "./startup-platform-adapter.js";
import {getInstallGuidance} from "./install-guidance.js";
import {detectFidunioPlatform,FIDUNIO_PLATFORM} from "./platform-runtime.js";
const web={capacitor:null,protocol:"https:"};
const manifest=JSON.parse(fs.readFileSync("manifest.json","utf8"));
assert.equal(manifest.display,"standalone");
assert.equal(manifest.start_url,"./");assert.equal(manifest.scope,"./");
assert.ok(manifest.icons.some(i=>i.sizes==="192x192"));
assert.ok(manifest.icons.some(i=>i.sizes==="512x512"));
const html=fs.readFileSync("index.html","utf8");
for(const path of ["manifest.json","version.js","bootstrap.js","styles.css","iphone-overflow-fix.css","settings-sidebar.css"])assert.ok(html.includes(path),path);
assert.match(html,/name="viewport"/);
assert.match(html,/class="startup-shell"/);
const bootstrap=fs.readFileSync("bootstrap.js","utf8");
assert.ok(bootstrap.indexOf("ensureStartupTermsAccepted")<bootstrap.indexOf("startAccountGuard"));
assert.ok(bootstrap.indexOf("startAccountGuard")<bootstrap.indexOf("runAuthGate"));
assert.equal(detectFidunioPlatform(web),FIDUNIO_PLATFORM.WEB);
assert.equal(getInstallGuidance({userAgent:"Mozilla/5.0 (iPad)",nativeApp:false}).platform,"ios");
assert.equal(getInstallGuidance({standalone:true,nativeApp:false}).platform,"installed");
const listeners={};
const retry={className:"",textContent:"",addEventListener:(name,fn)=>listeners[name]=fn};
const spinner={removed:false,remove(){this.removed=true}};
const title={textContent:"Starting"};
const detail={textContent:"Opening"};
const host={
  isConnected:true,button:null,
  querySelector(selector){return selector===".startup-spinner"?spinner:selector==="strong"?title:selector==="span"?detail:this.button;},
  append(element){this.button=element;}
};
let reloads=0;
const watchdog=createPlatformStartupWatchdog({host,platformOptions:web,reload:()=>reloads++});
watchdog.fail();
assert.equal(spinner.removed,true);
assert.match(title.textContent,/could not finish/);
assert.equal(retry.textContent,"Retry Startup");
assert.equal(host.button,retry);
listeners.click();assert.equal(reloads,1);
watchdog.clear();
console.log("PASS: main-3 web startup failure recovery, legal gate ordering, PWA and mobile layout references");
