import fs from "node:fs";
import assert from "node:assert/strict";

const manifest=JSON.parse(fs.readFileSync("build/release-readiness-manifest.json","utf8"));
const packaged=new Set(fs.readFileSync("build/www-files.txt","utf8").split(/\r?\n/).map(x=>x.replace(/#.*$/,"").trim()).filter(Boolean));
const fn=fs.readFileSync("functions/index.mjs","utf8");
const rules=fs.readFileSync(manifest.expectedLiveFirestoreRules,"utf8");
const storage=fs.readFileSync(manifest.expectedLiveStorageRules,"utf8");
const workflow=fs.readFileSync(".github/workflows/rebuild-baseline-security.yml","utf8");

assert.equal(manifest.schemaVersion,1);
assert.ok(Array.isArray(manifest.features)&&manifest.features.length>=10,"release manifest must cover major visible feature families");

for(const name of manifest.requiredFunctions){
  assert.match(fn,new RegExp(`export const ${name}\\s*=`),`missing required callable export: ${name}`);
}
for(const feature of manifest.features){
  assert.ok(feature.id&&feature.ui,`feature entry incomplete: ${JSON.stringify(feature)}`);
  for(const file of feature.packaged||[])assert.ok(packaged.has(file),`${feature.id}: packaged runtime missing ${file}`);
  for(const token of feature.rules||[])assert.ok(rules.includes(token),`${feature.id}: Firestore authority missing ${token}`);
  for(const token of feature.storage||[])assert.ok(storage.includes(token),`${feature.id}: Storage authority missing ${token}`);
  for(const name of feature.functions||[])assert.match(fn,new RegExp(`export const ${name}\\s*=`),`${feature.id}: function export missing ${name}`);
  for(const file of feature.tests||[]){
    assert.ok(fs.existsSync(file),`${feature.id}: declared test file missing ${file}`);
    assert.ok(workflow.includes(file)||workflow.includes(file.replace(/\.test\.mjs$/,"")),`${feature.id}: declared test is not release-gated: ${file}`);
  }
}
console.log(`PASS: release-readiness manifest covers ${manifest.features.length} visible feature families and their packaged/backend/test authorities`);
