# FIDUNIO / Hermes

FIDUNIO is the public product name for the Hermes private-messaging project. This repository contains the web/PWA implementation, Firebase integration, account-authoritative E2EE work, deterministic UI/runtime architecture, and the complete rebuild now in progress.

## Current authoritative state

- Repository: `willyros01/hermes`
- Product name: **FIDUNIO**
- Internal/project name: **Hermes**
- Authoritative development branch: `fidunio-complete-rebuild`
- Current checkpoint version: **0.9.6.17**
- Current first-rebuild completion estimate: **approximately 65%**
- `version.js` is the only authoritative runtime release-number source.
- `main` is not the current application-development authority; it is a curated recovery/reference/documentation branch.
- `htest` is reserved for coherent final-stage testing deployments and is not continuously synchronized with intermediate rebuild work.
- Firebase Cloud Messaging is deferred to FIDUNIO 1.1.
- Firebase App Check production enforcement is deferred to FIDUNIO 1.2 and remains OFF during the first rebuild.

The rebuild is deliberately conservative: previously validated behavior is preserved unless a replacement is fully integrated and validated. The core architecture rule is:

**ONE RESOURCE -> ONE OWNER -> ONE PREDEFINED AREA -> ONE SERIALIZED WRITE PATH.**

## README maintenance rule

This README is the durable human-readable release/build-history ledger for the repository.

Whenever the release number is **incremented, reset, rolled back, or otherwise reassigned**, the same work session must update this README. The update must record the old version, new version, reason for the change, significant implementation changes, rollback/rejection status where applicable, validation evidence, and any important follow-on constraints.

A version-number change is incomplete until all of the following are reconciled:

1. `version.js` contains the intended authoritative release number.
2. `README.md` records the release/reset/rollback and its significant build history.
3. `hermes-memory.txt` records the durable project state and consequences.
4. `FIDUNIO-BUILD-CHECKLIST.md` reflects the true completion state and evidence.
5. Every additional architecture/security/runtime/UI/setup/bug document affected by the change is updated.

Do not create version-numbered replacement README, memory, or setup files. Keep one cumulative root `README.md`, one cumulative root `hermes-memory.txt`, and one reusable root `hermes-setup.txt`.

## Protected files and release discipline

- Never overwrite or regenerate `firebase-config.js`.
- Never overwrite or regenerate `config-firestore.js` if present in the user's workflow.
- Release ZIPs must not include those protected configuration files.
- Do not restore rejected invite/install/icon code from the 0.9.4.12-.15 line.
- Preserve established iPhone single-pane behavior, prominent Back behavior, iPhone wrap-around fixes, and iPad/tablet/desktop two-pane layout.
- Preserve the established navy/teal/gray visual language; do not introduce gold.
- Do not replace real authorization or lifecycle rules with timing fixes, reloads, broad MutationObservers, source rewriting, or duplicate Firebase owners.

## Current security/runtime architecture

### Firebase ownership

`firebase.js` is the sole Firebase SDK/service owner. It owns Firebase Auth, Firestore, Functions access, and App Check client initialization. No second Firebase initializer is permitted.

### Account-authoritative E2EE

The current rebuild uses one durable E2EE identity per Firebase Auth UID rather than treating an installation/device as the durable cryptographic identity.

- Identity algorithm: ECDH P-256.
- Stable account `keyId` independent of device identity.
- Private identity stored only through wrapped encrypted account material.
- Normal wrapper: PBKDF2-HMAC-SHA256, 600,000 iterations, AES-256-GCM.
- Account E2EE PIN: exactly six digits and separate from the local app-lock PIN.
- Recovery restores the same durable identity/keyId and must never silently create a replacement identity.
- Recovery uses exactly three components: verified Firebase account/UID, exact six-digit E2EE PIN, and Google-hosted recovery authority using the protected server recovery secret.
- There is no supplemental verifier, security question, extra PIN, or fourth recovery factor.

### Direct messages

Current account-authoritative direct messages use `e2ee:3` with ECDH P-256, HKDF-SHA256, and AES-256-GCM. Device IDs are excluded from durable decryptability. Legacy `e2ee:1` and `e2ee:2` remain receive/read compatibility only for historical messages.

### Groups

Current account-authoritative group messages use `e2ee:4` and versioned key epochs. Membership changes require an epoch rotation before another message is accepted. A removed or leaving member receives no envelope for the replacement epoch.

Default group history policy is `fromJoin`: a new member receives only the new epoch and cannot decrypt earlier history by default.

