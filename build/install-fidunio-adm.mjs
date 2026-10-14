#!/usr/bin/env node
// Install the Fire-only ADM bridge into Capacitor-generated Android sources.
// Only called after the owner-provided FIDUNIO API key and official A3L AAR
// are validated. A staging error aborts the signed APK build.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const APP='android/app';
function need(path){assert.ok(fs.existsSync(path)&&fs.statSync(path).size>0,'Missing ADM requirement: '+path);}
const aar=APP+'/libs/A3LMessaging-1.1.1.aar';
const key=APP+'/src/main/assets/api_key.txt';
need(aar);need(key);
const admKey=fs.readFileSync(key,'utf8');
assert.ok(admKey.length>=32&&!/\s/.test(admKey),'Invalid FIDUNIO ADM key');
const pkg=APP+'/src/main/java/io/github/willyros01/fidunio/';
need(pkg+'MainActivity.java');
for(const name of ['FidunioAdmPlugin.java','FidunioAdmService.java']){
  need('android-src/native/'+name);
  fs.copyFileSync('android-src/native/'+name,pkg+name);
}
function patch(path,anchor,replacement){
  const contents=fs.readFileSync(path,'utf8');
  assert.equal(contents.split(anchor).length,2,'Unexpected native anchor: '+path);
  fs.writeFileSync(path,contents.replace(anchor,replacement));
}
patch(pkg+'MainActivity.java',
  'public class MainActivity extends BridgeActivity {}',
  'public class MainActivity extends BridgeActivity {\n'+
  '  @Override public void onCreate(android.os.Bundle state) {\n'+
  '    registerPlugin(FidunioAdmPlugin.class);\n'+
  '    super.onCreate(state);\n'+
  '  }\n'+
  '  @Override protected void onNewIntent(android.content.Intent intent) {\n'+
  '    super.onNewIntent(intent);\n'+
  '    setIntent(intent);\n'+
  '  }\n'+
  '}');
const manifest=APP+'/src/main/AndroidManifest.xml';
patch(manifest,'</application>',
  '    <receiver android:name=".FidunioAdmService" android:exported="false" android:enabled="true">\n'+
  '      <intent-filter>\n'+
  '        <action android:name="com.amazon.A3L.messaging.intent.REGISTRATION"/>\n'+
  '        <action android:name="com.amazon.A3L.messaging.intent.MESSAGE"/>\n'+
  '      </intent-filter>\n'+
  '    </receiver>\n'+
  '    <meta-data android:name="com.a3l.clsName" android:value="io.github.willyros01.fidunio.FidunioAdmService"/>\n'+
  '</application>');
const gradle=APP+'/build.gradle';
patch(gradle,'dependencies {',
  "dependencies {\n"+
  "    implementation files('libs/A3LMessaging-1.1.1.aar')\n"+
  "    implementation 'com.google.firebase:firebase-messaging:23.0.0'");
console.log('PASS: Amazon ADM native bridge installed without altering Google Android FCM ownership.');
