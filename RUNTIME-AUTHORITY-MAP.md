FCM N3 OWNERSHIP — 1.1.1: firebase.js is sole Firebase Messaging/Firestore notification-device API owner; notification-registration.js is the sole serialized notification intent/registration coordinator; settings-lifecycle.js owns the predefined Notifications Settings host. No second Firebase initializer, message store, receipt owner, or service-worker message authority.

# FIDUNIO Runtime Authority Map

## 0.9.9.12 disappearing text activation owner
`purgeDisappearingMessagesV1` is the sole scheduled discovery trigger. It discovers only exact direct/group message documents carrying `disappearingPurgeVersion: 1`, then delegates eligibility/serialization to `disappearing-purge-executor.js` and physical Firestore mutation to `disappearing-purge-firestore-admin-adapter.mjs`. Server time is mandatory. The marker is stamped only on newly sent text; attachments and pre-activation rows are excluded. `app.js` remains sole UID-local physical convergence/Outbox owner. No client delete rule, tombstone, second Firebase owner, or service-worker semantic owner is introduced.

## Message Notification / FCM authority — FIDUNIO 1.1

`FCM-NOTIFICATION-ARCHITECTURE.md` is the authoritative notification ownership map and must be read before notification work. Key boundary: `firebase.js` remains sole client Firebase SDK/service owner; a dedicated registration owner may manage notification intent/status only; server Functions/Admin own recipient resolution/FCM send/token cleanup; `service-worker.js` owns only generic push display/click transport; `app.js`/existing conversation owners retain routing/message projection; existing E2EE and receipt owners are unchanged. Push never constructs message state or decrypts content.

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

## Group history-copy purge barrier — 0.9.6.18
- `firebase.js` history-copy chunk transport updates parent-group `updatedAt` in the same batch as every genuinely new copy chunk.
- Firestore Rules deny copy create unless `historyGrantBarrier(groupId)` is satisfied.
- Group update-time is already part of the server purge basis, so new grant-copy writes are now purge-conflict/basis-visible.
- No physical delete authority moved to the client; group purge commit remains server-only and currently fail-closed.

## Group receipt purge barrier — 0.9.6.19
- New e2ee:4 group source: `receiptRevision: 0`.
- `firebase.js` group receipt transaction: parent message + caller receipt -> one atomic real-state transition + exact parent revision increment.
- Firestore Rules bind the two writes and prohibit unrelated group-message mutation.
- Server purge basis already contains the source update version, so receipt changes now invalidate stale purge plans.
- Physical group delete authority remains server-only/fail-closed.

## Group physical trace commit — 0.9.6.20
- Server purge repository: sole Firestore delete owner.
- One transaction re-reads group/source/epoch/receipts/grants/copies, checks opaque basis, recomputes grant trace plan, then atomically deletes/reconciles subordinate traces and source.
- 0.9.6.17-.19 concurrency barriers make browser grant/copy/receipt mutations basis-visible.
- Local/offline convergence remains a separate UID-scoped resource and is not owned by this server transaction.

## Local disappearing convergence — 0.9.6.21
- Pure decision: `disappearing-local-convergence.js`.
- Required evidence: valid disappearing metadata, explicit server-backed prior observation, authoritative server-backed absence.
- Outputs: message IDs and matching Outbox IDs to physically remove.
- IndexedDB/app-state mutation remains with the existing local persistence owner; wiring is the next slice.
- Cache-only/offline snapshots and client clocks cannot authorize removal.

## Local physical purge wiring — 0.9.6.22
- Mutable owner: existing `app.js` local persistence path.
- Resources: in-memory `state.messages`, encrypted `history`, encrypted `outbox`, encrypted persisted app-state.
- Serialization: dedicated local purge promise queue; active Firebase UID must match requested UID.
- Pure helper: `disappearing-local-storage-plan.js` computes exact removals only.
- 0.9.6.23 remains responsible for invoking this only from authoritative direct/group server-backed convergence.

