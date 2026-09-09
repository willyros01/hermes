### 1.1.0 — FCM N2 ownership foundation

Begins FIDUNIO 1.1 notification work without activating live push: central Firebase owner gains bounded Messaging APIs, with separate pure registration/policy owners and permanent ownership tests. Disappearing attachments from 0.9.9.19 are device accepted across direct photo/file/audio/video and group photo tests.

## 0.9.9.19 disappearing-attachment candidate

Disappearing selection now covers future encrypted attachments as well as text. Server deletion stays behind the existing serialized purge executor/repository: deterministic Storage ciphertext prefix first, Firestore source last after revalidation. Client delete permissions are unchanged. Live Storage IAM + Function redeployment and real-device acceptance are still required.

### 0.9.9.13 group sender-name labels

**Status: DEVICE CANDIDATE.**

0.9.9.13 is a bounded group-chat presentation change. Every group-message row now resolves the sender UID against the already-owned group member projection and shows that member's FIDUNIO display name above the bubble. This includes incoming and outgoing group bubbles. Direct-message bubbles are unchanged. No Firebase schema/rules, group E2EE, receipt, Outbox, disappearing-message, attachment, PIN, or responsive-layout authority changes are included. A permanent baseline gate verifies that sender identity remains carried by the existing group conversation projection and that rendering is group-only. Device acceptance must confirm names on iPhone and iPad and verify direct chats remain unchanged.

# FIDUNIO / Hermes

### Disappearing text activation — 0.9.9.12

**Status: REPOSITORY CANDIDATE; LIVE SCHEDULER DEPLOYMENT REQUIRED.**

The previously visible compose selector had policy, immutable metadata, server eligibility, physical Firestore purge repositories, authoritative local convergence and reconnect anti-resurrection foundations, but no scheduled server owner was deployed. 0.9.9.12 adds the missing scheduled Function owner `purgeDisappearingMessagesV1`. Only newly created text messages explicitly stamped `disappearingPurgeVersion: 1` are discoverable by the scheduler. This is an activation boundary: old pre-activation rows and attachment descriptors are intentionally excluded. The scheduler runs from server time, invokes the existing serialized purge executor/revalidated repository path, and never authorizes deletion from a browser clock. Attachments remain non-disappearing in this activation build until Storage trace deletion can satisfy the source-delete-last contract. Live Firebase rules/Function/IAM remain unchanged until the reviewed deployment handoff is run and verified.

## FIDUNIO 1.1 Message Notifications — authoritative plan

The approved durable design is `FCM-NOTIFICATION-ARCHITECTURE.md`. It governs all future FCM/Web Push notification implementation, testing, deployment, token registration, server notification triggers, service-worker notification handling, and tap routing. FCM must remain a generic wake-up/notification layer; authoritative messages continue to come only from Firestore through the existing E2EE path. The N1 architecture checkpoint changes documentation only and does not enable FCM or change live Firebase configuration.

## 0.9.9.11 iOS recorded-audio MIME normalization

**Status: DEVICE CANDIDATE.**

Real-device 0.9.9.10 evidence: Audio chooser passed, microphone recorder opened correctly, and the camera did not open; after **Stop & Send**, the recorded clip was rejected before send as `Unsupported attachment type`. Source review showed the recorder was passing `MediaRecorder.mimeType` verbatim into the attachment validator. Browser recorder MIME values may include codec parameters (for example `audio/mp4;codecs=...`), while FIDUNIO's attachment authority deliberately validates canonical media types. 0.9.9.11 normalizes only the recorded-audio MIME to the lower-case base media type before constructing the File. It does not accept video MIME as audio and does not change encryption, Storage, Outbox, limits, or recipient handling.

## 0.9.9.10 Audio source chooser and microphone recorder

**Status: DEVICE CANDIDATE.**

Observed on iPhone: tapping Audio invoked a camera/video capture path; the returned video MIME was then correctly rejected by the audio validator as an unsupported attachment type and showed the 25 MB audio limit. The Audio tool no longer uses the generic capture hint. It now opens **Record Audio / Choose Audio File / Cancel**. Record Audio uses microphone-only `getUserMedia({audio:true, video:false})` plus `MediaRecorder`; Choose Audio File opens `audio/*` without any capture attribute. Both sources converge on the same existing attachment validation, encryption, Storage upload, Outbox/publication and receipt path. No Firebase or E2EE authority changed.

## 0.9.9.9z iPhone composer clearance and video source chooser

**Status: DEVICE CANDIDATE — Issue 3.**

The phone chat no longer assumes a fixed 170px composer footprint. After each phone chat render, and whenever the textarea grows, FIDUNIO measures the actual fixed composer height and applies that exact bottom inset to the message area before scrolling to the bottom. Wide/iPad layout retains its prior scroll path and two-pane behavior.

Video now opens a source chooser with **Photo Library**, **Camera**, and **Cancel**. Both choices feed the existing accepted `chooseAndSendAttachment("video", "video/*", capture)` owner, so attachment validation, picker-session locking, encryption, upload, publication, and the 50 MiB video boundary are unchanged.

## 0.9.9.9y — LTE optimistic outgoing-message candidate

