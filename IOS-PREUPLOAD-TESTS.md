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


## FIDUNIO 1.1.59 — pre-emptive startup/auth/recovery transition hardening — 2026-10-03

This checkpoint supersedes the earlier 1.1.58 implementation and extends the 1.1.59 adapter correction under the Hermes minimum-drift rules. The user explicitly authorized pre-emptive code changes so TestFlight acceptance is not forced to discover startup, login and recovery failures one screen at a time.

Architecture: `firebase-platform-adapter.js` is the bounded owner of web-vs-native Firebase bootstrap policy. Shared `firebase.js` no longer branches on iOS. Web remains Firebase JS 12.18.0 + `getAuth(app)`; iOS uses Firebase JS 12.19.0 + `initializeAuth(app,{persistence:browserLocalPersistence})` with no popup/redirect resolver. PIN, account E2EE, recovery callables, identity/keyId, Firestore schemas and cryptographic algorithms remain shared and unchanged.

Transition hardening: `auth-ui-clean.js` now separates Firebase credential authentication from post-auth E2EE/application activation; separates successful PIN recovery from subsequent `startApp()`; separates successful invitation redemption from subsequent secure startup; and makes application startup retry-safe. `appStarted` is not set until the complete `app.js` module graph imports successfully, and a failed import clears the in-flight startup promise so Retry Opening FIDUNIO can genuinely retry. Once Firebase authentication succeeds, a later E2EE/startup failure is explicitly reported as an authenticated transition failure and is not relabeled as invalid credentials. Once recovery succeeds, a later parser/startup failure is not relabeled as failed recovery. Once a one-time invitation creates the account, a later secure-startup failure retries the authenticated transition rather than redeeming the invitation again.

IOS-AUTH-002 evidence correction: the 1.1.57 recovery button catch enclosed both `recoverAccountE2EE()` and the later `startApp()` dynamic import. Therefore the observed JavaScriptCore `Invalid escape in identifier: '\\'` message did not prove the cryptographic recovery operation itself failed; it could have been emitted by post-recovery application startup. The defects remain open until real-device proof.

Pre-upload gates now additionally require: the Firebase platform-adapter contract; no native branch/persistence policy inside shared `firebase.js`; separate retry-safe auth/recovery/enrollment/startup boundaries; Chromium and WebKit parsing of the post-auth `app.js` graph; and a WebKit P-256 private CryptoKey -> IndexedDB -> read-back -> ECDH-use round trip matching FIDUNIO local E2EE storage. The complete existing recovery/crypto/Firestore/emulator baseline remains required. No production Firebase/App Check enforcement or `main` branch change is included.

Status: IOS-AUTH-002 and IOS-AUTH-003 are OPEN / IMPLEMENTED CANDIDATE, not device-accepted. Required workflows must pass on the exact final release-marker commit before upload. Device exit criteria remain first sign-in -> missing-local recovery -> correct existing PIN -> same identity/messages -> close/restart -> retained authenticated session -> correct secure unlock/startup without credential, parser or recovery misclassification.


### 1.1.59 platform-boundary completion — startup/background adapters and hydration readiness

The pre-emptive migration pass also closes two additional boundary gaps. First, the web Service Worker is no longer selected or registered directly by shared `app.js` or by bootstrap platform conditionals. `background-platform-adapter.js` now provides one shared registration/background-message contract: web owns the real Service Worker; native iOS is an explicit no-op stand-in until the APNs/FCM implementation supplies the same contract. It does not fake `navigator.serviceWorker`. `startup-platform-adapter.js` owns the iOS-only startup timeout/failure presentation, while `bootstrap.js` remains the shared startup sequencer.

Second, importing `app.js` alone was not sufficient proof of startup because the module invoked async `initApp()` without exposing/awaiting its result. `app.js` now exports `FIDUNIO_APP_READY=initApp()`; the auth gate awaits that existing local-first hydration promise before setting `appStarted=true`. This covers interrupted vault recovery, persisted state, cloud-history cache and Outbox restoration. The existing Firebase synchronization layer remains intentionally non-blocking after local hydration. Browser release regression now awaits the same readiness promise.

