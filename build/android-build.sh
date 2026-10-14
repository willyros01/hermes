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
java build/AndroidIcons.java icon-512.png android/app/src/main/res
bash build/android-sign.sh
trap 'rm -f android/app/fidunio-signing.p12 android/app/fidunio-sign.gradle android/app/google-services.json' EXIT
cd android
chmod +x gradlew
./gradlew --no-daemon assembleDebug
APK=app/build/outputs/apk/debug/app-debug.apk
test -s "$APK"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
test -n "$SDK"
SIGNER="$(find "$SDK/build-tools" -name apksigner -type f | sort -V | tail -1)"
test -n "$SIGNER"
"$SIGNER" verify --verbose "$APK"
ACTUAL="$("$SIGNER" verify --print-certs "$APK" | sed -n 's/^.*certificate SHA-256 digest: *//p' | head -1 | tr 'A-F' 'a-f')"
EXPECTED="$(keytool -list -v -keystore app/fidunio-signing.p12 -storetype PKCS12 -storepass "$FIDUNIO_ANDROID_PASSWORD" -alias fidunio | sed -n 's/^[[:space:]]*SHA256: *//p' | head -1 | tr -d ':' | tr 'A-F' 'a-f')"
test -n "$ACTUAL" && test "$ACTUAL" = "$EXPECTED" || { echo "::error title=APK signature mismatch::Signer differs from owner keystore"; exit 1; }
echo "PASS: FIDUNIO signed APK, certificate SHA256=$ACTUAL"
sha256sum "$APK"
