/* TEST-ONLY. Android 9+ defaults to blocking cleartext local emulator ports.
 * Permit it solely in generated, disposable native Android debug source.
 * Never mutate a release-branch AndroidManifest.xml. */
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'.');
if(!fs.existsSync(path.join(root,'www','SIMULATOR-ONLY.txt')))
  throw new Error('Refusing Android HTTP override without disposable app marker');
const manifest=path.join(root,'android','app','src','main','AndroidManifest.xml');
if(!fs.existsSync(manifest))throw new Error('Native test AndroidManifest.xml is missing');
let xml=fs.readFileSync(manifest,'utf8');
if(!/\<application\s/.test(xml)||!xml.includes('android.permission.INTERNET'))
  throw new Error('Unexpected native Android manifest; refusing patch');
if(/android:usesCleartextTraffic="(true|false)"/.test(xml))
  xml=xml.replace(/android:usesCleartextTraffic="(true|false)"/,'android:usesCleartextTraffic="true"');
else xml=xml.replace(/<application\s/,'<application android:usesCleartextTraffic="true" ');
if(!xml.includes('android:usesCleartextTraffic="true"'))throw new Error('Local emulator HTTP permission not set');
fs.writeFileSync(manifest,xml);
console.log('PASS: disposable Android debug manifest permits localhost Firebase emulator HTTP; release manifests unchanged');
