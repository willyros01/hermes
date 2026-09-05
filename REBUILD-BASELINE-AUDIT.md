# FIDUNIO Rebuild Baseline Audit

**Branch:** `fidunio-rebuild-baseline-2026-09-05`

**Purpose:** establish a clean forward-consolidation development baseline without rewriting validated behavior or deleting recovery history from `main`.

## Safety rule

This branch was created from `main` at commit `246c524abc78404d9bc744b272ce08244a35cc3f`. `main` remains rollback/reference until the rebuilt runtime and target-device validation are complete. Repository validation does not authorize live Firebase deployment.

## Protected checkpoints

```text
checkpoint-rebuild-baseline-recovery-pass
commit e2d2e10031182781f6887b2cd1a971701aa21e3a

checkpoint-rebuild-new-message-owner
commit b4731926432af3a986af991d2f51db86acea0fd1

checkpoint-rebuild-account-e2ee-auth-binding
commit 251679cd9240e45f335536fed9bed5bc43e76157

checkpoint-rebuild-account-dm-v3-crypto-rules
commit ca9222bdb7171ae60de5b2b9c08bf5b9327f52c9
```

The latest checkpoint preserves the fully green repository-only account direct-message candidate before any live-project deployment or runtime transport cutover.

## Current authoritative foundation

### Product/runtime
- `index.html`, `version.js`, active CSS, current artwork/icons and `manifest.json`;
- `app.js` remains the structural runtime owner and still contains legacy per-device E2EE compatibility behavior pending migration;
- `bootstrap.js` is startup sequencing only;
- `firebase.js` is the sole runtime Firebase SDK/service owner;
- `firebase-config.js` remains protected and must never be regenerated/replaced;
- `service-worker.js` remains temporarily because it still injects legacy per-device E2EE compatibility transforms, but its target end-state is shell/offline caching only.

### Deterministic UI/auth ownership
- `auth-ui-clean.js`, `account-guard.js`, `account-storage.js`;
- `settings-lifecycle.js` is explicitly mounted by `app.js`;
- `new-message-owner.js` owns only its assigned recipient-picker region;
- peer display names and main Sign Out are explicit `app.js` projections using central `firebase.js` APIs;
- former `profile-sync.js`, `main-screen-polish.js`, `settings-lifecycle-bridge.js`, and observer-based `new-message-polish.js` are gone;
- runtime authority gate now has no temporary direct-Firebase or MutationObserver exceptions.

### Account E2EE identity/recovery foundation
- `e2ee-account-crypto.js` + browser tests;
- `e2ee-account-identity-manager.js` + browser tests;
- `e2ee-account-lifecycle.js` + CI test;
- `e2ee-account-runtime.js` auth lookup/reset binding;
- `e2ee-account-firestore-adapter.js`;
- `e2ee-account-firebase-adapter.js` + CI test;
- exact account-E2EE Firestore schema/rules and 42-case emulator matrix;
- `functions/recovery/` as sole authoritative recovery server implementation, with root compatibility re-exports for existing tests;
- Cloud Functions v2 scaffold with App Check and Secret Manager binding declarations, still not deployed;
- recovery completion remains intentionally fail-closed until supplemental recovery verification is implemented/reviewed.

### Account direct-message v3 pre-handoff candidate
- `e2ee-account-message-crypto.js`;
- `e2ee-account-message-crypto.test.mjs`;
- `e2ee-account-message-service.js`;
- `e2ee-account-message-service.test.mjs`;
- `ACCOUNT-E2EE-DIRECT-MESSAGE-FORMAT.md`;
- exact `firestore.rules` candidate acceptance for `e2ee:3` direct-message rows;
- `firestore-account-message-v3.rules.test.mjs` dedicated emulator-only matrix.

This candidate uses durable account ECDH identities, HKDF-SHA-256 and AES-256-GCM. Device IDs/per-device envelopes are absent from the v3 cryptographic format. The service fails closed unless the local durable account identity is already READY and the peer exact public account identity is available.

## Confirmed cleanup/materialization already complete

Removed from this rebuild branch after replacement or dependency audit:
- baseline cleanup/reset pages/scripts;
- E2EE diagnostics;
- obsolete one-shot cleanup workflow;
- superseded `auth-ui.js`, `admin-ui.js`, `invite-modal.js`, `settings-polish.js`;
- observer-based `new-message-polish.js`;
- historical `test-0.9.0/`;
- temporary `profile-sync.js`, `main-screen-polish.js`, `settings-lifecycle-bridge.js` after their behavior was materialized;
- completed one-shot account-E2EE auth materializer workflow/script after its bounded change was committed.

All are recoverable from Git history/main when historically needed; none should be resurrected as target architecture.

## Legacy material intentionally retained