Explicit earlier-history sharing is now defined as an administrator-selected starting point/date, including **Beginning of conversation**. The boundary must be enforced cryptographically at message granularity. A grant may not hand the target an old epoch key if that would reveal messages before the chosen boundary.

### Offline behavior

- Firestore is the durable encrypted authority.
- UID-scoped IndexedDB/local cache is rebuildable offline state.
- The encrypted Outbox is temporary pending-send authority.
- A pending Outbox record is removed only after Firestore confirms the write.
- Reconnect/retry paths must be serialized and idempotent.

### Service worker

The service worker is now cache/transport only. It must not rewrite `app.js`, inject runtime semantics, own E2EE, or become a second authority.

## Significant build history

### 0.1-0.4 — UX prototype phase

The project began as a Firebase-free UX prototype. Early work established the conversation list, New Message/New Group flows, group member selection, Group Info, quick compose, Settings, A/A+/A++ text sizing, Auto/Light/Dark appearance, initial offline simulation, and the core group-history privacy rule. FIDUNIO branding and the approved winged-messenger artwork were introduced during this period.

### 0.5 — first durable local build

0.5 moved from pure UI simulation to a functional local PWA foundation. It added IndexedDB persistence, AES-GCM-protected local state, an encrypted persistent Outbox, offline queue survival, app-shell caching, and stable client-generated message IDs.

### 0.6-0.6.5 — Firebase transport and offline hardening

0.6 introduced Firebase Auth, Firestore direct-conversation transport, real live listeners, and real queued cloud delivery.

0.6.1-0.6.5 were driven by real iPad/iPhone failure testing. Important fixes included authoritative Outbox persistence, transaction-completion waiting, cold-start queue reconstruction, foreground listener reattachment, dedicated encrypted history storage, Safari IndexedDB transaction corrections, and the final local-first rule: remote/cache snapshots must never erase locally durable information. Firebase data transport is never service-worker cached.

### 0.7.0-0.7.3 — first direct-message E2EE and version centralization

0.7.0 introduced the first direct-message E2EE foundation. 0.7.1 established `version.js` as the single version authority and consolidated project memory into one root `hermes-memory.txt`. 0.7.2 repaired peer-UID continuity required for encryption. 0.7.3 stabilized live receive/reconnect behavior and became an important transport checkpoint.

### 0.8.0-0.8.1.9 — device identity, security UX, and responsive tablet work

0.8.0 added stable installation device IDs and device public-key publication. 0.8.1 added local contact-key verification/key-change detection. The 0.8.1.x line then concentrated on the visual and responsive experience: 2D color-coded icons, compact attachment tools, iPhone overflow corrections, and the iPad/tablet two-pane layout.

0.8.1.9 was considered essentially complete for that UI generation, with the principal remaining tablet issue being Group Info landscape width treatment.

### 0.9.x — account, settings, receipts, identity continuity, and rebuild preparation

The 0.9.x line expanded account/invitation/settings behavior and exposed architectural weaknesses that ultimately motivated the controlled rebuild.

Important validated checkpoints preserved from this period include:

- **0.9.4.11** — stable pre-invite/install UI behavior, including the prominent iPhone Back fix and iPhone wrap-around fix.
- **0.9.5.1** — Settings lifecycle checkpoint.
- **0.9.5.4** — message receipt checkpoint.
- **0.9.5.7** — prevention of E2EE device-identity proliferation/startup race.

## Rollback and rejected-build history

### 0.9.4.12-.15 rollback — rejected invite/install implementation

The most important product rollback occurred after the stable 0.9.4.10/0.9.4.11 line. Automatic invitation/install/icon work introduced regressions that broke previously working Settings/two-panel iPad behavior and recreated problems that had already been solved.

The user directed the project to stop adapting that implementation and return to the known-good baseline. The recovery path was:

- return to the stable 0.9.4.10 foundation;
- reapply only the small proven iPhone wrap-around correction;
- reapply the prominent Back-button correction;
- establish the resulting stable behavior as 0.9.4.11;
- reject and purge the nonfunctional 0.9.4.12-.15 line;
- rebuild invitation/install integration later from first principles instead of adapting rejected code.

**0.9.4.12-.15 remain rejected and must never be treated as a source of truth or copied back into the rebuild.**

### Recovery architecture reversal — supplemental verifier removed

During the September 2026 rebuild, prototype recovery code/docs had accumulated an additional supplemental verifier. That architecture was explicitly rejected and removed. The durable recovery design is exactly three components: authenticated account/UID, exact six-digit account-E2EE PIN, and Google-hosted recovery authority. Tests and deployment source were reconciled to the three-component design.

### Firebase/App Check ownership reversal — duplicate owner removed

