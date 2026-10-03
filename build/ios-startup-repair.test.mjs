import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const firebase=fs.readFileSync("firebase.js","utf8");
const expression=firebase.match(/const auth=(.*?),db=fsSdk/)[1];
for(const native of [true,false]){
 const calls=[];const app={};
 const authSdk={indexedDBLocalPersistence:"idb",browserLocalPersistence:"local",browserSessionPersistence:"session",initializeAuth:(a,options)=>{calls.push({a,options});return "native";},getAuth:a=>{calls.push({a});return "web";}};
 assert.equal(vm.runInNewContext(expression,{app,authSdk,isNativeIOSRuntime:()=>native}),native?"native":"web");
 assert.equal(calls.length,1);assert.equal(calls[0].a,app);
 if(native){assert.deepEqual(Array.from(calls[0].options.persistence),["idb","local","session"]);assert.equal("popupRedirectResolver" in calls[0].options,false);}
 else assert.equal(calls[0].options,undefined);
}
const icon=fs.readFileSync("build/ios/AppIcon-1024.png");
assert.equal(icon.readUInt32BE(16),1024);assert.equal(icon.readUInt32BE(20),1024);assert.equal(icon[25],2);
console.log("PASS: native Firebase auth has persistent storage without browser redirect resolver; web defaults preserved; opaque app icon validated");