Issue 2 is isolated to sender visibility during Wi-Fi → LTE transition. `sendCurrent()` now renders the newly staged outgoing row before awaiting encrypted local Outbox creation or state persistence. Durable send authority, Firebase synchronization, E2EE, receipts, attachments, and responsive layout are unchanged. A permanent regression gate enforces render-before-Outbox ordering and failed-attempt visibility. Real iPhone/iPad LTE acceptance remains required before this issue is closed.

## Storage download CORS repair

If an encrypted attachment uploads successfully but Safari reports `Manifest download failed (storage/unknown): Load failed`, run the root-level `s.txt` script once in Google Cloud Shell with `bash s.txt`. It grants only the FIDUNIO GitHub Pages origin permission to read Storage objects through browser CORS; Storage security rules and authenticated membership checks remain authoritative.

Current device candidate **0.9.9.9x** repairs longer iOS camera capture continuity. The native file input is mounted in the document for the full system-camera session, and FIDUNIO defers its background lock only while that trusted picker is active. Normal locking resumes as soon as the camera returns a file or is cancelled. This prevents a longer recording from losing its browser callback and leaving no message trace.

FIDUNIO is the public product name for the Hermes private-messaging project. This repository contains the web/PWA implementation, Firebase integration, account-authoritative E2EE work, deterministic UI/runtime architecture, and the complete rebuild now in progress.

## Current authoritative state

- Repository: `willyros01/hermes`
- Product name: **FIDUNIO**
- Internal/project name: **Hermes**
- Sole authoritative development/deployment branch: `main`
- Historical rebuild checkpoint branch: `fidunio-complete-rebuild` — read-only; no new work
- Current checkpoint version: **0.9.9.13**
- Current weighted FIDUNIO 1.0 completion: **96%**
- `version.js` is the only authoritative runtime release-number source.
- GitHub Pages from `main` is the current full Firebase-connected device-test surface.
- The former rebuild-to-main documentation mirror is retired.
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

The persistence/runtime foundation is repository-validated, and 0.9.6.8 adds deterministic granted-history conversation projection. A target account can now merge active message-granular grant copies into the normal group conversation without allowing a grant to override an already decryptable ordinary message. The earlier-history runtime and Group Info grant controls are now repository-validated; final responsive Group Info completion and real-device acceptance remain in the allocated 0.9.9.x release-candidate phase.

### 0.9.6.6 bounded wiring repair

A repository-first audit found that `e2ee-account-group-app-integration.js` exposed Group Info administration wrappers without importing the corresponding controller delegates. The defect was repaired in commit `8b72f00744cc4b882c7fb1df0ce48d3959f563ec`, the integration gate was strengthened to check all four delegates, and the checkpoint advanced to 0.9.6.6.

The full Rebuild Baseline Security Gate run **34046337123** passed after that repair. Earlier important green runs include **34011735357** for the hardened recovery/account-E2EE baseline, **34045259037** for real group administration, and **34046083575** for the group-history cryptographic foundation.

## Current first-rebuild completion state

Exactly **96.0 / 100.0 weighted product points (reported as 96%)** of the first complete rebuild acceptance criteria are repository-validated. This deterministic ledger excludes FCM 1.1 and App Check 1.2 work.

Major completed areas include deterministic runtime/Firebase ownership, account E2EE identity/recovery, direct/group E2EE and administration, earlier-history grant UI/runtime, disappearing text and attachment anti-resurrection foundations, encrypted attachment send/receive/offline/lifecycle/purge, invitation-only enrollment, and independent safe install guidance.

Major unfinished first-release areas are the allocated 0.9.9.x release-candidate work: Group Info completion, Direct Chat Info completion, remaining prototype/simulation cleanup, responsive/lifecycle hardening, complete 1.0 repository candidate gate, final docs/package reconciliation, atomic `htest` deployment, real-device acceptance, any acceptance-only stabilization, and 1.0 promotion readiness.

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
- `BUG-LIST.md` — concise durable defect ledger.
- `DEVICE-ACCEPTANCE-BUGS.md` — critical detailed ledger for real-device acceptance and RC-stabilization defects.
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

### 0.9.6.18 — history-copy purge barrier

Release transition: **0.9.6.17 -> 0.9.6.18**.

- Clean Rebuild Baseline Security Gate run `34054991773` passed every substantive step after the history-copy barrier materialization and temporary-workflow cleanup.
- `writeCloudGroupHistoryGrantCopies` now uses one `serverTimestamp()` for each non-empty new-copy chunk and atomically updates parent-group `updatedAt` in the same Firestore batch as those new copy documents.
- Firestore Rules require the existing `historyGrantBarrier(groupId)` for history-grant copy creation. A standalone history-copy write is denied; a valid copy write must be accompanied by the exact parent-group `updatedAt == request.time` touch.
- This closes the remaining purge-basis phantom-copy race for building grants. The group purge basis already includes the group document update time, so any newly written grant copy invalidates/retries a concurrent purge before final deletion.
- Idempotent retry that finds every requested copy already present performs no group touch and no duplicate write.
- Added `group-history-copy-purge-barrier.test.mjs` plus group emulator tests proving standalone copy denial and atomic barrier success.
- Group physical deletion remains fail-closed. With new-grant and new-copy creation now basis-visible, the next secure repository slice is the bounded revalidated group trace commit: receipts + affected grant copies + grant metadata reconciliation/deletion + final source delete.
- Repository Firestore Rules changed only; **no live Firebase rule deployment** occurred. `htest` remains untouched; App Check enforcement remains OFF; FCM remains deferred to 1.1.
- Overall first-rebuild estimate remains approximately 65%.