A second App Check/Firebase ownership path briefly violated the single-owner architecture. The extra Firebase/App Check owner was removed, `firebase.js` was restored as the sole Firebase SDK/service owner, and the runtime-authority gate was strengthened so this regression is rejected automatically.

### Hidden service-worker semantics retired

Earlier builds relied on service-worker rewriting of `app.js` to inject E2EE/runtime behavior. The controlled rebuild materialized or superseded those transformations in source and reduced the service worker to cache/transport only. This was not merely cleanup: it removed a hidden second source of application semantics.

### September 5-6 process-integrity reset

A rebuild session exposed the risk of changing code from conversational memory instead of rereading the repository authority. That process was corrected by making repository-first recovery mandatory before consequential changes. Current work must reread the authoritative documents, identify the owner/write path, inspect the actual source, and then modify. A green CI result never overrides a published architecture invariant.

## Complete rebuild — September 2026

The current complete rebuild consolidates the application around deterministic ownership, account-authoritative E2EE, real Firestore authority, serialized writes, and explicit UI lifecycle control.

### Baseline and authority

The initial protected rebuild baseline was created on September 5, 2026. The current authoritative development branch is `fidunio-complete-rebuild`; older baseline branches/checkpoints remain historical rollback references and do not supersede the current branch.

The rebuild deliberately avoids coding from reconstructed memory. `hermes-memory.txt`, `FIDUNIO-BUILD-CHECKLIST.md`, security contracts, runtime ownership maps, lifecycle docs, and bug ledger are mandatory working references.

### Account E2EE and recovery

The rebuild implemented the durable account identity manager, exact Firestore identity schema/rules, direct-message account E2EE v3, recovery server crypto/session controls, client recovery integration, and three Recovery Functions in `us-central1`.

The recovery Functions are live and verified ACTIVE under the dedicated recovery runtime service account. The recovery master secret is restricted to enrollment/completion as designed. App Check enforcement remains OFF.

A parallel PIN-guess race discovered during review was fixed by serializing recovery completion through a Firestore `PENDING -> VERIFYING` reservation before PIN cryptography.

### Direct-message runtime cutover

Raw `app.js` now sends/decrypts new direct messages through the account-authoritative `e2ee:3` runtime/service path. New sends fail closed unless the account E2EE identity is READY. Legacy v1/v2 receive compatibility remains for historical messages.

### Group E2EE and administration

Group account-authoritative E2EE was materialized with `e2ee:4`, per-account epoch envelopes, membership-aware receipts, epoch-aware Outbox retry, and real group conversation integration.

Cloud-backed Group Info administration now includes rename, add member, remove member, and non-owner leave. Membership changes atomically update membership and create the replacement E2EE epoch. Owner removal/leave remains forbidden until a deliberate ownership-transfer design exists.

### Earlier-history grant work

The user approved administrator-selected starting point/date history sharing, including Beginning of conversation. `e2ee-account-group-history-crypto.js` now provides message-granular account-to-account re-encryption so the selected lower boundary cannot be bypassed by disclosure of an old epoch key.

The persistence/runtime foundation is repository-validated, and 0.9.6.8 adds deterministic granted-history conversation projection. A target account can now merge active message-granular grant copies into the normal group conversation without allowing a grant to override an already decryptable ordinary message. The usable feature is still not complete because Group Info date-selection/grant controls, disappearing-content physical purge/anti-resurrection linkage, and real-app/device validation remain required before earlier-history sharing can be enabled.

### 0.9.6.6 bounded wiring repair

A repository-first audit found that `e2ee-account-group-app-integration.js` exposed Group Info administration wrappers without importing the corresponding controller delegates. The defect was repaired in commit `8b72f00744cc4b882c7fb1df0ce48d3959f563ec`, the integration gate was strengthened to check all four delegates, and the checkpoint advanced to 0.9.6.6.

The full Rebuild Baseline Security Gate run **34046337123** passed after that repair. Earlier important green runs include **34011735357** for the hardened recovery/account-E2EE baseline, **34045259037** for real group administration, and **34046083575** for the group-history cryptographic foundation.

## Current first-rebuild completion state

Approximately **65%** of the first complete rebuild acceptance criteria are complete. This percentage excludes FCM 1.1 and App Check 1.2 work.

Major completed areas include deterministic runtime ownership, centralized Firebase ownership, account E2EE identity/recovery foundation, direct-message v3 E2EE, encrypted Outbox, group E2EE send/receive/receipts/offline retry, group creation, and real group rename/add/remove/leave administration.

