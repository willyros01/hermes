# FIDUNIO / Hermes

FIDUNIO is the public product name for the Hermes private-messaging project. This repository contains the web/PWA implementation, Firebase integration, account-authoritative E2EE work, deterministic UI/runtime architecture, and the complete rebuild now in progress.

## Current authoritative state

- Repository: `willyros01/hermes`
- Product name: **FIDUNIO**
- Internal/project name: **Hermes**
- Authoritative development branch: `fidunio-complete-rebuild`
- Current checkpoint version: **0.9.6.7**
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

The usable feature is not yet complete. Firestore grant/copy schema, authorization rules, runtime/service/transport integration, Group Info date-selection controls, disappearing-content purge linkage, and emulator tests are still required before the control can be enabled.

### 0.9.6.6 bounded wiring repair

A repository-first audit found that `e2ee-account-group-app-integration.js` exposed Group Info administration wrappers without importing the corresponding controller delegates. The defect was repaired in commit `8b72f00744cc4b882c7fb1df0ce48d3959f563ec`, the integration gate was strengthened to check all four delegates, and the checkpoint advanced to 0.9.6.6.

The full Rebuild Baseline Security Gate run **34046337123** passed after that repair. Earlier important green runs include **34011735357** for the hardened recovery/account-E2EE baseline, **34045259037** for real group administration, and **34046083575** for the group-history cryptographic foundation.

## Current first-rebuild completion state

Approximately **65%** of the first complete rebuild acceptance criteria are complete. This percentage excludes FCM 1.1 and App Check 1.2 work.

Major completed areas include deterministic runtime ownership, centralized Firebase ownership, account E2EE identity/recovery foundation, direct-message v3 E2EE, encrypted Outbox, group E2EE send/receive/receipts/offline retry, group creation, and real group rename/add/remove/leave administration.

Major unfinished first-release areas include explicit earlier-history grant persistence/UI/purge integration, disappearing-content physical purge, complete attachment send/receive/lifecycle, invitation and safe install integration rebuilt from scratch, remaining Chat/Group Info/tool placeholders and simulated state removal, final complete-repository gate, atomic `htest` deployment, and final real-device validation.

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