### 0.9.6.23 projection convergence authority
Server/cache projection decisions are centralized in `disappearing-authoritative-projection.js`. Firestore `fromCache` metadata is carried from the central Firebase/group subscription owners to the app boundary. Cache projections merge without purge; authoritative projections mark remote rows server-backed and may request exact local physical convergence through app.js. The local mutation itself remains serialized under the existing app/IndexedDB owner. Restart/reconnect pre-flush ordering is intentionally not claimed complete until 0.9.6.24.

0.9.6.25 RECONNECT / REPLAY OWNERSHIP
- `disappearing-reconnect-recovery.js`: pure restart/reconnect Outbox decision owner only. It has no Firebase SDK, IndexedDB, clock authority, crypto mutation, or physical delete capability.
- `firebase.js`: sole client Firebase owner for explicit direct/group server source-ID probes used by reconnect reconciliation. These probes use server reads and do not mutate Firebase.
- `app.js`: sole serialized reconnect orchestration and local mutation owner; it invokes server probes, applies the pure plan, physically removes local/Outbox traces through the established local owner, and gates replay.
- The service worker remains transport/cache only and owns no disappearing/replay semantics.
- The unresolved post-commit/pre-observation crash gap must not be solved by adding a second Firebase/local-storage owner, a per-message tombstone, client-clock authority, or scattered delete paths.

### 0.9.6.25 reconnect fail-closed authority
Outbox attempt state is owned and mutated only by `app.js`; authoritative source presence/absence is read only through `firebase.js`; `disappearing-reconnect-recovery.js` only plans accepted/purge/replay/blocked IDs. Automatic replay requires both authoritative server absence and `sendAttempted !== true` plus no prior server-backed observation. Attempted+absent is blocked/failed, never replayed automatically.

### 0.9.9.8 device finding — bounded pre-send reconciliation required

FDA-DM-001 proves the current owner can remain indefinitely at Sending while awaiting authoritative server reconciliation before a direct Firestore send. Any repair stays within the same `app.js` serialized Outbox/reconnect owner and `firebase.js` server-read boundary. A bounded pre-send failure must preserve the Outbox and must not create another retry path or fabricate Sent/Delivered/Read.

The 0.9.9.8 repair candidate implements that boundary through pure `outbox-reconciliation-boundary.js`, which owns no mutable resource. It supplies a 12-second wait boundary and a pure list of eligible requeue IDs. `app.js` remains the only state/IndexedDB mutation owner: it requeues only `sendAttempted !== true` Outbox-backed Sending rows and preserves every Outbox record. `firebase.js` remains the only Firebase SDK owner.

Device retest proved that serializing reconciliation alone was insufficient because the subsequent flush could overlap across lifecycle triggers. The expanded candidate adds one full-cycle `outboxCycleTail` inside `app.js`, covering reconciliation through post-attempt confirmation. Stage timeouts do not authorize replay: pre-attempt work may return to Queued; after the durable attempt marker, ambiguity remains Failed until authoritative server evidence resolves it. The service worker only caches the new pure module and owns no send semantics.

### 0.9.6.27 disappearing compose selection
`disappearing-compose-policy.js` is pure normalization/presentation policy only. `app.js` owns the persisted user selection and snapshots it when constructing a new outgoing row. Existing direct/group Outbox and message owners carry the immutable `disappearAfterSeconds`; no UI preference becomes expiry or purge authority.

## 0.9.6.29-0.9.6.30 authority reconciliation
Group earlier-history UI is intent-only: app -> bounded group integration -> controller serialization -> group runtime -> central Firebase transport. Source selection never moves into the DOM/app shell. Direct Read receipt mutation is single-path inside the active direct subscription; group receipt subscription/projection remains owned by `e2ee-account-group-conversation.js`. No new Firebase, IndexedDB, crypto, or receipt owner was introduced.

## 0.9.7.0–0.9.7.4 attachment send checkpoint — repository validated

Builds 0.9.7.0 through 0.9.7.4 establish one attachment send owner and wire photo, file, audio and video selection/capture through bounded local AES-256-GCM chunk encryption, encrypted Outbox staging, ciphertext-only Firebase Storage upload through `firebase.js`, and the existing direct/group E2EE message commit path. Attachment keys travel only inside E2EE message ciphertext. Size limits are photo 12 MiB, file 20 MiB, audio 25 MiB, video 50 MiB. Storage client delete is denied; disappearing attachment deletion remains reserved for the purge owner in 0.9.7.8. Full Rebuild Baseline Security Gate `34063327957` SUCCESS. No live Firebase or htest deployment occurred. Runtime version is 0.9.7.4. Next build is 0.9.7.5 receive/decrypt/display/play.

