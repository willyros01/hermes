#!/usr/bin/env bash
# No live project, no release branch modifications, no app package distribution.
set -Eeuo pipefail
if [[ "${FIREBASE_AUTH_EMULATOR_HOST:-}" != 127.0.0.1:9099 || "${FIRESTORE_EMULATOR_HOST:-}" != 127.0.0.1:8080 ]]; then
  echo 'Refusing authenticated simulation outside demo-only local Firebase emulators' >&2
  exit 2
fi
mkdir -p out-fidunio/functional
status=0
node build/simulator/run-functional.mjs out-fidunio/functional/android . chromium Android-shared || status=1
node build/simulator/run-functional.mjs out-fidunio/functional/ios ios-src webkit ios-shared || status=1
node build/simulator/run-functional.mjs out-fidunio/functional/web-chromium web-src chromium Web-main3-Chromium || status=1
node build/simulator/run-functional.mjs out-fidunio/functional/web-webkit web-src webkit Web-main3-WebKit || status=1
node build/simulator/index-functional.mjs out-fidunio/functional || status=1
exit "$status"
