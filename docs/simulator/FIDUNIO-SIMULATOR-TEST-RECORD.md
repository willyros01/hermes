# FIDUNIO — reusable simulator test record

**Scope:** Android/Fire-derived shared code, iOS shared code, disposable native Android and iPhone simulators, and the **local** Firebase emulator. This is a testing package; it does not build, upload, or publish a customer release.

**Baseline:** `willyros01/hermes`, release source `Android` at `f6f56055e6b3faae01319cfa370402843973ccb0`; iPhone source is checked out read-only from current `ios` for each run. The exact `ios` checkout SHA and all runner SHAs are preserved by GitHub Actions. This test infrastructure is committed **only** to branch `simulator-tests`; the result archive is **only** branch `simulator-evidence`.

**Status of this document:** A coverage and execution register. Actual GitHub runs now exist; the latest verified run and the earlier failures are documented below. Each run creates its own `REPORT.md`, detailed logs, and screenshots. Always use the archived run report as the authoritative outcome.

## How to run

1. Open [FIDUNIO Simulator Suite](https://github.com/willyros01/hermes/actions/workflows/simulator-suite.yml).
2. Choose **Run workflow**, branch **`simulator-tests`**. Every push to the test harness also runs it automatically.
3. Open the completed run. Check all **six verification jobs**, including the new authenticated two-source functional stage; do not infer success from the archive job alone.
4. Open [simulator-evidence](https://github.com/willyros01/hermes/tree/simulator-evidence/logs). Choose that run's `logs/run-N-SHA/REPORT.md` and the actual PNG captures. Job artifacts contain all raw assertions and build/emulator logs.
5. Record the run number, source commits, all six stage outcomes, and outstanding physical-device checks below or in a review issue. Never copy a prior run's PASS into a new run.

**No API keys, Firebase service account, Apple signing certificate, Android signing keystore, developer account, or real user's credentials are needed.** This suite refuses live Firebase endpoints. App builds are disposable simulator/debug binaries only.

## Test evidence and limits

| Evidence class | What an actual PASS proves | What it does **not** prove |
| --- | --- | --- |
| Reviewed source regressions | 131 shared/Android test files plus four iOS-specific test files execute from their correct source branches with zero failed exits, preserving individual logs | Real two-user chat, real network, physical sensors |
| Firebase rules emulator | 9 Firestore test files execute the repository's actual security rules against local demo Firestore | Deployed production rules or callable Cloud Functions behaving live |
| **Authenticated FIDUNIO workflows (NEW)** | In both Android-shared Chromium and iOS-shared WebKit, fresh synthetic Owner/Admin/Users use the actual FIDUNIO client APIs to issue/redeem invitations, create direct and group records, exercise role boundaries, reactions, disappearing-message metadata, receipts, blocks, notification-device sender privacy, abuse reporting and user suspension against local Auth and Firestore | Physical/native chat screen rendering; real message cryptography (the transport envelope fixture is synthetic), APNs/ADM/FCM arrival, Cloud Function delivery and deletion |
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

## Expanded exhaustive functionality register — requested coverage

**The following are all separate checks.** `FN-NNN` identifies the new cross-user Auth/Firestore emulator API runner; source suites and Firebase rules have their own results. When a feature says *source*, it means code-level validation, **not** that it was exercised on a physical handset. The suite keeps `NOT VERIFIED` for capabilities requiring real hardware or providers. An FN case is **not** PASS until its latest GitHub run has actually finished green.

| ID | Function or setting to verify | Automated evidence now available | Still NOT VERIFIED by simulation |
| --- | --- | --- | --- |
| A01 | Send User invitation: owner | FN-001/002, invitation-policy, invitation rules | Mail/message app sharing to recipient |
| A02 | Send Admin invitation: owner | FN-002, invitation rules | Actual email/share recipients |
| A03 | Send invitation: Admin, deny ordinary User | FN-003, invitation-policy | Native share sheet |
| A04 | Consume invite; create Auth account and enrolled profile | FN-002, invitation rules | Real Join PIN/E2EE enrollment on hardware |
| A05 | Reject reused, revoked, expired, invalid invite | FN-003, invitation-policy | Deep-link expiry on handset |
| A06 | Invite Universal Link on Android/iOS | invitation-install-closeout, platform tests, pre-auth browser | Install→open→join on physical devices |
| A07 | Sign-in, sign-out, wrong password, password visibility | FN-001, existing browser and source tests | Full account-vault roundtrip on device |
| A08 | Forgot/change password, PIN/E2EE recovery | forgot-password-recovery, password-change-integration, account crypto tests | Email arrival and recovery after device change |
| A09 | Legal terms: accept, refuse, reopening | native and browser journeys, legal-policy tests | Cross-install acceptance history |
| A10 | PIN create/change/remove; inactivity lock | existing source/browser tests | Real background/resume and timing |
| A11 | Face ID/biometric first, cancel, PIN fallback | biometric-unlock, iOS and browser mock tests | Physical Face ID/fingerprint sensor |
| D01 | New direct chat, peer lookup and isolation | FN-004, firestore rules | Both users' fully rendered chat screen |
| D02 | Direct E2EE v3 transport and ciphertext-only storage | FN-005 synthetic envelope, E2EE source/rules | Actual key agreement and decrypt on two devices |
| D03 | Queued→Sent→Delivered→Read and visibility | FN-005, read-visibility-regression, receipt tests | Screen-minimized and real delivered UI |
| D04 | Direct replies, message reply bubble | group-reply and direct-message source suites | Two signed-in device screens |
| D05 | Emoji reactions: six allowed, change/remove, reject others | FN-005, reaction policy/rules | Tap picker and other person's live reaction view |
| D06 | Delete for me, everyone; pending cancel | message-delete core, pending-message-delete, rules | Live callable deletion and remote result |
| D07 | Delete/archive entire conversation, bulk delete | conversation-delete, mass-message-delete, rules | Cloud Function cleanup and UI after reload |
| D08 | Block, denied delivery, unblock | FN-006, firestore-user-block, safety tests | Physical recipient push suppression |
| D09 | Report abuse, administrator list/resolution | FN-011, firestore-abuse-report, display tests | Actual moderation UX and closeout |
| G01 | New group: name, creator, at least two other users | FN-007, group-e2ee rules | Native member selector and chat UX |
| G02 | Group-admin rename allowed, member rename denied | FN-008, group-e2ee rules | Native group info controls |
| G03 | Add/remove member, admin/owner rules, rotate E2EE epoch | group-membership-lifecycle, group E2EE source/rules | End-to-end rotated key and revoked member access |
| G04 | Owner cannot be removed/leave prematurely | FN-008, group E2EE source tests | Device group info permissions |
| G05 | Group encrypted send/receive | FN-009 synthetic envelope, group crypto source/rules | Three-way actual decrypt/display |
| G06 | Group Delivered/Read and reaction add/remove | FN-009, group receipt/reaction source/rules | Multi-device visibility receipt accuracy |
| G07 | Group reply and sender name/time/date separators | group-reply, group-sender, group-date tests | Live visual conversation flow |
| G08 | New member history starts at join; grant earlier history | group-history tests, group rules | Complete grant/decryption/re-key UX |
| G09 | Leave group and former-member denial | group-membership source/rules | Native leave and push stop |
| M01 | Set disappearing period independently per direct chat | FN-005 metadata, disappearing compose/preferences tests | Timed cross-device purge |
| M02 | Set disappearing period independently per group | FN-009 metadata, disappearing compose/preferences tests | Timed cross-device purge |
| M03 | Local and server expiry, queued messages, attachments | disappearing purge/reconnect/multi-device suites | Wall-clock expiry and cloud purge Function |
| M04 | Photo gallery/camera, attachment compression | attachment-source and media viewer tests | Hardware picker/camera/image display |
| M05 | Audio record/upload/playback | audio-source-recorder, attachment source tests | Physical microphone and player |
| M06 | Video/file attach, share/download/save/open | attachment policy/source tests | Native picker and download destinations |
| M07 | Offline outbox, LTE, reconnect, retry after restart | outbox and LTE suites | Airplane-mode test on real devices |
| S01 | Appearance: Auto/Light/Dark with persistence | release-candidate-ui, settings lifecycle source checks | Real platform theme-change and restore |
| S02 | Text sizes A/A+/A++ | release-candidate-ui, iPad UI source checks | Physical font/render accessibility |
| S03 | Notification previews enabled/disabled | settings UI/source tests, notification policy | Actual lock-screen privacy |
| S04 | Sender-name notification privacy toggle | FN-010, notification rules | APNs/ADM/FCM banner text on handset |
| S05 | Notification device register, update, delete, account isolation | FN-010, notification rules | Physical token and lease confirmation |
| S06 | Native notification lease/revoke, sign-out cleanup | lease/policy/source tests | Live callable + ADM/APNs provider reception |
| S07 | Direct/group push, muted/background, tap→PIN/Face ID | notification route and core source tests | Real hardware provider and navigation |
| S08 | Wi-Fi-only large attachments, cellular warning | large-attachment-network-policy tests | Wi-Fi/cellular detection on device |
| S09 | Auto-lock timeout, lock now, PIN vs biometric | local-security source tests | Native background timing |
| S10 | Signed-in profile name/email/password, version label | settings lifecycle, password tests, FN-001 | Profile UI/password email change end to end |
| S11 | Admin user suspend/restore/expiry | FN-012, account access rules | Live admin console UX |
| S12 | Owner transfer/admin recovery | system-ownership and admin-recovery suites | Live callable and new-owner login |
| S13 | Self account deletion, cancellation, backend cleanup | account-deletion core/rules/wiring | Controlled full deletion Function |
| S14 | Dark mode, app rotation, iPad layout, VoiceOver | iPad release UI source and browser tests | Physical iPhone, iPad and Fire tablet review |

**Careful interpretation:** The new FN checks deliberately invoke the real application transport methods and actual local rules. Their message envelope values are *synthetic*; the separate encryption tests verify crypto logic. A real APNs/ADM notification or an actual disappearing-message purge is not inferred from a saved Firestore field. Every row's physical/remote column stays **NOT VERIFIED** until specifically signed off with that evidence.

## Reusable real-device acceptance checklist (not executed by this simulator)

Keep this list with the simulator record; check an item **PASS** only after collecting a dated screenshot, device/build version, test accounts, and the actual outcome. For a failure, retain the unexpected screen and do not mark it complete. Use authorized nonproduction accounts and test-only data.

1. **Invites, enrollment, and login:** Invite two fresh test accounts; join on iOS and Android; enforce a unique six-digit PIN and recover from an incorrect password without exposing an account.
2. **Direct encrypted chat:** Send text in both directions; verify ciphertext-at-rest, Queued → Sent → Read transitions, background/minimized view protection, and read only after the message is genuinely visible.
3. **Group encrypted chat:** Create a group of three accounts; test join, add/remove, message delivery, authorization of former members, history, and group notifications.
4. **Replies and message controls:** React, reply, delete for me, delete for everyone, delete a conversation, and verify effects from the other account and after relaunch.
5. **Camera, microphone, and files:** Capture a photo and record audio on each device; attach an existing image, video, and file; verify remote decrypt/open/playback, file limits, and failure handling.
6. **Offline and reconnect:** Turn Wi-Fi off mid-send; queue multiple messages/attachments; restart the app; reconnect; confirm exactly-once replay and accurate status transitions.
7. **Disappear and block:** Set per-conversation disappearance; check expiry on both devices; block, attempt to send, unblock and recover; confirm Report Abuse is correctly formatted and authorized.
8. **Native push and privacy:** For iOS APNs, Android FCM where supported, and Amazon Fire ADM, verify foreground/background delivery, no stale-session token delivery, sender-name preference, notification tap-to-PIN, and logout revocation.
9. **Lock and accessibility:** On hardware, check Face ID/fingerprint first, canceled/failing biometric fallback to PIN, wrong PIN rejection, background lock, A/A+/A++, screen reader and light/dark/auto persistence.
10. **Recovery, moderation, deletion:** Verify identity/E2EE recovery using another device; role-restricted admin actions, self-delete authorization, cleanup and encryption-safe backup/restore.
11. **Release-package checks:** Install an actual signed APK and a TestFlight build; check update/reinstall, rotation, app resume, deep links, app version, and crash-free behavior. These are never inferred from an unsigned simulator build.

All eleven acceptance groups remain **NOT VERIFIED by this automated suite**. They are an explicit follow-up gate, not hidden omissions.

## Execution history — 24 October 2026 (Toronto)

The report must distinguish automated test exit status from **readable screen evidence**. A source-level PASS cannot substitute for real app screenshots or a physical-device test.

| Run | Actual results | Evidence lesson |
| --- | --- | --- |
| [40113305588](https://github.com/willyros01/hermes/actions/runs/40113305588) | Nine Firebase suites PASS; Android and iPhone native pre-auth PASS (7/7 each), with 10 clear phone PNGs each; only part of the source/browser matrix completed | Initial discovery: four iOS-only regression files must execute against `ios`, not Android; browser scenarios need isolated test accounts |
| [40114062428](https://github.com/willyros01/hermes/actions/runs/40114062428) | 135/135 reviewed source files PASS; nine Firebase suites PASS; both native phone stages PASS; browser matrix FAIL | Auth emulator reused an earlier email; fixed by unique per-scenario synthetic accounts |
| [40114605659](https://github.com/willyros01/hermes/actions/runs/40114605659) | Five GitHub stages exited PASS: 135 source files, nine rules files, four browser cases and 7/7 native checks per platform | Subsequent visual review rejected Android image evidence: the host's `Pixel Launcher isn't responding` dialog covered screenshots despite WebView assertions passing |
| [40115750603](https://github.com/willyros01/hermes/actions/runs/40115750603) | Source, rules, browser and iPhone simulator PASS; Android simulator **FAIL (0/1)** | An added actual Android OS-screen gate correctly rejected the recurring Pixel Launcher overlay; this is a hosted-emulator failure, not proof of an app defect |
| [40116773536](https://github.com/willyros01/hermes/actions/runs/40116773536) | **ALL FIVE STAGES PASS:** 135/135 source files, 9/9 Firestore rules files, 4/4 browser journeys, Android 7/7 and iPhone 7/7 native checks | Standard AOSP Android image eliminated the Pixel Launcher obstruction; all 36 genuine screenshot files archived and reviewed |

The suite switched **only the disposable runner** from Google APIs Pixel system images to standard Android API 34 AOSP for native UI testing. It resolved the host screenshot obstruction in run 40116773536.

## Latest verified execution

| Required detail | Value from the current run |
| --- | --- |
| Date (Toronto) | 24 October 2026 |
| GitHub run number and URL | [40116773536 — PASS](https://github.com/willyros01/hermes/actions/runs/40116773536) |
| Simulator suite test-branch SHA | `d0e52c032248cad7edc988f48e0b932ff0e335f7` |
| Android release-source base SHA | `f6f56055e6b3faae01319cfa370402843973ccb0` |
| iOS checkout SHA | Read from the run, not guessed |
| Source regression result | **PASS: 135/135 test files, 405 printed PASS markers** |
| Firebase emulator security rules | **PASS: 9/9 test files, 216 printed PASS markers** |
| Chromium/WebKit browser journeys | **PASS: 4/4 browser/source combinations, 36 PASS markers, 16 PNG captures** |
| Android native UI/screenshot evidence | **PASS: 7/7 scenarios, 10 unobstructed PNG captures** |
| iPhone native UI/screenshot evidence | **PASS: 7/7 scenarios, 10 PNG captures** |
| Open functional defects | No simulated functional assertion failed in run 40116773536; hardware tests remain unverified |
| Real-device acceptance | NOT VERIFIED by this suite |

**Full saved evidence:** [run 5 record](https://github.com/willyros01/hermes/blob/simulator-evidence/logs/run-5-d0e52c0/REPORT.md) and its `unit/`, `rules/`, `browser/`, `android/`, and `ios/` folders. For transparency, the earlier failed native screenshot run remains archived.

**Manual layout observation:** On the iPhone's initial Terms screenshot, the upper portion of the emblem appears partly obscured near the Dynamic Island. No automated functional test failed; this is flagged for an iPhone/iPad safe-area appearance review, **not diagnosed as a code defect**. Do not adjust a protected release branch without separate authorization.

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