## 0.9.7.5–0.9.7.9 attachment phase closeout — repository validated

Runtime 0.9.7.9 completes the allocated attachment phase: integrity-checked receive/decrypt with explicit object-URL lifecycle; UID-scoped offline/cache recovery policy; message-level receipt authority; trace-free disappearing-attachment purge planning and serialized storage/local-before-source execution; and the permanent attachment closeout matrix. Firebase Storage download remains solely in `firebase.js`. Client Storage deletion remains denied; server purge dependencies are injected into the dedicated purge executor and no live Firebase deployment occurred. Full Rebuild Baseline Security Gate `34064314857` SUCCESS. Next allocated build is 0.9.8.0 invitation deterministic-owner rebuild; rejected 0.9.4.12-.15 invite/install logic remains forbidden.

## 0.9.8.0–0.9.8.5 invitation/install checkpoint — repository validated

Runtime 0.9.8.5 completes the invitation/join/install phase. `invitation-owner.js` is the sole serialized invitation mutation coordinator while `firebase.js` remains the sole Firebase repository/SDK owner. Pure `invitation-policy.js` enforces single-use lifecycle, issuer roles and target roles. Auth and Settings request invitation work through that owner. Firestore emulator coverage proves anonymous validation of a known token, unauthorized issuance/revocation denial, owner issuance/revocation, atomic accepted-invitation + active-profile enrollment, and second-redemption denial. Joined active profiles flow into existing direct/group discovery without device binding.

`install-guidance.js` owns only an optional predefined Settings Install panel. It never mutates invitation, account, messaging or service-worker state and never uses automatic install prompting. iOS uses Safari Share -> Add to Home Screen; Android/Fire and desktop use browser-provided install/add/shortcut commands when available. The rejected 0.9.4.12–0.9.4.15 invite/install logic was not restored or adapted. Protected iPhone Back/wrap, Settings deterministic ownership and two-pane architecture remain gated. Full Rebuild Baseline Security Gate `34065528714` SUCCESS. No live Firebase or htest deployment occurred. Next allocated build: 0.9.9.0 Group Info completion.


## 0.9.9.0-0.9.9.5 repository candidate checkpoint — 2026-09-06
Group Info landscape/responsive completion, real Direct Chat Info-only behavior, prototype/simulation retirement and responsive/lifecycle hardening are repository-validated. Permanent candidate UI/lifecycle coverage is in the normal baseline. Full gate 34066875377 SUCCESS. Runtime checkpoint 0.9.9.5. Weighted ledger 95.5/100 (reported 96%). Next: 0.9.9.6 atomic htest deployment. Do not claim 0.9.9.7 device acceptance until the user actually tests iPhone/iPad/two-account/offline/disappearing/attachments/invitation/install/recovery. Live Firebase is still not to be changed.


## 0.9.9.8 Firebase Storage connectivity repair — IN PROGRESS — 2026-09-06
The 0.9.9.7 pre-acceptance connectivity check proved that the prior 0.9.7.x attachment gates were repository-only dependency-injection/source tests, not a real Firebase-backed attachment test. The live default bucket `fidunio-fef13.firebasestorage.app` was then created in `US-CENTRAL1`, the reviewed `storage.rules` compiled and deployed, and Firebase granted the required Storage-Rules-to-Firestore cross-service role. Firestore rules, Functions, Hosting, Auth, App Check, GitHub branches and protected Firebase configuration were not changed by that live setup.

Repository stabilization now registers `storage.rules` in `firebase.json` and adds a permanent Storage deployment-wiring gate. Runtime advances 0.9.9.6 -> 0.9.9.8 because 0.9.9.7 is the device-acceptance gate, not an implementation build. This does not complete attachment acceptance: authenticated real-device upload/download/authorization/offline/purge proof remains required. The 0.9.9.8 point remains unearned until the full repository gate is green and acceptance defects are closed. Overall ledger remains 96.0/100 (96%).


