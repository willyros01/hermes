# FIDUNIO Runtime Transform Inventory

**STATUS: REBUILD INVENTORY — AUTHORITATIVE FOR SOURCE-CONSOLIDATION WORK**

This inventory records JavaScript behavior that is still injected into raw `app.js` by `service-worker.js`. A transform may be deleted only after its behavior is either materialized in source or deliberately superseded by the account-authoritative rebuild architecture.

## Already materialized / no longer a transform target

### Live receipt reconciliation / read promotion
The validated receipt reconciliation path is already present in raw `app.js`. It remains a protected behavior and must stay green during later runtime cleanup.

### New Message recipient picker
The recipient picker is now owned by `new-message-owner.js` and called explicitly by `app.js` from `renderNewConversation()`. It is not a service-worker transform and uses no observer or independent Firebase initializer.

### Prototype top-level contact seed
Raw `app.js` now uses an empty `contacts` compatibility array instead of named prototype identities. The current Messages route also has a real empty-conversation state.

## Transforms still present in `service-worker.js`

### 1. Per-device E2EE v2 helper functions — LEGACY/COMPATIBILITY, SECURITY-SENSITIVE
The service worker injects:
- `deriveDeviceEnvelopeKey()`
- `encryptDeviceEnvelope()`
- `buildDeviceEnvelopes()`
- `decryptDeviceEnvelope()`

These depend on the per-installation device identity in raw `app.js` and legacy `/users/{uid}/devices/{deviceId}` registry data.

**Rebuild treatment:** do not blindly materialize this as the final architecture. Device-owned E2EE is being superseded by the validated account-authoritative identity manager. Preserve the current behavior only until account-authoritative send/receive is ready to replace it.

### 2. E2EE v2 receive/decrypt branch — LEGACY/COMPATIBILITY, SECURITY-SENSITIVE
The service worker changes message receive/decrypt so `e2ee===2` resolves a device envelope and legacy `e2ee:1` remains readable.

**Rebuild treatment:** keep until account-authoritative message decrypt plus legacy migration behavior is deliberately implemented.

### 3. Direct-send trust-gate change — LEGACY/COMPATIBILITY, SECURITY-SENSITIVE
The service worker removes the old account-level changed-key send block because the current transformed runtime relies on per-device envelopes.

**Rebuild treatment:** do not copy this policy forward automatically. Account-authoritative key verification policy must be defined by the account identity path.

### 4. Outbox cloud-send conversion to per-device fan-out — LEGACY/COMPATIBILITY, SECURITY-SENSITIVE
The service worker replaces the legacy single-recipient ciphertext path with per-device `e2ee:2` fan-out and sender-device metadata.

**Rebuild treatment:** preserve until account-authoritative encryption/send/outbox replaces it. Do not make device fan-out the target design.

### 5. Group Firebase imports — GROUP FOUNDATION
Adds `listCloudUsers`, `createCloudGroup`, and `subscribeMyGroups` imports to transformed `app.js`.

**Rebuild treatment:** safe candidate for direct source materialization because these are already central `firebase.js` APIs and are unrelated to device-E2EE ownership.

### 6. Group runtime variables — GROUP FOUNDATION
Adds `cloudGroupUnsub` and `groupCandidates`.

**Rebuild treatment:** materialize with the group subscription/UI unit.

### 7. Cloud group merge/subscription functions — GROUP FOUNDATION
Injects `mergeCloudGroup()` and `beginCloudGroupSubscription()` so real Firestore group metadata appears in the conversation list.

**Rebuild treatment:** materialize directly in `app.js`; keep Firebase ownership in `firebase.js`.

### 8. Start/stop cloud group subscription on auth lifecycle — GROUP FOUNDATION
Adds authenticated start and sign-out cleanup for the group subscription.

**Rebuild treatment:** materialize as part of the same bounded group unit.

### 9. Real New Group / Group Details UI replacement — GROUP FOUNDATION
The service worker replaces raw group placeholder functions with FIDUNIO-user selection and real group metadata creation.

**Rebuild treatment:** materialize after preserving a rollback checkpoint. Group transport must stay disabled until reviewed group E2EE exists.

### 10. Block cloud-group message send — SAFETY-CRITICAL
The service worker injects an early send guard for `cloudGroup` conversations.

**Rebuild treatment:** materialize together with the group UI. This guard must exist in authoritative source before the group transform is removed.

## Temporary non-service-worker compatibility modules

These are not source transforms but still violate the target one-owner runtime and must be retired deliberately:

### `profile-sync.js`
Independently imports Firebase SDK and follows conversation/profile documents, then emits a global event containing peer names.

### `main-screen-polish.js`
Independently imports Firebase Auth for Sign Out and uses a broad `MutationObserver` to add Sign Out and rewrite rendered peer names.

### `settings-lifecycle-bridge.js`
Temporary deterministic bridge until `app.js` exposes the final explicit Settings render hook.

## Current consolidation order

1. **COMPLETE:** dead one-off cleanup and security/recovery checkpoint.
2. **COMPLETE:** real empty Messages state and New Message recipient owner.
3. **CURRENT:** materialize group metadata/subscription/UI/send guard from the service worker as one bounded non-cryptographic unit.
4. Replace profile-name and Sign Out overlays with central Firebase APIs + explicit `app.js` projection; remove `main-screen-polish.js` observer path.
5. Wire validated account-E2EE identity lifecycle through central `firebase.js`.
6. Replace per-device send/decrypt/fan-out transforms with account-authoritative messaging plus explicit legacy migration handling.
7. Confirm no semantic source transform remains.
8. Reduce service worker to network/cache/offline only.
9. Revalidate iPhone/iPad, receipts, Settings, offline reconnect, account switching, reinstall/recovery.

## Rule

For every bounded unit:

1. preserve a rollback checkpoint;
2. add the behavior to authoritative source or intentionally supersede it;
3. remove only the corresponding service-worker transform/compatibility module;
4. run the repository security/runtime gates;
5. never weaken account isolation, E2EE continuity, group-send safety, or deterministic UI ownership merely to simplify code.