### 0.9.6.19 — group receipt purge barrier

Release transition: **0.9.6.18 -> 0.9.6.19**.

- Clean Rebuild Baseline Security Gate run `34055638377` passed every step, including the new group receipt purge barrier and expanded group Firestore emulator matrix.
- New encrypted group messages now begin with `receiptRevision: 0` as outer non-cryptographic purge-concurrency metadata.
- Every actual group Delivered/Read receipt mutation is serialized in the existing Firebase transaction with the parent message and atomically advances `receiptRevision` by exactly one.
- Firestore Rules permit a parent group-message update only for that exact +1 revision and only when the caller's receipt in the same atomic request has `updatedAt == request.time`. Receipt create/update likewise requires the matching parent revision barrier.
- Repeat Delivered/Read no-ops do not advance the revision. Ciphertext, epoch, sender, disappearing duration and all other message authority remain immutable.
- This closes the orphan-receipt race: a newly created or advanced receipt necessarily changes the parent message already included in the server purge basis, forcing stale purge plans to retry.
- Group physical deletion remains fail-closed pending the bounded server trace commit and local/offline anti-resurrection work.
- Repository Firestore Rules changed only; **no live Firebase deployment** occurred. `htest` remains untouched; App Check enforcement remains OFF; FCM remains deferred to 1.1.
- Overall first-rebuild estimate remains approximately 65%.

### 0.9.6.20 — atomic group physical trace commit

Release transition: **0.9.6.19 -> 0.9.6.20**.

- The server-only disappearing purge Firestore repository now materializes the previously fail-closed group commit path.
- Final group purge re-reads group, source message, source epoch, all message receipts, all history-grant metadata and all grant copies inside one Firestore transaction, recomputes the complete trace plan, and rejects any stale basis before writes.
- An eligible commit physically deletes every observed message receipt, every subordinate history-grant copy for the source, any grant made empty by that removal, reconciles retained grant metadata, then deletes the shared encrypted source in the same atomic commit.
- The existing 0.9.6.17-.19 grant/copy/receipt barriers make permitted concurrent browser writes basis-visible; a concurrent change therefore aborts/retries rather than creating an orphan trace.
- Browser/client delete authority remains closed. No tombstone or `expired:true` record was introduced.
- This checkpoint does not add a scheduler and does not yet complete local IndexedDB/Outbox/object-URL/notification anti-resurrection convergence or attachment purge.
- No live Firebase deployment occurred. `htest` remains untouched; App Check enforcement remains OFF; FCM remains deferred to 1.1.
- Overall first-rebuild estimate remains approximately 65%.

### 0.9.6.21 — local anti-resurrection decision foundation

Release transition: **0.9.6.20 -> 0.9.6.21**.

- Added `disappearing-local-convergence.js` as a pure decision owner for local disappearing-message convergence after authoritative cloud absence.
- Only a message explicitly known to have been server-backed, carrying valid disappearing metadata, and absent from an authoritative server-backed snapshot can be planned for local cache/Outbox removal.
- Cache-only absence, offline cold-start incompleteness, device time, and never-server-backed queued work cannot authorize local purge.
- The planner emits physical-removal IDs only and creates no tombstone or `expired:true` record.
- Added focused tests and the planner to the normal Rebuild Baseline Security Gate.
- This checkpoint deliberately does not yet wire IndexedDB mutation into `app.js`; persistent cross-restart Outbox suppression, group projection metadata, object URLs, attachments and notification traces remain unfinished.
- No live Firebase deployment occurred. `htest` remains untouched; App Check enforcement remains OFF; FCM remains deferred to 1.1.
- Overall first-rebuild estimate remains approximately 65%.

### 0.9.6.22 — UID-scoped local physical purge wiring
Release transition: **0.9.6.21 -> 0.9.6.22**. `app.js`, the existing owner of live application state, encrypted Outbox and encrypted history cache, now has one serialized UID-guarded local purge path. The path physically removes planned message IDs from in-memory message state, encrypted history records and matching Outbox records, then persists the cleaned state. Restored queued messages retain `disappearAfterSeconds` and are explicitly `serverBacked:false`; no tombstone/`expired:true` record is created. A pure local-storage plan and focused gate test were added. Authoritative snapshot invocation remains allocated to 0.9.6.23, so this build does not let cache-only absence trigger purge. Full Rebuild Baseline Security Gate `34058248816` completed SUCCESS, including the dedicated local physical purge wiring step and all protected baseline gates. No live Firebase or htest change.

## 0.9.6.23 — authoritative direct/group projection convergence

Runtime version advanced from **0.9.6.22** to **0.9.6.23** because the server/cache projection boundary is now wired into both direct and group message projections.

