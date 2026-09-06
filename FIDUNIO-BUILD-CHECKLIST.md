# FIDUNIO Complete Rebuild — Authoritative Build Checklist

This file is the operational completion ledger for the `fidunio-complete-rebuild` branch.

## Mandatory build-session rule

Before changing code in any build session:
1. Read `hermes-memory.txt` and the mandatory architecture/security documents named there.
2. Read this entire checklist.
3. Select work from an item marked `NOT DONE` or `IN PROGRESS`.
4. Do not mark an item `DONE` merely because code exists. `DONE` requires the implementation to be integrated into the real app and the applicable repository tests/security gate to pass.
5. After every substantive build run/commit, update this file in the same work session with the actual state and evidence/commit. If no checklist state changed, update the Build Log only when there is material evidence worth preserving.
6. If a completed feature regresses, change it back to `IN PROGRESS` or `NOT DONE`; never preserve a false green status.
7. Completion percentage is based on the complete product acceptance criteria for the current release target, not file count. Report a new percentage to the user only after a meaningful milestone is completed.

Status vocabulary: `DONE`, `IN PROGRESS`, `NOT DONE`, `BLOCKED — USER DEVICE PROOF`, `DEFERRED — 1.1`, `DEFERRED — 1.2`.

## Release scope

- First complete rebuild release: core FIDUNIO messaging product, account E2EE, groups, attachments, disappearing content, invitations/install, responsive UI, offline behavior, receipts, and final device validation.
- FCM notifications are **not required to be active in the first rebuild release**. FCM implementation/activation is explicitly targeted for **FIDUNIO 1.1**.
- Firebase App Check enforcement is **not required to be active in the first rebuild release**. App Check production activation/enforcement is explicitly targeted for **FIDUNIO 1.2**.
- Existing App Check client ownership/configuration may remain in place with enforcement OFF; this does not block the first rebuild release.
- Do not allow deferred 1.1/1.2 work to block the first rebuild release gate.

## Architecture / security foundation

| Area | State | Evidence / notes |
|---|---|---|
| Deterministic owner architecture | DONE | One-resource/one-owner rule documented and gated. |
| `firebase.js` sole Firebase SDK/service owner | DONE | Runtime authority/App Check gates. |
| Service worker cache/transport only | DONE | Semantic app.js transforms retired. |
| UID-scoped startup/account isolation | DONE | Auth -> UID -> account storage -> app startup; mixed pre-v3 state quarantined. |
| Account E2EE identity manager | DONE | Durable P-256 account identity; fail-closed lifecycle. |
| Three-component E2EE recovery | DONE | Recovery Functions active; client/server tests; no fourth factor. |
| Direct-message account E2EE v3 | DONE | `e2ee:3`, runtime/service/rules/tests integrated. |
| Serialized encrypted Outbox foundation | DONE | Firestore confirmation required before removal. |
| Local PIN/security serialized mutations | DONE | Remaining UI callers repaired in `013508078f1cda925a54c99cf7e7ffb3c986f8e7`. |
| App Check client ownership | DONE | Centralized in firebase.js; enforcement intentionally OFF. Production enforcement deferred to 1.2. |

## Core messaging product

| Area | State | Evidence / notes |
|---|---|---|
| Conversation list / cloud metadata | DONE | Real cloud direct/group conversations integrated. |
| Create direct conversation | DONE | Real cloud user selection/creation. |
| Direct send/receive/decrypt | DONE | Account-authoritative v3 path. |
| Direct offline queue/reconnect | DONE | Encrypted Outbox + idempotent retry path. |
| Direct Sent/Delivered/Read | IN PROGRESS | Core receipt path exists; final cross-device/iPad lifecycle validation remains. |
| Group E2EE crypto/runtime/rules | DONE | `e2ee:4`, epoch crypto/runtime/rules tests green. |
| Group send/receive/decrypt | DONE | Integrated through group app owner into app.js; encrypted Outbox retained until Firestore confirmation. |
| Group per-account receipts | DONE | Membership-aware receipt aggregation implemented. |
| Group offline queue/epoch revalidation | DONE | Epoch-aware Outbox coordinator integrated. |
| Group create | DONE | Real cloud group creation UI exists. |
| Group rename | NOT DONE | Current Group Info path still has local/placeholder behavior. |
| Group add member | NOT DONE | Must use real cloud users and rotate epoch atomically. |
| Group remove member | NOT DONE | Must rotate epoch before subsequent message; removed member gets no new envelope. |
| Leave group | NOT DONE | Real cloud membership mutation + epoch handling required. |
| Group history policy/admin controls | IN PROGRESS | `historyPolicy:"fromJoin"` contract exists; real management UI/backend controls unfinished. |

## Disappearing content

**Non-negotiable purge rule:** when disappearing content expires, every application-controlled trace of that content must be purged. The Firestore message document itself must be physically deleted, not merely hidden or marked expired. No per-message tombstone, plaintext, ciphertext, receipt record, attachment metadata, attachment blob/chunk, thumbnail, preview, local history record, cached decrypted object, Outbox copy, notification payload, or other application-controlled content record may remain after purge. This applies to sender and recipient devices/accounts and to direct and group content.

