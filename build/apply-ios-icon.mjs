import fs from "node:fs";
import {execFileSync} from "node:child_process";

const source="build/ios/AppIcon-1024.png",data=fs.readFileSync(source);
if(data.readUInt32BE(16)!==1024||data.readUInt32BE(20)!==1024||data[25]!==2)throw new Error("App icon must be opaque RGB 1024×1024 PNG");
if(process.platform!=="darwin")throw new Error("iOS icon transform must run on macOS");

const target="ios/App/App/Assets.xcassets/AppIcon.appiconset";
fs.mkdirSync(target,{recursive:true});
const targetIcon=target+"/AppIcon-1024.png";
execFileSync("/usr/bin/swift",["build/recolor-ios-blue.swift",source,targetIcon],{stdio:"inherit"});
const nativeIcon=fs.readFileSync(targetIcon);
if(nativeIcon.readUInt32BE(16)!==1024||nativeIcon.readUInt32BE(20)!==1024)throw new Error("Transformed iOS App icon lost 1024×1024 dimensions");
if([4,6].includes(nativeIcon[25]))throw new Error("Transformed iOS App icon unexpectedly contains alpha");

const nativeLogo="ios/App/App/public/fidunio-logo.png";
if(!fs.existsSync(nativeLogo))throw new Error("Prepared native FIDUNIO logo is missing");
execFileSync("/usr/bin/swift",["build/recolor-ios-blue.swift","fidunio-logo.png",nativeLogo],{stdio:"inherit"});

const nativeHermes="ios/App/App/public/hermes-logo.png";
if(fs.existsSync(nativeHermes))execFileSync("/usr/bin/swift",["build/recolor-ios-blue.swift","hermes-logo.png",nativeHermes],{stdio:"inherit"});

fs.writeFileSync(target+"/Contents.json",JSON.stringify({images:[{filename:"AppIcon-1024.png",idiom:"universal",platform:"ios",size:"1024x1024"}],info:{author:"xcode",version:1}},null,2)+"\n");
console.log("PASS: iOS-only blue-ring App icon and native logo assets generated; shared web artwork remains unchanged");