Significant changes:
- `disappearing-authoritative-projection.js` is the pure server-vs-cache projection decision owner. A cache snapshot can merge but cannot authorize purge; a server-backed snapshot marks observed rows `serverBacked:true` and can plan physical removal of previously server-backed disappearing rows that are now absent.
- `app.js` invokes the existing serialized active-UID local physical purge owner before committing an authoritative direct/group projection, including matching encrypted Outbox removal.
- Direct and group projections preserve `disappearAfterSeconds`; legitimate never-server-backed queued work survives authoritative snapshots.
- Group snapshot metadata is propagated through the existing group conversation owner. Earlier-history grant reads now require server reads so a stale cached grant copy cannot be treated as authoritative after server purge; offline/cache projections preserve the already encrypted local projection rather than gaining delete authority.
- No tombstone, `expired:true`, client-clock purge authority, competing Firebase owner, service-worker semantic owner, live Firebase deployment, or htest deployment was introduced.

Validation: full `Rebuild Baseline Security Gate` run **34059145963** completed **SUCCESS**, including the permanent `Disappearing authoritative projection convergence` step and all prior E2EE/rules/recovery/runtime gates.

Rollback/rejection status: no validated checkpoint was rejected or rolled back. The historical rejected 0.9.4.12–0.9.4.15 invite/install implementation remains excluded.

Follow-on constraint: 0.9.6.24 owns cold-start/restart/reconnect ordering proof. In particular, an authoritative server snapshot must converge/purge stale server-backed disappearing traces before any reconnect Outbox replay can recreate them. The existing reconnect retry timers are not accepted as purge authority and must not be used as a semantic rescue mechanism.

### 0.9.6.23 final grant-source authority strengthening
Final review caught and closed a subtle group-history resurrection boundary: a grant-only projected copy is not proof that its original source message still exists. `e2ee-account-group-history-projection.js` now marks ordinary retained source rows `authoritativeSource:true` and grant-only rows `authoritativeSource:false`; `disappearing-authoritative-projection.js` excludes grant-only rows from authoritative source-presence IDs and suppresses a grant-only row when authoritative source absence plans that disappearing ID for purge. The permanent projection and group-conversation gates cover this distinction. Full baseline security gate `34059145963` passed on the strengthened implementation. Live Firebase and `htest` were not touched.

### Mandatory build reallocation after 0.9.6.23
Repository review reconfirmed the known 0.9.6.20 omission: group physical purge still lacks an explicit conservative transaction write-count ceiling. Per the pre-allocation rule, this security repair is allocated **before implementation** as 0.9.6.24. The previous 0.9.6.24–0.9.6.29 work shifts to 0.9.6.25–0.9.6.30. The weighted denominator remains 100: 0.9.6.24 receives 0.5 point and restart/reconnect 0.9.6.25 receives 0.5 point; later shifted builds retain their prior points. Current earned completion remains 69%.

### 0.9.6.24 bounded group-purge transaction writes
The known 0.9.6.20 write-limit omission is closed. `disappearing-purge-firestore-admin-adapter.mjs` now computes the complete group purge transaction write count before scheduling any mutation and caps it at 400. Exactly 400 writes are accepted; 401 fails closed with `PURGE_TRACE_TOO_LARGE` and zero scheduled writes. Oversized traces remain intact for a future safe lease/chunk design; there is no source-first chunking, tombstone, browser delete permission, or live Firebase change. Full baseline security gate `34059468538` passed. Runtime version is 0.9.6.24. Weighted ledger is 69.5/100, reported as **70%**. Next allocated build is 0.9.6.25 restart/reconnect stale-client anti-resurrection proof.

### 0.9.6.25 restart/reconnect replay barrier — IN PROGRESS
Runtime version is now **0.9.6.25**. `disappearing-reconnect-recovery.js` is the pure restart/reconnect Outbox decision owner. `firebase.js` remains the sole client Firebase owner and now exposes explicit server-only direct/group source-ID probes; `app.js` remains the sole local mutation/controller owner and serializes reconnect reconciliation before any cloud/group Outbox replay. Server-present Outbox IDs are treated as already accepted, prior-server-backed disappearing IDs that are authoritatively absent are physically purged before retry, and only never-server-backed absent work may replay. Cache-only absence and client time remain non-authoritative; no tombstone is created. Full baseline security gate **34060082292** passed on head `cb05fadc749fd42cdbbccc64fc3bb1972b854d41`.

The build is deliberately **not** marked repository-validated for the 1.0 ledger because one exact crash/idempotency boundary remains unresolved: if Firestore accepts a send and the browser crashes before the Outbox is deleted or any durable `serverBacked:true` observation is recorded, then the source later expires and is physically purged before that device returns, restart state is indistinguishable from genuinely never-sent queued work. A per-message tombstone/accepted-ID registry would violate the current trace-free rule; delaying purge until sender acknowledgement can violate disappearance semantics; a durable per-device/replay-channel high-water mark may solve replay but would intentionally retain non-content anti-replay state caused by expired traffic and therefore needs an explicit architecture/privacy decision before adoption. The contract records `postCommitPreObservationCrashGapClosed:false`. No live Firebase or `htest` change was made. The allocated 0.5 point remains unearned, so weighted completion stays **69.5/100 (70% normal status)**. Do not begin 0.9.6.26 until this boundary is resolved.
### Version checkpoint 0.9.6.24 -> 0.9.6.25
Reason: materialize the allocated restart/reconnect anti-resurrection barrier. Significant change: cloud/group encrypted Outbox replay is now preceded by explicit Firestore server-authority reads and a serialized app-owned reconciliation step. Validation: full `Rebuild Baseline Security Gate` run `34060082292` succeeded. This is **not** a rollback or rejected build, but the build remains IN PROGRESS because the post-commit/pre-observation crash window still requires an architecture decision. Follow-on constraint: do not advance to 0.9.6.26 and do not touch live Firebase/`htest` until that boundary is resolved.

