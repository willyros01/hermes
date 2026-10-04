#!/usr/bin/env bash
# Test only: replace the entry page in a disposable simulator app copy. The
# release www payload and signed TestFlight archive never contain this fixture.
set -Eeuo pipefail
TASK_DIR=$(mktemp -d "${RUNNER_TEMP:-/tmp}/fidunio-photo.XXXXXX")
TASK_SERVER_PID=''
trap 'if [[ -n "$TASK_SERVER_PID" ]]; then kill "$TASK_SERVER_PID" 2>/dev/null || true; fi; rm -rf "$TASK_DIR"' EXIT
cp -R "$FIDUNIO_SIMULATOR_APP" "$TASK_DIR/Fixture.app"
/usr/libexec/PlistBuddy -c 'Add :NSAppTransportSecurity dict' "$TASK_DIR/Fixture.app/Info.plist" 2>/dev/null || true
/usr/libexec/PlistBuddy -c 'Set :NSAppTransportSecurity:NSAllowsArbitraryLoads true' "$TASK_DIR/Fixture.app/Info.plist" 2>/dev/null || /usr/libexec/PlistBuddy -c 'Add :NSAppTransportSecurity:NSAllowsArbitraryLoads bool true' "$TASK_DIR/Fixture.app/Info.plist"
node build/ios-attachment-fixture-server.mjs "$TASK_DIR" "$TASK_DIR/Fixture.app" > "$TASK_DIR/server.log" 2>&1 &
TASK_SERVER_PID=$!
for attempt in {1..10}; do [[ -f "$TASK_DIR/fixture-ready" ]] && break; sleep 1; done
test -f "$TASK_DIR/fixture-ready"
DEVICE=$(xcrun simctl list devices booted -j | python3 -c 'import json,sys; print(next(d["udid"] for ds in json.load(sys.stdin)["devices"].values() for d in ds if d["state"]=="Booted"))')
xcrun simctl terminate "$DEVICE" io.github.willyros01.fidunio || true
xcrun simctl install "$DEVICE" "$TASK_DIR/Fixture.app"
cat > "$TASK_DIR/ReadScreen.swift" <<'SWIFT'
import Foundation
import Vision
let request=VNRecognizeTextRequest()
request.recognitionLevel = .accurate
try VNImageRequestHandler(url:URL(fileURLWithPath:CommandLine.arguments[1])).perform([request])
let text=(request.results ?? []).compactMap{$0.topCandidates(1).first?.string}.joined(separator:"\n")
print(text)
exit(text.contains("PASS PHOTO") ? 0 : 1)
SWIFT
swiftc "$TASK_DIR/ReadScreen.swift" -o "$TASK_DIR/read-screen"
mkdir -p attachment-evidence
xcrun simctl launch "$DEVICE" io.github.willyros01.fidunio
for attempt in {1..12}; do
 sleep 3
 xcrun simctl io "$DEVICE" screenshot attachment-evidence/native-photo.png
 if "$TASK_DIR/read-screen" attachment-evidence/native-photo.png > attachment-evidence/screen-text.txt; then
  echo 'PASS: real CapacitorHttp GET -> adapter -> shared decrypt/integrity -> image decode'
  exit 0
 fi
done
cat attachment-evidence/screen-text.txt
cat "$TASK_DIR/server.log"
exit 1
