// FIDUNIO HELP (2026-11-24): location question, Wi-Fi name plugin, and the
// entitlements HELP needs (urgent "time-sensitive" alerts, Wi-Fi name).
// Runs after build/apply-ios-native-services.mjs, on macOS.
import fs from "node:fs";
import {execFileSync} from "node:child_process";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const xcode=require("xcode");
const projectPath="ios/App/App.xcodeproj/project.pbxproj";
const appDir="ios/App/App";
const infoPlist=appDir+"/Info.plist";
const entitlements=appDir+"/App.entitlements";
const storyboard=appDir+"/Base.lproj/Main.storyboard";
for(const p of [projectPath,infoPlist,entitlements,storyboard])if(!fs.existsSync(p))throw new Error("Missing generated iOS input: "+p);

/* 1. Entitlements: add two keys before the closing </dict>. */
let ent=fs.readFileSync(entitlements,"utf8");
for(const key of ["com.apple.developer.usernotifications.time-sensitive","com.apple.developer.networking.wifi-info"]){
  if(!ent.includes(key)){
    if(ent.split("</dict>").length!==2)throw new Error("Unexpected entitlements file");
    ent=ent.replace("</dict>",`  <key>${key}</key>\n  <true/>\n</dict>`);
  }
}
fs.writeFileSync(entitlements,ent);

/* 2. Location question (asked only when HELP sends a location). */
const buddy="/usr/libexec/PlistBuddy";
const text="FIDUNIO sends your location only to the HELP contacts you chose, and only when you ask for HELP.";
try{execFileSync(buddy,["-c",`Set :NSLocationWhenInUseUsageDescription ${text}`,infoPlist],{stdio:"pipe"});}
catch{execFileSync(buddy,["-c",`Add :NSLocationWhenInUseUsageDescription string ${text}`,infoPlist]);}

/* 3. Native code: Wi-Fi plugin + FIDUNIO screen that registers it. */
const sources=["FidunioWifiPlugin.swift","FidunioViewController.swift"];
for(const f of sources)fs.copyFileSync("build/ios/help/"+f,appDir+"/"+f);
const project=xcode.project(projectPath).parseSync();
const target=project.getFirstTarget();
const appGroup=project.findPBXGroupKey({path:"App"});
if(!appGroup)throw new Error("Generated Xcode App group is missing");
for(const f of sources){
  if(!fs.readFileSync(projectPath,"utf8").includes(f)){
    const file=project.addSourceFile(f,{target:target.uuid},appGroup);
    if(!file)throw new Error("Could not add "+f);
  }
}
fs.writeFileSync(projectPath,project.writeSync());

let sb=fs.readFileSync(storyboard,"utf8");
const from='customClass="CAPBridgeViewController" customModule="Capacitor"';
if(!sb.includes("FidunioViewController")){
  if(sb.split(from).length!==2)throw new Error("Capacitor storyboard anchor changed");
  sb=sb.replace(from,'customClass="FidunioViewController" customModule="App" customModuleProvider="target"');
  fs.writeFileSync(storyboard,sb);
}

execFileSync("/usr/bin/plutil",["-lint",infoPlist]);
execFileSync("/usr/bin/plutil",["-lint",entitlements]);
const pbx=fs.readFileSync(projectPath,"utf8");
for(const f of sources)if(!pbx.includes(f))throw new Error(f+" not in Xcode project");
console.log("PASS: FIDUNIO HELP iOS: location question, Wi-Fi name plugin, time-sensitive and Wi-Fi entitlements");
