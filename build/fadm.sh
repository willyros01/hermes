#!/usr/bin/env bash
# FIDUNIO Android ADM — never publish with an absent or mismatched key.
set -Eeuo pipefail
umask 077
: "${FIDUNIO_ADM_API_KEY:?FIDUNIO_ADM_API_KEY must be configured in Hermes Actions secrets}"
[[ "${#FIDUNIO_ADM_API_KEY}" -ge 32 && ! "${FIDUNIO_ADM_API_KEY}" =~ [[:space:]] ]] || {
  echo "::error title=Invalid FIDUNIO ADM API key::Expected single-line Amazon-issued app API key"; exit 1;
}
mkdir -p android/app/libs android/app/src/main/assets
printf '%s' "$FIDUNIO_ADM_API_KEY" > android/app/src/main/assets/api_key.txt
chmod 600 android/app/src/main/assets/api_key.txt
DIR="$(mktemp -d)"
trap 'rm -rf "$DIR"' EXIT
curl -fLsS --retry 3 --connect-timeout 12 --max-time 120 \
  'https://amzndevresources.com/a3l/sdk/A3LMessaging_SDK_1.1.1.zip' -o "$DIR/a3l.zip"
unzip -tqq "$DIR/a3l.zip"
unzip -q "$DIR/a3l.zip" -d "$DIR/sdk"
AAR="$(find "$DIR/sdk" -type f -name A3LMessaging-1.1.1.aar -print -quit)"
test -n "$AAR" || { echo "::error title=Amazon A3L SDK::Official SDK archive missing AAR";exit 1; }
install -m 0600 "$AAR" android/app/libs/A3LMessaging-1.1.1.aar
node build/install-fidunio-adm.mjs
# Build orchestrator removes the app API key after Gradle compilation.
echo "PASS: FIDUNIO Android ADM A3L bridge prepared."
