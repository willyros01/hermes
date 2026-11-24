// FIDUNIO HELP (2026-11-24): register the read-only Wi-Fi name plugin.
// Runs after build/fadm.sh, which has already given MainActivity an onCreate.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const main='android/app/src/main/java/io/github/willyros01/fidunio/MainActivity.java';
let m=fs.readFileSync(main,'utf8');
if(!m.includes('FidunioWifiPlugin')){
  assert.equal(m.split('super.onCreate(state);').length,2,'Unexpected MainActivity');
  m=m.replace('super.onCreate(state);','registerPlugin(FidunioWifiPlugin.class);\n    super.onCreate(state);');
  fs.writeFileSync(main,m);
}
assert.ok(fs.existsSync(main.replace('MainActivity','FidunioWifiPlugin')),'FidunioWifiPlugin missing');
console.log('PASS: FIDUNIO HELP Wi-Fi name plugin registered');