Major unfinished first-release areas include explicit earlier-history grant UI/purge integration, disappearing-content physical purge and anti-resurrection, complete attachment send/receive/lifecycle, invitation and safe install integration rebuilt from scratch, remaining Chat/Group Info/tool placeholders and simulated state removal, final complete-repository gate, atomic `htest` deployment, and final real-device validation.

## Disappearing-content requirement

Disappearing content is not a soft-delete feature. When content expires, FIDUNIO must physically purge every application-controlled trace: Firestore message document, ciphertext/plaintext copies, receipts/references, attachment metadata and encrypted blobs/chunks, thumbnails/previews, IndexedDB/history/cache copies, decrypted object URLs/cache, Outbox copies, and app-controlled notification payload/cache records. No per-message tombstone or retained `expired:true` message record is permitted. Stale/offline devices must not resurrect expired content.

History-grant copies are subject to the same rule. If a source message expires, every grant copy/reference that exists only for that message must also be removed.

## Release roadmap

### First complete rebuild

The first rebuild release covers core private messaging, account E2EE, groups, attachments, disappearing content, invitations/install, responsive UI, offline behavior, receipts, and final device validation.

### FIDUNIO 1.1

Firebase Cloud Messaging will be added as a privacy-preserving notification/wake transport. Firestore/E2EE remains message authority. Push payloads must not contain plaintext message or attachment content by default, and Fire OS/non-FCM fallback remains required.

### FIDUNIO 1.2

Firebase App Check production enforcement will be considered only after legitimate supported-device/client/recovery traffic is validated and rollout testing proves that enforcement will not lock out legitimate users.

## Authoritative project documentation

Before consequential rebuild work, read and reconcile the repository documentation appropriate to the task. The central durable references are:

- `hermes-memory.txt` — cumulative project state, decisions, checkpoints, regressions, and next state.
- `FIDUNIO-BUILD-CHECKLIST.md` — authoritative first-rebuild completion ledger.
- `CODING-GUIDELINES.md` — reusable implementation and process rules.
- `architecture-ownership.txt` — resource/module ownership and write-path boundaries.
- `RUNTIME-AUTHORITY-MAP.md` — runtime authority boundaries.
- `DETERMINISTIC-UI-LIFECYCLE.md` — UI navigation/render/lifecycle authority.
- `ACCOUNT-E2EE-FIRESTORE-AUTHORITY.md` — durable account E2EE storage authority.
- `ACCOUNT-E2EE-DIRECT-MESSAGE-FORMAT.md` — direct-message v3 contract.
- `ACCOUNT-E2EE-GROUP-MESSAGE-FORMAT.md` — group-message/history policy contract.
- `E2EE-IDENTITY-LIFECYCLE.md` and `E2EE-RECOVERY-PROTOCOL.md` — identity and recovery contracts.
- `FIRESTORE-E2EE-V1-RULES.md`, `FIRESTORE-GROUP-E2EE-V1-RULES.md`, and emulator-test docs — security-rule authority and validation.
- `BUG-LIST.md` — durable defect ledger.
- `REBUILD-BASELINE-AUDIT.md` — baseline keep/remove/audit history.
- `hermes-setup.txt` — reusable setup/deployment/recovery/testing instructions.
- `DISAPPEARING-PURGE-AUTHORITY.md` — disappearing-content physical purge ownership, trace-set, server-time, revalidation, and anti-resurrection contract.

## Development rule

Do not declare a feature complete because code merely exists. A rebuild item is DONE only when it is integrated into the real application and its applicable tests/security gates pass. If a regression is found, the checklist must move backward rather than preserve a false green state.

The README must likewise tell the truth about release history: successful versions, rejected versions, resets, rollbacks, protected checkpoints, and significant architecture changes must remain visible rather than being rewritten out of history.

## FIDUNIO 0.9.6.7 — bounded group-history persistence foundation

Release transition: **0.9.6.6 -> 0.9.6.7**.

