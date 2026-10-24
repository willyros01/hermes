# FIDUNIO — reusable simulator test record

**Scope:** Android/Fire-derived shared code, iOS shared code, disposable native Android and iPhone simulators, and the **local** Firebase emulator. This is a testing package; it does not build, upload, or publish a customer release.

**Baseline:** `willyros01/hermes`, release source `Android` at `f6f56055e6b3faae01319cfa370402843973ccb0`; iPhone source is checked out read-only from current `ios` for each run. The exact `ios` checkout SHA and all runner SHAs are preserved by GitHub Actions. This test infrastructure is committed **only** to branch `simulator-tests`; the result archive is **only** branch `simulator-evidence`.

**Status of this document:** A coverage register, not a claim that tests have passed. Each actual run creates its own `REPORT.md`, detailed logs, and screenshots. Always use the archived run report as the authoritative outcome.

## How to run

1. Open [FIDUNIO Simulator Suite](https://github.com/willyros01/hermes/actions/workflows/simulator-suite.yml).
2. Choose **Run workflow**, branch **`simulator-tests`**. Every push to the test harness also runs it automatically.
3. Open the completed run. Check all five jobs, including any red jobs; do not infer success from the archive job alone.
4. Open [simulator-evidence](https://github.com/willyros01/hermes/tree/simulator-evidence/logs). Choose that run's `logs/run-N-SHA/REPORT.md` and the actual PNG captures. Job artifacts contain all raw assertions and build/emulator logs.
5. Record the run number, source commits, five stage outcomes, and outstanding physical-device checks below or in a review issue. Never copy a prior run's PASS into a new run.

**No API keys, Firebase service account, Apple signing certificate, Android signing keystore, developer account, or real user's credentials are needed.** This suite refuses live Firebase endpoints. App builds are disposable simulator/debug binaries only.

## Test evidence and limits

| Evidence class | What an actual PASS proves | What it does **not** prove |
| --- | --- | --- |
| Reviewed source regressions | 131 shared/Android test files plus four iOS-specific test files execute from their correct source branches with zero failed exits, preserving individual logs | Real two-user chat, real network, physical sensors |
| Firebase rules emulator | 9 Firestore test files execute the repository's actual security rules against local demo Firestore | Deployed production rules or callable Cloud Functions behaving live |
| Chromium and WebKit | 4 browser/source combinations exercise startup, Terms, invitation deep links, authentication validation, PIN/biometric mocks, IndexedDB/E2EE initialization, and recovery behavior | The physical iPhone lock sensor or APNs |
| Android native simulator | Disposable Android app launches and traverses 7 pre-auth validation scenarios, with real PNG device captures | Amazon Fire HD ADM, notification receipt, real camera, signed APK installation |
| iPhone native simulator | Disposable iOS app launches and traverses 7 pre-auth validation scenarios, with real PNG device captures | TestFlight signing, Face ID hardware, APNs receipt, real microphone/camera |

## Functionality inventory

In this table **source** means regression checks; **rules** means genuine local Firebase rules; **browser** means browser-rendered UI simulation; **native pre-auth** means installed app on a simulator. A function's full real-world acceptance remains **NOT VERIFIED** until the relevant end-to-end/physical-device evidence exists. Rows do not imply an automatic PASS.

| FIDUNIO function | Automated coverage | Remaining end-to-end acceptance |
| --- | --- | --- |
| Terms of Use acceptance, refusal, persistence | Source + browser + both native pre-auth | Repeated install/update behavior on owned devices |
| Sign In, password visibility, Forgot Password validation | Source + browser + both native pre-auth | Real sign-in and real reset email |
| Invite code, Join, six-digit PIN enrollment | Source + browser + both native pre-auth | Actual invited second account enrollment |
| PIN unlock, app background/foreground, timeout | Source + browser mocked biometric fallback | Hardware PIN and lock-on-resume on iOS/Fire |
| Face ID/biometric-first, fallback to PIN | Source + browser plugin simulation | Actual Face ID/fingerprint success and cancellation |
| Local identity, E2EE enrollment and recovery | Source + browser local crypto/IndexedDB | Two-device verified message decryption and cloud recovery |
| Direct chat send, queued/sent/read, visibility | Source + Firestore rules | Two physical accounts, online/offline and background |
| Group creation, membership and shared history | Source + Firestore rules | Multiple accounts and devices, membership transitions |
| Direct and group E2EE and ciphertext-only writes | Source + Firestore rules | Peer-to-peer message display and delivery |
| Attachments: photo, video, audio, files | Source crypto/transport and policy tests | Real picker, recording, upload, decrypt, playback |
| Attachment offline/reconnect and Wi-Fi-only limit | Source | Physical Wi-Fi/cellular/Fire behavior |
| Offline Outbox, restart, replay and reconciliation | Source | Physical airplane-mode recovery and multi-device reconciliation |
| Message reaction, reply, delete for me/everyone | Source + Firestore rules for relevant authorization | Multiple physical participants confirming visibility |
| Conversation deletion, self-service account deletion | Source + Firestore rules | Coordinated backend cleanup on nonproduction test accounts |
| Disappearing messages and attachments | Source + rules | Multi-device elapsed-time persistence and purge |
| Block/unblock, abuse reporting | Source | Blocked recipient on real second account and reporting moderation |
| Notifications and lease safety, sender privacy | Source + platform adapter assertions | APNs, FCM and Amazon ADM delivery, notification tap-to-PIN |
| Large fonts, accessibility, light/dark settings | Source UI/settings checks | Device rendering, VoiceOver/TalkBack, persistence |
| Admin/owner permissions and account recovery | Source + Firestore rules where available | Authorized multi-role test accounts and functions |
| Storage/rules isolation and security | Source + local Firestore emulator | Deployed Storage/Auth/App Check configuration |
| App restart and return to Sign In | Browser + native pre-auth | Native signed production-package continuity |

## Execution record template

| Required detail | Value from the current run |
| --- | --- |
| Date (Toronto) | Pending first run |
| GitHub run number and URL | Pending first run |
| Simulator suite test-branch SHA | Pending first run |
| Android release-source base SHA | `f6f56055e6b3faae01319cfa370402843973ccb0` |
| iOS checkout SHA | Read from the run, not guessed |
| Source regression result | NOT RUN |
| Firebase emulator security rules | NOT RUN |
| Chromium/WebKit browser journeys | NOT RUN |
| Android native UI/screenshot evidence | NOT RUN |
| iPhone native UI/screenshot evidence | NOT RUN |
| Open functional defects | Update from full logs |
| Real-device acceptance | NOT VERIFIED by this suite |

## Result policy

- **PASS:** actual runner exit zero and its generated evidence agrees.
- **FAIL:** any assertion, compilation, emulator startup, or driver failure; preserve the failed screenshot and log.
- **NOT RUN:** absent runner or report, timed-out job before results, or missing screenshot evidence.
- **NOT VERIFIED:** feature beyond the simulator's demonstrated scope, even when its source regression passes.
- Android screenshots must also pass an OS-level accessibility check; a host-emulator launcher not-responding dialog is dismissed using **Wait**, or the capture is failed. Passing WebView/DOM assertions alone is insufficient when another OS window covers the app.
- Report failures individually. Never silently convert a failed capability into a skipped test.
- If the user authorizes application fixes, make them only on the separately agreed product branch with branch-specific release gates; this test branch must not deploy.

## Evidence privacy and repeatability

The test-only binary replaces only **generated** web copies of Firebase config with `demo-fidunio-simulator-tests`, uses `10.0.2.2` from Android / `127.0.0.1` from iPhone for local emulators, disables App Check **only inside those generated throwaway binaries**, and checks project ID at runtime. Actual source `firebase.js`, `firebase-config.js`, rules, backend and production release branches remain unchanged. Runs do not use real contacts or personal data. PNG files and logs live on the isolated evidence branch for review and future comparison.

## PDF record

The illustrated PDF is to be generated from an **actual** `simulator-evidence/logs/run-N-SHA/` run, not from mockup screens. Include a title page, outcome table, failures with links to detailed logs, full-sized phone screenshots with captions, coverage boundaries, and final acceptance checklist. Never substitute synthetic illustrations for simulator captures.
