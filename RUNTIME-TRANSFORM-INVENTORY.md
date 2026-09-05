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

### Group runtime foundation — MATERIALIZED
Commit `bcfdebbc64477f4c2ed50ea77f4572322ba63abd` moved these behaviors into authoritative `app.js`:
- central Firebase imports `listCloudUsers`, `createCloudGroup`, `subscribeMyGroups`;
- `cloudGroupUnsub` and `groupCandidates` state;
- `mergeCloudGroup()` and `beginCloudGroupSubscription()`;
- authenticated start/sign-out cleanup of group subscription;
- fail-closed cloud-group send guard.

The matching service-worker transforms were removed. The group send guard is now authoritative source and continues to block group message transport until reviewed group E2EE exists.

## Transforms still present in `service-worker.js`

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

### 5. Real New Group / Group Details UI replacement — NON-CRYPTOGRAPHIC, REMAINING GROUP TRANSFORM
The service worker still replaces raw group placeholder functions with FIDUNIO-user selection and real group metadata creation UI.

**Treatment:** this is now the next bounded group materialization. The data/subscription APIs and fail-closed send guard it depends on are already authoritative raw source.

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
3. **PARTIAL COMPLETE:** group imports/state/subscription/auth lifecycle/send guard materialized; matching SW transforms removed.
4. **CURRENT:** materialize the remaining New Group / Group Details UI transform into raw `app.js`, then remove that final non-cryptographic group transform.
5. Replace peer-name/main-screen observer projections with central Firebase APIs + explicit `app.js` projection.
6. Wire validated account-E2EE identity lifecycle through central `firebase.js`.
7. Replace per-device send/decrypt/fan-out transforms with account-authoritative messaging plus explicit legacy migration handling.
8. Confirm no semantic source transform remains and reduce service worker to cache/offline only.
9. Revalidate iPhone/iPad, receipts, Settings, offline reconnect, account switching, reinstall/recovery.

## Rule

For every bounded unit: preserve rollback, materialize/supersede behavior, remove only its matching transform, run gates, and never weaken account isolation, E2EE continuity, group-send safety, or deterministic UI ownership.