- Added exact Firestore schema/rules for explicit group-history grant metadata and message-granular encrypted copies under `groups/{groupId}/historyGrants/{grantId}`.
- Only a current group administrator can create/activate a grant; the target must be another current active group member with the authoritative durable account key.
- A grant begins in `building` state. The target cannot read grant metadata or copies until the grantor explicitly activates it; this prevents partial chunked history from becoming visible during construction.
- Source-message timestamps are rule-bound to retained group messages, and timestamp grants reject copies earlier than the selected lower boundary. `Beginning of conversation` remains supported without disclosing historical epoch keys.
- `firebase.js` remains the sole Firebase owner and now transports opaque grant metadata/copy records in bounded chunks.
- `e2ee-account-group-runtime.js` serializes grant construction, decrypts only source messages the admin can already read, re-encrypts them message-by-message through `e2ee-account-group-history-crypto.js`, and provides target-side grant decryption.
- Runtime and Firestore emulator coverage were expanded for creation, boundary enforcement, activation visibility, outsider denial, and target decrypt.
- Group Info UI remains deliberately disabled for earlier-history sharing until date-selection UI, conversation merge/display, disappearing-content purge/anti-resurrection linkage, and final real-app validation are complete.
- Repository rules changed in this release but **live Firebase rules were not deployed**. Live Firebase remains untouched pending the controlled Firebase handoff.
- Overall first-rebuild estimate remains approximately 65% until the full history-sharing user path and purge linkage are integrated.

### 0.9.6.7 validation and build-process note

The first 0.9.6.7 materialization used a newly added one-shot workflow that GitHub did not register for execution on the same creation push, producing zero-job/failure noise; it was not an application or security-test failure. The materialization was then performed through a previously registered bounded runner. Repository inspection caught a rules-test chronology fixture defect before final validation: the valid group message had been given a fixed timestamp despite the rule requiring `createdAt == request.time`, and the history-grant matrix ran after its target member had been removed. The test fixture was repaired to use the authoritative server timestamp and an isolated restored-member setup for the separate grant matrix.

After temporary materializer/repair files were removed, the cleaned-branch **Rebuild Baseline Security Gate run 34047570212 passed completely**, including Firestore E2EE rules, direct-message rules, expanded group E2EE/history-grant rules, group crypto/runtime/service/Outbox/conversation/controller/integration gates, recovery, App Check ownership, Functions scaffold, and runtime authority/transform gates. This validates the 0.9.6.7 repository foundation; it does not enable the unfinished Group Info history-sharing UI and does not deploy the changed rules to live Firebase.

### 0.9.6.8 — granted-history conversation projection

Release transition: **0.9.6.7 -> 0.9.6.8**.

- Added `e2ee-account-group-history-projection.js`, a pure deterministic projection helper for merging active earlier-history grant copies with ordinary retained group rows.
- Ordinary successfully decrypted group messages remain authoritative; a grant may replace only the undecryptable body for the same source message ID. Duplicate source messages are collapsed and the final projection is ordered by authoritative source time/message ID.
- `e2ee-account-group-conversation.js` now loads active granted history through the existing group runtime/service owner and projects it through the same bounded conversation callback used by `app.js`; no Firebase or crypto ownership moved into the UI.
- Normal Delivered/Read receipts are no longer written for historical ciphertext that the current account cannot decrypt. Explicit granted-history copies are projected without retroactive normal-message receipt mutation.
- The group conversation gate now executes projection behavior, checking deterministic order, deduplication, grant replacement only for undecryptable rows, ordinary-message precedence, and removal of internal decrypt markers.
- Rebuild Baseline Security Gate run `34048452887` passed all substantive steps on the implementation commit.
- This release does **not** enable the Group Info history-grant control. Date/beginning selection and grant creation remain deliberately unavailable until physical disappearing-content purge/anti-resurrection is integrated and validated.
- Live Firebase, `htest`, FCM and App Check enforcement were not changed. Overall first-rebuild estimate remains approximately 65%.

### 0.9.6.9 — authoritative earlier-history source selection

Release transition: **0.9.6.8 -> 0.9.6.9**.

- Removed caller/UI-provided source rows from production earlier-history grant creation. The serialized group runtime now obtains retained encrypted source rows through the bounded group Firebase adapter.
- The adapter reuses `firebase.js`'s sole central group-message subscription owner and waits for a server-backed (`fromCache == false`) snapshot before a grant may be built. Local/app projected rows cannot become cryptographic grant authority.
- Date/Beginning boundaries are applied to those authoritative retained rows inside `e2ee-account-group-runtime.js`; tests prove forged caller rows cannot change either the selected source message or the lower-bound decision.
- Production grant IDs are now generated inside the group runtime with `crypto.randomUUID()`. The bounded controller/app-integration bridge accepts only group ID, target UID and boundary intent; it does not accept ciphertext/source rows or own Firebase/crypto.
- Rebuild Baseline Security Gate run `34048905157` passed every substantive step on the source-authority/intent-bridge implementation.
- Group Info still does not enable the earlier-history action. Physical disappearing-content purge/anti-resurrection remains a prerequisite before the control can be exposed to users.
- No live Firebase deployment, no `htest` deployment, no FCM activation and no App Check enforcement change. Overall first-rebuild estimate remains approximately 65%.