### 0.9.6.25 fail-closed reconnect checkpoint
The restart/reconnect anti-resurrection slice is repository-validated. FIDUNIO now persists a local Outbox send-attempt marker before direct/group cloud transmission and refuses automatic replay when an attempted ID is later absent from authoritative Firestore, preventing the rare crash/expiry sequence from resurrecting disappearing content without retaining server tombstones. Full baseline gate `34060880885` passed. Weighted first-rebuild completion is **70%**; next allocated build is 0.9.6.26 multi-device expiry convergence. Live Firebase and `htest` were not changed.

### 0.9.6.26 + 0.9.6.27 combined build pass
Per user instruction these two pre-allocated checkpoints were built in one continuous pass while retaining separate exit criteria. 0.9.6.26 adds permanent same-UID multi-device disappearance convergence proof: independent installations converge source/history/Outbox traces only from authoritative server absence, and stale attempted Outbox work cannot resurrect a purged source. 0.9.6.27 adds the user-facing disappearing-text selection (Off, 5 minutes, 1 hour, 1 day, 7 days) directly at the composer and snapshots that choice into each new direct/group message's immutable `disappearAfterSeconds`. Changing the preference later does not alter already-sent messages. Runtime version advanced 0.9.6.25 -> 0.9.6.27 because both allocated builds completed together. Full Rebuild Baseline Security Gate `34061730677` passed on `b3086fb894b2e9d904264300b60c04a68668f3dc`. Both are REPOSITORY-VALIDATED; weighted completion is **72%**. No live Firebase or `htest` change.

## 0.9.6.27 -> 0.9.6.30 combined validated pass — 2026-09-06
Reason: complete the three pre-attachment checkpoints in one controlled pass while preserving separate build ownership and exit criteria.

- **0.9.6.28:** added a permanent end-to-end disappearing-text matrix covering immutable duration policy, authoritative absence, cache-only non-authority, physical local/history/Outbox removal, and restart/reconnect anti-replay.
- **0.9.6.29:** Group Info administrators can deliberately grant retained earlier history either from the beginning or from a selected date. The UI delegates target/boundary intent through the existing bounded group app/controller/runtime owner; it does not select cached source rows or manufacture local grant state.
- **0.9.6.30:** removed the duplicate direct-message pre-projection Read mutation path so direct receipts have one deterministic subscription write path; retained foreground/pageshow subscription recovery and the existing serialized group receipt projection.
- Permanent focused gates were added to the normal Rebuild Baseline Security Gate. Full gate **34062508968** passed SUCCESS.
- No rollback or rejected 0.9.4.12-.15 code was restored. No live Firebase or `htest` deployment occurred.
- Follow-on: attachment transport/data authority begins at 0.9.7.0. Real iPhone/iPad receipt and responsive acceptance remains scheduled for the release-candidate device gate.

## 0.9.7.0–0.9.7.4 attachment send checkpoint — repository validated

Builds 0.9.7.0 through 0.9.7.4 establish one attachment send owner and wire photo, file, audio and video selection/capture through bounded local AES-256-GCM chunk encryption, encrypted Outbox staging, ciphertext-only Firebase Storage upload through `firebase.js`, and the existing direct/group E2EE message commit path. Attachment keys travel only inside E2EE message ciphertext. Size limits are photo 12 MiB, file 20 MiB, audio 25 MiB, video 50 MiB. Storage client delete is denied; disappearing attachment deletion remains reserved for the purge owner in 0.9.7.8. Full Rebuild Baseline Security Gate `34063327957` SUCCESS. No live Firebase or htest deployment occurred. Runtime version is 0.9.7.4. Next build is 0.9.7.5 receive/decrypt/display/play.

## 0.9.7.5–0.9.7.9 attachment phase closeout — repository validated

Runtime 0.9.7.9 completes the allocated attachment phase: integrity-checked receive/decrypt with explicit object-URL lifecycle; UID-scoped offline/cache recovery policy; message-level receipt authority; trace-free disappearing-attachment purge planning and serialized storage/local-before-source execution; and the permanent attachment closeout matrix. Firebase Storage download remains solely in `firebase.js`. Client Storage deletion remains denied; server purge dependencies are injected into the dedicated purge executor and no live Firebase deployment occurred. Full Rebuild Baseline Security Gate `34064314857` SUCCESS. Next allocated build is 0.9.8.0 invitation deterministic-owner rebuild; rejected 0.9.4.12-.15 invite/install logic remains forbidden.

## 0.9.8.0–0.9.8.5 invitation/install checkpoint — repository validated

Runtime 0.9.8.5 completes the invitation/join/install phase. `invitation-owner.js` is the sole serialized invitation mutation coordinator while `firebase.js` remains the sole Firebase repository/SDK owner. Pure `invitation-policy.js` enforces single-use lifecycle, issuer roles and target roles. Auth and Settings request invitation work through that owner. Firestore emulator coverage proves anonymous validation of a known token, unauthorized issuance/revocation denial, owner issuance/revocation, atomic accepted-invitation + active-profile enrollment, and second-redemption denial. Joined active profiles flow into existing direct/group discovery without device binding.

