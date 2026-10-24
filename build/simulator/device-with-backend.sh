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
./node_modules/.bin/firebase emulators:start \
  --config firebase.simulator.json \
  --only auth,firestore,storage \
  --project demo-fidunio-simulator-tests \
  > "$OUT/firebase-emulator.log" 2>&1 &
EMU_PID=$!
trap 'kill "$EMU_PID" 2>/dev/null || true' EXIT
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
node build/simulator/device-run.mjs "$KIND" "$OUT" "$APP" 2>&1 | tee "$OUT/console.log"
