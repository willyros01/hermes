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

## September 6, 2026 account-E2EE runtime authority

- Firebase SDK/service initialization and callable recovery: firebase.js only.
- Durable account identity lifecycle: e2ee-account-identity-manager.js through e2ee-account-runtime.js.
- Direct-message e2ee:3 orchestration: e2ee-account-message-runtime.js -> e2ee-account-message-service.js.
- Settings enrollment/unlock/recovery UI: settings-lifecycle.js in its named Account Encryption host.
- Service worker: cache/transport only; zero app.js semantic transforms.
- New direct-message transport is e2ee:3 only and requires account identity READY. Legacy e2ee:1/e2ee:2 remain read compatibility until migration history is no longer needed.

## Group administration materialization — 2026-09-06
Group Info mutations now route `app.js -> group app integration/controller -> account group runtime -> Firebase adapter -> firebase.js`. Membership changes are a single serialized cryptographic+Firestore operation; the runtime prepares an epoch for the exact post-change members and `firebase.js` atomically commits membership, member document, key epoch and epoch record. Rename uses the same serialized bridge but does not rotate the key because membership is unchanged.


## Group earlier-history grant foundation — 2026-09-06
- `e2ee-account-group-history-crypto.js`: isolated message-granular grant cryptographic transform only.
- Existing group runtime remains the only authorized path that may decrypt source group messages; the grant crypto owner never reads Firestore or epochs itself.
- Future grant creation path remains `app.js intent -> group app controller -> serialized group runtime/service -> firebase.js opaque persistence`.
- Historical epoch keys are never handed to the target merely to satisfy a date boundary.
- Group Info history-grant UI remains disabled until Firestore schema/rules, runtime integration, source-boundary selection, purge linkage and emulator tests are green.

## Group history-grant runtime path — 0.9.6.7
`e2ee-account-group-history-crypto.js` owns only message-granular grant cryptography. `e2ee-account-group-runtime.js` is the serialized group orchestration owner for grant selection/construction/decryption. `e2ee-account-group-firebase-adapter.js` is a thin naming adapter. `firebase.js` remains the sole Firebase SDK/service owner for grant persistence/read transport. `app.js`, the service worker and UI modules do not own grant cryptography or Firestore writes. The Group Info UI is still disabled until projection/purge integration is complete.

## Group granted-history projection — 0.9.6.8
- `e2ee-account-group-history-projection.js`: pure read-model merge helper only; no Firebase, crypto, IndexedDB or mutable authority.
- `e2ee-account-group-conversation.js`: read-side owner that combines ordinary decrypted rows with active history-grant rows obtained through `e2ee-account-group-service.js`.
- `app.js` continues to receive one bounded `onRows` projection and owns only rendering/cache projection; it does not decrypt grant copies or read Firestore grants directly.
- Normal receipt mutation is restricted to ordinary rows that decrypt successfully; granted historical projection does not mint retroactive receipts.

## Earlier-history source selection — 0.9.6.9
- `app.js` / future Group Info control: intent only (`groupId`, `targetUid`, `boundary`).
- `e2ee-account-group-app-integration.js` / controller: bounded serialized intent bridge only; no source rows, Firebase or crypto.
- `e2ee-account-group-runtime.js`: grant ID generation, authoritative boundary filtering, source decrypt/re-encrypt and grant serialization.
- `e2ee-account-group-firebase-adapter.js`: one-shot server-backed retained-message read by wrapping the existing central firebase.js group subscription; cache-only snapshots are not grant authority.
- `firebase.js`: remains the sole Firebase SDK/service owner.

## Disappearing first-Read authority — 0.9.6.10
- `disappearing-content-policy.js`: pure recipient-expiry/shared-source eligibility decisions.
- `firebase.js`: sole receipt persistence owner; direct/group first Read uses a Firestore transaction and server timestamp. Repeat Read returns the already-established authority rather than moving it.
- Firestore Rules: recipient/account authorization plus immutable `readAt == request.time` boundary.
- Existing direct app/group conversation owners request receipt state only. They do not supply a disappearance timestamp.
- Physical purge/anti-resurrection remains a separate future serialized resource owner and is not implemented by this checkpoint.