### 0.9.9.8 repository validation checkpoint — 2026-09-06
Commit `34c8d237eb8f08b8228f670b8ca958038b553aef` registers `storage.rules` in `firebase.json`, adds the permanent `storage-deployment-wiring.test.mjs` gate, advances runtime to 0.9.9.8, and preserves `firebase-config.js` unchanged at blob `b81026dcc07b7374d1f48d0cb094764ce28319bd`. Full Rebuild Baseline Security Gate `34072294756` completed SUCCESS, including the new Firebase Storage deployment-wiring step. This proves repository deployability, not real attachment operation. 0.9.9.8 remains IN PROGRESS pending authenticated iPhone/iPad upload, second-device download/decrypt, unauthorized denial, offline/reconnect and disappearing-attachment purge proof. No additional completion credit is earned; overall remains 96.0/100 (96%).


## 0.9.9.8 iPad stabilization ownership — 2026-09-07

`app.js` remains the sole route/render owner. Its direct/group subscription callbacks now own only a small pending/error presentation state so asynchronous Firebase discovery cannot be mislabeled as authoritative emptiness. `firebase.js` remains the sole Firebase owner and all IndexedDB/account-storage boundaries remain unchanged. The existing tablet sidebar and root text-size classes remain the sole layout/accessibility owners; no MutationObserver, orientation listener, reload synchronization, new storage owner or competing renderer was added.

## 0.9.9.8 iPad RC repair candidate — 2026-09-07

The bounded repair candidate addresses FDA-IPAD-001 through FDA-IPAD-003 without changing Firebase/E2EE/storage ownership. It separates Sign Out from the constrained tablet icon cluster, makes tablet brand/navigation/tool labels scale from the established root A/A+/A++ owner, changes the obsolete eight-slot tablet attachment grid to the four supported tools, and distinguishes Firebase conversation discovery from authoritative empty/error state. It does not fabricate conversations or restore quarantined cross-account data. Targeted iPad stabilization, release-candidate UI/lifecycle and Storage-wiring gates pass locally. Full baseline, promotion to `main`, Pages deployment and repeated user-device acceptance remain pending. Defects remain OPEN; 0.9.9.8 earns no point and total completion remains 96.0/100.0 (96%).


## 0.9.9.8 second iPad acceptance evidence — 2026-09-07

The first repair restored the real cloud conversation and composer/widgets and removed the horizontal Sign Out collision. The user screenshot also exposed FDA-IPAD-004 (standalone status-bar header clipping) and FDA-IPAD-005 (unused right-side viewport). A tablet-only follow-up candidate adds a bounded safe-top fallback and gives the existing `#app`/tablet-shell owner full flex width. Targeted iPad, candidate UI and receipt-lifecycle gates pass locally. All five device defects remain open until full baseline, `main` deployment and repeated user acceptance. Completion remains 96.0/100.0 (96%).

FDA-DM-001 authenticated-session ownership: key verification may record trust but must not call lower-level `flushQueued()` directly. Verification, foreground and online recovery enter the same serialized `app.js` authoritative reconcile/Outbox cycle. That owner requests a forced current ID token through sole Firebase SDK owner `firebase.js` before reconciliation. Every Firebase-dependent stage is bounded and named; no new Firebase, Outbox, E2EE or receipt owner is introduced.

FDA-DM-001 follow-up corrects the token policy and trigger queue: `firebase.js` establishes a valid authenticated session with the SDK's cached-token/automatic-refresh behavior; `app.js` coalesces repeated lifecycle requests inside its single Outbox owner, preventing a serialized backlog. Local PIN configuration remains installation-wide in `local-security.js`; storage read failure is unavailable/locked, never equivalent to no PIN. Static startup presentation in `index.html` exists only until the established bootstrap/auth owner replaces it.

Account v3 read direction remains owned by `e2ee-account-message-service.js`. It compares authoritative `row.senderUid` with the authenticated account and peer, then supplies actual AAD direction and local/peer key material to the existing crypto owner. `app.js` does not select keys. Unknown senders fail closed. No Firebase, Outbox, receipt, storage or service-worker semantic owner is added.