| Area | State | Evidence / notes |
|---|---|---|
| Disappearing-message policy/model | NOT DONE | Define authenticated E2EE expiry metadata and deterministic start condition/timer semantics; must work across devices without relying on a single device clock as authority. |
| Firestore trace-free purge | NOT DONE | At expiry, physically delete the Firestore message record and every application-owned subordinate/reference record associated only with that content. Do not leave an `expired` document or per-message tombstone. |
| Direct disappearing text messages | NOT DONE | Purge cloud ciphertext/message doc, per-message receipts/references, local plaintext/ciphertext/cache, and any pending copy on all participating devices. |
| Group disappearing text messages | NOT DONE | Same trace-free purge rule plus integration with group E2EE epochs, membership, and per-account receipts; no expired message record remains in Firestore. |
| Disappearing attachments | NOT DONE | Purge attachment metadata, encrypted chunks/blobs, thumbnails/previews, local decrypted object URLs/cache, message references, and attachment-specific receipts together. |
| Offline/reconnect expiry behavior | NOT DONE | Expired content must not resurrect from Outbox, IndexedDB history, stale snapshots, cached attachments, or reconnect reconciliation. Normal clients must discard stale expired material rather than re-upload it. |
| Multi-device expiry convergence | NOT DONE | Same account on multiple devices must converge on the same absence of the expired content; purge cannot be installation-local only. |
| Expiry UI/settings | NOT DONE | Provide clear per-conversation/default or per-message controls only after the underlying authority model is defined; UI must show the effective disappearing policy before expiry and no residual content after expiry. |
| Expiry security/rules/tests | NOT DONE | Tests must prove Firestore records are physically deleted, subordinate content/receipts are purged, local caches are cleared, and stale clients do not reintroduce expired content. |

Provider limitation: this trace-free rule governs all data FIDUNIO controls through Firestore/Firebase application APIs and local device storage. Cloud-provider internal infrastructure such as transient service logs or provider-managed backups, if any are enabled or retained outside application-level control, must be separately audited/configured; the app must never intentionally create or retain its own archival copy of disappearing content.

## Attachments / rich messaging

| Area | State | Evidence / notes |
|---|---|---|
| Attachment encryption/chunking foundation | DONE | Integrity-checked bounded chunking; tamper/missing-chunk tests. |
| Photo select/capture + send | NOT DONE | End-to-end UI/transport/storage required. |
| File select + send | NOT DONE | End-to-end UI/transport/storage required. |
| Audio record/select + send | NOT DONE | End-to-end UI/transport/storage required. |
| Video select/capture + send | NOT DONE | End-to-end UI/transport/storage required. |
| Attachment receive/decrypt/display/play | NOT DONE | Must work in direct and group conversations. |
| Attachment retention/history/offline | NOT DONE | Must follow Firestore-authoritative/cache/Outbox ownership. |
| Attachment receipts/lifecycle | NOT DONE | Must integrate with message status model. |

## Account / invitations / install

| Area | State | Evidence / notes |
|---|---|---|
| Account creation/sign-in/sign-out | DONE | Firebase Auth owner centralized. |
| Account E2EE enroll/unlock UI | DONE | Exact six-digit account E2EE PIN; separate from local PIN. |
| Same-identity recovery | BLOCKED — USER DEVICE PROOF | Repo implementation complete; final legitimate account/device proof belongs to final validation. |
| Invitation creation/send/use/join | NOT DONE | Must be completed end-to-end under deterministic owner. |
| Invitation account/conversation association | NOT DONE | Must be real Firebase-backed behavior. |
| PWA manifest/icons/standalone/SW foundation | DONE | Existing PWA assets/runtime foundation. |
| Safe install-to-Home-Screen integration | NOT DONE | Rebuild from scratch; rejected invite-install/icon implementation must never be adapted. |

## UI / responsive / settings

| Area | State | Evidence / notes |
|---|---|---|
| Settings deterministic lifecycle owner | DONE | Explicit lifecycle owner; observer self-repair rejected. |
| iPad/tablet/desktop two-pane foundation | DONE | Mandatory responsive owner retained. |
| iPhone single-pane/back/wrap fixes | DONE | Protected behavior retained; final device regression still required. |
| Group Info real management UI | NOT DONE | Contains placeholders/local-only controls. |
| Direct Chat Info complete | NOT DONE | Remaining placeholder behavior. |
| Remove remaining prototype/test banners | NOT DONE | Only after corresponding real functionality is complete. |
| Remove remaining simulated local message-state timers | NOT DONE | Real product must not simulate sent/delivered/read. |
| Remove remaining tool-button alert placeholders | NOT DONE | Replace with real supported functions or deliberately remove unsupported tools. |

## FCM / notifications — FIDUNIO 1.1

FCM is intentionally deferred from the first rebuild release. The first rebuild release must remain fully usable through Firestore synchronization when the app is opened. FCM will be implemented/activated in **FIDUNIO 1.1**.

