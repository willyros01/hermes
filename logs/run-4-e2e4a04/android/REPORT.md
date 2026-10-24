# FIDUNIO Android native simulator report

**Result: FAIL — 0 passed, 1 failed**

- GitHub run: https://github.com/willyros01/hermes/actions/runs/40115750603
- Simulator: Pixel Android disposable debug app
- Source branch: Android (read-only source checkout)
- Backend: Firebase project demo-fidunio-simulator-tests; local emulators only
- No authenticated user, production message, real push receipt, or actual camera capture was exercised

## Step-by-step checks

```text
FIDUNIO ANDROID native simulator, disposable data only

S1: Real native cold start shows legal Terms before Firebase login
    Emulator OS dialog detected; selecting Wait to preserve the app
    Emulator OS dialog detected; selecting Wait to preserve the app
FAIL S1: Error: Android system warning covers the final screen capture
    at capture (file:///home/runner/work/hermes/hermes/build/simulator/device-run.mjs:39:39)
    at async file:///home/runner/work/hermes/hermes/build/simulator/device-run.mjs:110:5
    at async step (file:///home/runner/work/hermes/hermes/build/simulator/device-run.mjs:69:7)
    at async file:///home/runner/work/hermes/hermes/build/simulator/device-run.mjs:105:3

Stopped: Android system warning covers the final screen capture

FINAL 0 passed, 1 failed
```

## Actual device screen captures

## Coverage limitations

- This is a real native shell and WebView journey, but pre-auth only. Authenticated encrypted message flows are covered by separately labeled source/emulator tests.
- Native APNs/ADM/FCM delivery and push-tap routing cannot be proved on these disposable emulators.
- Biometric sensor success and camera picker handling require physical devices.
- The separate browser suite tests simulated biometric failure and PIN fallback.