Repository authority is `main` only as of 2026-09-07. The branch choice does not change runtime owners: code, durable documents, the permanent baseline and GitHub Pages deployment now converge on the same branch. The former documentation mirror is removed.

The disappearing compose policy owns only normalization and the one-time `disappearAfterSeconds` stamp. It must not freeze the whole Outbox application row. `app.js` remains the sole serialized transport-state owner and may advance that row through Queued, Sending, Sent or Failed without creating another expiry or receipt authority.

Pending-message cancellation belongs to the same `app.js` Outbox coordinator. A reservation blocks transport at bounded pre-send checkpoints; after active work settles, the existing physical local purge owner removes message, history and encrypted Outbox traces. It never calls Firestore deletion.

Accepted direct-message physical deletion belongs only to callable `deleteDirectMessageForEveryoneV1` and its Admin repositories. `firebase.js` is the sole client callable owner; `app.js` owns presentation only. Attachment-object traces are removed before the Firestore source. See `MESSAGE-DELETION-AUTHORITY.md`.

As of 0.9.9.9k that callable also owns accepted group-message physical deletion when explicitly requested as a group operation. It revalidates original sender and current membership and transactionally removes receipts, history-grant traces, and the group source; the UI remains sender-only.

User access presentation is governed by `USER-ACCESS-KEY-UX.md`: email/password plus one six-digit FIDUNIO PIN are visible; internal cryptographic resources retain distinct code owners and domain separation but no ordinary-user controls.

The Settings Security host coordinates first setup through existing public operations. `settings-lifecycle.js` owns the DOM and serialization; `local-security.js` remains sole installation-verifier owner; `e2ee-account-runtime.js` remains sole account-identity lifecycle facade. The same transient user PIN never creates shared derived key material or another storage owner.

## FIDUNIO 1.1.6 notification routing checkpoint — 2026-09-09

- N4 real-device acceptance passed: a backgrounded iPhone received the generic `FIDUNIO — New message` notification after the live Eventarc/Cloud Run invocation permission was corrected.
- Live N4 trigger: `notifyDirectMessageCreatedV1`; Eventarc trigger region is `nam5`; the trigger service account has `roles/run.invoker` only on the N4 Cloud Run service.
- N5 candidate adds deterministic notification-tap routing. The service worker may focus/open FIDUNIO and pass only opaque direct-message routing intent. `app.js` remains the route/message owner and resolves the conversation through existing Firestore/E2EE state.
- Notification metadata never creates a message row, decrypts content, or writes receipts. Cold-open routing waits behind the normal local PIN/auth gates.
- Device acceptance still required for N5 warm-open and cold-open taps before N5 is closed.

## FIDUNIO 1.1.9 — optional sender display-name notifications — 2026-09-09

**Status: REPOSITORY CANDIDATE; live Firestore rules + N4 Function deployment and device acceptance required.** Private notifications remain the default. Each notification installation may explicitly opt in with `showSenderName: true`. The server resolves the sender only from authoritative `users/{senderUid}.displayName`, never from message `senderName`, and sends `FIDUNIO — New message from <display name>` only to opted-in installations. Non-opted installations remain `FIDUNIO — New message`. Message text, attachment names, email, UID, phone, ciphertext and decrypted content remain excluded. This changes no Firestore/E2EE/message/receipt authority.

## FIDUNIO 1.1.18 notification-click experiment — REJECTED

The returned-client message/focus addition is removed. The restored 1.1.17 authority remains: `service-worker.js` opens the validated routed URL; `app.js` alone owns pending-route retention, conversation selection, Firestore subscription and rendering. No message, receipt, PIN, Settings or navigation authority changed.

## FIDUNIO 1.1.19 diagnostic ledger authority

`notification-diagnostics.js` solely owns the isolated append-only diagnostic database. Worker and page owners may submit observations but cannot use the ledger as routing/message authority. `service-worker.js`, bootstrap/auth, `app.js`, Settings, Firebase, Outbox, receipts and E2EE retain their existing decisions and storage owners.

## FIDUNIO 1.1.20 pending-notification authority

