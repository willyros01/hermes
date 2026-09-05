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

### Account E2EE auth lookup/reset binding — MATERIALIZED, TRANSPORT UNCHANGED
Commit `ee27f32a46ef4a058a2c1e430f4a3c108e31f260` bound the validated account-E2EE lifecycle to the existing Firebase auth callback in `app.js`.

On authenticated UID, `app.js` calls `bindAuthenticatedAccountE2EE(uid)`, which serializes an authoritative identity lookup through `e2ee-account-lifecycle.js` and `e2ee-account-identity-manager.js`. On sign-out, `resetAccountE2EEForSignOut()` invalidates in-flight identity work and clears runtime account-E2EE state.

This bounded step deliberately does **not** enroll a missing identity, unlock a locked identity, replace legacy direct-message transport, or deploy anything to Firebase. Missing durable identity remains `EMPTY`; an existing durable identity remains `LOCKED` until a reviewed password + exact six-digit PIN lifecycle is wired. Recovery enrollment also remains fail-closed until the reviewed Firebase/Google recovery boundary is live.

The one-shot materializer and its workflow were removed immediately after materialization. GitHub run `33981660852` showed `action_required` only because the PR workflow was triggered by the Actions-bot materializer and created zero jobs. A normal user-authored follow-up run proved the repository security gate green. Protected checkpoint `checkpoint-rebuild-account-e2ee-auth-binding` points to `251679cd9240e45f335536fed9bed5bc43e76157`.

### Account-authoritative direct-message crypto/rules/service — VALIDATED ISOLATED CANDIDATE
The rebuild branch now contains a tested account-to-account direct-message replacement that is deliberately **not wired into normal runtime transport yet**:

- `e2ee-account-message-crypto.js` — ECDH P-256 + HKDF-SHA-256 + AES-256-GCM account-message crypto, version `e2ee:3`;
- `ACCOUNT-E2EE-DIRECT-MESSAGE-FORMAT.md` — exact format and migration constraints;
- `firestore.rules` — exact repository candidate acceptance for account-message rows while retaining legacy plaintext/e2ee:1/e2ee:2 compatibility;
- `firestore-account-message-v3.rules.test.mjs` — dedicated emulator-only account-message rule matrix;
- `e2ee-account-message-service.js` — fail-closed service that uses only a READY durable account runtime identity plus the peer authoritative public account identity;
- crypto/rules/service tests are part of `Rebuild Baseline Security Gate`.

Exact crypto envelope fields are `e2ee,kdfVersion,senderKeyId,recipientKeyId,ciphertext,iv`. Device ID and per-device envelopes are absent. The exact Firestore v3 message row must keep plaintext `text` empty and bind sender/recipient keyIds to authoritative `e2eePublicKeys/{uid}` records. A dedicated test exposed and then closed a cross-format loophole where a mixed E2EE row could be accepted by the older plaintext clause; plaintext rows now explicitly require no `e2ee` field.

The full expanded security gate passed at commit `ca9222bdb7171ae60de5b2b9c08bf5b9327f52c9`, including the original 42 account-E2EE rules matrix, the dedicated account-message rules matrix, account-message crypto and fail-closed service, all recovery tests, Functions scaffold, transform anchors, and runtime authority. Protected checkpoint: `checkpoint-rebuild-account-dm-v3-crypto-rules`.

## Transforms still present in `service-worker.js`

Only legacy/per-device E2EE compatibility transforms remain.

### 1. Per-device E2EE v2 helper functions — LEGACY/COMPATIBILITY, SECURITY-SENSITIVE
Injects `deriveDeviceEnvelopeKey()`, `encryptDeviceEnvelope()`, `buildDeviceEnvelopes()`, and `decryptDeviceEnvelope()` based on per-installation device identity.

**Treatment:** do not materialize as target architecture. Keep until account-authoritative send/receive is actually reachable with READY account identities and deliberate legacy migration is validated.

### 2. E2EE v2 receive/decrypt branch — LEGACY/COMPATIBILITY, SECURITY-SENSITIVE
Adds `e2ee===2` per-device envelope decrypt while preserving legacy `e2ee:1` readability.

**Treatment:** keep until account-authoritative receive/migration is implemented and target-device validated.

### 3. Direct-send trust-gate change — LEGACY/COMPATIBILITY, SECURITY-SENSITIVE
Changes the older account-key trust behavior for the per-device transformed runtime.

**Treatment:** do not copy forward automatically; account-authoritative verification policy owns the target behavior.

### 4. Outbox cloud-send conversion to per-device fan-out — LEGACY/COMPATIBILITY, SECURITY-SENSITIVE
Converts cloud send to per-device `e2ee:2` fan-out.

**Treatment:** preserve until account-authoritative encryption/send/outbox is reachable and validated with stable message IDs and reconnect behavior.

## Current boundary and next ordered work

1. **COMPLETE:** dead one-off cleanup and security/recovery checkpoint.
2. **COMPLETE:** empty Messages state and explicit New Message owner.
3. **COMPLETE:** all non-cryptographic group service-worker transforms materialized; group send remains fail-closed.
4. **COMPLETE:** peer-name/main-screen observer overlays retired; Sign Out and display names are explicit projections.
5. **COMPLETE:** Settings lifecycle bridge retired and all non-central Firebase SDK ownership consolidated into `firebase.js`.
6. **COMPLETE (LOOKUP/RESET):** validated account-E2EE lifecycle is bound to Firebase auth for serialized lookup and sign-out invalidation.
7. **COMPLETE (ISOLATED PRE-HANDOFF):** account-authoritative direct-message v3 crypto, exact repository rules, and fail-closed service are validated and checkpointed; normal runtime transport is unchanged.
8. **BLOCKED UNTIL FIREBASE/GOOGLE HANDOFF:** deploy/verify the already-reviewed account-E2EE Firestore rules and recovery enrollment boundary so a real authenticated account can safely reach durable identity `READY` without silent replacement. Normal enrollment requires the recovery service because creation atomically establishes both normal and recovery wrappers.
9. After the live-project boundary is proven, wire normal enrollment/unlock readiness explicitly into auth/PIN lifecycle and then migrate send/receive/Outbox to account v3 in bounded increments while retaining explicit legacy readability.
10. Only after account-authoritative send/receive is proven remove matching per-device transforms and reduce service worker to cache/offline only.
11. Finish Firestore-authoritative encrypted history + UID-scoped rebuildable cache + serialized Outbox and revalidate iPhone/iPad/PWA receipts/offline/Settings/account switching/reinstall/recovery.

## Rule

For every bounded unit: preserve rollback, materialize/supersede behavior, remove only its matching transform, run gates, and never weaken account isolation, E2EE continuity, group-send safety, or deterministic UI ownership.
