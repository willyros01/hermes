import assert from "node:assert/strict";
import fs from "node:fs";
import {spawnSync} from "node:child_process";

const files=fs.readFileSync("build/www-files.txt","utf8")
  .split(/\r?\n/)
  .map(line=>line.replace(/#.*$/,"").trim())
  .filter(Boolean)
  .filter(file=>file.endsWith(".js"));

const failures=[];
for(const file of files){
  const result=spawnSync(process.execPath,["--check",file],{encoding:"utf8"});
  if(result.status!==0)failures.push({file,error:(result.stderr||result.stdout||"syntax check failed").trim()});
}
assert.deepEqual(failures,[],failures.map(x=>x.file+": "+x.error).join("\n\n"));
console.log("PASS: all "+files.length+" packaged JavaScript files parse before iOS packaging");
