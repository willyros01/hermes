# FIDUNIO ios-shared - chromium simulated iPhone browser journey

**Result: PASS**

- Source: ios-shared checkout; real shared source and browser engine
- Firebase config: demo project only; gstatic SDK and localhost Auth emulator
- GitHub run: https://github.com/willyros01/hermes/actions/runs/40412652061

## Verified assertions reported by the existing browser suite

- PASS: chromium fresh Terms, disabled Accept, decline lock, read again, visible controls and acceptance before auth
- PASS: chromium native Firebase Auth local persistence survives reload against isolated Auth emulator
- PASS: chromium native cold startup/reload, auth tabs, password visibility, validation and no web service worker
- PASS: chromium cold Universal Link reaches shared Join screen with invitation token
- PASS: chromium warm Universal Link reaches shared Join screen with invitation token
- PASS: chromium Face ID-first unlock hides PIN and keeps blank/wrong PIN failures interactive
- PASS: chromium simulated Face ID failure exposes a usable PIN fallback
- PASS: chromium rejected SDK load reports failure and retry recovers without bypass
- PASS: chromium stalled startup is visible and cannot bypass authentication

## Browser screen captures

### chromium-load-failure.png

![chromium-load-failure.png](chromium-load-failure.png)

### chromium-sign-in.png

![chromium-sign-in.png](chromium-sign-in.png)

### chromium-terms.png

![chromium-terms.png](chromium-terms.png)

### chromium-unlock-pin-fallback.png

![chromium-unlock-pin-fallback.png](chromium-unlock-pin-fallback.png)

## Scope

This test exercises Terms, Join, startup, password visibility, invitation Universal Link simulation, PIN/biometrics mock failure, local cryptography storage, and safe startup recovery. It does not prove a real Face ID sensor or physical push receipt.