## Disappearing outer message metadata — 0.9.6.12
- `disappearing-content-policy.js`: sole duration normalization/schema-name policy owner.
- Direct/group UI/controller callers provide intent only; resolved duration is stored as outer `disappearAfterSeconds` metadata.
- Encrypted Outbox records preserve the resolved duration across offline retry.
- Direct/group crypto modules do not own or authenticate this metadata and remain exact-envelope owners only.
- `firebase.js` is the sole Firestore persistence owner and writes the bounded optional metadata alongside ciphertext.
- Firestore Rules enforce bounds and immutability through exact create schemas plus receipt-only update diffs.
- Physical deletion remains a separate not-yet-materialized serialized resource owner.

## Disappearing purge-decision authority — 0.9.6.13
- `disappearing-purge-policy.js`: pure final-source eligibility only.
- Direct input authority: immutable message `readAt` plus immutable outer duration.
- Group input authority: source epoch membership, sender UID, current entitlement membership, per-account immutable Read receipts, immutable outer duration, and server-side current time.
- History grants do not become source-lifetime authority and cannot resurrect or extend a disappearing source.
- No deletion executor exists at this checkpoint. Final purge must be implemented by one serialized server-side owner and must also coordinate receipts, grant copies/metadata, attachments and local anti-resurrection.

## Disappearing serialized purge executor — 0.9.6.14
- `disappearing-purge-policy.js`: sole pure final-source eligibility owner.
- `disappearing-purge-executor.js`: sole serialized purge-coordination owner; no Firebase/Admin SDK, local storage, DOM, crypto or delete calls.
- Future server repository/adapter: sole physical Firestore/Storage delete owner. It must supply authoritative state + opaque basis, then re-read/revalidate that basis before commit.
- Server-side current time is required. Device/browser time cannot authorize cloud deletion.
- Ineligible sources never enter the mutable delete owner; stale basis fails closed without stale-state retry.
- No scheduled Function, client delete rule, or local anti-resurrection executor exists yet.

## Disappearing Firestore purge repository — 0.9.6.15
- Server Firestore repository: `disappearing-purge-firestore-admin-adapter.mjs`.
- Admin Firestore is injected; the module is not a Firebase initializer and is never a browser/runtime import.
- Direct source deletion: transaction re-reads conversation/message, compares opaque update-time basis, then deletes only on unchanged authority; stale basis fails closed and absence is idempotent.
- Group read: authoritative group + source + source epoch + per-account receipts, all bound into the opaque basis supplied to the pure eligibility owner.
- Group source deletion: intentionally unavailable until history-grant/receipt subordinate trace deletion is materialized. No independent/partial group delete path is permitted.

## Disappearing group grant trace planning — 0.9.6.16
- `disappearing-group-grant-trace-plan.js`: pure plan only; no mutable authority.
- Group purge repository read now enumerates group history grants + grant copy subcollections, validates them through the pure planner, and incorporates their Firestore update times into the opaque purge basis.
- Incomplete/inconsistent grant construction fails closed rather than allowing source deletion to bypass subordinate traces.
- Group commit remains intentionally disabled pending a basis-visible concurrent-grant barrier and final receipt/grant/source transaction/precondition implementation.

## Group history-grant purge barrier — 0.9.6.17
- `firebase.js` history-grant create transaction now updates group `updatedAt` and creates the grant with one server timestamp.
- Firestore Rules require `historyGrantBarrier(groupId)` and reject grant creation lacking that exact group touch.
- The server purge repository already includes group update-time in the opaque basis, making new-grant creation conflict/basis-visible.
- Physical group trace deletion remains exclusively server-side and not yet enabled.
