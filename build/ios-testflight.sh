#!/usr/bin/env bash
# Owns one ephemeral generated Xcode project, key file, archive and export per CI run.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
for name in ASC_KEY_ID ASC_ISSUER_ID ASC_KEY_P8 APPLE_TEAM_ID RUNNER_TEMP GITHUB_RUN_NUMBER; do
  test -n "${!name:-}" || { echo "Missing $name"; exit 1; }
done
test "$APPLE_TEAM_ID" = VXMLKHF72B
umask 077
TASK_DIR="$(mktemp -d "$RUNNER_TEMP/fidunio-testflight.XXXXXX")"
export KEY="$TASK_DIR/AuthKey_${ASC_KEY_ID}.p8"
trap 'rm -f "$KEY"' EXIT
node --input-type=module -e 'import fs from "node:fs";fs.writeFileSync(process.env.KEY,process.env.ASC_KEY_P8,{mode:0o600});'
unset ASC_KEY_P8
export VERSION="$(node --input-type=module -e 'await import("./version.js");console.log(globalThis.FIDUNIO_RELEASE.version)')"
export BUILD="$GITHUB_RUN_NUMBER"
[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
[[ "$BUILD" =~ ^[0-9]+$ ]]
node build/asc.mjs check
node build/asc-build-status.mjs identity
npm ci --no-audit --no-fund
npm run ios:prepare
rm -rf ios
npx cap add ios
npx cap sync ios
node build/apply-ios-native-services.mjs
node build/apply-ios-export-compliance.mjs
node build/apply-ios-icon.mjs
PLIST=ios/App/App/Info.plist
/usr/libexec/PlistBuddy -c 'Add :NSCameraUsageDescription string FIDUNIO uses the camera when you choose to capture a photo or video for a message.' "$PLIST"
/usr/libexec/PlistBuddy -c 'Add :NSMicrophoneUsageDescription string FIDUNIO uses the microphone when you choose to record an audio or video message.' "$PLIST"
AUTH=(-allowProvisioningUpdates -authenticationKeyPath "$KEY" -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID")
xcodebuild archive -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$TASK_DIR/App.xcarchive" "${AUTH[@]}" \
  DEVELOPMENT_TEAM="$APPLE_TEAM_ID" CODE_SIGN_STYLE=Automatic CODE_SIGN_IDENTITY="-" \
  AD_HOC_CODE_SIGNING_ALLOWED=YES MARKETING_VERSION="$VERSION" CURRENT_PROJECT_VERSION="$BUILD" \
  > "$TASK_DIR/xcodebuild.log" 2>&1 || { tail -n 70 "$TASK_DIR/xcodebuild.log"; exit 1; }
export_options() {
cat > "$TASK_DIR/ExportOptions-$1.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>method</key><string>app-store-connect</string>
<key>destination</key><string>$1</string>
<key>teamID</key><string>VXMLKHF72B</string>
<key>signingStyle</key><string>automatic</string>
<key>uploadSymbols</key><true/>
<key>manageAppVersionAndBuildNumber</key><false/>
</dict></plist>
PLIST
}
export_options export
xcodebuild -exportArchive -archivePath "$TASK_DIR/App.xcarchive" \
  -exportOptionsPlist "$TASK_DIR/ExportOptions-export.plist" -exportPath "$TASK_DIR/export" \
  "${AUTH[@]}" >> "$TASK_DIR/xcodebuild.log" 2>&1 || { tail -n 70 "$TASK_DIR/xcodebuild.log"; exit 1; }
IPA="$(find "$TASK_DIR/export" -name '*.ipa' -print -quit)"
test -n "$IPA"
mkdir "$TASK_DIR/audit"
unzip -q "$IPA" -d "$TASK_DIR/audit"
APP="$(find "$TASK_DIR/audit/Payload" -maxdepth 1 -name '*.app' -print -quit)"
test -n "$APP"
pb() { /usr/libexec/PlistBuddy -c "Print :$1" "$APP/Info.plist"; }
test "$(pb CFBundleIdentifier)" = io.github.willyros01.fidunio
test "$(pb CFBundleDisplayName)" = FIDUNIO
test "$(pb CFBundleShortVersionString)" = "$VERSION"
test "$(pb CFBundleVersion)" = "$BUILD"
test "$(pb ITSAppUsesNonExemptEncryption)" = false
test "$(pb CFBundleIcons:CFBundlePrimaryIcon:CFBundleIconName)" = AppIcon
test -s "$APP/Assets.car"
codesign --verify --deep --strict "$APP"
codesign -dv "$APP" 2> "$TASK_DIR/signature.txt"
grep -qx 'TeamIdentifier=VXMLKHF72B' "$TASK_DIR/signature.txt"
security cms -D -i "$APP/embedded.mobileprovision" > "$TASK_DIR/profile.plist"
/usr/libexec/PlistBuddy -c 'Print :Entitlements:application-identifier' "$TASK_DIR/profile.plist" | grep -qx 'VXMLKHF72B.io.github.willyros01.fidunio'
/usr/libexec/PlistBuddy -c 'Print :Entitlements:get-task-allow' "$TASK_DIR/profile.plist" | grep -qx false
/usr/libexec/PlistBuddy -c 'Print :Entitlements:aps-environment' "$TASK_DIR/profile.plist" | grep -qx production
codesign -d --entitlements :- "$APP" > "$TASK_DIR/app-entitlements.plist" 2>/dev/null
/usr/libexec/PlistBuddy -c 'Print :aps-environment' "$TASK_DIR/app-entitlements.plist" | grep -qx production
test -s "$APP/GoogleService-Info.plist"
/usr/libexec/PlistBuddy -c 'Print :BUNDLE_ID' "$APP/GoogleService-Info.plist" | grep -qx 'io.github.willyros01.fidunio'
/usr/libexec/PlistBuddy -c 'Print :PROJECT_ID' "$APP/GoogleService-Info.plist" | grep -qx 'fidunio-fef13'
/usr/libexec/PlistBuddy -c 'Print :GOOGLE_APP_ID' "$APP/GoogleService-Info.plist" | grep -qx '1:130339622893:ios:929f4e431c91ef7ed0e1e4'
/usr/libexec/PlistBuddy -c 'Print :Entitlements:aps-environment' "$TASK_DIR/profile.plist" | grep -qx production
codesign -d --entitlements :- "$APP" > "$TASK_DIR/signed-entitlements.plist" 2>/dev/null
/usr/libexec/PlistBuddy -c 'Print :aps-environment' "$TASK_DIR/signed-entitlements.plist" | grep -qx production
node --input-type=module - "$APP" <<'JS'
import fs from "node:fs";
import path from "node:path";
const app=process.argv[2],list=fs.readFileSync("build/www-files.txt","utf8").split(/\r?\n/).map(x=>x.replace(/#.*$/,"").trim()).filter(Boolean);
for(const rel of list){
 const source=fs.readFileSync(path.join("www",rel)),packaged=fs.readFileSync(path.join(app,"public",rel));
 if(!source.equals(packaged))throw new Error("Packaged asset differs: "+rel);
}
console.log("PASS: all "+list.length+" shared web assets match the prepared payload");
JS
echo "PASS: signed FIDUNIO $VERSION ($BUILD), correct team/profile/bundle and encryption declaration"
export_options upload
xcodebuild -exportArchive -archivePath "$TASK_DIR/App.xcarchive" \
  -exportOptionsPlist "$TASK_DIR/ExportOptions-upload.plist" -exportPath "$TASK_DIR/upload" \
  "${AUTH[@]}" >> "$TASK_DIR/xcodebuild.log" 2>&1 || { tail -n 70 "$TASK_DIR/xcodebuild.log"; exit 1; }
echo "UPLOAD SUCCEEDED: FIDUNIO $VERSION ($BUILD); awaiting Apple processing"
node build/asc-build-status.mjs status
