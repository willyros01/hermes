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
- current Settings/profile/admin/invite modules actually imported by the validated runtime
- current responsive/back-button/message-bubble styling

### New account-authoritative E2EE foundation
- `e2ee-account-crypto.js` and its browser tests
- `e2ee-account-identity-manager.js` and its browser tests
- `e2ee-account-firestore-adapter.js`
- `e2ee-account-firebase-adapter.js` and CI test
- recovery server crypto/session/callable/admin-adapter modules and tests
- staged/exact Firestore E2EE rules harness and CI workflows
- production `firestore.rules` until an exact reviewed merge is intentionally made

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

## Confirmed legacy/development artifacts that do not belong in the rebuild baseline

These files are not part of the live bootstrap path and are historical one-off cleanup/diagnostic/test harnesses. They remain recoverable from `main` and Git history, so they can be removed from this rebuild branch:

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
- `auth-ui.js` — superseded by the validated `auth-ui-clean.js` path and not imported by the current bootstrap
- `test-0.9.0/` — historical snapshot, not a production runtime dependency

## Retain for now pending dependency removal

The following are old architecture, but cannot be deleted blindly because validated runtime still depends on or is entangled with them:

- legacy per-device E2EE code in `app.js`, `firebase.js`, and `service-worker.js`
- service-worker source transforms for E2EE v2 and group behavior
- prototype cleanup code in `bootstrap.js`
- hard-coded prototype state in `app.js`
- legacy device Firestore rules

These are migration material, not the target architecture.

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

1. Remove confirmed dead one-off files from this branch only.
2. Re-run repository CI gates; security tests remain unchanged.
3. Freeze this branch as the rebuild baseline checkpoint.
4. Remove the broad bootstrap MutationObserver only after prototype UI/state ownership is removed from authoritative runtime.
5. Materialize or replace every remaining `service-worker.js` source transform; delete transforms one by one.
6. Remove hard-coded Maria Santos / John Cruz / Family Group startup state and make empty state explicit.
7. Wire validated account E2EE through central Firebase ownership, without reviving device-owned E2EE as the target.
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