`notification-pending-inbox.js` solely owns the installation-local opaque route database. `service-worker.js` validates and writes before display. `app.js` may list/group/consume only after its existing hydration + unlock + Firebase-user gate; it remains the sole conversation-selection/subscription/render owner. No worker or inbox code may read messages, decrypt, write receipts, mutate Outbox, use UID-global routing or invoke lifecycle recovery. The 1.1.19 diagnostic owner is removed from runtime.

## FIDUNIO 1.1.21 activation and active-composer authority

`requestAppActivation()` in `app.js` is the sole serialized/coalescing owner of app activation decisions. Hydration, PIN/biometric unlock, Firebase-auth readiness, `visibilitychange`, `pageshow`, online/offline and worker route delivery submit signals only. Its promise mutex drains an explicit reason queue, including signals received during awaited work; there is no busy/follow-up flag. The owner rereads the installation-local inbox, applies notification priority, establishes the already-defined active message subscription without forced replacement, requests the UI projection and finalizes inbox consumption.

`render()` remains the sole UI projection entry. `composerStateByConversation` owns ephemeral per-conversation draft, focus, selection and scroll state. Background data callbacks request `{background:true}`; the render owner updates only `#chatArea`, `#chatStatusRegion`, the active name and tablet list while leaving `#messageBox` mounted. Draft state is memory-only and is cleared on sign-out. No Firebase, E2EE, receipt, Outbox or durable-message ownership moves.

## FIDUNIO 1.1.22 route, projection and viewport authority

- `requestAppActivation()` remains the only route-decision owner. Locally restored conversation metadata is a hint, not rejection authority; `firebase.js#getCloudConversationFromServer()` supplies the bounded authoritative read when the hint is questionable. The inbox record remains owned by `notification-pending-inbox.js` until the target composer is mounted.
- The existing direct-message subscription remains the only direct projection owner. It reuses plaintext already authenticated for immutable message IDs and decrypts new/unavailable rows through the unchanged account-E2EE service. It updates `state.messages`, then requests central background projection before durability and receipt awaits.
- `render()` remains the only DOM projection entry. `composerStateByConversation` owns draft, focus, caret and height only. Viewport state is captured only for the next render of the same currently mounted conversation and is never retained across Messages/Settings/other-conversation navigation. Intentional entry belongs to the render owner and scrolls to the newest row.
- Firestore rules/backend, notification worker/payload/token, PIN/auth, E2EE keys/formats, receipt writer, Outbox, groups, attachments, disappearing content and Settings lifecycle retain their prior owners.

## FIDUNIO 1.1.23 activation, stream and frame authority

- `startAppActivationOwner()` owns draining and release. `requestAppActivation()` only records a reason and joins/starts that owner. Release checks queued reasons synchronously, so no lifecycle source can create a parallel route decision or an ownerless cold-start signal.
- `firebase.js#subscribeConversationMessages()` owns exactly one live listener per conversation. Re-entry changes the current token/callback only. `queueLatestMessageSnapshot()` owns one active projection and one replaceable pending snapshot; it does not issue a competing history read or retain an unbounded FIFO.
- `render()` owns `chatRenderGeneration` and the pending viewport intent. Only the current generation and exact mounted conversation may restore composer/viewport state. A latest-entry intent remains authoritative until applied; a background projection cannot reinterpret initial scroll zero as user intent.
- Notification inbox, Firebase backend/rules/config, worker payload/display/click, PIN/auth, E2EE, receipts, Outbox, groups, attachments, disappearing content and Settings retain existing owners.

## FIDUNIO 1.1.24 notification-priority authority

- `startAppActivationOwner()` is the only notification route/transition owner. It keeps the unlock screen mounted, requests exact-message readiness, selects chat, renders, and conditionally consumes the route.
- `createDirectMessageDeliveryOwner()` is the only direct-message work scheduler per conversation. Listener snapshots coalesce; keyed priorities deduplicate; cache, persistence, receipt, and final refresh are serialized maintenance checked between priority boundaries.
- `prioritizeConversationMessage()` performs one exact server read and must rejoin the unchanged existing owner. It cannot create a listener or project state itself.
- `beginCloudMessageSubscription()` remains the sole decrypt/merge callback. Partial priority rows merge by ID without authoritative purge and paint before maintenance.
- `render()` remains the sole DOM owner. A notification is complete only when the exact message row and conversation-bound composer are mounted.
