#!/usr/bin/env bash
# Investigation only: local demo Firebase emulators + seed, then the gesture probe.
set -Eeuo pipefail
OUT="$1"; APK="$2"; mkdir -p "$OUT"
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
./node_modules/.bin/firebase emulators:start --config firebase.simulator.json --only auth,firestore,storage \
  --project demo-fidunio-simulator-tests > "$OUT/firebase-emulator.log" 2>&1 &
EMU=$!; trap 'kill $EMU 2>/dev/null || true; kill ${FN:-0} 2>/dev/null || true' EXIT
up(){ node -e 'const s=require("net").connect(+process.argv[1],"127.0.0.1");s.on("connect",()=>process.exit(0));s.on("error",()=>process.exit(1));setTimeout(()=>process.exit(1),700)' "$1"; }
for i in {1..90}; do up 9099 && up 8080 && up 9199 && break; sleep 2; done
up 8080
node build/simulator/local-functions.mjs > "$OUT/local-recovery.log" 2>&1 & FN=$!
for i in {1..30}; do up 5001 && break; sleep 1; done
node build/simulator/seed-native.mjs "$OUT/native-fixture.json"
node build/gestures/probe.mjs "$OUT" "$APK" 2>&1 | tee "$OUT/console.log"
