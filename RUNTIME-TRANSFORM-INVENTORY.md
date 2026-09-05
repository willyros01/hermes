# FIDUNIO Runtime Transform Inventory

**STATUS: REBUILD INVENTORY — AUTHORITATIVE FOR SOURCE-CONSOLIDATION WORK**

This inventory records JavaScript behavior still injected into raw `app.js` by `service-worker.js`. A transform may be deleted only after its behavior is materialized in source or deliberately superseded by the account-authoritative rebuild architecture.

## Already materialized / no longer a transform target

### Live receipt reconciliation / read promotion
Validated receipt reconciliation is already present in raw `app.js` and remains protected.

### New Message recipient picker
`new-message-owner.js` owns the recipient-picker region and is called explicitly by `app.js`. The old observer-based New Message polish layer is removed.

### Empty production state
Raw `app.js` uses an empty compatibility contact array, empty conversations/messages, and a real no-conversations projection rather than named prototype identities.

### Group runtime foundation and creation UI — FULLY MATERIALIZED
Commit `bcfdebbc64477f4c2ed50ea77f4572322ba63abd` moved group imports/state/subscription/auth lifecycle and the fail-closed cloud-group send guard into authoritative `app.js`.

Commit `249eeea1a48a3dcdf9a98e742a29e79b7525395e` then materialized the real New Group / Group Details selection-and-create UI into raw `app.js` and removed the final non-cryptographic group service-worker rewrite.

Group metadata and creation now use central `firebase.js` APIs directly. Group message transport remains intentionally blocked until reviewed account-authoritative group E2EE exists.

## Transforms still present in `service-worker.js`

Only legacy/per-device E2EE compatibility transforms remain.

### 1. Per-device E2EE v2 helper functions — LEGACY/COMPATIBILITY, SECURITY-SENSITIVE
Injects `deriveDeviceEnvelopeKey()`, `encryptDeviceEnvelope()`, `buildDeviceEnvelopes()`, and `decryptDeviceEnvelope()` based on per-installation device identity.

**Treatment:** do not materialize as target architecture. Keep only until account-authoritative send/receive plus deliberate legacy migration replaces it.

### 2. E2EE v2 receive/decrypt branch — LEGACY/COMPATIBILITY, SECURITY-SENSITIVE
Adds `e2ee===2` per-device envelope decrypt while preserving legacy `e2ee:1` readability.

**Treatment:** keep until account-authoritative decrypt/migration is implemented.

### 3. Direct-send trust-gate change — LEGACY/COMPATIBILITY, SECURITY-SENSITIVE
Changes the older account-key trust behavior for the per-device transformed runtime.

**Treatment:** do not copy forward automatically; account-authoritative verification policy must own the target behavior.

### 4. Outbox cloud-send conversion to per-device fan-out — LEGACY/COMPATIBILITY, SECURITY-SENSITIVE
Converts cloud send to per-device `e2ee:2` fan-out.

**Treatment:** preserve only as compatibility until account-authoritative encryption/send/outbox replaces it.

## Temporary non-service-worker compatibility modules

### `profile-sync.js`
Still independently imports Firebase SDK and follows peer profile documents, then emits a global peer-name event. Must be consolidated through `firebase.js`.

### `main-screen-polish.js`
Still uses a broad `MutationObserver` to add Sign Out and rewrite peer names. Sign Out itself now routes through central `signOutFidunio()`; remaining DOM repair behavior must be materialized into explicit owners.

### `settings-lifecycle.js`
Deterministic Settings owner, but still has temporary direct Firebase SDK access for profile/admin data. Its service acquisition should eventually move behind bounded `firebase.js` APIs.

### `settings-lifecycle-bridge.js`
Temporary bridge until `app.js` exposes the final explicit Settings render hook.

## Current consolidation order

1. **COMPLETE:** dead one-off cleanup and security/recovery checkpoint.
2. **COMPLETE:** empty Messages state and explicit New Message owner.
3. **COMPLETE:** all non-cryptographic group service-worker transforms materialized into raw `app.js`; group send remains fail-closed.
4. **CURRENT:** replace peer-name/main-screen observer projections with central Firebase APIs + explicit `app.js` projection; remove `profile-sync.js` direct SDK access and `main-screen-polish.js` MutationObserver when their behavior is owned explicitly.
5. Consolidate remaining Settings direct Firebase service access behind bounded central APIs.
6. Wire validated account-E2EE identity lifecycle through central `firebase.js`.
7. Replace per-device send/decrypt/fan-out transforms with account-authoritative messaging plus explicit legacy migration handling.
8. Confirm no semantic source transform remains and reduce service worker to cache/offline only.
9. Revalidate iPhone/iPad, receipts, Settings, offline reconnect, account switching, reinstall/recovery.

## Rule

For every bounded unit: preserve rollback, materialize/supersede behavior, remove only its matching transform, run gates, and never weaken account isolation, E2EE continuity, group-send safety, or deterministic UI ownership.
