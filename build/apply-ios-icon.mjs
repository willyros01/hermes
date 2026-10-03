import fs from "node:fs";
const source="build/ios/AppIcon-1024.png",data=fs.readFileSync(source);
if(data.readUInt32BE(16)!==1024||data.readUInt32BE(20)!==1024||data[25]!==2)throw new Error("App icon must be opaque RGB 1024×1024 PNG");
const target="ios/App/App/Assets.xcassets/AppIcon.appiconset";
fs.mkdirSync(target,{recursive:true});
fs.copyFileSync(source,target+"/AppIcon-1024.png");
fs.writeFileSync(target+"/Contents.json",JSON.stringify({images:[{filename:"AppIcon-1024.png",idiom:"universal",platform:"ios",size:"1024x1024"}],info:{author:"xcode",version:1}},null,2)+"\n");
console.log("PASS: existing FIDUNIO logo installed as opaque 1024×1024 iOS icon");