### Disappearing-content timer semantics — September 6, 2026

The product decision for disappearing messages is fixed-time-after-read for both direct and group messaging. Each recipient account starts its own timer from its first authoritative Read event. In a group, one member reading does not start other members' timers. Recipient-local visibility/cache must expire independently, while the shared Firestore source can be physically deleted only after all applicable recipient read windows have elapsed or those recipients are no longer entitled to the message. Final purge remains trace-free and includes grant copies/references and attachments.

### 0.9.6.10 — immutable first-Read authority foundation

Release transition: **0.9.6.9 -> 0.9.6.10**.

- Added `disappearing-content-policy.js` as the pure decision owner for recipient expiry and group shared-source purge eligibility. It owns no Firebase, DOM, cryptography, storage, timer, or deletion path.
- Direct-message receipt rules now allow only the recipient to advance `sent -> delivered` or the first `sent/delivered -> read`. The first Read requires a server-backed `readAt == request.time`; repeat Read updates cannot move that timestamp.
- Group receipt records now use a state-sensitive exact schema: Delivered has `uid,state,updatedAt`; Read additionally has immutable server-backed `readAt`. A group member can mutate only that member's own receipt.
- `firebase.js`, still the sole Firebase SDK/service owner, now serializes direct and group receipt mutations with Firestore transactions. Repeat Read is a no-op and `markCloudConversationRead()` delegates through the same authoritative direct receipt path.
- Emulator tests cover sender denial, missing `readAt`, first Read success, repeat-Read timestamp denial, group per-account isolation, and ciphertext-tamper denial. A dedicated source/ownership gate checks the transactional first-read write paths and is part of the normal security gate.
- This release establishes timer-start authority only. It does **not** yet physically purge messages, history-grant copies, receipts, local cache, Outbox traces, attachments, or stale-device material. Purge execution and anti-resurrection remain IN PROGRESS.
- Repository Firestore rules changed but were **not deployed to live Firebase**. `htest` was not touched; FCM remains deferred to 1.1 and App Check enforcement remains OFF/deferred to 1.2.
- Overall first-rebuild estimate remains approximately 65%.

### 0.9.6.11 — user-selected disappearing duration policy

Release transition: **0.9.6.10 -> 0.9.6.11**.

- Product decision: the user chooses the disappearing duration rather than FIDUNIO forcing one universal duration.
- The pure `disappearing-content-policy.js` owner now defines one canonical per-message metadata field, `disappearAfterSeconds`, with `off` represented by absence of that field.
- A disappearing duration is normalized to an exact integer number of seconds. Current policy bounds are 1 second through 31,536,000 seconds (one year).
- UI presets or conversation defaults may be added later for convenience, but they are not authority. Each sent disappearing message must persist its resolved immutable duration so changing a later preference cannot retroactively alter an already-sent message's expiry window.
- Expiry still starts from the recipient account's immutable server-backed first `readAt` established in 0.9.6.10. In groups, each recipient has an independent first-Read clock.
- This checkpoint defines and gates duration-selection semantics only. Message-schema persistence/rules, physical purge, local/offline convergence, attachment purge, anti-resurrection, and final UI remain unfinished.
- No live Firebase deployment, no `htest` deployment, no FCM activation, and no App Check enforcement change.
- Overall first-rebuild estimate remains approximately 65%.

### 0.9.6.12 — immutable outer disappearing-message metadata

Release transition: **0.9.6.11 -> 0.9.6.12**.

- `disappearAfterSeconds` is now carried as optional outer message metadata for current account-authoritative direct (`e2ee:3`) and group (`e2ee:4`) sends. It is deliberately not part of either exact cryptographic envelope.
- The central `firebase.js` owner normalizes the user-selected duration and writes it only when disappearing content is enabled. The accepted range remains 1..31,536,000 seconds; absence means off.
- Direct encrypted Outbox records preserve the resolved duration across offline/reconnect. Group Outbox/runtime/service/controller/integration similarly preserve and forward the resolved duration while re-encrypting only ciphertext when epochs change.
- Firestore Rules accept only the bounded optional integer and receipt transitions cannot mutate it because existing receipt diff constraints remain authoritative.
- Direct/group emulator matrices now cover valid duration, zero/over-max/non-integer rejection, and direct receipt mutation denial. A dedicated source gate verifies metadata ownership and that crypto-envelope modules remain untouched.
- This checkpoint still does not implement physical deletion. Purge ownership, deletion authorization, grant-copy/attachment/local-cache purge, and stale-client anti-resurrection remain prerequisites before user-facing disappearing controls or earlier-history controls are enabled.
- Repository rules changed but are not deployed to live Firebase. `htest` remains untouched; FCM remains deferred to 1.1; App Check enforcement remains OFF/deferred to 1.2.
- Overall first-rebuild estimate remains approximately 65%.

