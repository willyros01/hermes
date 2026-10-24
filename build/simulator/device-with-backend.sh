#!/usr/bin/env bash
# Called inside a disposable Android/iPhone emulator runner. Fail closed if the
# Firebase local Auth/Firestore/Storage services cannot be reached.
set -Eeuo pipefail
KIND="$1"
OUT="$2"
APP="$3"
[[ "$KIND" == android || "$KIND" == ios ]]
mkdir -p "$OUT"
test -s firebase.simulator.json
node --check build/simulator/device-run.mjs
node --check build/simulator/device-auth-run.mjs
node --check build/simulator/seed-native.mjs
node --check build/simulator/local-functions.mjs
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
./node_modules/.bin/firebase emulators:start \
  --config firebase.simulator.json \
  --only auth,firestore,storage \
  --project demo-fidunio-simulator-tests \
  > "$OUT/firebase-emulator.log" 2>&1 &
EMU_PID=$!
trap 'kill "$EMU_PID" 2>/dev/null || true; if [[ -n "${FN_PID:-}" ]]; then kill "$FN_PID" 2>/dev/null || true; fi' EXIT
for i in {1..90}; do
  if node -e 'const n=require("net");const s=n.connect(9099,"127.0.0.1");s.on("connect",()=>{s.destroy();process.exit(0)});s.on("error",()=>process.exit(1));setTimeout(()=>process.exit(1),700)' \
    && node -e 'const n=require("net");const s=n.connect(8080,"127.0.0.1");s.on("connect",()=>{s.destroy();process.exit(0)});s.on("error",()=>process.exit(1));setTimeout(()=>process.exit(1),700)' \
    && node -e 'const n=require("net");const s=n.connect(9199,"127.0.0.1");s.on("connect",()=>{s.destroy();process.exit(0)});s.on("error",()=>process.exit(1));setTimeout(()=>process.exit(1),700)'; then
    break
  fi
  if ! kill -0 "$EMU_PID" 2>/dev/null; then
    echo 'Firebase local emulator exited before the device tests.'
    tail -n 60 "$OUT/firebase-emulator.log"
    exit 1
  fi
  sleep 2
done
node -e 'const n=require("net");const s=n.connect(9099,"127.0.0.1");s.on("connect",()=>{s.destroy();process.exit(0)});s.on("error",()=>process.exit(1));setTimeout(()=>process.exit(1),700)'
echo "PASS: only local demo Firebase emulator ports are ready"
node build/simulator/local-functions.mjs > "$OUT/local-recovery.log" 2>&1 &
FN_PID=$!
for i in {1..30}; do
  if node -e 'const n=require("net");const s=n.connect(5001,"127.0.0.1");s.on("connect",()=>{s.destroy();process.exit(0)});s.on("error",()=>process.exit(1));setTimeout(()=>process.exit(1),700)'; then break; fi
  if ! kill -0 "$FN_PID" 2>/dev/null; then echo 'Local recovery shim failed'; exit 1; fi
  sleep 1
done
node build/simulator/seed-native.mjs "$OUT/native-fixture.json" 2>&1 | tee "$OUT/seed.log"
set +e
node build/simulator/device-run.mjs "$KIND" "$OUT" "$APP" > "$OUT/console.log" 2>&1
SMOKE_EXIT=$?
if [[ -f "$OUT/REPORT.md" ]]; then mv "$OUT/REPORT.md" "$OUT/PREAUTH-REPORT.md"; fi
node build/simulator/device-auth-run.mjs "$KIND" "$OUT/auth" "$APP" > "$OUT/auth-console.log" 2>&1
AUTH_EXIT=$?
set -e
{
  echo "# FIDUNIO native $KIND simulator: pre-auth and authenticated UI"
  echo
  echo "**Result: $([ "$SMOKE_EXIT" -eq 0 ] && [ "$AUTH_EXIT" -eq 0 ] && echo PASS || echo FAIL) — Both native phases required**"
  echo
  echo "- Pre-auth native status: $([ "$SMOKE_EXIT" -eq 0 ] && echo PASS || echo FAIL) — [pre-auth report](PREAUTH-REPORT.md)"
  echo "- Authenticated native status: $([ "$AUTH_EXIT" -eq 0 ] && echo PASS || echo FAIL) — [authenticated report](auth/REPORT.md)"
  echo "- Native Auth/Firestore/Storage: localhost demo project and original rules; recovery enroll local test shim only."
  echo "- No physical ADM/APNs notification delivery or biometric sensor proof."
  echo
  echo "## Actual device screen evidence"
  echo
  echo "See both pre-auth screenshots in this directory and authenticated screenshots under auth/."
} > "$OUT/REPORT.md"
if [[ "$SMOKE_EXIT" -ne 0 || "$AUTH_EXIT" -ne 0 ]]; then
  echo "Native $KIND test failures: pre-auth=$SMOKE_EXIT authenticated=$AUTH_EXIT"
  tail -n 38 "$OUT/auth-console.log"
  exit 1
fi
echo "PASS: native $KIND pre-auth AND authenticated UI journeys"
