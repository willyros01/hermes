# FIDUNIO Runtime Authority Map

**STATUS: REBUILD CONTROL DOCUMENT — SEPTEMBER 5, 2026**

This map identifies the current runtime owner for each major resource and separates target architecture from temporary compatibility code. It is used to avoid deleting behavior before its replacement is authoritative.

## Startup / authentication

- `bootstrap.js`: startup sequencing only. Runs account guard, auth gate, then temporary profile/main-screen compatibility modules.
- `auth-ui-clean.js`: authentication gate and account activation. It starts `app.js` only after authenticated account storage activation.
- `account-guard.js` / `account-storage.js`: account-local storage activation/quarantine boundary.
- TARGET: bootstrap remains sequencing only; no DOM repair loops and no independent Firebase initialization outside `firebase.js`.

## Firebase ownership

- `firebase.js`: sole target Firebase SDK/service owner and sole target location for Auth/Firestore service acquisition.
- `profile-sync.js`: TEMPORARY VIOLATION — independently imports Firebase SDK and obtains app/auth/firestore services. Must be replaced with a central `firebase.js` subscription API before removal.
- `main-screen-polish.js`: TEMPORARY VIOLATION — independently imports Firebase Auth to sign out. Sign-out must be routed through `signOutFidunio()` in `firebase.js` and projected by the structural UI owner.
- `auth-ui-clean.js`: contains a small password-reset SDK helper that uses the already initialized app. This should eventually be moved behind `firebase.js` too, but it is not a competing initializer.

## Structural UI ownership

- `app.js`: current structural owner for Messages, Chat, Settings host, New Message host, group placeholders, local lock projection, tablet/iPhone layout.
- `new-message-owner.js`: authoritative owner for the recipient-picker region supplied by `app.js`. It has no observer and no Firebase initialization.
- `settings-lifecycle.js`: authoritative Settings content lifecycle.
- `settings-lifecycle-bridge.js`: temporary bridge until `app.js` exposes the final explicit Settings post-render hook.
- `main-screen-polish.js`: TEMPORARY DOM repair/overlay module. Broad MutationObserver must be removed after sign-out and peer-name projection are materialized into explicit owners.
- `profile-sync.js`: data synchronization only in intent, but currently emits global events to `main-screen-polish.js`; this event/observer overlay is migration material.

## Conversation names

- Firestore `/users/{uid}.displayName` is authoritative profile display name.
- Firestore conversation `memberNames` is a convenience snapshot and can be stale after a profile rename.
- `profile-sync.js` currently follows peer profile documents and emits `fidunio-profile-names`.
- `main-screen-polish.js` mutates rendered conversation rows/header using that event.
- TARGET: central Firebase subscription feeds normalized conversation/view state; `app.js` renders the resolved display name directly. No post-render DOM rewrite.

## New Message

- `new-message-owner.js` is now authoritative for recipient discovery/selection.
- `app.js` owns only the host region and direct-conversation transition.
- No UID-copy UI is intended for normal users; hidden UID input is compatibility plumbing until the conversation-start API is refactored to take selected model data directly.

## Local storage / offline

- `app.js` currently owns IndexedDB `fidunio-local`, including `meta`, `history`, and `outbox` stores.
- Firestore is the durable target authority for encrypted history.
- Local `history` is rebuildable cache.
- Local `outbox` is temporary pending-send authority.
- TARGET: UID-scoped cache/outbox ownership with one serialized write/reconnect path.

## E2EE

### Target account-authoritative foundation
- `e2ee-account-crypto.js`
- `e2ee-account-identity-manager.js`
- `e2ee-account-firestore-adapter.js`
- `e2ee-account-firebase-adapter.js`
- `firebase.js` account-E2EE persistence API

These are validated but not yet wired into normal messaging runtime.

### Legacy/compatibility messaging E2EE
- `app.js` still contains per-installation/device ECDH identity and legacy direct encryption.
- `service-worker.js` still source-transforms `app.js` at fetch time to inject per-device E2EE v2 fan-out/decrypt behavior.
- Legacy `/users/{uid}/devices/{deviceId}` Firestore data/rules remain migration material.
- Device ID remains informational in the target architecture and must not become durable key/history ownership.

## Groups

- `firebase.js` contains group metadata APIs.
- Raw `app.js` currently contains a rebuild placeholder for group creation.
- `service-worker.js` still injects group imports/state/subscriptions, real group creation UI, and a cloud-group send guard at runtime.
- TARGET: materialize group metadata/list/UI behavior into source before deleting those transforms. Group message send remains disabled until account-authoritative group E2EE is deliberately implemented.

## Service worker

Current `service-worker.js` has two jobs mixed together:
1. network-first shell/offline caching — TARGET KEEP;
2. runtime JavaScript source rewriting of `app.js` — TARGET REMOVE.

Every source transform must be materialized or superseded before its corresponding transform is deleted. Final service worker must never change JavaScript semantics.

## Required consolidation sequence

1. Preserve a rollback checkpoint before each bounded runtime change.
2. Materialize peer display-name data flow through `firebase.js` and direct `app.js` projection; remove `profile-sync.js` independent SDK ownership and `main-screen-polish.js` peer-name DOM repair.
3. Materialize main-screen Sign Out in `app.js` using `signOutFidunio()`; remove independent Auth import from `main-screen-polish.js`, then delete the module when no behavior remains.
4. Materialize group subscription/UI/send guard from service-worker transform into source.
5. Materialize/supersede per-device E2EE v2 transform only as part of the account-authoritative E2EE migration; do not preserve device ownership as target architecture.
6. Reduce service worker to cache/offline duties only.
7. Wire account E2EE identity manager into normal authenticated lifecycle.
8. Build Firestore-authoritative encrypted history + UID-scoped cache + Outbox.

## Invariant

**ONE RESOURCE -> ONE OWNER -> ONE PREDEFINED AREA -> ONE SERIALIZED WRITE PATH.**

No new MutationObserver, reload repair, source transform, competing Firebase initializer, or device-owned durable E2EE identity may be introduced during rebuild.
