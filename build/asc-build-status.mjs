import crypto from "node:crypto";
import fs from "node:fs";
const required=n=>{if(!process.env[n])throw new Error("missing "+n);return process.env[n];};
async function get(path){
 const enc=x=>Buffer.from(JSON.stringify(x)).toString("base64url"),now=Math.floor(Date.now()/1000);
 const msg=enc({alg:"ES256",kid:required("ASC_KEY_ID"),typ:"JWT"})+"."+enc({iss:required("ASC_ISSUER_ID"),iat:now,exp:now+900,aud:"appstoreconnect-v1"});
 const sig=crypto.sign("sha256",Buffer.from(msg),{key:fs.readFileSync(required("KEY")),dsaEncoding:"ieee-p1363"}).toString("base64url");
 const res=await fetch("https://api.appstoreconnect.apple.com"+path,{headers:{Authorization:"Bearer "+msg+"."+sig}});
 if(!res.ok)throw new Error("Apple API HTTP "+res.status);
 return res.json();
}
try{
 const apps=await get("/v1/apps?filter[bundleId]=io.github.willyros01.fidunio");
 const app=apps.data?.find(x=>x.id==="6818880685");
 if(!app||app.attributes.name!=="FIDUNIO"||app.attributes.sku!=="fidunio-ios-001")throw new Error("FIDUNIO app identity/SKU mismatch");
 console.log("PASS: FIDUNIO app 6818880685 / fidunio-ios-001");
 if(process.argv[2]==="status"){
  const build=required("BUILD"),version=required("VERSION");
  for(let i=0;i<40;i++){
   const r=await get("/v1/builds?filter[app]=6818880685&filter[version]="+encodeURIComponent(build)+"&filter[preReleaseVersion.version]="+encodeURIComponent(version));
   const b=r.data?.[0],state=b?.attributes.processingState;
   console.log("Build "+version+" ("+build+"): "+(state||"not listed yet"));
   if(state==="VALID"){
    if(b.attributes.usesNonExemptEncryption!==false)throw new Error("Apple has not confirmed the assessed encryption declaration");
    console.log("PASS: Apple processed the build; usesNonExemptEncryption=false; build ID "+b.id);process.exit(0);
   }
   if(["FAILED","INVALID"].includes(state))throw new Error("Apple processing "+state);
   await new Promise(r=>setTimeout(r,30000));
  }
  throw new Error("Apple processing still pending after 20 minutes; upload may have succeeded; check before rerunning");
 }else if(process.argv[2]!=="identity")throw new Error("use identity or status");
}catch(e){console.error(e.message);process.exit(1);}
