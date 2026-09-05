# FIDUNIO Rebuild Baseline Audit

**Branch:** `fidunio-rebuild-baseline-2026-09-05`

**Purpose:** establish a clean development starting point without rewriting validated behavior or deleting recovery history from `main`.

## Safety rule

This branch was created from `main` at commit `246c524abc78404d9bc744b272ce08244a35cc3f`. Cleanup and consolidation occur here first. `main` remains the rollback/reference source until the rebuild branch passes its own validation gates.

Protected checkpoints now include:

```text
checkpoint-rebuild-baseline-recovery-pass
commit e2d2e10031182781f6887b2cd1a971701aa21e3a

checkpoint-rebuild-new-message-owner
commit b4731926432af3a986af991d2f51db86acea0fd1
```

The first checkpoint corresponds to successful `Rebuild Baseline Security Gate` run `33976715187` covering Firestore rules, recovery crypto/session/callable/persistence, central Firebase E2EE adapter, and Cloud Functions scaffold import. The second checkpoint preserves the later deterministic empty Messages state and explicit New Message recipient owner before further runtime consolidation.

## What is authoritative and must be kept

### Product/runtime foundation
- `index.html`
- `version.js`
- `styles.css`, `styles-0.9.0.css`, active focused CSS files
- `app.js` — temporarily retained because it still carries validated runtime behavior and is still transformed by the service worker
- `bootstrap.js` — now reduced to startup sequencing; no broad bootstrap scrub observer remains
- `service-worker.js` — retained temporarily only until all behavior still injected into `app.js` is materialized or deliberately superseded
- `firebase.js`
- `firebase-config.js` — protected; never regenerate or replace
- `manifest.json` and current artwork/icons

### Validated deterministic UI/auth foundation
- `auth-ui-clean.js`
- `account-guard.js`
- `account-storage.js`
- `settings-lifecycle.js`
- `settings-lifecycle-bridge.js`
- `new-message-owner.js` — authoritative recipient-picker region owner called explicitly by `app.js`; no MutationObserver
- `profile-sync.js` — TEMPORARY read-only peer display-name synchronization; currently still initializes Firebase SDK access independently and must be consolidated through `firebase.js`
- `main-screen-polish.js` — TEMPORARY sign-out/display-name overlay and broad MutationObserver; behavior must be materialized before removal
- `quick-start.html` — live dependency of Settings invitation sharing; keep
- current responsive/back-button/message-bubble styling

The superseded observer-based `new-message-polish.js` has now been removed from the rebuild branch after its behavior was materialized into `new-message-owner.js` + `app.js`.

### New account-authoritative E2EE foundation
- `e2ee-account-crypto.js` and browser tests
- `e2ee-account-identity-manager.js` and browser tests
- `e2ee-account-firestore-adapter.js`
- `e2ee-account-firebase-adapter.js` and CI test
- exact Firestore E2EE rules harness and CI workflows
- `firestore.rules` exact repository candidate; repository validation does not imply live Firebase deployment

### Recovery server / Cloud Functions authority
- `functions/index.mjs`
- `functions/package.json`
- `functions/recovery/e2ee-recovery-server-crypto.mjs`
- `functions/recovery/e2ee-recovery-session-policy.mjs`
- `functions/recovery/e2ee-recovery-callable-core.mjs`
- `functions/recovery/e2ee-recovery-firestore-admin-adapter.mjs`
- root `e2ee-recovery-*.mjs` compatibility re-exports and their tests while repository CI remains rooted at the project top level
- `FIREBASE-RECOVERY-PROJECT-CONFIG.md`

The `functions/recovery/` copies are the sole authoritative recovery server implementation. Root recovery modules intentionally re-export them so tests cannot drift onto a duplicate implementation.

### Binding architecture/security documentation
- `hermes-memory.txt`
- `CODING-GUIDELINES.md`
- `ACCOUNT-E2EE-FIRESTORE-AUTHORITY.md`
- `E2EE-V1-CRYPTO-FORMAT.md`
- `E2EE-RECOVERY-PROTOCOL.md`
- `FIREBASE-RECOVERY-PROJECT-CONFIG.md`
- `FIRESTORE-E2EE-V1-RULES.md`
- `FIRESTORE-E2EE-V1-EMULATOR-TESTS.md`
- `DETERMINISTIC-UI-LIFECYCLE.md`
- `RUNTIME-CONSOLIDATION-PLAN.md`
- `RUNTIME-TRANSFORM-INVENTORY.md`
- `RUNTIME-AUTHORITY-MAP.md`
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
- `auth-ui.js`
- `admin-ui.js`
- `invite-modal.js`
- `settings-polish.js`
- `new-message-polish.js`
- `test-0.9.0/`

