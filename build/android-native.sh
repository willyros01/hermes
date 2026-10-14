#!/usr/bin/env bash
# Android-only manifest, Firebase configuration and generated Gradle preparation.
set -euo pipefail
umask 077
: "${FIDUNIO_GOOGLE_SERVICES_JSON_B64:?Missing Actions secret FIDUNIO_GOOGLE_SERVICES_JSON_B64}"
APP=android/app
test -s "$APP/build.gradle"
test -s android/build.gradle
printf '%s' "$FIDUNIO_GOOGLE_SERVICES_JSON_B64" | base64 --decode > "$APP/google-services.json"
node --input-type=commonjs - <<'JS'
const fs=require('node:fs');
const cfg=JSON.parse(fs.readFileSync('android/app/google-services.json','utf8'));
if(cfg.project_info?.project_id!=='fidunio-fef13')throw Error('Wrong Firebase project');
if(!cfg.client?.some(c=>c.client_info?.android_client_info?.package_name==='io.github.willyros01.fidunio'))throw Error('Android Firebase app registration is missing/wrong');
const gradle='android/app/build.gradle';
let s=fs.readFileSync(gradle,'utf8');
const buildNumber=Number(process.env.GITHUB_RUN_NUMBER||1);
if(!Number.isSafeInteger(buildNumber)||buildNumber<1||buildNumber>2000000000)throw Error('Invalid build number');
if(!/^\s*versionCode\s+\d+/m.test(s)||!/^\s*versionName\s+["'][^"']+["']/m.test(s))throw Error('Gradle version fields missing');
s=s.replace(/^(\s*versionCode\s+)\d+/m,(_,a)=>a+String(100000+buildNumber));
s=s.replace(/^(\s*versionName\s+)["'][^"']+["']/m,(_,a)=>a+'"1.1.78"');
fs.writeFileSync(gradle,s);
const manifest='android/app/src/main/AndroidManifest.xml';
let xml=fs.readFileSync(manifest,'utf8');
if(!xml.includes('android:name=".MainActivity"'))throw Error('Capacitor MainActivity missing');
if(!xml.includes('android:allowBackup="false"')){
  xml=xml.replace(/android:allowBackup="true"/,'android:allowBackup="false"');
}
if(!xml.includes('android:allowBackup='))xml=xml.replace('<application ','<application android:allowBackup="false" ');
if(!xml.includes('www.cuberoot-systems.com')){
  const filter='<intent-filter android:autoVerify="true">'+
  '<action android:name="android.intent.action.VIEW"/>'+
  '<category android:name="android.intent.category.DEFAULT"/>'+
  '<category android:name="android.intent.category.BROWSABLE"/>'+
  '<data android:scheme="https" android:host="www.cuberoot-systems.com" android:pathPrefix="/fidunio/join/"/>'+
  '</intent-filter>';
  xml=xml.replace('</activity>',filter+'</activity>');
}
fs.writeFileSync(manifest,xml);
JS
cat >> android/build.gradle <<'GRADLE'

buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.4'
    }
}
GRADLE
cat >> "$APP/build.gradle" <<'GRADLE'

apply plugin: 'com.google.gms.google-services'
GRADLE
echo "PASS: Android Firebase registration, invitation link, security and version wiring."