Do not delete yet:
- old per-installation E2EE code still present in `app.js`/`firebase.js`;
- service-worker E2EE v2 helper/receive/trust/outbox fan-out transforms;
- legacy `/users/{uid}/devices/{deviceId}` rules/data compatibility;
- legacy `e2ee:1` and `e2ee:2` message readability.

These remain only because normal runtime cannot yet safely reach a READY durable account identity without the live Firebase account-E2EE/recovery boundary. They are migration compatibility, not target ownership.

## Security-gate history and latest state

The rebuild branch uses `.github/workflows/rebuild-baseline-security.yml` with read-only repository permission and no Firebase deployment step.

The earlier `action_required` run `33981660852` at `ee27f32a46ef4a058a2c1e430f4a3c108e31f260` had **zero jobs**. It was caused by a one-shot materializer committing as `github-actions[bot]`, not by a failed security test. The one-shot materializer was removed, and normal user-authored branch runs returned to green.

The expanded gate now executes:
- original exact Firestore account-E2EE emulator matrix (42 assertions);
- dedicated account direct-message v3 rules matrix;
- recovery server crypto/session/callable/persistence tests;
- central Firebase E2EE adapter test;
- account E2EE auth lifecycle test;
- account direct-message crypto test;
- fail-closed account direct-message service test;
- Cloud Functions recovery scaffold import;
- runtime transform anchor gate;
- runtime authority gate.

Commit `ca9222bdb7171ae60de5b2b9c08bf5b9327f52c9` passed the complete expanded gate. The dedicated v3 rules test first exposed a mixed-format loophole: a row carrying E2EE fields plus plaintext could be accepted by the old plaintext OR branch. Commit `7eb1d22fe1c3323ca613ff986812be5dc02d7b21` closed that path by requiring plaintext rows to have no `e2ee` field; both original and dedicated rule gates passed afterward.

## Live Firebase boundary — now the ordered blocker

Repository preparation has reached the point where the next architectural dependency is live-project configuration/verification, not additional source-transform cleanup.

Why the boundary is real:
- account identity creation must establish both normal and recovery wrappers; the recovery service is deliberately unavailable until the reviewed Functions/Secret/App Check boundary exists;
- existing durable account identity lookup/unlock needs the reviewed account-E2EE Firestore permissions to be deployed/verified;
- normal runtime transport must not be switched from legacy per-device compatibility to v3 until a real authenticated account can reach E2EE `READY` safely;
- removing legacy service-worker transforms before that would remove the last working transport path.

Therefore **do not** remove the remaining per-device transforms and do not change live Firebase implicitly. The next live-project step is controlled by `FIREBASE-RECOVERY-PROJECT-CONFIG.md` / `GEMINI-FIREBASE-HANDOFF.md` and requires project-owner confirmation for the actual Firebase/Google environment, billing/region, Secret Manager/IAM/App Check, rule/function deployment and verification.

No Cloud Function, Firestore rule, Secret Manager secret, IAM permission, App Check setting, billing setting, or production Firebase deployment has been changed by this rebuild work.

## Ordered continuation after the handoff

1. Confirm actual Firebase project and deployment region; configure least-privilege recovery Functions/Secret Manager/App Check/IAM and deploy/verify exact reviewed account-E2EE rules only under explicit handoff.
2. Prove a real account can safely resolve EMPTY/LOCKED/READY without replacement; wire normal six-digit account-E2EE PIN enrollment/unlock explicitly into auth lifecycle.
3. Wire `e2ee:3` direct send/receive through the validated account-message service while retaining explicit `e2ee:1/2` readability.
4. Move Outbox retries to stable account-v3 message IDs and preserve Sent/Delivered/Read semantics.
5. Remove only the matching per-device service-worker transforms after replacement behavior is proven.
6. Reduce service worker to cache/offline duties only.
7. Finish Firestore-authoritative encrypted history + UID-scoped rebuildable cache + serialized Outbox.
8. Revalidate iPhone/iPad/PWA receipts, offline reconnect, Settings, account switching, reinstall/recovery and local PIN behavior.
9. Only then decide whether to merge/advance `main`.

## Non-negotiable rollback points

- `checkpoint-rebuild-baseline-recovery-pass` -> `e2d2e10031182781f6887b2cd1a971701aa21e3a`
- `checkpoint-rebuild-new-message-owner` -> `b4731926432af3a986af991d2f51db86acea0fd1`
- `checkpoint-rebuild-account-e2ee-auth-binding` -> `251679cd9240e45f335536fed9bed5bc43e76157`
- `checkpoint-rebuild-account-dm-v3-crypto-rules` -> `ca9222bdb7171ae60de5b2b9c08bf5b9327f52c9`
- rebuild origin on `main` -> `246c524abc78404d9bc744b272ce08244a35cc3f`
- historical stable 0.9.4.11, Settings 0.9.5.1, receipts 0.9.5.4, identity-race stabilization 0.9.5.7.

No destructive reset of `main` is required to rebuild FIDUNIO safely.
