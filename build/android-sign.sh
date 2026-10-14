#!/usr/bin/env bash
# Permanent, owner-controlled FIDUNIO Android certificate. Never mint a CI debug key.
set -euo pipefail
umask 077
: "${FIDUNIO_ANDROID_KEYSTORE_BASE64:?Missing Actions secret FIDUNIO_ANDROID_KEYSTORE_BASE64}"
: "${FIDUNIO_ANDROID_PASSWORD:?Missing Actions secret FIDUNIO_ANDROID_PASSWORD}"
APP=android/app
test -s "$APP/build.gradle"
printf '%s' "$FIDUNIO_ANDROID_KEYSTORE_BASE64" | base64 --decode > "$APP/fidunio-signing.p12"
chmod 600 "$APP/fidunio-signing.p12"
keytool -list -keystore "$APP/fidunio-signing.p12" -storetype PKCS12 -storepass "$FIDUNIO_ANDROID_PASSWORD" -alias fidunio >/dev/null 2>&1 || {
  echo "::error title=Android signing invalid::Keystore/password/alias mismatch"; exit 1;
}
cat > "$APP/fidunio-sign.gradle" <<'GRADLE'
android {
    signingConfigs {
        fidunioPermanent {
            storeFile file("fidunio-signing.p12")
            storePassword System.getenv("FIDUNIO_ANDROID_PASSWORD")
            keyAlias "fidunio"
            keyPassword System.getenv("FIDUNIO_ANDROID_PASSWORD")
            storeType "PKCS12"
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.fidunioPermanent
        }
    }
}
GRADLE
printf '\napply from: "fidunio-sign.gradle"\n' >> "$APP/build.gradle"
echo "FIDUNIO: stable signing identity verified."
