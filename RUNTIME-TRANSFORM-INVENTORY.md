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

### Main-screen peer names and Sign Out — FULLY MATERIALIZED
Peer display-name synchronization now comes through bounded `firebase.js` subscriptions and is projected explicitly by `app.js`. Sign Out is rendered and bound explicitly by `app.js` through central `signOutFidunio()`.

The former `profile-sync.js` and `main-screen-polish.js` compatibility overlays are deleted. No broad main-screen `MutationObserver` remains.

### Settings lifecycle ownership — FULLY MATERIALIZED
`app.js` imports and calls `mountSettingsLifecycle()` after `renderSettings()`. The former `settings-lifecycle-bridge.js` observer bridge is deleted.

### Firebase SDK ownership — CONSOLIDATED
Commit `f837acfc4b88cfacb0358359891110018b4c94ad` moved Settings profile/admin/invitation operations behind bounded `firebase.js` APIs.

Commit `b164a12ab2c2a86c88aaac70cfdf4079114d9243` moved password-reset service access out of `auth-ui-clean.js` and into central `firebase.js`.

`firebase.js` is now the sole runtime Firebase SDK/service owner. The runtime authority gate has no temporary Firebase SDK exceptions and no MutationObserver exceptions.

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

## Current consolidation order

1. **COMPLETE:** dead one-off cleanup and security/recovery checkpoint.
2. **COMPLETE:** empty Messages state and explicit New Message owner.
3. **COMPLETE:** all non-cryptographic group service-worker transforms materialized into raw `app.js`; group send remains fail-closed.
4. **COMPLETE:** peer-name/main-screen observer overlays retired; Sign Out and display names are explicit projections.
5. **COMPLETE:** Settings lifecycle bridge retired and all remaining non-central Firebase SDK ownership consolidated into `firebase.js`.
6. **CURRENT:** wire the validated account-E2EE identity lifecycle through central Firebase ownership without yet changing direct-message transport.
7. Replace per-device send/decrypt/fan-out transforms with account-authoritative messaging plus explicit legacy migration handling.
8. Confirm no semantic source transform remains and reduce service worker to cache/offline only.
9. Revalidate iPhone/iPad, receipts, Settings, offline reconnect, account switching, reinstall/recovery.

## Rule

For every bounded unit: preserve rollback, materialize/supersede behavior, remove only its matching transform, run gates, and never weaken account isolation, E2EE continuity, group-send safety, or deterministic UI ownership.
