#!/usr/bin/env node
// FIDUNIO Android input fixes (2026-11-24), installed into the Capacitor-generated
// project. Used by the signed APK build AND the simulator test build, so the
// tested app is the shipped app.
//  1. Camera: Android 11+ hides the camera app from FIDUNIO unless the manifest
//     declares it wants to use it; Capacitor then silently falls back to the
//     photo library. Declaring the camera intents restores "Take a Picture".
//  2. Keyboard GIFs/stickers: FidunioWebView accepts them in the message box.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const APP='android/app';
const pkg=APP+'/src/main/java/io/github/willyros01/fidunio/';
assert.ok(fs.existsSync(pkg+'MainActivity.java'),'Capacitor MainActivity missing');
fs.copyFileSync('android-src/native/FidunioWebView.java',pkg+'FidunioWebView.java');

const layoutDir=APP+'/src/main/res/layout';
fs.mkdirSync(layoutDir,{recursive:true});
fs.writeFileSync(layoutDir+'/capacitor_bridge_layout_main.xml',`<?xml version="1.0" encoding="utf-8"?>
<androidx.coordinatorlayout.widget.CoordinatorLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">
    <io.github.willyros01.fidunio.FidunioWebView
        android:id="@+id/webview"
        android:layout_width="fill_parent"
        android:layout_height="fill_parent" />
</androidx.coordinatorlayout.widget.CoordinatorLayout>
`);
const manifest=APP+'/src/main/AndroidManifest.xml';
let xml=fs.readFileSync(manifest,'utf8');
/* HELP: location, asked only when HELP is sent. */
for(const perm of ['android.permission.ACCESS_COARSE_LOCATION','android.permission.ACCESS_FINE_LOCATION']){
  if(!xml.includes('"'+perm+'"'))xml=xml.replace('<application','<uses-permission android:name="'+perm+'" />\n    <application');
}
if(!xml.includes('android.media.action.IMAGE_CAPTURE')){
  assert.equal(xml.split('<application').length,2,'Unexpected manifest');
  xml=xml.replace('<application','<queries>\n        <intent><action android:name="android.media.action.IMAGE_CAPTURE" /></intent>\n        <intent><action android:name="android.media.action.VIDEO_CAPTURE" /></intent>\n    </queries>\n    <application');
}
fs.writeFileSync(manifest,xml);
console.log('PASS: FIDUNIO Android camera choice and keyboard GIF/sticker support installed');
