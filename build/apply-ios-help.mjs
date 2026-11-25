// FIDUNIO HELP (KISS, 2026-11-25): the location question and the "time-sensitive"
// notification entitlement. No change to the app's shell or screens: the iPhone app
// runs the same shared program as Android and the web.
// Runs after build/apply-ios-native-services.mjs, on macOS.
import fs from "node:fs";
import {execFileSync} from "node:child_process";
const appDir="ios/App/App";
const infoPlist=appDir+"/Info.plist";
const entitlements=appDir+"/App.entitlements";
for(const p of [infoPlist,entitlements])if(!fs.existsSync(p))throw new Error("Missing generated iOS input: "+p);

let ent=fs.readFileSync(entitlements,"utf8");
const key="com.apple.developer.usernotifications.time-sensitive";
if(!ent.includes(key)){
  if(ent.split("</dict>").length!==2)throw new Error("Unexpected entitlements file");
  ent=ent.replace("</dict>",`  <key>${key}</key>\n  <true/>\n</dict>`);
}
fs.writeFileSync(entitlements,ent);

const buddy="/usr/libexec/PlistBuddy";
const text="FIDUNIO sends your location only to your HELP contacts, and only when you ask for HELP.";
try{execFileSync(buddy,["-c",`Set :NSLocationWhenInUseUsageDescription ${text}`,infoPlist],{stdio:"pipe"});}
catch{execFileSync(buddy,["-c",`Add :NSLocationWhenInUseUsageDescription string ${text}`,infoPlist]);}

execFileSync("/usr/bin/plutil",["-lint",infoPlist]);
execFileSync("/usr/bin/plutil",["-lint",entitlements]);
console.log("PASS: FIDUNIO HELP iOS: location question and time-sensitive notifications (no shell changes)");