## Retain for now pending dependency removal

The following are old architecture or temporary compatibility layers, but cannot be deleted blindly because validated runtime still depends on or is entangled with them:

- legacy per-device E2EE code in `app.js`, `firebase.js`, and `service-worker.js`
- service-worker source transforms for E2EE v2 and group behavior
- legacy device Firestore rules
- `profile-sync.js` and `main-screen-polish.js` until display-name/sign-out behavior is moved into explicit owners
- `settings-lifecycle-bridge.js` until `app.js` exposes an explicit Settings post-render hook

These are migration/compatibility material, not the target architecture.

## Runtime authority map

`RUNTIME-AUTHORITY-MAP.md` is now the detailed source-of-truth for current resource ownership and temporary ownership violations. In particular:

- `firebase.js` is the sole target Firebase service owner;
- `app.js` is the structural UI owner;
- `new-message-owner.js` owns only its explicit recipient-picker region;
- `profile-sync.js` and `main-screen-polish.js` are temporary compatibility modules that must be retired without replacing them with new observers or competing Firebase access paths;
- `service-worker.js` must end as cache/offline infrastructure only, never a JavaScript semantic transform layer.

## Rebuild validation

The branch has its own non-deploying workflow:

```text
.github/workflows/rebuild-baseline-security.yml
```

It executes:
- Firestore E2EE emulator gate (42 assertions)
- recovery server crypto tests
- recovery session-policy tests
- recovery callable-core tests
- recovery Firestore admin-adapter tests
- central Firebase E2EE adapter tests
- Cloud Functions recovery scaffold import test
- runtime transform anchor gate

Latest protected recovery pass:

```text
commit: e2d2e10031182781f6887b2cd1a971701aa21e3a
run:    33976715187
result: SUCCESS
```

Subsequent rebuild commits continue to trigger the same non-deploying gate. The workflow has read-only repository permissions and performs no Firebase production deployment.

## Recovery / Firebase live-project boundary

Repository-only recovery preparation is complete enough to checkpoint:
- exact schema documentation is frozen;
- deployable-source Cloud Functions layout exists;
- App Check/secret bindings are declared;
- completion remains intentionally fail-closed until supplemental recovery verification is implemented;
- no Cloud Function, Firestore rule, Secret Manager secret, IAM permission, App Check setting, billing change, or live deployment has occurred.

`FIREBASE-RECOVERY-PROJECT-CONFIG.md` is the explicit future handoff for project-owner actions.

## Rebuild target

The clean starting point is **not** a historical version rollback. A historical rollback would discard newly validated account E2EE/security work and reintroduce known defects. The correct baseline is forward consolidation:

```text
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

1. **COMPLETE** — remove confirmed dead one-off/superseded files from this branch only.
2. **COMPLETE** — exact Firestore/recovery documentation and non-deploying Cloud Functions scaffold.
3. **COMPLETE** — rebuild security gate green and checkpoint `checkpoint-rebuild-baseline-recovery-pass` created.
4. **COMPLETE** — prototype top-level contact seed removed, real empty Messages state established, explicit `new-message-owner.js` materialized, superseded New Message observer removed, checkpoint `checkpoint-rebuild-new-message-owner` created.
5. **CURRENT** — materialize group metadata/subscription/UI/send guard from service-worker transform into authoritative source as one bounded non-cryptographic unit.
6. Replace profile-name and Sign Out overlays with central `firebase.js` APIs + explicit `app.js` projection; delete `main-screen-polish.js` observer path when empty.
7. Wire validated account E2EE through central `firebase.js` ownership without reviving device-owned E2EE as the target.
8. Replace per-device send/decrypt/fan-out service-worker transforms with account-authoritative messaging plus deliberate legacy migration handling.
9. Reduce service worker to cache/offline only.
10. Build/finish Firestore-authoritative sync/cache/Outbox and revalidate iPhone/iPad UI, receipts, offline reconnect, Settings, account switching, PWA reinstall/recovery.
11. Only after rebuild branch validation decide whether to merge/advance `main`.

## Non-negotiable rollback points

- `checkpoint-rebuild-baseline-recovery-pass` at `e2d2e10031182781f6887b2cd1a971701aa21e3a`
- `checkpoint-rebuild-new-message-owner` at `b4731926432af3a986af991d2f51db86acea0fd1`
- `main` at rebuild origin `246c524abc78404d9bc744b272ce08244a35cc3f`
- historical stable 0.9.4.11 baseline
- Settings checkpoint 0.9.5.1
- receipts materialization 0.9.5.4
- identity race stabilization 0.9.5.7

No destructive reset of `main` is required to rebuild FIDUNIO safely.