Permanent gates protect these boundaries: shared `app.js` has no Service Worker registration API; bootstrap has no iOS/service-worker platform decision; the background and startup adapters own those differences; notification N3/N5 tests point to the adapter owner; and authenticated startup cannot report success before `FIDUNIO_APP_READY` resolves. Native biometric/Keychain/APNs functionality remains a later adapter implementation and is not falsely claimed by this checkpoint.


### 1.1.59 pre-upload hardening addendum — complete syntax + persisted-auth proof

During the pre-emptive implementation pass, repository inspection caught a literal `\\n` token accidentally present between JavaScript declarations in the in-development `auth-ui-clean.js`. It was introduced after the 1.1.57 TestFlight commit and therefore is **not** claimed as the historical cause of IOS-AUTH-002, but it demonstrates the same JavaScriptCore parser-error class and was removed before any accepted 1.1.59 release. A new permanent `build/ios-runtime-syntax.test.mjs` parses every JavaScript file in the iOS package allow-list; both native preflight and the complete baseline require it.

The browser release matrix now also starts the isolated Firebase Authentication emulator under demo project `demo-fidunio-ios-auth`. Chromium and WebKit initialize Firebase Auth through the same native platform adapter used by FIDUNIO, create an emulator-only email/password account, reload, wait for Auth initial state to settle, and require the identical UID to be restored before signing the test account out. This specifically covers IOS-AUTH-003's restart/persistence boundary without production credentials or production Firebase writes. Existing P-256 CryptoKey/IndexedDB round-trip, post-auth `app.js` graph/readiness, startup failure/retry, full recovery/security baseline and real iOS Simulator cold-start gates remain required.

No new TestFlight release marker is authorized by this addendum. The current source must first pass the required push workflows; IOS-AUTH-002 and IOS-AUTH-003 remain OPEN / IMPLEMENTED CANDIDATE until a subsequently gated TestFlight build passes the real-device sequence.


## Pre-auth Terms consolidated repair candidate — 2026-10-04

Base: ios `40d50a9e246fc53fce75ac401098fcddc692914a`. No release version change yet.
The legal wiring gate expected the obsolete heading `No warranty`; it now checks the retained warranty disclaimer. The browser helper raced the legal-module import and now waits for either Terms or sign-in. A real startup presentation regression was also found: Terms replaced the original startup host, so the watchdog could not show SDK-failure/retry UI. Bootstrap now suspends its watchdog while the user reads/declines Terms, explicitly restores its own startup host after acceptance, and starts a fresh bounded watchdog before account/auth initialization. Shared business logic and Firebase owners are unchanged.

Terms uses a bounded scroll area with visible decision controls; browser journeys assert disabled Accept, decline lock, read again, acceptance before auth, 45 seconds of reading without auth initialization, initial iPhone control bounds, reload/persistence, failed SDK/retry and stalled startup. The native artifact from run 37257137156 showed Terms but controls below the viewport; compilation passed and the step hit its 12-minute infrastructure timeout. The native step now allows 20 minutes and is accurately named Terms startup. Native OCR still requires Terms, checkbox wording, Accept and Decline.

Local legal wiring, platform boundaries, auth transitions, native bootstrap and all 91 packaged JavaScript syntax checks passed. Local Chromium launch is blocked by the macOS sandbox (MachPort permission denied); browser and simulator results must be established by the automatic GitHub push workflows. No device acceptance is claimed. No production main/main2, backend, enforcement, APNs, account/E2EE identity, or TestFlight trigger changed. After all required repair checks pass, update version.js once to trigger the existing automatic exact-commit gated TestFlight workflow; do not dispatch manually. Synchronization is deferred at the user's direction.
