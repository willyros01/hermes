import fs from "node:fs";
import {execFileSync} from "node:child_process";
import {createRequire} from "node:module";

const require=createRequire(import.meta.url);
const xcode=require("xcode");
const projectPath="ios/App/App.xcodeproj/project.pbxproj";
const appDir="ios/App/App";
const infoPlist=appDir+"/Info.plist";
const firebaseSource="build/ios/GoogleService-Info.plist";
const firebaseTarget=appDir+"/GoogleService-Info.plist";
const privacySource="build/ios/PrivacyInfo.xcprivacy";
const privacyTarget=appDir+"/PrivacyInfo.xcprivacy";
const entitlements=appDir+"/App.entitlements";
const appDelegate=appDir+"/AppDelegate.swift";
const bundleId="io.github.willyros01.fidunio";

for(const path of [projectPath,infoPlist,appDelegate,firebaseSource,privacySource])if(!fs.existsSync(path))throw new Error("Missing generated iOS input: "+path);
const firebase=fs.readFileSync(firebaseSource,"utf8");
if(!firebase.includes("<string>"+bundleId+"</string>")||!firebase.includes("<string>fidunio-fef13</string>"))throw new Error("Firebase iOS config does not match FIDUNIO");
fs.copyFileSync(firebaseSource,firebaseTarget);
fs.copyFileSync(privacySource,privacyTarget);

fs.writeFileSync(entitlements,`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>aps-environment</key>
  <string>production</string>
</dict>
</plist>
`);

const delegate=fs.readFileSync(appDelegate,"utf8");
const notificationHooks=`
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        NotificationCenter.default.post(name: Notification.Name.init("didReceiveRemoteNotification"), object: completionHandler, userInfo: userInfo)
    }

`;
if(!delegate.includes("didRegisterForRemoteNotificationsWithDeviceToken")){
  const marker="    func application(_ application: UIApplication,\n                     configurationForConnecting connectingSceneSession: UISceneSession,";
  if(!delegate.includes(marker))throw new Error("Capacitor AppDelegate anchor changed");
  fs.writeFileSync(appDelegate,delegate.replace(marker,notificationHooks+marker));
}

if(process.platform!=="darwin")throw new Error("Native iOS configuration must run on macOS");
const buddy="/usr/libexec/PlistBuddy";
function setString(key,value){
  try{execFileSync(buddy,["-c",`Set :${key} ${value}`,infoPlist],{stdio:"pipe"});}
  catch{execFileSync(buddy,["-c",`Add :${key} string ${value}`,infoPlist]);}
}
setString("NSFaceIDUsageDescription","FIDUNIO uses Face ID to unlock your locally protected messaging session.");

const project=xcode.project(projectPath).parseSync();
const target=project.getFirstTarget();
const appGroup=project.findPBXGroupKey({path:"App"});
if(!appGroup)throw new Error("Generated Xcode App group is missing");
const firebaseFile=project.addFile("GoogleService-Info.plist",appGroup,{target:target.uuid});
if(!firebaseFile)throw new Error("Firebase plist already exists unexpectedly");
firebaseFile.target=target.uuid;
firebaseFile.uuid=project.generateUuid();
project.addToPbxBuildFileSection(firebaseFile);
project.addToPbxResourcesBuildPhase(firebaseFile);
const privacyFile=project.addFile("PrivacyInfo.xcprivacy",appGroup,{target:target.uuid});
if(!privacyFile)throw new Error("PrivacyInfo.xcprivacy already exists unexpectedly");
privacyFile.target=target.uuid;
privacyFile.uuid=project.generateUuid();
project.addToPbxBuildFileSection(privacyFile);
project.addToPbxResourcesBuildPhase(privacyFile);
project.updateBuildProperty("CODE_SIGN_ENTITLEMENTS","App/App.entitlements",undefined,"App");
project.addTargetAttribute("SystemCapabilities",{"com.apple.Push":{enabled:1}},target);
fs.writeFileSync(projectPath,project.writeSync());

execFileSync("/usr/bin/plutil",["-lint",infoPlist]);
execFileSync("/usr/bin/plutil",["-lint",firebaseTarget]);
execFileSync("/usr/bin/plutil",["-lint",privacyTarget]);
execFileSync("/usr/bin/plutil",["-lint",entitlements]);
const pbx=fs.readFileSync(projectPath,"utf8");
if(!pbx.includes("GoogleService-Info.plist"))throw new Error("Firebase plist was not added to Xcode resources");
if(!pbx.includes("PrivacyInfo.xcprivacy"))throw new Error("Privacy manifest was not added to Xcode resources");
if(!pbx.includes("CODE_SIGN_ENTITLEMENTS"))throw new Error("Push entitlement build setting is missing");
const entitlementText=fs.readFileSync(entitlements,"utf8");
if(!entitlementText.includes("aps-environment")||!entitlementText.includes("<string>production</string>"))throw new Error("Production APNs entitlement is missing");
console.log("PASS: FIDUNIO native Firebase, Push and Face ID configuration applied; App Check remains standby/fail-open until Apple App Attest capability is enabled");