### 0.9.6.13 — deterministic purge-eligibility policy

Release transition: **0.9.6.12 -> 0.9.6.13**.

- Cleaned 0.9.6.12 Rebuild Baseline Security Gate run `34052064381` passed every step after the bounded group app-integration assertion was updated to recognize the new outer-duration argument.
- Added pure `disappearing-purge-policy.js`. It owns only deterministic purge eligibility and performs no Firebase, Admin SDK, local-storage, timer, UI or deletion writes.
- Direct disappearing source purge becomes eligible only after its sole recipient has an authoritative first Read and that message's immutable `disappearAfterSeconds` window has elapsed.
- Group final-source eligibility is derived from the source epoch's member set, excluding the sender, intersected with members who remain entitled now. A later-added member outside that source epoch does not become a retroactive retention blocker; a removed member no longer blocks final purge.
- Every still-entitled original recipient independently blocks final group-source purge until that recipient has Read and the recipient-specific duration window has elapsed. An unread still-entitled original recipient therefore keeps the source.
- A history grant cannot extend the lifetime of a disappearing source. Grant copies remain subordinate traces and must disappear when the source becomes purge-eligible.
- Production deletion authorization must use server-side time. A device clock is never sufficient authority for cloud purge.
- This is a decision/policy foundation only. No delete rules, scheduled server purge, local cache purge, attachment cleanup or stale-client anti-resurrection executor is enabled yet.
- Live Firebase and `htest` remain untouched; FCM remains deferred to 1.1; App Check enforcement remains OFF/deferred to 1.2.
- Overall first-rebuild estimate remains approximately 65%.

### 0.9.6.14 — serialized purge-executor authority

Release transition: **0.9.6.13 -> 0.9.6.14**.

- Added `DISAPPEARING-PURGE-AUTHORITY.md`, the binding single-owner contract for future physical deletion. The contract explicitly forbids browser/client delete rules, per-message tombstones, and device-clock deletion authority.
- Added `disappearing-purge-executor.js` as the single serialized purge coordination owner. It consumes the already-authoritative pure direct/group purge decisions, owns no Firebase/Admin SDK, and can reach physical deletion only through one injected repository interface.
- The executor requires an explicit server-time provider, one opaque repository `basis` for every evaluation, and a commit result that confirms physical deletion. Ineligible sources never enter the mutable delete owner.
- The future server repository must re-read/revalidate the basis inside its transaction/precondition path. A stale basis fails closed and is not automatically retried from stale state; a later evaluation starts a new read/decision cycle.
- One executor instance serializes direct and group purge attempts. This queue is supplemental; cross-instance correctness remains a required server transaction/precondition responsibility.
- Added `disappearing-purge-executor.test.mjs` and normal security-gate coverage for eligible direct commit, unread retention, per-recipient group blocking, removed-member handling, stale-basis fail-closed behavior, serialization, and explicit server-time authority.
- This checkpoint still does **not** physically delete Firestore/Storage/local traces and does not add a scheduler or new Cloud Function. The next implementation boundary is the dedicated server repository/adapter that enumerates and atomically/reliably deletes source + receipts + history-grant copies/references, followed by local cache/Outbox anti-resurrection and attachment cleanup.
- Live Firebase and `htest` remain untouched; no delete rules were opened; FCM remains deferred to 1.1; App Check enforcement remains OFF/deferred to 1.2.
- Overall first-rebuild estimate remains approximately 65%.

### 0.9.6.15 — server Firestore purge repository foundation

Release transition: **0.9.6.14 -> 0.9.6.15**.