`install-guidance.js` owns only an optional predefined Settings Install panel. It never mutates invitation, account, messaging or service-worker state and never uses automatic install prompting. iOS uses Safari Share -> Add to Home Screen; Android/Fire and desktop use browser-provided install/add/shortcut commands when available. The rejected 0.9.4.12–0.9.4.15 invite/install logic was not restored or adapted. Protected iPhone Back/wrap, Settings deterministic ownership and two-pane architecture remain gated. Full Rebuild Baseline Security Gate `34065528714` SUCCESS. No live Firebase or htest deployment occurred. Next allocated build: 0.9.9.0 Group Info completion.


### 0.9.9.0-0.9.9.5 — repository release-candidate closeout

Group Info now uses the established tablet-responsive secondary-screen owner, including the previously deferred landscape treatment, while retaining the validated earlier-history grant controls. Direct Chat Info exposes only real cloud security information; unsupported local-only placeholder behavior was removed. Prototype test banners, fake local receipt timers, and unsupported Contact/Checklist/Schedule/Saved tool alerts were retired; legacy local-only transport now fails closed instead of manufacturing delivery states.

The permanent `release-candidate-ui.test.mjs` gate protects these decisions alongside the existing runtime, receipt, Settings, attachment, invitation, disappearing-content, group, recovery and E2EE gates. Full Rebuild Baseline Security Gate **34066875377** completed SUCCESS on the clean candidate source. 0.9.9.5 reconciles cumulative documentation and prepares the coherent candidate for one atomic `htest` deployment. Live Firebase remains untouched; real iPhone/iPad acceptance remains a separate 0.9.9.7 requirement.


### 0.9.9.6 — atomic `htest` candidate deployment

Runtime version advanced 0.9.9.5 -> 0.9.9.6 solely to materialize the deployment candidate. Full Rebuild Baseline Security Gate **34067021824** completed SUCCESS on commit `31dac2c0b551429a5a4ba7cf7c967e6316e9a9e6`. The `htest` branch was then created directly at that exact commit, so the deployed test source and version are identical to the gated candidate. No live Firebase configuration, rules, Functions, App Check enforcement or production branch was changed.

The next checkpoint is 0.9.9.7 and is intentionally **BLOCKED — USER DEVICE PROOF** until real iPhone/iPad/two-account/offline/disappearing/attachment/invitation/install/recovery acceptance is performed.


### 0.9.9.6 — atomic `htest` candidate deployment

Runtime version advanced 0.9.9.5 -> 0.9.9.6 solely to materialize the deployment candidate. Full Rebuild Baseline Security Gate **34067021824** completed SUCCESS on commit `31dac2c0b551429a5a4ba7cf7c967e6316e9a9e6`. The `htest` branch was then created directly at that exact commit, so the deployed test source and version are identical to the gated candidate. No live Firebase configuration, rules, Functions, App Check enforcement or production branch was changed.

The next checkpoint is 0.9.9.7 and is intentionally **BLOCKED — USER DEVICE PROOF** until real iPhone/iPad/two-account/offline/disappearing/attachment/invitation/install/recovery acceptance is performed.


## 0.9.9.8 Firebase Storage connectivity repair — IN PROGRESS — 2026-09-06
The 0.9.9.7 pre-acceptance connectivity check proved that the prior 0.9.7.x attachment gates were repository-only dependency-injection/source tests, not a real Firebase-backed attachment test. The live default bucket `fidunio-fef13.firebasestorage.app` was then created in `US-CENTRAL1`, the reviewed `storage.rules` compiled and deployed, and Firebase granted the required Storage-Rules-to-Firestore cross-service role. Firestore rules, Functions, Hosting, Auth, App Check, GitHub branches and protected Firebase configuration were not changed by that live setup.

Repository stabilization now registers `storage.rules` in `firebase.json` and adds a permanent Storage deployment-wiring gate. Runtime advances 0.9.9.6 -> 0.9.9.8 because 0.9.9.7 is the device-acceptance gate, not an implementation build. This does not complete attachment acceptance: authenticated real-device upload/download/authorization/offline/purge proof remains required. The 0.9.9.8 point remains unearned until the full repository gate is green and acceptance defects are closed. Overall ledger remains 96.0/100 (96%).


### 0.9.9.8 repository validation checkpoint — 2026-09-06
Commit `34c8d237eb8f08b8228f670b8ca958038b553aef` registers `storage.rules` in `firebase.json`, adds the permanent `storage-deployment-wiring.test.mjs` gate, advances runtime to 0.9.9.8, and preserves `firebase-config.js` unchanged at blob `b81026dcc07b7374d1f48d0cb094764ce28319bd`. Full Rebuild Baseline Security Gate `34072294756` completed SUCCESS, including the new Firebase Storage deployment-wiring step. This proves repository deployability, not real attachment operation. 0.9.9.8 remains IN PROGRESS pending authenticated iPhone/iPad upload, second-device download/decrypt, unauthorized denial, offline/reconnect and disappearing-attachment purge proof. No additional completion credit is earned; overall remains 96.0/100 (96%).


## 0.9.9.7 iPad acceptance failure — 2026-09-06

