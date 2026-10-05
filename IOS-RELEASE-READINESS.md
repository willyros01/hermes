# FIDUNIO iOS release-readiness reconciliation — 2026-10-05

This file is a release gate companion, not release approval. A feature is not complete merely because source or an isolated test exists.

## Release policy

For each visible feature, release readiness requires:
1. reachable UI journey;
2. packaged runtime owner;
3. required Firestore/Storage/Function authority represented in source;
4. automated gate covering the relevant boundary;
5. live backend deployment matched to the candidate;
6. physical-device acceptance where browser/simulator proof is insufficient.

The machine-readable contract is `build/release-readiness-manifest.json`. The permanent baseline runs `build/release-readiness-gate.test.mjs`. The read-only live audit is `fidunio-pretestflight-readonly-audit.txt`.

## Current branch protection

- `main`: production reference; do not modify during reconciliation.
- `main2`: controlled web reconciliation only.
- `ios`: native release candidate work.

## Current known release blockers

### Live Firestore reconciliation — BLOCKED UNTIL EXPLICIT DEPLOYMENT APPROVAL

The live safety rules deployed during 1.1.72 repair preserve production main plus Block/Unblock and Report Abuse. Exact source comparison proves the only remaining full-iOS Firestore addition is `accountDeletionRequests/{uid}` plus `validAccountDeletionRequestCreate`.

The normal self-delete client uses Cloud Functions and does not depend on this client rule. The visible Owner/Admin Account Deletion Requests queue does read the collection directly and therefore requires this authority.

`fsfix.txt` is the guarded one-command reconciliation script. It verifies project `fidunio-fef13` / project number `130339622893`, backs up live rules, requires live rules to equal the approved safety candidate, runs the full Firestore emulator regression set, prepares rollback, deploys Firestore rules only, and verifies the exact candidate. Do not run without explicit approval.

### Blocked direct-message UX — IMPLEMENTED / DEVICE REQUIRED

Firestore correctly denies direct sends in either direction for a blocked pair. The iOS source now maps that expected policy denial to the privacy-safe terminal message `Message could not be delivered to this conversation.`, removes the rejected row from automatic Outbox retry, and does not publish a global Firebase connection error. Permanent gate: `blocked-direct-delivery-ux.test.mjs`.

Installed 1.1.72 predates this UX correction; physical acceptance requires the next gated build.

### Abuse Reports moderation display — IMPLEMENTED / DEVICE REQUIRED

The moderation queue no longer renders raw Firebase reporter/target UIDs. It resolves human-readable FIDUNIO display names/email fallback and formats categories for the UI. Permanent gate: `abuse-report-display.test.mjs`.

Installed 1.1.72 predates this display correction.

### Cross-platform invitations — IMPLEMENTED CANDIDATE / DEVICE REQUIRED

New invitation generation uses `https://www.cuberoot-systems.com/fidunio/join/?invite=...`.

Native iOS:
- `@capacitor/app` is the thin URL-delivery plugin;
- `invitation-platform-adapter.js` accepts only the FIDUNIO Cuberoot Universal Link;
- cold launch uses `getLaunchUrl()`;
- warm launch uses `appUrlOpen`;
- shared `auth-ui-clean.js` remains the Join UI;
- Firebase invitation validation/redemption remains the single authority;
- generated entitlements contain `applinks:www.cuberoot-systems.com`.

Cuberoot:
- Apple association file contains both Scorecard and FIDUNIO app IDs;
- `/fidunio/join/` preserves the invitation query and falls back to the production web app when native FIDUNIO is unavailable;
- GitHub Pages deployment for the Cuberoot change completed successfully.

Automated native browser release coverage exercises cold and warm Universal Link delivery into the real Join screen. Physical-device acceptance still requires installed-app and no-app fallback tests.

Web reconciliation:
- `main2` generates the same Cuberoot invitation URL;
- production `main` remains unchanged pending full main2 regression/review.

### Self-service account deletion — BACKEND REPAIRED / DESTRUCTIVE DEVICE ACCEPTANCE STILL REQUIRED

All five account-deletion callables are now deployed and ACTIVE under `fidunio-message-delete@fidunio-fef13.iam.gserviceaccount.com`. The dedicated runtime identity has Firestore and Firebase Authentication authority. Installed 1.1.72 now loads the Delete My Account form without the prior `internal [0]` failure.

A disposable-account end-to-end deletion test is still required before marking the destructive flow fully accepted.

## Live pre-TestFlight audit hardening

The read-only audit now fails rather than merely warning when:
- required Firestore or Storage rules do not exactly match release source;
- a required rules release is missing;
- a required Cloud Function is missing or not ACTIVE;
- a required Function runs under the wrong service account.

App Check enforcement remains OFF / fail-open by policy.

## TestFlight rule

Do not bump the release version or trigger TestFlight until:
- exact-head native preflight is green;
- exact-head browser release regressions are green;
- exact-head Rebuild Baseline Security Gate is green;
- live read-only backend audit is green;
- required live reconciliation has been explicitly approved and verified;
- remaining device-only acceptance items are clearly labeled.
