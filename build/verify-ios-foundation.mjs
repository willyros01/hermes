import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const fail=msg=>{throw new Error(msg);};
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const cap=JSON.parse(fs.readFileSync("capacitor.config.json","utf8"));
const list=fs.readFileSync("build/www-files.txt","utf8").split(/\r?\n/).map(x=>x.replace(/#.*$/,"").trim()).filter(Boolean);

for(const name of ["@capacitor/core","@capacitor/ios","@capacitor-firebase/app-check"]){
  if(pkg.dependencies?.[name]!=="8.5.2")fail(name+" must be pinned to 8.5.2");
}
if(pkg.devDependencies?.["@capacitor/cli"]!=="8.5.2")fail("@capacitor/cli must be pinned to 8.5.2");
if(cap.appId!=="io.github.willyros01.fidunio")fail("unexpected Capacitor appId");
if(cap.appName!=="FIDUNIO"||cap.webDir!=="www")fail("unexpected Capacitor appName/webDir");
if(cap.experimental?.ios?.spm?.packageOptions?.["@capacitor-firebase/app-check"]?.symlink!==true)fail("Capacitor App Check SwiftPM symlink option is required");
if(!list.includes("index.html")||!list.includes("bootstrap.js")||!list.includes("app.js")||!list.includes("firebase.js"))fail("core FIDUNIO runtime missing from iOS web allow-list");
if(list.some(x=>/\.test\.mjs$|-tests\.(?:js|html)$|diagnostics/i.test(x)))fail("test/diagnostic file leaked into iOS web allow-list");
if(new Set(list).size!==list.length)fail("duplicate iOS web allow-list entry");
for(const rel of list)if(!fs.existsSync(rel))fail("allow-listed source is missing: "+rel);
const privacyManifest="build/ios/PrivacyInfo.xcprivacy";
if(!fs.existsSync(privacyManifest))fail("FIDUNIO iOS privacy manifest is missing");
const privacy=fs.readFileSync(privacyManifest,"utf8");
for(const token of ["NSPrivacyTracking","NSPrivacyCollectedDataTypes","NSPrivacyCollectedDataTypeEmailAddress","NSPrivacyCollectedDataTypeUserID","NSPrivacyCollectedDataTypeOtherUserContent"]){
  if(!privacy.includes(token))fail("FIDUNIO privacy manifest is incomplete: "+token);
}

if(fs.existsSync("www")){
  for(const rel of list)if(!fs.existsSync(path.join("www",rel)))fail("prepared www/ is missing: "+rel);
  const unexpected=[];
  const walk=(dir,prefix="")=>{
    for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
      const rel=path.posix.join(prefix,ent.name);
      if(ent.isDirectory())walk(path.join(dir,ent.name),rel);
      else if(!list.includes(rel))unexpected.push(rel);
    }
  };
  walk("www");
  if(unexpected.length)fail("www/ contains non-allow-listed files: "+unexpected.join(", "));
}

const textFiles=list.filter(x=>/\.(?:js|html|css|json)$/.test(x));
const localRefs=new Set();
const patterns=[
  /(?:from\s*|import\s*\(|import\s*)["'](\.\.?\/[^"'?#]+)["']/g,
  /(?:src|href)=["'](\.\/?[^"'?#]+)["']/g
];
for(const rel of textFiles){
  const src=fs.readFileSync(rel,"utf8");
  for(const re of patterns){
    re.lastIndex=0;
    let m;
    while((m=re.exec(src))){
      let ref=m[1];
      if(ref.startsWith("./"))ref=ref.slice(2);
      if(ref.startsWith("../"))continue;
      if(!ref||ref.startsWith("http"))continue;
      localRefs.add(ref);
    }
  }
}
const missing=[...localRefs].filter(ref=>!list.includes(ref)&&fs.existsSync(ref));
if(missing.length)fail("local runtime dependency exists but is not allow-listed: "+missing.sort().join(", "));

console.log(`PASS: Capacitor 8.5.2 foundation, ${list.length} explicit web assets, appId ${cap.appId}`);
