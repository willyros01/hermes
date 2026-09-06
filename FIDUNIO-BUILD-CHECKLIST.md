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
7. Completion percentage is based on the complete product acceptance criteria, not file count. Report a new percentage to the user only after a meaningful milestone is completed.

Status vocabulary: `DONE`, `IN PROGRESS`, `NOT DONE`, `BLOCKED — USER DEVICE PROOF`.

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
| App Check client ownership | DONE | Centralized in firebase.js; enforcement intentionally OFF pending legitimate-device validation. |

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

## FCM / notifications

**Required architecture:** Firebase Cloud Messaging (FCM) is part of the complete FIDUNIO notification system wherever the installed PWA/browser platform supports it. FCM is an endpoint wake/notification mechanism, not message authority. Firestore remains authoritative for conversations/messages. Device registrations/tokens are replaceable endpoints associated with an authenticated account; they do not own account history or E2EE identity. FIDUNIO must not rely on FCM alone for platforms where FCM is unavailable or unreliable, including the Fire OS target.

**Privacy rule:** push payloads must not contain plaintext message or attachment content by default. A notification may signal that new encrypted content is available and identify only the minimum routing/account information needed to open/synchronize FIDUNIO. Message content is obtained from Firestore and decrypted by the normal account-authoritative E2EE runtime after the app is active/unlocked.

| Area | State | Evidence / notes |
|---|---|---|
| FCM architecture / single owner boundary | NOT DONE | Define one notification owner/service. `firebase.js` remains the sole Firebase SDK owner; UI and message crypto modules must not independently initialize Firebase Messaging. |
| FCM permission/enrollment UX | NOT DONE | Request notification permission deliberately from supported installed-PWA/browser UX; no hidden permission prompts. |
| FCM device-token registration | NOT DONE | Register supported device/browser FCM token automatically after permission and authenticated account binding; associate token with UID plus replaceable endpoint/device registration, not E2EE identity ownership. |
| FCM token refresh/replacement | NOT DONE | Detect/reconcile token changes and retire obsolete registrations so pushes are not sent indefinitely to stale endpoints. |
| Multi-device notification fan-out | NOT DONE | One UID may have multiple active notification endpoints; send to appropriate active endpoints without changing one-account/one-E2EE-identity authority. |
| Sign-out/device revocation cleanup | NOT DONE | Remove or deactivate the local endpoint registration when account/device access is revoked; prevent cross-account notification leakage on a reused browser/device. |
| Direct-message FCM notifications | NOT DONE | New direct messages trigger privacy-preserving notification/wake flow; normal Firestore + direct E2EE v3 path remains authoritative. |
| Group-message FCM notifications | NOT DONE | Fan out to active group-member account endpoints while respecting membership and group E2EE v4; never expose plaintext group content in push payload. |
| Attachment FCM notifications | NOT DONE | Notification may indicate new content but must not include attachment plaintext, preview, filename/content details that violate the privacy policy, or decrypted media. |
| Disappearing-content notification purge | NOT DONE | Application-controlled notification records/payload caches associated with disappearing content must follow the same trace-free purge requirement and must not resurrect expired content. |
| Notification tap/open routing | NOT DONE | Route to the intended conversation only after authenticated account state is established; then synchronize/decrypt through normal owners. No crypto/private keys in notification code. |
| Foreground/background behavior | NOT DONE | Define supported behavior for active PWA vs browser/OS background limitations; never assume background execution is guaranteed on iOS/browser suspension. |
| Fire OS/non-FCM fallback behavior | NOT DONE | FIDUNIO must remain usable and synchronize from Firestore when opened even when push is unavailable; no Google Play Services dependency for core messaging. |
| FCM privacy/security/rules tests | NOT DONE | Test UID/token ownership, stale/revoked token rejection/cleanup, cross-account isolation, group membership fan-out, no plaintext payloads, and disappearing-content interaction. |

## Final product gate / deployment

| Area | State | Evidence / notes |
|---|---|---|
| Full repository security/regression gate on complete candidate | NOT DONE | Required after feature completion. |
| Cumulative `hermes-memory.txt` final reconciliation | IN PROGRESS | Keep one cumulative root file. |
| Reusable `hermes-setup.txt` final reconciliation | IN PROGRESS | Current rebuild/recovery guide reconciled 2026-09-06; keep updating as architecture/product state changes. |
| Remove temporary one-shot build workflows | IN PROGRESS | Delete after each one-shot job has served its purpose. |
| Atomic complete deployment to `htest` | NOT DONE | Current htest is stale/incomplete; do not continuously sync. |
| Final iPhone/iPad/two-device/offline/recovery test candidate | NOT DONE | User tests only after complete coherent candidate is deployed. |

## Current completion estimate

Approximately **65%** of the complete FIDUNIO acceptance criteria. Restored disappearing-content and explicit FCM requirements expand the remaining acceptance criteria; retain 65% as the working estimate until the next meaningful product milestone is completed and the denominator is reconciled. This number must not be advanced for minor cleanup.

## Build Log

- 2026-09-06 — Created this authoritative checklist at user request so every build session has an explicit done/not-done ledger.
- 2026-09-06 — Local-security Settings callers now await serialized timeout/device-unlock mutations; commit `013508078f1cda925a54c99cf7e7ffb3c986f8e7`; Local PIN/security serialized mutations marked DONE.
- 2026-09-06 — Group account-authoritative send/read/receipts/Outbox integration is present in the rebuild; group administration remains the next major messaging milestone.
- 2026-09-06 — Restored disappearing messages and attachments to the complete-product acceptance criteria, including direct/group, attachments, offline/reconnect, multi-device convergence, UI, and security/rules testing.
- 2026-09-06 — Disappearing-content requirement tightened: all application-controlled traces must be physically purged at expiry, including Firestore message records and attachments; no per-message tombstone/expired record is permitted.
- 2026-09-06 — Restored FCM as an explicit complete-product requirement: supported endpoint token registration/refresh/revocation, multi-device fan-out, direct/group/attachment notifications, privacy-preserving payloads, disappearing-content interaction, and non-FCM fallback behavior.
- 2026-09-06 — Reconciled hermes-setup.txt from obsolete 0.8.1.9 instructions to the current complete-rebuild architecture and recovery procedure.