Real-device testing on the promoted `main` build exposed three release-candidate blockers: missing conversation widgets, materially regressed iPad text size, and conversation-pane overlap. The durable detailed records are FDA-IPAD-001 through FDA-IPAD-003 in `DEVICE-ACCEPTANCE-BUGS.md`. These are user-observed device failures, not repository simulations. Build 0.9.9.7 remains FAILED/BLOCKED; 0.9.9.8 remains the allocated RC stabilization build and earns no point until repair, full required gates, redeployment and repeated user acceptance. Overall completion remains 96.0/100.0 (96%).


## 0.9.9.8 iPad RC repair candidate — 2026-09-07

The bounded repair candidate addresses FDA-IPAD-001 through FDA-IPAD-003 without changing Firebase/E2EE/storage ownership. It separates Sign Out from the constrained tablet icon cluster, makes tablet brand/navigation/tool labels scale from the established root A/A+/A++ owner, changes the obsolete eight-slot tablet attachment grid to the four supported tools, and distinguishes Firebase conversation discovery from authoritative empty/error state. It does not fabricate conversations or restore quarantined cross-account data. Targeted iPad stabilization, release-candidate UI/lifecycle and Storage-wiring gates pass locally. Full baseline, promotion to `main`, Pages deployment and repeated user-device acceptance remain pending. Defects remain OPEN; 0.9.9.8 earns no point and total completion remains 96.0/100.0 (96%).


## 0.9.9.8 second iPad acceptance evidence — 2026-09-07

The first repair restored the real cloud conversation and composer/widgets and removed the horizontal Sign Out collision. The user screenshot also exposed FDA-IPAD-004 (standalone status-bar header clipping) and FDA-IPAD-005 (unused right-side viewport). A tablet-only follow-up candidate adds a bounded safe-top fallback and gives the existing `#app`/tablet-shell owner full flex width. Targeted iPad, candidate UI and receipt-lifecycle gates pass locally. All five device defects remain open until full baseline, `main` deployment and repeated user acceptance. Completion remains 96.0/100.0 (96%).


## 0.9.9.8 third iPad acceptance finding — 2026-09-07

The second screenshot confirms the safe-area and full-width repairs visually, while exposing FDA-IPAD-006: iPad painted the native disappearing selector white inside the dark composer. The bounded CSS-only candidate themes the existing selector with the established panel/accent/ink variables and preserves an accessible 42px target. No render, Firebase, storage, E2EE or receipt owner changes. Targeted gates and user acceptance remain required; completion remains 96%.

## 0.9.9.8 deferred selector alignment — 2026-09-07

The deployed selector theme is readable and removes the white native control, but user-device evidence shows that its size, shape, spacing and alignment do not match the quick-reply widgets. Per explicit user direction, no isolated cosmetic repair is made now. FDA-IPAD-006 remains OPEN — DEFERRED for the next necessary 0.9.9.8 acceptance repair. No ownership boundary changes and no completion credit result from this documentation-only disposition; completion remains 96%.

## 0.9.9.8 direct-send acceptance blocker — 2026-09-07

Real-device testing exposed FDA-DM-001: an iPad cloud direct message remained at Sending for more than one minute. The message is staged in the encrypted Outbox before an unbounded authoritative Firebase reconciliation wait, so the UI can remain Sending before the actual Firestore send is attempted. The defect is open and must be repaired only through the existing serialized Outbox/reconnect owner with fail-closed status semantics. Completion remains 96%.

## 0.9.9.8 bounded Firebase reconciliation candidate — 2026-09-07

FDA-DM-001 is addressed inside the existing serialized Outbox/reconnect owner with a 12-second authoritative Firebase reconciliation boundary. An unattempted Outbox-backed message returns from Sending to Queued on timeout, the encrypted Outbox remains intact, and the sender receives a clear Firebase timeout message. Attempted messages retain the established fail-closed anti-replay treatment; Sent/Delivered/Read are never simulated. A permanent gate is in the normal baseline. Full repository validation, `main` deployment and device acceptance remain pending; completion remains 96%.

## 0.9.9.8 expanded direct-send candidate — 2026-09-07

The first reconciliation-only timeout failed device acceptance: the original Failed row returned to Sending and two new rows remained Sending beyond one minute. The expanded candidate serializes the full reconcile/encrypt/send cycle, bounds all Firebase-dependent stages, prevents attempted-message replay, and adds the new dependency to a deterministically revised service-worker shell cache. Runtime remains 0.9.9.8 because this is continued work under the allocated stabilization build. Full baseline, `main` publication and user acceptance remain pending; completion remains 96%.

### Expanded candidate validated and deployed — 2026-09-07

Expanded repair commit `90460aea19c0d5204c91b2542d59905b1edff246` passed full baseline `34085040014`. Main promotion `321d182cbd08cb690fa4df7caf96221ef69d09b4` passed Pages run `34085354728`, and live full-cycle/cache anchors were verified. This is repository and deployment evidence only. FDA-DM-001 stays open until installed-iPad and authenticated Firebase communication/receipt acceptance pass. Completion remains 96%.

### Device result: safe queue confirmed; Firebase communication unresolved — 2026-09-07

