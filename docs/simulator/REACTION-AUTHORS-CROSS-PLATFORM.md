# FIDUNIO group-reaction attribution & immediate-display regression — Test Standard v1
Date: 2026-10-26 | Owner: Hermes simulator-tests | Production impact: NONE

## Verified baseline and release boundaries

- Physical iOS TestFlight 1.1.80: user-confirmed group reaction author names display correctly and emojis appear immediately. PASS only for observed feature behavior.
- Physical Fire HD 8 signed APK 1.1.80: same user-confirmed PASS.
- Production web: user-confirmed FAIL (no author name list and slow reaction feedback). Github `main` remains 1.1.79; `main-3` has 1.1.80 and production PR #7 is OPEN, so the absence of the feature on public web is explained by **not deploying it**. The actual 1.1.80 web behavior after deployment is NOT VERIFIED.
- Isolated simulator workflow #40412652061 overall FAIL (reviewed-regressions used outdated web regex); Android and iPhone native simulator journeys PASS separately, emulator Firestore rules PASS, authenticated workflows PASS, browser startup PASS. The complete release manifest still demands 88 scenarios and real devices.
- A cancelled WebKit run never counts as PASS. Stale files/previous version results never count as current-commit acceptance.

## Hard pass/fail design (same contract, platform-specific adapter)

| ID | Test | Web Chromium | Web WebKit | iOS simulator | Android simulator | Physical device |
| --- | --- | --- | --- | --- | --- | --- |
| E01 | Message actually sent by account A, reactor B authenticates separately, eligible 3-member group | REQUIRED | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| E02 | B taps emoji in own message-action sheet: DOM chip visible synchronously before Firestore transaction resolves | REQUIRED | REQUIRED | REQUIRED (no web-specific code) | REQUIRED (no web-specific code) | REQUIRED |
| E03 | Authenticated Firestore stores B's emoji; original A and member C each receive update in existing listener, chip visible | REQUIRED | REQUIRED | REQUIRED as feasible; otherwise explicit BLOCKED | REQUIRED as feasible; otherwise explicit BLOCKED | REQUIRED |
| E04 | Tap emoji chip: dialog lists `B` by display name, not UID; first tap, keyboard and screen-reader labels | REQUIRED | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| E05 | A+B select same emoji: two names, correct count; changing emoji affects only B; removing removes only B | REQUIRED | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| E06 | Unknown/former group member uses bounded fallback (no raw UID), HTML escapes names, no outsider content | REQUIRED | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| E07 | Firestore retry concurrent updates: identical intent survives; one tap not cancelled or duplicated | REQUIRED | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| E08 | Direct-message reaction stays usable; no group-only name-list shown in direct chat | REQUIRED | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| E09 | Offline or permission-denied transaction: preview appears then rolls back (no indefinite fake confirmed reaction) | REQUIRED | REQUIRED | REQUIRED as appropriate | REQUIRED as appropriate | REQUIRED |
| E10 | Website release: exact `version.js` = 1.1.80, `app.js` hash, service-worker active cache revision, GitHub Pages successful, click still works after reload/PWA reopen | REQUIRED | REQUIRED | N/A | N/A | REQUIRED for public web |

### Instrumentation and evidence
- For every action record: run ID, release-source SHA, OS/browser, actor IDs (synthetic/non-sensitive), message UID association, reaction, actual DOM chip and dialog text, authoritative emulator reaction map, transaction error/result, listener timestamp, start-to-first-visible milliseconds.
- On non-web native journeys: the test MUST invoke installed-app UI; Firestore writer B must be another authenticated SDK session against original rules, not an administrative fake document write.
- On web: use genuine browser DOM events and Firestore emulator authenticated sessions. If a test-only projection hook bypasses actual E2EE hydration, label that narrowly as a **render/transaction integration test**, NEVER as a complete authenticated E2EE/peer-receipt proof.
- Capture pass and failure screenshots, JSON metrics, and failing assertions. A screenshot alone does not prove B ≠ A or storage authority. Preserve images and docs in `simulator-evidence`, no secrets.
- All executors must fail closed against non-`demo-` Firebase; no production Firebase keys, notifications, Apple upload, Android publisher, branch release side effects.
- No full certification until all 88 release-manifest requirements and physical owner acceptance are complete.

### Maintenance rules
Read `hermes-memory.txt`, `CODING-GUIDELINES.md`, `IOS-NATIVE-ARCHITECTURE.md`, `FCM-NOTIFICATION-ARCHITECTURE.md` and `FIDUNIO-BUILD-CHECKLIST.md` before editing. Make fixes in existing app render/Firestore owners and web adapter only; preserve native accepted behavior, E2EE, memberships, lease tokens, signing and Outbox. Repeat changed behaviors on `ios`, `Android`, `main-3` and production release candidate; do not blindly merge branch files.
