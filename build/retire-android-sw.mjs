#!/usr/bin/env node
// ANDROID APK ONLY. Preserve the existing WebView origin and every
// localStorage/IndexedDB/account/E2EE/PIN record. Never ship this on web/iOS.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const ASSET='android/app/src/main/assets/public/service-worker.js';
export const ANDROID_SW_RETIRE_SOURCE=`/* FIDUNIO native Android retirement worker; no fetch listener. */
self.addEventListener("install",event=>event.waitUntil(self.skipWaiting()));
self.addEventListener("activate",event=>event.waitUntil((async()=>{
  // The previous PWA worker could serve cached old Settings/JS from an
  // updated signed APK. Retire only this app's SW cache, not user data.
  await self.registration.unregister();
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith("fidunio-shell-"))
    .map(k=>caches.delete(k)));
  const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});
  for(const client of windows){
    if(client.url.startsWith(self.location.origin+"/")){
      try{await client.navigate(client.url);}catch{}
    }
  }
})()));
`;
export function retireAndroidServiceWorker(assetPath=ASSET){
  if(!fs.existsSync(assetPath)||!fs.statSync(assetPath).isFile())
    throw new Error('Missing native APK service worker at '+assetPath);
  const original=fs.readFileSync(assetPath,'utf8');
  if(original!==ANDROID_SW_RETIRE_SOURCE&&!original.includes('fidunio-shell-'))
    throw new Error('Unexpected native service-worker source; refuse to replace');
  fs.writeFileSync(assetPath,ANDROID_SW_RETIRE_SOURCE,'utf8');
  if(fs.readFileSync(assetPath,'utf8')!==ANDROID_SW_RETIRE_SOURCE)
    throw new Error('Native service-worker retirement was not written');
  console.log('PASS: Android APK retires stale FIDUNIO service worker without clearing account data.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)
  retireAndroidServiceWorker();