After the required second launch, the two preserved iPad messages display Queued. The expanded repair therefore prevents indefinite Sending, preserves encrypted Outbox authority and does not create false receipts. Authenticated Firebase communication still did not complete and remains the critical FDA-DM-001 blocker. Minor deferred FDA-IOS-001 records a blank iPhone startup/login interval; a visible accessible spinner/loading message should be added with later minor acceptance work. Completion remains 96%.

### 0.9.9.8 authenticated-session/verification-path repair candidate — 2026-09-07

The Verify handler's direct queue flush bypassed the established serialized authoritative Outbox cycle. The candidate routes it through that owner and force-refreshes Firebase Auth through `firebase.js` before reconciliation, with bounded stage-specific failure messages. Verification is a stored trust decision, not proof of a fingerprint comparison; no key reset occurred. Firebase rules and protected configuration remain unchanged. Full gate, `main` deployment and device acceptance remain required; completion stays 96%.

Candidate `6e6d5e84beb7e12173a5708835842512d44a92d4` passed full baseline `34087534090` and was promoted to `main` as `529a56d1f8e45d463a47d8c6150f95b4937ee87b`. Pages `34087730948` succeeded and live repair/config anchors were verified. Real two-device Sent → Delivered → Read acceptance remains required; completion stays 96%.

### 0.9.9.8 retry-backlog/startup/PIN fail-closed candidate — 2026-09-07

Device retest found a two-minute blank startup, iPhone PIN presented as unset, and a new direct message returned Sending → Queued. The candidate coalesces stacked recovery triggers, avoids unnecessary forced token refresh, displays connection-stage errors, adds a large startup spinner, and keeps the app locked if PIN storage is unavailable. It does not reset the PIN, keys, Firebase rules or protected configuration. Full gate/deployment/device acceptance remain required; completion stays 96%.

Authoritative `429855f037c3f9f0fb2a0f31ff1371a21f273922` passed full baseline `34125430406` and was promoted to `main` as `2dcbd8a558ed8bf355ebec1c6bbc82e59948b29f`. Pages `34125666157` and live checks succeeded. Device acceptance remains required; completion stays 96%.

### Device evidence — startup/PIN pass; Account E2EE locked

The user confirmed the large spinner on iPhone/iPad and successful unlock with the original iPhone local PIN. The current direct-send blocker is now explicit: the iPad Account E2EE identity is locked, so encryption correctly fails closed before Firestore send. No keys should be reset and the changed fingerprint must not be verified without comparison. Completion remains 96% pending Account Encryption unlock and receipt testing.

### 0.9.9.8 sender-side v3 read candidate

After both device accounts became Account Encryption READY, real queued rows reached Sent but the iPad could not read its own accepted ciphertext. The candidate adds the missing outgoing direction inside the existing account E2EE service, selected from authoritative sender UID and protected by exact keyId/AAD checks. Legacy compatibility-device trust is explicitly separated from account-authoritative E2EE. Direct tests pass; full baseline, promotion and device acceptance remain pending. Completion remains 96%.

Repository validation: corrected authoritative commit `fbfb296b2c29ce367fae7c38abc2b5147f14d509` passed full baseline `34130779064`. Promotion and real-device receipt proof remain pending; completion remains 96%.

### 0.9.9.8 Safari readonly-Outbox-row repair candidate

The iPad exposed `Attempted to assign to readonly property` when the established Outbox owner advanced a disappearing-message row from Queued to Sending/Sent. The disappearing compose policy had frozen the entire copied application row even though only the stamped expiry choice is immutable. The candidate preserves the one-time expiry stamp but returns a mutable transport row so the sole serialized `app.js` Outbox owner can update its state. No Firebase configuration, rules, E2EE owner, receipt owner or storage owner changes. Full baseline, `main` deployment and real-device acceptance remain required; completion stays 96%.

### 0.9.9.8 pending-message deletion candidate

Outgoing Queued, Sending and Failed messages now expose press-and-hold Delete Message/Cancel controls. Delete coordinates with the sole encrypted Outbox cycle and physically removes local message/history/Outbox traces. It adds no client Firestore delete authority. Gate, deployment and device acceptance remain required; completion stays 96%.

### Controlled deletion and one-PIN UX decision

Sender-owned accepted direct messages use a new server-only `deleteDirectMessageForEveryoneV1` authority; attachment traces are removed before the Firestore source. The callable and client are repository candidates only until the dedicated service account is provisioned and the Function is explicitly deployed. `MESSAGE-DELETION-AUTHORITY.md` is the critical deletion contract.

The approved fresh-account UX retains email/password plus one six-digit FIDUNIO PIN. Local unlock and account-encryption use separate internal derivations from that one PIN; device, direct, group, attachment and fingerprint details move to the background. `USER-ACCESS-KEY-UX.md` is the critical presentation/security contract. Completion remains 96%.

The 0.9.9.8 candidate now implements that ordinary Settings presentation: Account, one Security area, one six-digit FIDUNIO PIN, optional device unlock, and plain encryption status. Existing differing PINs fail closed rather than being overwritten. Focused gates pass locally; full baseline/deployment/device evidence remains outstanding, so the version and 96% ledger do not advance.

Commit `5e22a9484029d02f9f6691b82329a55d4695c848` passed full baseline `34139245770`; Pages `34139244639` succeeded. Device proof remains outstanding. The accepted-message cloud-delete control is still off until the dedicated server authority is explicitly activated. Completion remains 96%.
