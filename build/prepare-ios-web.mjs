import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const listPath=path.join(root,"build","www-files.txt");
const out=path.join(root,"www");
const entries=fs.readFileSync(listPath,"utf8")
  .split(/\r?\n/)
  .map(line=>line.replace(/#.*$/,"").trim())
  .filter(Boolean);

fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});

for(const rel of entries){
  if(rel.includes("..")||path.isAbsolute(rel))throw new Error("Unsafe iOS web asset path: "+rel);
  const src=path.join(root,rel);
  if(!fs.existsSync(src))throw new Error("Missing iOS web asset: "+rel);
  const stat=fs.statSync(src);
  if(!stat.isFile())throw new Error("iOS web allow-list entry must be a file: "+rel);
  const dest=path.join(out,rel);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.copyFileSync(src,dest);
}
console.log(`Prepared ${entries.length} FIDUNIO web assets in www/`);