| Area | State | Evidence / notes |
|---|---|---|
| FCM architecture / single owner boundary | DEFERRED — 1.1 | `firebase.js` remains the sole Firebase SDK owner when Messaging is added. |
| FCM permission/enrollment UX | DEFERRED — 1.1 | Deliberate supported-PWA/browser permission flow. |
| FCM device-token registration | DEFERRED — 1.1 | UID-bound replaceable endpoint registration. |
| FCM token refresh/replacement | DEFERRED — 1.1 | Reconcile and retire stale tokens. |
| Multi-device notification fan-out | DEFERRED — 1.1 | One UID may have multiple active endpoints. |
| Sign-out/device revocation cleanup | DEFERRED — 1.1 | Prevent cross-account notification leakage. |
| Direct-message FCM notifications | DEFERRED — 1.1 | Privacy-preserving wake/notification only; Firestore/E2EE remains authority. |
| Group-message FCM notifications | DEFERRED — 1.1 | Membership-aware privacy-preserving fan-out. |
| Attachment FCM notifications | DEFERRED — 1.1 | No plaintext attachment content/previews in push payloads. |
| Disappearing-content notification purge | DEFERRED — 1.1 | Must obey trace-free purge when FCM is introduced. |
| Notification tap/open routing | DEFERRED — 1.1 | Authenticate, synchronize, then decrypt through normal owners. |
| Foreground/background behavior | DEFERRED — 1.1 | Respect iOS/browser suspension limits. |
| Fire OS/non-FCM fallback behavior | DEFERRED — 1.1 | Core messaging must continue without Google Play Services/FCM. |
| FCM privacy/security/rules tests | DEFERRED — 1.1 | Token ownership, isolation, no plaintext payloads, expiry interaction. |

## App Check production enforcement — FIDUNIO 1.2

App Check client ownership/configuration already exists in `firebase.js`, but **production enforcement remains OFF for the first rebuild release and for 1.1 unless separately changed by deliberate release work**. Production activation/enforcement is targeted for **FIDUNIO 1.2** after the base rebuild and FCM release have been validated.

| Area | State | Evidence / notes |
|---|---|---|
| App Check production enforcement | DEFERRED — 1.2 | Keep enforcement OFF for first rebuild release. |
| App Check legitimate-device validation | DEFERRED — 1.2 | Validate supported browser/PWA/device flows before enforcement. |
| App Check recovery callable enforcement | DEFERRED — 1.2 | Do not enable until production validation is complete. |
| App Check rollout/regression gate | DEFERRED — 1.2 | Must prove no legitimate-client lockout before release. |

## Final product gate / deployment — first rebuild release

| Area | State | Evidence / notes |
|---|---|---|
| Full repository security/regression gate on complete first-rebuild candidate | NOT DONE | Required after first-release feature completion. FCM 1.1 and App Check 1.2 are excluded from this gate. |
| Cumulative `hermes-memory.txt` final reconciliation | IN PROGRESS | Keep one cumulative root file. |
| Reusable `hermes-setup.txt` final reconciliation | IN PROGRESS | Keep current release/deferred-roadmap scope explicit. |
| Remove temporary one-shot build workflows | IN PROGRESS | Delete after each one-shot job has served its purpose. |
| Atomic complete deployment to `htest` | NOT DONE | Current htest is stale/incomplete; do not continuously sync. |
| Final iPhone/iPad/two-device/offline/recovery test candidate | NOT DONE | User tests only after complete coherent first-rebuild candidate is deployed. |

## Current completion estimate

Approximately **65%** of the first complete rebuild release acceptance criteria. FCM 1.1 and App Check 1.2 are tracked roadmap work and are not part of this percentage or first-release completion gate.

## Build Log

- 2026-09-06 — Created this authoritative checklist at user request so every build session has an explicit done/not-done ledger.
- 2026-09-06 — Local-security Settings callers now await serialized timeout/device-unlock mutations; commit `013508078f1cda925a54c99cf7e7ffb3c986f8e7`; Local PIN/security serialized mutations marked DONE.
- 2026-09-06 — Group account-authoritative send/read/receipts/Outbox integration is present in the rebuild; group administration remains the next major messaging milestone.
- 2026-09-06 — Restored disappearing messages and attachments to the complete-product acceptance criteria, including direct/group, attachments, offline/reconnect, multi-device convergence, UI, and security/rules testing.
- 2026-09-06 — Disappearing-content requirement tightened: all application-controlled traces must be physically purged at expiry, including Firestore message records and attachments; no per-message tombstone/expired record is permitted.
- 2026-09-06 — FCM notification architecture retained in roadmap but explicitly deferred to FIDUNIO 1.1; it does not block the first complete rebuild release.
- 2026-09-06 — App Check production activation/enforcement explicitly deferred to FIDUNIO 1.2; client ownership/config may remain present with enforcement OFF and does not block the first complete rebuild release.
- 2026-09-06 — Reconciled hermes-setup.txt from obsolete 0.8.1.9 instructions to the current complete-rebuild architecture and recovery procedure.
