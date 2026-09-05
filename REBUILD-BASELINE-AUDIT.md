# FIDUNIO Rebuild Baseline Audit

**Branch:** `fidunio-rebuild-baseline-2026-09-05`

**Purpose:** establish a clean development starting point without rewriting validated behavior or deleting recovery history from `main`.

## Safety rule

This branch was created from `main` at commit `246c524abc78404d9bc744b272ce08244a35cc3f`. Cleanup and consolidation occur here first. `main` remains the rollback/reference source until the rebuild branch passes its own validation gates.

## What is authoritative and must be kept

### Product/runtime foundation
- `index.html`
- `version.js`
- `styles.css`, `styles-0.9.0.css`, active focused CSS files
- `app.js` — temporarily retained because it still carries validated runtime behavior and is still transformed by the service worker
- `bootstrap.js` — retained temporarily, but must be simplified because it still contains legacy prototype cleanup and a broad MutationObserver
- `service-worker.js` — retained temporarily only until all behavior still injected into `app.js` is materialized or replaced
- `firebase.js`
- `firebase-config.js` — protected; never regenerate or replace
- `manifest.json` and current artwork/icons

### Validated deterministic UI/auth foundation
- `auth-ui-clean.js`
- `account-guard.js`
- `account-storage.js`
- `settings-lifecycle.js`
- `settings-lifecycle-bridge.js`
- `new-message-polish.js` — LIVE today; bootstrap imports it. Temporary display-name recipient overlay that should ultimately be materialized into the New Message owner.
- `profile-sync.js` — LIVE today; bootstrap imports it. Read-only peer display-name synchronization.
- `main-screen-polish.js` — LIVE today; bootstrap imports it. Temporary sign-out/display-name overlay and broad observer; behavior must be materialized before removal.
- `quick-start.html` — LIVE dependency of Settings invitation sharing; keep.
- current responsive/back-button/message-bubble styling

### New account-authoritative E2EE foundation
- `e2ee-account-crypto.js` and its browser tests
- `e2ee-account-identity-manager.js` and its browser tests
- `e2ee-account-firestore-adapter.js`
- `e2ee-account-firebase-adapter.js` and CI test
- recovery server crypto/session/callable/admin-adapter modules and tests
- staged/exact Firestore E2EE rules harness and CI workflows
- `firestore.rules` exact candidate source; repository validation does not imply Firebase production deployment

### Binding architecture/security documentation
- `hermes-memory.txt`
- `CODING-GUIDELINES.md`
- `ACCOUNT-E2EE-FIRESTORE-AUTHORITY.md`
- `E2EE-V1-CRYPTO-FORMAT.md`
- `E2EE-RECOVERY-PROTOCOL.md`
- `FIRESTORE-E2EE-V1-RULES.md`
- `FIRESTORE-E2EE-V1-EMULATOR-TESTS.md`
- `DETERMINISTIC-UI-LIFECYCLE.md`
- `RUNTIME-CONSOLIDATION-PLAN.md`
- `RUNTIME-TRANSFORM-INVENTORY.md`
- `architecture-ownership.txt`
- `BUG-LIST.md`
- `E2EE-IDENTITY-LIFECYCLE.md` as migration/history context

## Confirmed legacy/development artifacts removed from this rebuild branch

These files were not part of the live bootstrap path or were superseded by a validated owner. They remain recoverable from `main` and Git history.

- `baseline-cleanup.html`
- `baseline-cleanup.js`
- `baseline-cleanup-09510.html`
- `baseline-cleanup-09510.js`
- `baseline-cleanup-09511.html`
- `baseline-cleanup-09511.js`
- `master-reset-09512.html`
- `master-reset-09512.js`
- `master-reset-09513.html`
- `master-reset-09513.js`
- `e2ee-diagnostics.html`
- `e2ee-diagnostics.js`
- `.github/workflows/fix-cleanup-return.yml`
- `auth-ui.js` — superseded by validated `auth-ui-clean.js`
- `admin-ui.js` — superseded by `settings-lifecycle.js`; no current runtime import
- `invite-modal.js` — invitation behavior is now owned by `settings-lifecycle.js`; no current runtime import
- `settings-polish.js` — superseded by `settings-lifecycle.js`; its observer/layout repair path is not imported
- `test-0.9.0/` — historical snapshot, not a production runtime dependency

## Retain for now pending dependency removal

The following are old architecture, but cannot be deleted blindly because validated runtime still depends on or is entangled with them:

- legacy per-device E2EE code in `app.js`, `firebase.js`, and `service-worker.js`
- service-worker source transforms for E2EE v2 and group behavior
- prototype cleanup code in `bootstrap.js`
- hard-coded prototype state in `app.js`
- legacy device Firestore rules
- `new-message-polish.js`, `profile-sync.js`, `main-screen-polish.js` until their behavior is moved into explicit owners
- `settings-lifecycle-bridge.js` until `app.js` exposes an explicit Settings post-render hook

These are migration/compatibility material, not the target architecture.

## Rebuild validation

The branch has its own non-deploying workflow:
`.github/workflows/rebuild-baseline-security.yml`

It runs on this rebuild branch and on pull requests to `main`, and executes:
- Firestore E2EE emulator gate
- recovery server crypto tests
- recovery session-policy tests
- recovery callable-core tests
- recovery Firestore admin-adapter tests
- central Firebase E2EE adapter tests

This workflow has read-only repository permissions and performs no Firebase production deployment.

## Rebuild target

The clean starting point is **not** a historical version rollback. A historical rollback would discard the newly validated account E2EE/security work and reintroduce known defects. The correct baseline is a forward consolidation branch that preserves validated UI/auth behavior and validated account-E2EE components while removing dead one-off code and then replacing the hidden service-worker/runtime architecture in bounded steps.

Target runtime:

```
index.html
  -> bootstrap/auth/account activation
  -> one authoritative app runtime
  -> central firebase.js
  -> account-authoritative E2EE manager/adapter
  -> Firestore authoritative encrypted history
  -> UID-scoped rebuildable local cache + Outbox
  -> service worker used only for shell/offline caching
```

## Ordered cleanup/consolidation gates

1. COMPLETE — remove confirmed dead one-off/superseded files from this branch only.
2. CURRENT — run the rebuild branch security gate after cleanup.
3. Freeze this branch as the rebuild baseline checkpoint once CI is green.
4. Remove prototype source/defaults and the broad bootstrap scrub observer as one bounded ownership change.
5. Materialize/replace the live display-name/New Message/main-screen overlays into explicit owners, then remove their observers.
6. Materialize or replace every remaining `service-worker.js` source transform; delete transforms one by one.
7. Wire validated account E2EE through central `firebase.js` ownership, without reviving device-owned E2EE as the target.
8. Build Firestore-authoritative sync/cache/Outbox.
9. Revalidate iPhone/iPad UI, receipts, offline reconnect, Settings, account switching, PWA reinstall/recovery.
10. Only after branch validation decide whether to merge this clean baseline to `main`.

## Non-negotiable rollback points

- current `main` commit `246c524abc78404d9bc744b272ce08244a35cc3f`
- historical stable 0.9.4.11 baseline
- Settings checkpoint 0.9.5.1
- receipts materialization 0.9.5.4
- identity race stabilization 0.9.5.7

No destructive reset of `main` is required to rebuild FIDUNIO safely.
