#!/usr/bin/env bash
# Fresh simulator, no account credentials or writes to the live backend.
set -Eeuo pipefail
TASK_DIR="$(mktemp -d "${RUNNER_TEMP:-/tmp}/fidunio-startup.XXXXXX")"
DEVICE="$(xcrun simctl list devices available -j | python3 -c 'import json,sys; rows=[d for key,ds in json.load(sys.stdin)["devices"].items() if "iOS" in key for d in ds if d.get("isAvailable") and "iPhone" in d["name"]]; print(rows[0]["udid"])')"
echo "Booting fresh iPhone simulator: $DEVICE"
xcrun simctl boot "$DEVICE" || true
xcrun simctl bootstatus "$DEVICE" -b
test -n "${FIDUNIO_SIMULATOR_APP:-}"
test -d "$FIDUNIO_SIMULATOR_APP"
echo 'Installing the already-compiled simulator app (no second compilation)'
xcrun simctl install "$DEVICE" "$FIDUNIO_SIMULATOR_APP"
echo 'Preparing screenshot text recognition'
cat > "$TASK_DIR/ReadScreen.swift" <<'SWIFT'
import Foundation
import Vision
let image=URL(fileURLWithPath:CommandLine.arguments[1])
let request=VNRecognizeTextRequest()
request.recognitionLevel = .accurate
try VNImageRequestHandler(url:image).perform([request])
let text=(request.results ?? []).compactMap{$0.topCandidates(1).first?.string}.joined(separator:"\n")
print(text)
exit(text.localizedCaseInsensitiveContains("Sign In") && text.localizedCaseInsensitiveContains("Email") && text.localizedCaseInsensitiveContains("Password") ? 0 : 1)
SWIFT
swiftc "$TASK_DIR/ReadScreen.swift" -o "$TASK_DIR/read-screen"
echo 'Launching FIDUNIO and checking for the sign-in form'
xcrun simctl launch "$DEVICE" io.github.willyros01.fidunio
mkdir -p startup-evidence
for attempt in {1..12}; do
  echo "Checking startup screen: attempt $attempt of 12"
  sleep 5
  xcrun simctl io "$DEVICE" screenshot startup-evidence/ios-startup.png
  if "$TASK_DIR/read-screen" startup-evidence/ios-startup.png > startup-evidence/screen-text.txt; then
    cat startup-evidence/screen-text.txt
    echo 'PASS: real iOS Simulator Capacitor cold launch reached the unauthenticated sign-in form'
    exit 0
  fi
done
cat startup-evidence/screen-text.txt
exit 1
