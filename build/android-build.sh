#!/usr/bin/env bash
# FIDUNIO Android: preserve iOS shared source, compile a separately signed APK.
set -euo pipefail
umask 077
test -n "${FIDUNIO_ANDROID_KEYSTORE_BASE64:-}" || { echo "::error title=Android signing missing::FIDUNIO_ANDROID_KEYSTORE_BASE64 not set"; exit 1; }
test -n "${FIDUNIO_ANDROID_PASSWORD:-}" || { echo "::error title=Android signing missing::FIDUNIO_ANDROID_PASSWORD not set"; exit 1; }
test -n "${FIDUNIO_GOOGLE_SERVICES_JSON_B64:-}" || { echo "::error title=Firebase Android config missing::FIDUNIO_GOOGLE_SERVICES_JSON_B64 not set"; exit 1; }
npm ci --no-audit --no-fund
npm install --no-save --no-package-lock --no-audit --no-fund @capacitor/android@8.5.2
npm run ios:prepare
node build/test-android.mjs
npx cap add android
npx cap sync android
bash build/android-native.sh
bash build/fadm.sh
java build/AndroidIcons.java icon-512.png android/app/src/main/res
bash build/android-sign.sh
trap 'rm -f android/app/fidunio-signing.p12 android/app/fidunio-sign.gradle android/app/google-services.json android/app/src/main/assets/api_key.txt' EXIT
cd android
chmod +x gradlew
./gradlew --no-daemon assembleDebug
APK=app/build/outputs/apk/debug/app-debug.apk
test -s "$APK"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
test -n "$SDK"
# Android rejects FIDUNIO if Wire is installed when Amazon A3L's
# default provider authority is present in BOTH packages. Verify the
# actual compiled APK, not merely the source manifest.
AAPT="$(find "$SDK/build-tools" -name aapt -type f | sort -V | tail -1)"
test -n "$AAPT" || { echo "::error title=Cannot verify APK manifest::Android aapt unavailable"; exit 1; }
MANIFEST_DUMP="$("$AAPT" dump xmltree "$APK" AndroidManifest.xml)"
if ! printf '%s\n' "$MANIFEST_DUMP" | grep -F 'android:authorities' | grep -Fq 'io.github.willyros01.fidunio.a3l-init'; then
  echo "::error title=Amazon ADM provider conflict::Compiled APK missing unique FIDUNIO A3L authority"
  exit 1
fi
if printf '%s\n' "$MANIFEST_DUMP" | grep -F 'android:authorities' | grep -Fq 'com.amazon.A3L.messaging.util.A3LMessagingInitProvider'; then
  echo "::error title=Amazon ADM provider collision::Compiled APK still uses Wire's fixed A3L authority"
  exit 1
fi
echo "PASS: FIDUNIO Amazon A3L provider authority does not collide with Wire."
SIGNER="$(find "$SDK/build-tools" -name apksigner -type f | sort -V | tail -1)"
test -n "$SIGNER"
"$SIGNER" verify --verbose "$APK"
ACTUAL="$("$SIGNER" verify --print-certs "$APK" | sed -n 's/^.*certificate SHA-256 digest: *//p' | head -1 | tr 'A-F' 'a-f')"
EXPECTED="$(keytool -list -v -keystore app/fidunio-signing.p12 -storetype PKCS12 -storepass "$FIDUNIO_ANDROID_PASSWORD" -alias fidunio | sed -n 's/^[[:space:]]*SHA256: *//p' | head -1 | tr -d ':' | tr 'A-F' 'a-f')"
test -n "$ACTUAL" && test "$ACTUAL" = "$EXPECTED" || { echo "::error title=APK signature mismatch::Signer differs from owner keystore"; exit 1; }
echo "PASS: FIDUNIO signed APK, certificate SHA256=$ACTUAL"
sha256sum "$APK"
