# FIDUNIO iOS pre-upload tests

## Authority and release order

Only `ios` may upload. The release marker starts TestFlight, which waits for all four required push workflows at the identical source commit. Failure, cancellation, absence or timeout blocks archive/upload. TestFlight secrets exist only in the signing/upload job. Test changes can run without changing the marker.

| Required workflow | Proof |
| --- | --- |
| ios-native-checks.yml | Platform boundaries, exact Capacitor pins, unchanged public Firebase config, no iOS Pages publication, native auth persistence and opaque 1024×1024 icon |
| rebuild-baseline-security.yml | Existing complete runtime/crypto/recovery/messaging/Outbox/attachment/receipt/deletion/PIN regression gates and isolated Firestore emulator authorization tests |
| ios-browser-release.yml | Chromium and WebKit execute prepared app assets with a native bridge flag and fresh storage: cold launch/reload, signed-out state, loaded logo, no horizontal overflow, auth tabs, password visibility, local validation, failed SDK load with recovery, 30-second stalled startup diagnostic, no auth bypass or web service worker; screenshots on failure |
| ios-capacitor-shell.yml | Fresh generated actual Capacitor iOS project, declaration and icon application, unsigned Simulator compilation, simulator install/launch and screenshot OCR proving Sign In/Email/Password appear |

After the gates, the existing archive audit verifies distribution signing/profile/team, bundle identifier, visible version/build, independent encryption declaration, compiled icon catalog reference, and all packaged web assets against the prepared payload. Apple processing must finish VALID. Build distribution and actual iPhone acceptance remain separate.

## Safe test boundaries

Browser tests serve only the prepared `www` allow-list. A server-only test override substitutes a demo Firebase configuration without editing `firebase-config.js` or packaged release assets. Browser requests may reach local assets and public gstatic SDK modules only; live Auth/Firestore/Storage/Functions/App Check requests are blocked. Tests submit no credentials, create no live users, and send no emails/messages. Existing emulator projects have `demo-` names. Simulator cold launch submits no account credentials.

The startup timeout owns only the initial startup host. It does not reset local PIN, account vault, E2EE identity or Outbox and does not start a second auth owner. Retry reloads the page. Browser tests deliberately reject/hang dependencies to verify those boundaries.

## Scorecard reference

Reviewed Scorecard main commit `8320c6cf02a9bbf38fa3fa7171235d2954f1d873`:

- [.github/workflows/ios-testflight.yml](https://github.com/willyros01/scorecard/blob/8320c6cf02a9bbf38fa3fa7171235d2954f1d873/.github/workflows/ios-testflight.yml): reusable required-tests dependency before Mac archive/upload; marker trigger.
- [.github/workflows/release-checks.yml](https://github.com/willyros01/scorecard/blob/8320c6cf02a9bbf38fa3fa7171235d2954f1d873/.github/workflows/release-checks.yml): Chromium/WebKit matrix, complete isolated rules/app tests and artifacts.
- [build/verify.sh](https://github.com/willyros01/scorecard/blob/8320c6cf02a9bbf38fa3fa7171235d2954f1d873/build/verify.sh): lock/pins, reproducible bundle, remote-code rejection, Capacitor consistency and export checks.
- [test/ops/run.sh](https://github.com/willyros01/scorecard/blob/8320c6cf02a9bbf38fa3fa7171235d2954f1d873/test/ops/run.sh): Auth/Firestore emulator isolation and aggregate failures.

Adapt the structure to FIDUNIO owners; do not copy Scorecard application tests/accounts/deletion operations or encryption determination. FIDUNIO currently imports public Firebase SDK modules from gstatic. Unlike Scorecard's bundled SDK it therefore still requires network access for SDK startup; the failed-load/stall tests expose this limitation. Bundling requires a separate approved implementation and SDK compatibility audit, not an unsupported claim that Hermes has no remote code.

## Coverage limits and open defects

No finite suite catches everything. This suite exercises unauthenticated startup and existing regression/emulator owners; it does not yet prove signed-in real iPhone E2EE continuity, production uploads, biometric/native push, native lifecycle/background behavior or external beta-review acceptance. IOS-STARTUP-001 and IOS-ICON-001 remain device-open until repeated user acceptance on the uploaded build.

Checkpoint: local module/platform/PIN/ownership/Apple-spec gates pass. Local browser process launch is sandbox-blocked; GitHub browser results pending. TestFlight run 37159557103 cancelled before signing/upload on the user's explicit request.


### Verified 1.1.57 pre-upload checkpoint — 2026-10-03

All four required workflows succeeded at `19d1a2911441913ad5c048bae839fd5b990d3b2e`: native preflight `37161083339`, complete security baseline `37161083345`, Chromium AND WebKit browser regression suite `37161083342`, and actual Capacitor iOS Simulator startup `37161083343`. Simulator OCR explicitly confirmed FIDUNIO 1.1.57 with Sign In/Email/Password; artifact `11287488574` stores screenshot and screen text. The apparent log stall was a redirected second compilation (23:20:45 → 23:24:33 UTC), not proof of an app hang. The workflow now installs its already-compiled simulator app and prints stage progress; test-only browser harness edits no longer request unnecessary Simulator recompilation. Those workflow changes must still pass the release's exact-commit checks.

The new release marker (revision 3) requests one gated 1.1.57 upload after all four checks at its source commit succeed. Cancelled run 2 submitted nothing. Upload/Apple processing/internal-group distribution results remain pending until verified. IOS-STARTUP-001 and IOS-ICON-001 stay user-device OPEN. This is no new acceptance credit and no change to main/production Firebase/App Check enforcement/E2EE protocols.

### Verified TestFlight release — 2026-10-03

The release gate was retried after the first native simulator runner timed out during Apple simulator boot. The retry passed and OCR confirmed the unauthenticated Sign In/Email/Password form. The gated archive then uploaded successfully as FIDUNIO 1.1.57 (3); Apple processing returned successfully. App Store Connect build `3984d17b-881b-4194-80db-62426eddfe32` is `Testing` and is assigned to `FIDUNIO Internal Testing` (1 tester, 2 builds). The external group remains at 0 builds pending its separate beta-review requirements. IOS-STARTUP-001 and IOS-ICON-001 remain open for real-iPhone acceptance.