- Clean 0.9.6.14 Rebuild Baseline Security Gate run `34053227630` passed every step, including the serialized purge-executor gate.
- Added server-only `disappearing-purge-firestore-admin-adapter.mjs`. Firebase Admin Firestore is injected; the adapter does not initialize/import a competing Firebase SDK owner.
- Direct purge reads the authoritative direct conversation/message, derives the non-sender recipient, and binds an opaque purge basis to Firestore snapshot update times. Eligible direct source deletion is a Firestore transaction that re-reads the same authority and deletes the message only if the basis is unchanged. A stale basis fails closed; an already-absent source is idempotent success.
- Group purge reads the source message, exact source epoch membership, current group entitlement membership, and per-account receipts into one opaque update-time basis. This is sufficient for the existing pure group eligibility policy without making the adapter a second policy owner.
- Group physical deletion deliberately remains fail-closed with `GROUP_PURGE_TRACE_DELETE_NOT_READY`. The source will not be removed until history-grant copy/reference cleanup and receipt deletion can be coordinated without leaving FIDUNIO-controlled traces.
- Added `disappearing-purge-firestore-admin-adapter.test.mjs` and normal gate coverage for direct basis/read/delete/idempotency/stale rejection, group authority reads, server-only SDK ownership, and the explicit group fail-closed boundary. Rebuild Baseline Security Gate run `34053462019` passed all steps on the implementation/gate commit.
- This is repository-only. No scheduled purge Function was added or deployed, no client delete rule was opened, live Firebase and `htest` were untouched, FCM remains deferred to 1.1, and App Check enforcement remains OFF/deferred to 1.2.
- Next secure slice: materialize group history-grant trace planning/reconciliation and receipt deletion so a group source can be physically removed only after subordinate traces are safely handled; then add UID-scoped local cache/Outbox anti-resurrection convergence.
- Overall first-rebuild estimate remains approximately 65%.

### 0.9.6.16 — group history-grant purge trace planning

Release transition: **0.9.6.15 -> 0.9.6.16**.

- Clean 0.9.6.15 Rebuild Baseline Security Gate run `34053702432` passed every step before this slice.
- Added pure `disappearing-group-grant-trace-plan.js`. It owns only deterministic reconciliation of group earlier-history grant metadata/copies when one disappearing source is removed; it has no Firebase/Admin SDK, storage, UI, timer, crypto or delete ownership.
- A matching grant copy is planned for deletion. If it was the grant's only copy, the grant metadata is planned for deletion. If retained copies remain, the plan recomputes `totalCopies`, `firstSharedMessageId`, and `firstSharedAt` from the earliest still-retained source rather than leaving stale grant metadata.
- The planner fails closed when grant metadata and actual copy count disagree, a copy belongs to another group/grant, or duplicate source copies exist. A partially written/building grant therefore blocks final source purge until its trace set becomes internally consistent or is handled by a later cleanup owner.
- `disappearing-purge-firestore-admin-adapter.mjs` now reads history-grant metadata and copies as part of authoritative group purge state, includes their Firestore update times in the opaque purge basis, and returns the pure grant trace plan to the serialized executor path.
- Group source deletion remains deliberately fail-closed. This checkpoint does not yet perform receipt/grant/source mutation because a race-safe grant-creation barrier and one transaction/precondition commit path must exist first.
- Added dedicated planner tests plus repository integration tests. Rebuild Baseline Security Gate run `34054137154` passed all steps including the new group grant trace plan and Firestore purge repository gates.
- No live Firebase rules/functions/deletes, no `htest` deployment, no client delete permission, no App Check enforcement change, and no FCM activation.
- Next secure slice: bind new history-grant creation to the group authority update-time so concurrent grant creation invalidates a purge basis, then materialize one revalidated group commit that deletes receipts, source grant copies/reconciles grant metadata, and finally deletes the source without partial trace loss.
- Overall first-rebuild estimate remains approximately 65%.

### 0.9.6.17 — history-grant purge barrier

Release transition: **0.9.6.16 -> 0.9.6.17**.

- Clean Rebuild Baseline Security Gate run `34054522196` passed every substantive step on the cleaned barrier implementation, including the group emulator matrix and dedicated history-grant purge-barrier gate.
- New earlier-history grant creation now atomically updates the authoritative group `updatedAt` in the same Firestore transaction that creates the building grant. The grant and group touch share one `serverTimestamp()` authority.
- Firestore Rules now require `historyGrantBarrier(groupId)`: a grant create is accepted only when the same write changes exactly group `updatedAt` to `request.time`. A standalone grant create is denied.
- This closes the purge-basis phantom-grant race: group purge basis already includes the group document update time, so a concurrent new history grant invalidates/retries the purge transaction rather than escaping the previously observed grant/copy trace set.
- Idempotent retry of an already-existing matching building grant does not create another barrier write.
- Added `group-history-grant-purge-barrier.test.mjs` plus emulator coverage proving missing barrier denial and atomic barrier success.
- Group physical purge remains deliberately fail-closed. The next repository slice is the one revalidated group commit that removes receipts, affected grant copies, deletes/reconciles grant metadata, and only then removes the source.
- Repository Firestore Rules changed, but **no live Firebase rules were deployed**. `htest` remains untouched; App Check enforcement remains OFF; FCM remains deferred to 1.1.
- Overall first-rebuild estimate remains approximately 65%.
