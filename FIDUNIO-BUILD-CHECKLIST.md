- [x] **Disappearing attachments — 0.9.9.19:** live backend deployed; direct photo/file/audio/video and group photo all device accepted after authoritative Read with close/reopen anti-resurrection pass.
- [x] **Date/time presentation — 0.9.9.18:** group sender name/time + group/direct date separators device accepted.
- [ ] **Direct chat date separators — 0.9.9.18 correction:** preserve authoritative direct-message `createdAt` through projection so the shared date separator can render; pending device acceptance.
- [ ] **Direct chat date separators — 0.9.9.17 candidate:** apply the accepted horizontal-line `Month D, YYYY` day separator to one-to-one conversations while preserving per-message times and group sender name/time; pending iPhone/iPad device acceptance.
# FIDUNIO Complete Rebuild — Authoritative Build Checklist

### Open follow-up items

- [ ] **Disappearing attachments:** implement trace-free disappearance for photos/files/audio/video, including physical Firebase Storage manifest/chunk deletion and related-trace cleanup under `DISAPPEARING-PURGE-AUTHORITY.md`; preserve source-delete-last ordering; add permanent gates; deploy backend changes; complete direct/group/reopen device acceptance.
- [x] **Group chat sender label — 0.9.9.13:** device evidence confirmed sender names display correctly across tested group devices; the one observed reconciliation timeout subsequently completed delivery after Close and a repeat send from another device completed normally.
- [ ] **Group date separators — 0.9.9.14 candidate:** horizontal-line `Month D, YYYY` demarcation at group calendar-day boundaries while every message keeps time only; pending iPhone/iPad device acceptance.
- [ ] **Group sender time — 0.9.9.16 correction:** 0.9.9.15 device test showed names but no time on existing projected group rows; display now falls back from legacy `time` to authoritative `createdAt`; pending iPhone/iPad device acceptance.

### Disappearing text activation — 0.9.9.12

- [x] Diagnose live Test 1 no-purge failure from Cloud Function logs: missing `COLLECTION_GROUP ASCENDING` index for `messages.disappearingPurgeVersion`.
- [x] Add durable `firestore.indexes.json` authority and wire it through `firebase.json`.
- [x] Add permanent disappearing index wiring gate.
- [x] Deploy the reviewed Firestore index to live `fidunio-fef13` and verify scheduler invocation returns success.

- [x] Preserve server-time-only eligibility and the existing single purge executor/repository path.
- [x] Add explicit activation marker `disappearingPurgeVersion: 1` only to newly sent disappearing text.
- [x] Exclude pre-activation rows and attachment payloads from scheduler discovery.
- [x] Add scheduled server discovery owner `purgeDisappearingMessagesV1` (one-minute sweep).
- [x] Preserve direct/group first-Read duration semantics and authoritative local anti-resurrection convergence.
- [x] Extend exact Firestore create schemas for the bounded optional activation marker.
- [x] Add permanent disappearing activation gate and deployment-mirror drift gate.
- [x] Deploy/verify reviewed Firestore rules, dedicated purge IAM, and scheduled Function to live `fidunio-fef13`. Evidence: Cloud Shell SUCCESS; Function `purgeDisappearingMessagesV1` ACTIVE; dedicated runtime SA verified; scheduler present; Firestore rules deployed.
- [x] Deploy required COLLECTION_GROUP ASCENDING index for `messages.disappearingPurgeVersion` and verify scheduler returns healthy empty status.code.
- [x] Device-confirm direct 5-minute disappearing text from Read -> physical absence on sender and recipient; close/reopen confirmed no resurrection.
- [x] Device-confirm group 5-minute disappearing text with all entitled recipients Read -> physical absence on sender and all tested recipients; close/reopen confirmed no resurrection.
- [x] Device-confirm unread message does not disappear before authoritative Read; direct/group close/reopen confirmed no resurrection after purge.
- [x] Disappearing TEXT overall device closeout: direct purge, unread protection, group purge, and reopen anti-resurrection accepted on real devices.
- [ ] Attachment disappearing remains NOT ACTIVE until server Storage trace cleanup meets the source-delete-last contract.

### FIDUNIO 1.1 Message Notifications — N1 architecture/specification

**Authoritative design:** `FCM-NOTIFICATION-ARCHITECTURE.md`.

- [x] Preserve the approved notification architecture as one durable authoritative document on `main`.
- [x] Define FCM/Web Push as notification/wake-up transport only; Firestore + existing E2EE remain message authority.
- [x] Prohibit plaintext/decrypted message and attachment content in push payloads.
- [x] Preserve `firebase.js` as sole Firebase SDK/service owner and service worker as infrastructure-only notification display/click owner.
- [x] Define installation-scoped notification-token storage and owner-only rules model.
- [x] Define explicit Settings permission flow; no automatic startup permission prompt.
- [x] Define server-only recipient resolution, FCM send, invalid-token cleanup, direct/group policy, multi-device behavior, disappearing-content behavior, and Fire OS limitation.
- [x] Define phased implementation N2-N7 and the live Google/Firebase handoff barrier.
- [x] N2 — Firebase Messaging ownership foundation implemented; permanent ownership gate added.
- [ ] N3 — 1.1.1 repository candidate: deterministic Settings permission UI + UID/installation token registration + exact rules/emulator tests implemented; live VAPID/rules handoff and device registration proof pending.
- [ ] Google/Firebase handoff only after repo-side N2/N3 readiness is proven.
- [ ] N4 — Direct-message background notification.
- [ ] N5 — Notification tap routing through existing app/Firestore/E2EE path.
- [ ] N6 — Group + multi-device notification fan-out.
- [ ] N7 — lifecycle/reliability/device acceptance closeout.

Every future Message Notification/FCM task must read `FCM-NOTIFICATION-ARCHITECTURE.md` first and reconcile this checklist with it. N1 is documentation/architecture only and does not activate FCM or alter live Firebase configuration.

### iOS recorded-audio MIME normalization — 0.9.9.11

- [x] Preserve the accepted Audio chooser and microphone-only recorder.
- [x] Normalize only recorded-audio MIME parameters to a canonical base media type before validation.
- [x] Do not classify `video/*` as audio.
- [x] Preserve the 25 MiB audio limit and existing attachment send authority.
- [x] Extend the permanent audio regression gate.
- [ ] Device-confirm Record Audio → Stop & Send succeeds on iPhone.
- [ ] Confirm sender and recipient can access the audio after reopen.

### Audio source chooser + recorder — 0.9.9.10

- [x] Remove the generic audio capture hint that could launch iPhone video capture.
- [x] Add Audio chooser: Record Audio / Choose Audio File / Cancel.
- [x] Record Audio uses microphone-only media capture and MediaRecorder.
- [x] Choose Audio File uses `audio/*` with no capture attribute.
- [x] Both paths converge on one existing attachment send owner.
- [x] Audio validation failures identify themselves as Audio rather than generic Attachment.
- [x] Add focused regression coverage.
- [ ] Device-confirm microphone recording does not launch camera and sends successfully.
- [ ] Device-confirm saved audio selection and send.
- [ ] Reopen and confirm both audio attachments remain accessible.
- [ ] Confirm Photo and Video choosers remain unchanged.

### Issue 3 iPhone composer + video source — 0.9.9.9z

- [x] Replace the phone-only fixed composer clearance assumption with measured composer height.
- [x] Recompute clearance when the phone textarea grows.
- [x] Preserve the existing wide/iPad scroll path and two-pane layout.
- [x] Add Video source chooser: Photo Library / Camera / Cancel.
- [x] Reuse the existing accepted video picker/send owner; do not fork attachment transport.
- [x] Add focused regression coverage.
- [ ] Device-confirm iPhone last-line visibility and sticky bottom with tools closed/open and multi-line draft.
- [ ] Device-confirm Video Photo Library and Camera paths.
- [ ] Confirm iPad two-pane layout remains unchanged.

### Issue 2 LTE outgoing-message visibility — 0.9.9.9y

- [x] Identify the delayed-bubble boundary in `sendCurrent()` before changing transport ownership.
- [x] Render one staged outgoing row before the first awaited encrypted Outbox/IndexedDB operation.
- [x] Keep the existing serialized encrypted Outbox as sole durable send authority.
- [x] Fail an already-visible attempt in place instead of silently restoring duplicate composer text.
- [x] Add permanent LTE optimistic-message ordering coverage.
- [ ] Prove Wi-Fi → LTE immediate outgoing visibility and no duplicate send on iPhone.
- [ ] Repeat the same acceptance on iPad and confirm normal final receipt state.

## Authoritative publishing rule

- [ ] Every completed and validated build is committed and pushed directly to `main` before it is reported complete.
- [ ] Never separate the `main` push into a later user-confirmation step.
- [ ] Application builds use automatic repository publishing; only authenticated backend operations may require the user to run the supplied short `.txt` Cloud Shell script.

### Basic direct-message transport recovery — 2026-09-07

- [x] Identify account-key preparation as the direct-text pre-send blocker.
- [x] Route new direct text through the existing authenticated Firestore text format.
- [x] Preserve fixed-ID Outbox retry, real receipts, and historical encrypted-message reading.
- [x] Add a permanent basic direct-message path gate.
- [x] Remove direct-chat key/fingerprint banners and replace Conversation Security access with plain Chat Info.
- [x] Add explicit open-conversation Read recovery and permanent regression coverage.
- [x] Advance visible device candidate to 0.9.9.8c and observe Firestore cache-to-server metadata confirmation.
- [x] Advance to 0.9.9.8d; remove plaintext receipt dependency on legacy-key lookup and stop swallowing explicit receipt errors.
- [x] Reject 0.9.9.8d after four failed attempts; make displayed/open incoming rows trigger Read without metadata gating in 0.9.9.8e.
- [x] Capture 0.9.9.8e permission-denied evidence and add exact plaintext recipient-Read rules coverage.
- [x] Deploy and verify the reviewed Firestore rules to live project `fidunio-fef13` (ruleset `6f6d9fda-0698-48db-b1a9-b9dde31b9456`).
- [x] Prove iPad → iPhone Read receipt on live devices after rules alignment.
- [x] Restore account E2EE v3 at the serialized direct Outbox boundary in candidate 0.9.9.9a.
- [x] Restore the existing pending-delete and sender Delete for Everyone client actions.
- [x] Extend sender-only Delete for Everyone to accepted group messages, including receipt and history-grant trace cleanup.
- [x] Add one reusable six-slot FIDUNIO PIN owner to login and local unlock.
- [ ] Deploy and verify `deleteDirectMessageForEveryoneV1` with its dedicated service account.
- [ ] Prove 0.9.9.9a encrypted send/read and both delete paths on iPad/iPhone.
- [x] Correct the 0.9.9.9a returning unlock design and duplicate READY-identity bind in 0.9.9.9b.
- [ ] Prove 0.9.9.9b PIN/biometric reopening, then repeat encrypted send/read/delete on iPad/iPhone.
- [x] Add local-only Delete for Me with durable per-device snapshot filtering in 0.9.9.9c.
- [ ] Prove Delete for Me survives close/reopen on one device while the message remains visible on the other device.
- [x] Restore immediate lock on app background/pagehide and replace the no-op Groups navigation in 0.9.9.9d.
- [x] Give direct Read one receipt owner, support legacy iOS Auto appearance changes, and align delete choices in 0.9.9.9e.
- [x] Preserve the mounted local PIN control and focus while locked cloud callbacks arrive in 0.9.9.9f.
- [x] Implement login-join: password-only Sign In, separate invitation/account/PIN Join, and PIN/biometric only for subsequent local unlock in 0.9.9.9g.
- [x] Implement the approved graphic Sign In/Join navigation tiles without changing login-join form behavior in 0.9.9.9h.
- [x] Add one accessible, shared busy spinner for asynchronous action buttons and explicitly cover Send/password reset in 0.9.9.9i.
- [x] Make group text Send single-flight, clear the composer immediately, render final state, and recover stale pending deletion in 0.9.9.9j.
- [ ] Deploy and verify the simplified 0.9.9.9j group receipt Firestore rules, then prove group Send/receipt/delete on devices.
- [ ] Verify app-switch PIN/biometric lock and Groups list/New Group navigation on iPad.
- [ ] Complete full repository gate and Pages deployment.
- [ ] User proves iPad → iPhone and iPhone → iPad Sent → Delivered → Read.

This file is the operational completion ledger for the sole authoritative `main` branch. `fidunio-complete-rebuild` is historical only after the 2026-09-07 branch-authority transition.

## Mandatory build-session rule

Before changing code in any build session:
1. Read `hermes-memory.txt` and the mandatory architecture/security documents named there.
2. Read this entire checklist.
3. Select work from an item marked `NOT DONE` or `IN PROGRESS`.
4. Do not mark an item `DONE` merely because code exists. `DONE` requires the implementation to be integrated into the real app and the applicable repository tests/security gate to pass.
5. After every substantive build run/commit, update this file in the same work session with the actual state and evidence/commit. If no checklist state changed, update the Build Log only when there is material evidence worth preserving.
6. If a completed feature regresses, change it back to `IN PROGRESS` or `NOT DONE`; never preserve a false green status.
7. Completion percentage is based on the complete product acceptance criteria for the current release target, not file count. Report a new percentage to the user only after a meaningful milestone is completed.
8. Every release-number increment/reset/rollback must update `README.md` in the same work session with the significant build/rollback history and validation evidence; `version.js` remains the runtime version authority.

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
| Group rename | DONE | Cloud-authoritative admin rename through serialized group owner; group tests and full Rebuild Baseline Security Gate green. |
| Group add member | DONE | Real cloud users; membership/member doc/new E2EE epoch committed atomically. |
| Group remove member | DONE | Admin removal atomically rotates epoch; removed member is excluded from replacement envelopes. |
| Leave group | DONE | Non-owner self-leave is atomic with epoch replacement; immutable owner intentionally cannot leave. |
| Group history policy/admin controls | IN PROGRESS | Date/message-bounded policy, message-granular grant crypto, Firestore persistence/rules/runtime, deterministic target-side conversation projection, and server-backed authoritative source selection/intent-only app bridge are repository-validated through 0.9.6.9. Group Info date/beginning grant controls and disappearing-content purge/anti-resurrection remain unfinished. |

## Disappearing content

**Non-negotiable purge rule:** when disappearing content expires, every application-controlled trace of that content must be purged. The Firestore message document itself must be physically deleted, not merely hidden or marked expired. No per-message tombstone, plaintext, ciphertext, receipt record, attachment metadata, attachment blob/chunk, thumbnail, preview, local history record, cached decrypted object, Outbox copy, notification payload, or other application-controlled content record may remain after purge. This applies to sender and recipient devices/accounts and to direct and group content.

| Area | State | Evidence / notes |
|---|---|---|
| Disappearing-message policy/model | IN PROGRESS | 0.9.6.14 adds the serialized purge-executor coordination owner on top of 0.9.6.13 eligibility: explicit server-time provider, opaque revalidation basis, fail-closed stale commit, and one repository delete boundary. Physical Firestore/Storage deletion, repository adapter, local/offline convergence, attachments and anti-resurrection remain unfinished. |
| Firestore trace-free purge | IN PROGRESS | 0.9.6.15 adds a server-only Firestore repository foundation: direct source deletion is transactional and basis-revalidated; group authoritative state/basis reads exist but group physical delete remains deliberately fail-closed until grant-copy/reference + receipt cleanup is coordinated. No tombstone/client delete rule. |
| Direct disappearing text messages | IN PROGRESS | Repository server adapter can physically delete an eligible direct source with transaction/basis revalidation and idempotent absence. Scheduler/wiring plus UID-scoped local cache/Outbox convergence and multi-device validation remain required. |
| Group disappearing text messages | IN PROGRESS | 0.9.6.16 adds deterministic history-grant trace planning and binds grant metadata/copy update times into the authoritative group purge basis. Whole-grant delete vs retained-copy metadata reconciliation is now defined and gated. Concurrent new-grant creation is now basis-visible through the 0.9.6.17 atomic group `updatedAt` barrier. Physical group delete still fails closed pending one revalidated receipt/grant/source commit. |
| Disappearing attachments | DONE | 0.9.7.8 enumerated physical traces + serialized storage/local-before-source purge executor; no tombstones/client Storage delete. |
| Offline/reconnect expiry behavior | NOT DONE | Expired content must not resurrect from Outbox, IndexedDB history, stale snapshots, cached attachments, or reconnect reconciliation. Normal clients must discard stale expired material rather than re-upload it. |
| Multi-device expiry convergence | NOT DONE | Same account on multiple devices must converge on the same absence of the expired content; purge cannot be installation-local only. |
| Expiry UI/settings | NOT DONE | Provide clear per-conversation/default or per-message controls only after the underlying authority model is defined; UI must show the effective disappearing policy before expiry and no residual content after expiry. |
| Expiry security/rules/tests | NOT DONE | 0.9.6.16 additionally gates group history-grant trace reconciliation and inclusion of grant/copy versions in the opaque purge basis. Still required: race-safe grant-creation barrier, physical group receipt/grant/source deletion tests, local cache purge, multi-device convergence, attachment cleanup and stale-client non-resurrection. |

Provider limitation: this trace-free rule governs all data FIDUNIO controls through Firestore/Firebase application APIs and local device storage. Cloud-provider internal infrastructure such as transient service logs or provider-managed backups, if any are enabled or retained outside application-level control, must be separately audited/configured; the app must never intentionally create or retain its own archival copy of disappearing content.

## Attachments / rich messaging

| Area | State | Evidence / notes |
|---|---|---|
| Attachment encryption/chunking foundation | DONE | Integrity-checked bounded chunking; tamper/missing-chunk tests. |
| Photo select/capture + send | DONE | 0.9.7.1 common encrypted send owner; baseline 34063327957 green. |
| File select + send | DONE | 0.9.7.2 common encrypted send owner; baseline 34063327957 green. |
| Audio record/select + send | DONE | 0.9.7.3 browser capture/select intent through common encrypted owner; baseline green. |
| Video select/capture + send | DONE | 0.9.7.4 bounded common encrypted send owner; baseline green. |
| Attachment receive/decrypt/display/play | DONE | 0.9.7.5 integrity-checked receive and object lifecycle; baseline 34064314857 green. |
| Attachment retention/history/offline | DONE | 0.9.7.6 UID-scoped Outbox/cache authority; baseline green. |
| Attachment receipts/lifecycle | DONE | 0.9.7.7 message-level receipt authority; baseline green. |

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
| Group Info real management UI | IN PROGRESS | Rename/add/remove/leave are real. Earlier-history grant policy + crypto foundation exist, but the control remains disabled until schema/rules/runtime/purge validation. Admin-role controls and unrelated placeholders remain. |
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

## Weighted 1.0 completion ledger

The 1.0 percentage is now a **fixed-point weighted ledger**, not a subjective estimate and not a count of build numbers. The denominator is exactly **100.0 product points**. FCM 1.1 and App Check 1.2 are outside this denominator.

### Calculation rule

1. **Validated foundation through 0.9.6.20 = 66.0 earned points.** This freezes already repository-validated architecture, account E2EE/recovery, direct/group messaging foundations, responsive foundations, and the server disappearing-purge authority into one audited baseline rather than repeatedly re-estimating historical work.
2. Every remaining allocated 1.0 build has a fixed point value below. A build earns its points only when its stated exit criteria are satisfied and the required repository gate is green. `PLANNED`, `CURRENT`, and incomplete `IN PROGRESS` builds earn 0 from their reserved points.
3. `BLOCKED — USER DEVICE PROOF` work earns no final-device points until the required real-device acceptance is recorded.
4. If a validated build regresses, its points are removed until the regression is closed. If a new mandatory 1.0 task is discovered, points must be reallocated **before** implementation while preserving the 100.0 denominator; the percentage must never be adjusted merely to look smoother.
5. Reported completion = `earned product points / 100`, rounded to the nearest whole percent for normal status reports. The ledger retains tenths so progress remains auditable.

### Remaining point allocation

| Build(s) | 1.0 product work | Points |
|---|---|---:|
| **0.9.6.21** | Local anti-resurrection decision foundation | **1.0** |
| **0.9.6.22–0.9.6.23** | IndexedDB/Outbox purge wiring + authoritative projection convergence | **2.0** (1.0 each) |
| **0.9.6.24** | Mandatory bounded group-purge transaction write limit | **0.5** |
| **0.9.6.25** | Restart/reconnect stale-client anti-resurrection proof | **0.5** |
| **0.9.6.26** | Multi-device expiry convergence | **1.0** |
| **0.9.6.27–0.9.6.28** | Disappearing-text UI + end-to-end security closeout | **2.0** (1.0 each) |
| **0.9.6.29–0.9.6.30** | Group earlier-history UI + receipt/lifecycle stabilization | **2.0** (1.0 each) |
| **0.9.7.0–0.9.7.9** | Complete encrypted attachment/rich-messaging phase including disappearing attachment purge | **10.0** (1.0 each) |
| **0.9.8.0–0.9.8.5** | Invitation/join/account association + safe install rebuild | **6.0** (1.0 each) |
| **0.9.9.0–0.9.9.3** | Remaining UI completion, prototype cleanup, responsive/lifecycle hardening | **3.0** (0.75 each) |
| **0.9.9.4–0.9.9.5** | Complete repository candidate gate + final docs/package reconciliation | **1.5** (0.75 each) |
| **0.9.9.6** | Atomic coherent candidate deployment to `htest` | **0.5** |
| **0.9.9.7** | Real-device acceptance pass | **2.0** |
| **0.9.9.8** | Reserved RC stabilization; if no defects require code, points earn when acceptance confirms no stabilization is needed | **0.5** |
| **0.9.9.9** | 1.0 promotion readiness/go-no-go | **0.5** |
| **1.0.0** | Controlled final production/Firebase handoff and synchronized release promotion | **1.0** |
| | **Remaining allocation after 0.9.6.20** | **34.0** |

### Current calculation

- Audited validated foundation through 0.9.6.20: **66.0 / 66.0 earned**.
- 0.9.6.21 is repository-validated: **+1.0 earned**.
- 0.9.6.22 is repository-validated: **+1.0 earned**.
- 0.9.6.23 is repository-validated: **+1.0 earned**.
- 0.9.6.24 is repository-validated: **+0.5 earned**.
- 0.9.6.25 is repository-validated after the user-approved fail-closed replay resolution: **+0.5 earned**.
- 0.9.6.26 multi-device expiry convergence is repository-validated: **+1.0 earned**.
- 0.9.6.27 disappearing-text settings/UI wiring is repository-validated: **+1.0 earned**.
- 0.9.6.28 disappearing-text security closeout is repository-validated: **+1.0 earned**.
- 0.9.6.29 Group earlier-history admin UI is repository-validated: **+1.0 earned**.
- 0.9.6.30 receipt/lifecycle stabilization is repository-validated: **+1.0 earned**.
- 0.9.7.0 attachment transport/data authority is repository-validated: **+1.0 earned**.
- 0.9.7.1 photo encrypted send is repository-validated: **+1.0 earned**.
- 0.9.7.2 file encrypted send is repository-validated: **+1.0 earned**.
- 0.9.7.3 audio encrypted send is repository-validated: **+1.0 earned**.
- 0.9.7.4 video encrypted send is repository-validated: **+1.0 earned**.
- 0.9.7.5 attachment receive/decrypt/display/play is repository-validated: **+1.0 earned**.
- 0.9.7.6 attachment offline retention/account isolation is repository-validated: **+1.0 earned**.
- 0.9.7.7 attachment receipt/lifecycle authority is repository-validated: **+1.0 earned**.
- 0.9.7.8 disappearing attachment trace-free purge is repository-validated: **+1.0 earned**.
- 0.9.7.9 attachment phase security closeout is repository-validated: **+1.0 earned**.
- 0.9.8.0 invitation deterministic-owner rebuild is repository-validated: **+1.0 earned**.
- 0.9.8.1 invitation create/send/use/join is repository-validated: **+1.0 earned**.
- 0.9.8.2 invitation account/conversation association is repository-validated: **+1.0 earned**.
- 0.9.8.3 safe install-to-Home-Screen owner is repository-validated: **+1.0 earned**.
- 0.9.8.4 invite/install coexistence regression gate is repository-validated: **+1.0 earned**.
- 0.9.8.5 account/invitation/install phase closeout is repository-validated: **+1.0 earned**.
- 0.9.9.0 Group Info completion is repository-validated: **+1.0 earned**.
- 0.9.9.1 Direct Chat Info completion is repository-validated: **+0.5 earned**.
- 0.9.9.2 prototype/simulation cleanup is repository-validated: **+0.5 earned**.
- 0.9.9.3 responsive/lifecycle regression hardening is repository-validated: **+1.0 earned**.
- 0.9.9.4 complete 1.0 repository candidate gate is repository-validated: **+1.0 earned**.
- 0.9.9.5 final docs/setup/package reconciliation is repository-validated: **+0.5 earned**.
- 0.9.9.6 atomic deployment to `htest` is validated: **+0.5 earned**.
- 0.9.9.7 and later allocated builds: **0.0 earned so far**.
- **Current total: 96.0 / 100.0, reported as 96%.**

This 96.0-point ledger is authoritative until another allocated build earns points or a validated item regresses.


## FIDUNIO 1.0 allocated build roadmap

This section pre-allocates the planned build number for every remaining first-release component so the checklist always shows **what is being built now, what comes next, and which build number owns it**. These are target allocations, not permission to skip a security boundary. If an unexpected security/regression repair requires an inserted build, record the change here before implementation; never silently reuse a completed build number. `version.js` changes only when a build is actually materialized, not merely because a number is reserved below.

### Build allocation status vocabulary

- `CURRENT` — next authorized implementation slice.
- `PLANNED` — allocated but not started.
- `IN PROGRESS` — materialized work exists but release exit criteria are not yet satisfied.
- `REPOSITORY-VALIDATED` — build implementation and required repository gate are green, but later product/device gates still depend on it.
- `BLOCKED — USER DEVICE PROOF` — repository work is complete and the remaining acceptance step requires real-device testing.
- `FINAL` — 1.0 promotion only after every required predecessor is green.

### 0.9.6.x — disappearing content and anti-resurrection completion

| Allocated build | Component / detailed task | Exit criteria | State |
|---|---|---|---|
| **0.9.6.21** | Local anti-resurrection decision foundation. Pure planner distinguishes server-backed authoritative absence from cache-only/offline absence; identifies local history/Outbox IDs without tombstones. | Planner tests + full baseline security gate green. | REPOSITORY-VALIDATED |
| **0.9.6.22** | **UID-scoped IndexedDB + encrypted Outbox physical purge wiring.** Preserve `disappearAfterSeconds` and prior-server-observation metadata in local records; route all local purge mutations through the existing serialized local-storage/application owner; delete matching history rows and Outbox rows before any retry; no second IndexedDB owner. | Focused local-storage test is wired for exact removal/unrelated retention/no tombstone/UID guard; full gate `34058248816` SUCCESS. Authoritative pre-retry invocation is owned by 0.9.6.23/0.9.6.24. | REPOSITORY-VALIDATED |
| **0.9.6.23** | **Authoritative direct/group projection convergence.** Direct and group server-backed snapshots mark observed remote messages as server-backed; server-backed absence invokes the 0.9.6.21 planner and 0.9.6.22 physical purge owner; cache-only snapshots merge but never purge; group granted-history authority refreshes from server so stale cached copies cannot become authoritative resurrection material. | Pure projection tests cover server-present, authoritative-absent, cache-only-empty and pending-local cases; group owner gate covers metadata/duration propagation; full gate `34059145963` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.6.24** | **Bounded group-purge transaction write limit.** The server repository computes every receipt delete, source-linked history-copy delete, empty-grant delete, retained-grant update and final source delete before scheduling writes; a conservative maximum of 400 writes fails closed with `PURGE_TRACE_TOO_LARGE`. No chunked source-first deletion, tombstone, or client delete authority. | Exact 400-write boundary succeeds; 401 writes throws `PURGE_TRACE_TOO_LARGE` before any transaction write is scheduled; full gate `34059468538` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.6.25** | **Restart/reconnect stale-client anti-resurrection proof.** Local Outbox records are durably marked `sendAttempted:true` before direct/group cloud transmission. Authoritative absence of an attempted row fails closed and never auto-replays; sender may deliberately create a new message. No server tombstone/accepted-ID registry. | Focused replay barrier + full baseline `34060880885` SUCCESS; post-commit/pre-observation ambiguity closed conservatively. | REPOSITORY-VALIDATED |
| **0.9.6.26** | **Multi-device expiry convergence foundation.** Same-UID installations independently converge server-backed disappearing message state, encrypted history and Outbox traces after authoritative source absence. Cache-only/local absence remains non-authoritative. | Permanent multi-device simulation proves both devices independently purge source/history/Outbox and neither can replay; full gate `34061730677` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.6.27** | **Disappearing text settings/UI wiring.** Composer exposes Off / 5 minutes / 1 hour / 1 day / 7 days through one persisted preference. Each new direct/group message snapshots the selected immutable outer `disappearAfterSeconds`; later preference changes cannot alter sent rows. | Pure compose-policy + app source wiring gate proves direct/group propagation and immutable prior-message metadata; full gate `34061730677` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.6.28** | **Disappearing text end-to-end security closeout.** Reconcile direct/group text purge, receipts, history grants, local cache, Outbox, stale clients and multi-device behavior as one release checkpoint. | Permanent closeout matrix plus full baseline `34062508968` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.6.29** | **Group earlier-history admin UI.** Enable Group Info date/beginning grant controls only against already-validated server-backed history source selection and grant runtime; preserve admin-only intent and from-join default. | Permanent UI wiring gate + group history runtime/rules/projection gates + full baseline `34062508968` SUCCESS; no cache-only grant source. | REPOSITORY-VALIDATED |
| **0.9.6.30** | **Receipt/lifecycle stabilization before attachment phase.** Remove duplicate direct Read mutation ownership, preserve deterministic foreground/pageshow subscription recovery, and gate direct/group receipt projection before attachments. | Permanent receipt/lifecycle gate + full baseline `34062508968` SUCCESS; repository stabilization complete and real-device proof remains in 0.9.9.7. | REPOSITORY-VALIDATED |

### 0.9.7.x — attachments / rich messaging required for 1.0

| Allocated build | Component / detailed task | Exit criteria | State |
|---|---|---|---|
| **0.9.7.0** | **Attachment transport/data authority.** One serialized attachment send owner; ciphertext-only Storage namespace; E2EE key boundary; bounded size/type policy. | Attachment crypto + send-owner + full baseline `34063327957` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.7.1** | **Photo select/capture + encrypted send.** Browser image picker/capture uses the common encrypted attachment owner. | Common send-owner/UI wiring + full baseline `34063327957` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.7.2** | **File select + encrypted send.** Generic file picker uses bounded common encrypted transport. | Common send-owner/UI wiring + full baseline `34063327957` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.7.3** | **Audio record/select + encrypted send.** Browser audio capture/select intent uses common encrypted transport. | Common send-owner/UI wiring + full baseline `34063327957` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.7.4** | **Video select/capture + encrypted send.** Bounded video capture/select uses common chunk/integrity owner. | Common send-owner/UI wiring + full baseline `34063327957` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.7.5** | **Attachment receive/decrypt/display/play.** Integrity-check every chunk before exposing decrypted object; lifecycle owns object-URL creation/revocation. | Direct/group photo/file/audio/video receive tests; corrupt/missing chunks fail closed. | REPOSITORY-VALIDATED |
| **0.9.7.6** | **Attachment offline retention + Outbox/history integration.** Pending encrypted attachment work is authoritative only in Outbox; downloaded attachment cache remains rebuildable and UID-scoped. | Offline restart/reconnect tests green; account-switch isolation proven. | REPOSITORY-VALIDATED |
| **0.9.7.7** | **Attachment receipts/lifecycle.** Message-level status remains authoritative; attachment transport cannot manufacture independent Sent/Delivered/Read semantics. | Direct/group receipt tests green with attachments. | REPOSITORY-VALIDATED |
| **0.9.7.8** | **Disappearing attachment trace-free purge.** Extend server/local purge owner to attachment manifest, encrypted chunks/blobs, thumbnails/previews, object URLs/cache, Outbox and references. | Expired attachment leaves no FIDUNIO-controlled trace; stale/offline client cannot restore it. | REPOSITORY-VALIDATED |
| **0.9.7.9** | **Attachment phase security closeout.** Run complete attachment + disappearing + offline + account-isolation matrix. | Full baseline security gate and attachment-specific matrix green. | REPOSITORY-VALIDATED |

### 0.9.8.x — invitations, joining and safe PWA install

| Allocated build | Component / detailed task | Exit criteria | State |
|---|---|---|---|
| **0.9.8.0** | **Invitation deterministic-owner rebuild.** `invitation-owner.js` is sole serialized invitation mutation coordinator; rejected 0.9.4.12-.15 logic not reused. | Full baseline `34065528714` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.8.1** | **Invitation create/send/use/join end-to-end.** Atomic accepted-invite + active-profile enrollment. | Policy + emulator matrix + full baseline `34065528714` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.8.2** | **Invitation account/conversation association.** Joined active profile enters UID/account-authoritative direct/group discovery; no device binding. | Closeout association gate + full baseline `34065528714` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.8.3** | **Safe install-to-Home-Screen owner.** Independent Settings guidance; no auto prompt or invitation/account mutation. | Browser guidance + full baseline `34065528714` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.8.4** | **Invite + install coexistence regression gate.** Install owner state-independent; automatic install absent; protected Settings/two-pane/iPhone assets intact. | Coexistence gate + full baseline `34065528714` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.8.5** | **Account/invitation/install phase closeout.** Invitation-only enrollment, account lifecycle/recovery and independent install guidance reconciled. | Full baseline `34065528714` SUCCESS; rejected implementation absent. | REPOSITORY-VALIDATED |

### 0.9.9.x — UI completion, regression hardening and release candidate

| Allocated build | Component / detailed task | Exit criteria | State |
|---|---|---|---|
| **0.9.9.0** | **Group Info completion.** Earlier-history controls retained; unsupported placeholders removed; landscape tablet workspace completed without changing the established pane owner. | Candidate UI/lifecycle gate + full baseline `34066875377` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.9.1** | **Direct Chat Info completion.** Real cloud direct-chat security info retained; unsupported local-only placeholder action removed. | Candidate UI/lifecycle gate + full baseline `34066875377` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.9.2** | **Prototype/simulation cleanup.** Test banner, simulated local Sent/Delivered/Read timers, and unsupported tool placeholders removed; legacy local-only transport fails closed. | Candidate UI/lifecycle gate + full baseline `34066875377` SUCCESS. | REPOSITORY-VALIDATED |
| **0.9.9.3** | **Responsive/lifecycle regression hardening.** Group Info joins the established responsive route owner; protected phone/tablet structures and deliberate receipt recovery remain intact. | Candidate UI/lifecycle, runtime-authority and receipt gates + full baseline `34066875377` SUCCESS. Real-device acceptance remains 0.9.9.7. | REPOSITORY-VALIDATED |
| **0.9.9.4** | **Complete 1.0 repository candidate gate.** All required repository rules/E2EE/recovery/group/disappearing/attachment/invitation/offline/runtime/UI gates run together. | Full Rebuild Baseline Security Gate `34066875377` SUCCESS. FCM 1.1 and App Check enforcement 1.2 excluded. | REPOSITORY-VALIDATED |
| **0.9.9.5** | **Final documentation/setup/package reconciliation.** Cumulative recovery docs reconciled to candidate; one-shot implementation helpers removed; protected configs remain excluded from release authority. | Docs/source reconcile against full gate `34066875377` SUCCESS; coherent candidate checkpoint ready for `htest`. | REPOSITORY-VALIDATED |
| **0.9.9.6** | **Atomic deployment to `htest`.** Coherent candidate commit `31dac2c0b551429a5a4ba7cf7c967e6316e9a9e6` was gated and deployed atomically as the `htest` branch. | Full gate `34067021824` SUCCESS; `htest` points exactly to `31dac2c0b551429a5a4ba7cf7c967e6316e9a9e6` with runtime 0.9.9.6. | REPOSITORY-VALIDATED |
| **0.9.9.7** | **FAILED / BLOCKED — User-device acceptance pass.** iPhone startup/list passed, but iPad landscape exposed FDA-IPAD-001 through FDA-IPAD-003: missing conversation widgets, regressed text size and pane overlap. Remaining two-account/offline/disappearing/attachment/invitation/install/recovery proof is paused. | All defects in `DEVICE-ACCEPTANCE-BUGS.md` repaired, gated, redeployed and accepted by the user; remaining device matrix completed. | FAILED — RC DEFECTS |
| **0.9.9.8** | **IN PROGRESS — RC stabilization.** Storage deployment wiring is repository-validated; now repair only the acceptance defects FDA-IPAD-001 through FDA-IPAD-003 before resuming the device matrix. | Storage wiring remains green; all device defects are closed without ownership regressions; full baseline green; corrected candidate redeployed; affected iPad tests and remaining acceptance matrix pass. | IN PROGRESS |
| **0.9.9.9** | **1.0 promotion readiness.** Freeze feature scope, verify no required 1.0 checklist item remains NOT DONE/IN PROGRESS/BLOCKED, and prepare controlled production/Firebase handoff without enabling 1.1/1.2 work. | Explicit go/no-go record for 1.0.0. | PLANNED |

### 1.0.0 — first complete FIDUNIO release

| Allocated build | Component / detailed task | Exit criteria | State |
|---|---|---|---|
| **1.0.0** | **First complete FIDUNIO release.** Promote the validated 0.9.9.9 candidate only after controlled Firebase/hosting handoff and final verification. | All 1.0 checklist acceptance criteria DONE; production artifacts/version/docs synchronized. FCM remains scheduled for 1.1; App Check enforcement remains scheduled for 1.2. | FINAL |

### Allocation rule for future build sessions

Every substantive 1.0 build report must name the allocated build number from this roadmap and list: **(1)** the exact detailed task being executed, **(2)** what was completed, **(3)** what remains inside that same build, **(4)** validation evidence, and **(5)** overall first-rebuild completion percentage. A planned build number is a reservation only; it becomes the runtime version only when implementation for that slice is actually materialized.


## Build Log

- 2026-09-06 — Created this authoritative checklist at user request so every build session has an explicit done/not-done ledger.
- 2026-09-06 — Local-security Settings callers now await serialized timeout/device-unlock mutations; commit `013508078f1cda925a54c99cf7e7ffb3c986f8e7`; Local PIN/security serialized mutations marked DONE.
- 2026-09-06 — Group account-authoritative send/read/receipts/Outbox integration is present in the rebuild; group administration remains the next major messaging milestone.
- 2026-09-06 — Restored disappearing messages and attachments to the complete-product acceptance criteria, including direct/group, attachments, offline/reconnect, multi-device convergence, UI, and security/rules testing.
- 2026-09-06 — Disappearing-content requirement tightened: all application-controlled traces must be physically purged at expiry, including Firestore message records and attachments; no per-message tombstone/expired record is permitted.
- 2026-09-06 — FCM notification architecture retained in roadmap but explicitly deferred to FIDUNIO 1.1; it does not block the first complete rebuild release.
- 2026-09-06 — App Check production activation/enforcement explicitly deferred to FIDUNIO 1.2; client ownership/config may remain present with enforcement OFF and does not block the first complete rebuild release.
- 2026-09-06 — Reconciled hermes-setup.txt from obsolete 0.8.1.9 instructions to the current complete-rebuild architecture and recovery procedure.
- 2026-09-06 — Real group administration materialized: cloud-backed rename/add/remove/non-owner leave; membership changes atomically rotate E2EE epoch and exclude departed members. Firestore/runtime tests extended. Explicit earlier-history/admin-role controls remain IN PROGRESS.
- 2026-09-06 — Group administration validation checkpoint: materializer group runtime/app/rules/authority tests passed, then full Rebuild Baseline Security Gate run `34045259037` passed on the cleaned authoritative branch. Temporary group-administration materializer/trigger workflows were removed.
- 2026-09-06 — Earlier-history grant foundation: user approved an admin-selected starting point/date including Beginning of conversation. `e2ee-account-group-history-crypto.js` now provides message-granular account-to-account grant encryption so a date boundary never requires disclosure of an entire historical epoch. Dedicated crypto tests are part of the security gate. Overall first-rebuild estimate remains approximately 65% until Firestore/runtime/UI/purge integration completes.
- 2026-09-06 — Repository-first audit after history-grant foundation found a bounded group-administration bridge defect: `e2ee-account-group-app-integration.js` exported rename/add/remove/leave wrappers without importing their controller delegates. Commit `8b72f00744cc4b882c7fb1df0ce48d3959f563ec` repaired the imports; the integration gate now explicitly checks all four delegates. Version checkpoint advanced to 0.9.6.6. Overall first-rebuild estimate remains approximately 65%.
- 2026-09-06 — README modernized from the stale 0.8.1.9-era prototype narrative into the current cumulative build/rebuild ledger, including protected checkpoints, rejected 0.9.4.12-.15 rollback history, recovery/App Check ownership reversals, current 0.9.6.6 rebuild state, validation runs, and the mandatory future rule that every version increment/reset/rollback updates README in the same work session.
- 2026-09-06 — 0.9.6.7 group earlier-history persistence foundation materialized: exact grant/copy Firestore schema and rules, building->active target-visibility boundary, current-admin/current-member/keyId authorization, message/timestamp boundary binding, central Firebase chunked persistence/read APIs, serialized runtime create/decrypt path, and expanded emulator/runtime tests. Group Info history control remains IN PROGRESS pending UI/projection and disappearing-content purge/anti-resurrection integration. Live Firebase was not touched. Overall estimate remains approximately 65%.
- 2026-09-06 — 0.9.6.7 cleaned-branch validation GREEN: after correcting a test-only chronology fixture caught during review and removing all temporary group-history materializer/repair files, Rebuild Baseline Security Gate run `34047570212` passed every substantive step. Group-history persistence/runtime foundation is repository-validated, but the feature remains IN PROGRESS pending Group Info date selection, granted-history projection, disappearing-content physical purge/anti-resurrection, and real-app/device validation. Live Firebase and htest remain untouched. Overall estimate remains approximately 65%.
- 2026-09-06 — 0.9.6.8 granted-history conversation projection: active grant copies now merge deterministically into the normal group conversation through the existing read-side owner. Ordinary decryptable rows win; grants replace only undecryptable matching source rows; duplicates collapse; undecryptable old ciphertext no longer receives normal receipts. Security Gate run `34048452887` passed. Group history remains IN PROGRESS pending real Group Info selection/grant UI, disappearing-content purge/anti-resurrection, and device proof. Live Firebase/htest untouched; estimate remains approximately 65%.
- 2026-09-06 — 0.9.6.9 group-history source authority GREEN: production grant creation no longer accepts app/local source rows. The serialized runtime obtains a server-backed retained-message snapshot through the central Firebase owner, applies the approved boundary there, owns secure grant-ID generation, and exposes only target/boundary intent through the controller/integration bridge. Gate run `34048905157` passed. User-facing grant control remains IN PROGRESS pending physical purge/anti-resurrection and device validation. Live Firebase/htest untouched; estimate remains approximately 65%.
- 2026-09-06 — Disappearing-content timer semantics approved: for direct and group messages, each recipient/account starts its fixed disappearance interval at that recipient's first authoritative Read event. Group timers are therefore per recipient, not started globally by the first group reader. The shared source cannot be physically removed until every still-authorized recipient whose read window exists has reached expiry; each recipient must lose local/projected access at its own expiry. Sender/device clocks are not authority. Implementation/rules/purge/anti-resurrection remain IN PROGRESS; overall rebuild estimate remains approximately 65%.
- 2026-09-06 — 0.9.6.10 immutable first-Read authority: direct and group Read transitions now establish server-backed readAt exactly once through serialized firebase.js transactions and Firestore Rules; repeat Read cannot move the clock. Pure disappearing policy + emulator/source gates are in the normal security baseline. Rebuild Baseline Security Gate run 34050343201 passed on the README checkpoint. Physical purge/anti-resurrection remains IN PROGRESS. Live Firebase and htest untouched; overall estimate remains approximately 65%.
- 2026-09-06 — 0.9.6.11 user-selected disappearing duration: user controls duration; pure policy normalizes off or an exact immutable per-message `disappearAfterSeconds` value (1..31536000 seconds). Presets/defaults may be UI convenience only and cannot retroactively alter sent-message expiry. No live Firebase or htest change; overall estimate remains approximately 65%.
- 2026-09-06 — 0.9.6.12 disappearing metadata persistence: optional bounded `disappearAfterSeconds` is outer immutable metadata for v3 direct/v4 group messages, preserved through encrypted Outbox retry and central Firebase transport; rules/emulator/source gates extended. Physical purge remains IN PROGRESS; no live Firebase or htest change; overall estimate remains approximately 65%.
- 2026-09-06 — 0.9.6.13 purge-decision foundation: pure direct/group eligibility owner added and gated; clean 0.9.6.12 gate `34052064381` green. No deletion path or delete rules enabled; live Firebase/htest untouched; overall estimate remains approximately 65%.

- 2026-09-06 — 0.9.6.14 serialized purge-executor foundation: one coordination owner now serializes direct/group purge attempts and reaches mutation only through an injected revalidating repository boundary. Server time and opaque basis are mandatory; stale commits fail closed. Physical delete repository/scheduler/local convergence remain NOT DONE; live Firebase/htest untouched; overall estimate remains approximately 65%.

- 2026-09-06 — 0.9.6.15 server Firestore purge repository foundation: direct cloud-source delete transaction now has update-time basis revalidation and idempotent absence; group read authority is materialized but group deletion remains fail-closed pending subordinate grant/receipt trace cleanup. Gate `34053462019` green. No live deployment; overall estimate remains approximately 65%.

- 2026-09-06 — 0.9.6.16 group history-grant purge trace planning: pure reconciliation now defines exact subordinate grant-copy/grant-metadata handling and the server group purge read basis includes grant/copy Firestore versions. Inconsistent/building trace sets fail closed. Gate `34054137154` green. Physical group commit/local convergence remain unfinished; live Firebase/htest untouched; overall estimate remains approximately 65%.

- 2026-09-06 — 0.9.6.17 history-grant purge barrier: new building-grant creation must atomically touch group `updatedAt`; Firestore Rules deny standalone grant creation, making concurrent new grants visible to the existing group purge basis. Gate `34054522196` green. Physical group delete/local convergence remain unfinished; no live Firebase/htest change; overall estimate remains approximately 65%.

- 2026-09-06 — 0.9.6.18 history-copy purge barrier: genuinely new group history-copy chunks must atomically touch parent-group `updatedAt`; Rules deny standalone copy creation. Together with 0.9.6.17 grant creation barrier, all new grant/copy subordinate writes are basis-visible. Gate `34054991773` green. Physical group trace commit/local convergence remain unfinished; no live Firebase/htest change; overall estimate remains approximately 65%.

- 2026-09-06 — 0.9.6.19 group receipt purge barrier: new group messages start `receiptRevision:0`; each real own-receipt Delivered/Read mutation atomically advances the parent revision by one and Rules require the coupled request. Concurrent receipts are therefore source-basis-visible. Gate `34055638377` green. Physical group trace commit and local/offline convergence remain unfinished; no live Firebase/htest change; overall estimate remains approximately 65%.

- 2026-09-06 — 0.9.6.20 atomic group physical trace commit: server repository now revalidates the complete group source/epoch/receipt/grant/copy basis and atomically deletes/reconciles every Firestore trace before deleting the source. Client delete authority remains closed. Local/offline anti-resurrection, attachments and final UI/device validation remain unfinished; no live Firebase/htest change; overall estimate remains approximately 65%.

- 2026-09-06 — 0.9.6.21 local anti-resurrection decision foundation: pure convergence planner now distinguishes authoritative server absence from cache-only/offline absence and identifies local history/Outbox IDs eligible for physical removal without tombstones. IndexedDB wiring, restart/reconnect suppression, group projection metadata, attachments/object URLs/notifications and device validation remain unfinished. No live Firebase/htest change; overall estimate remains approximately 65%.

### 0.9.6.22 materialization note
The existing `app.js` local persistence owner now contains the serialized UID-guarded physical purge mutation for message state, encrypted history and matching encrypted Outbox rows. `disappearing-local-storage-plan.js` is pure planning only and does not open IndexedDB. Full Rebuild Baseline Security Gate `34058248816` is green, so this allocated build earns **+1.0 point**; weighted completion is now **68.0/100.0**. Next allocated build after validation is 0.9.6.23 authoritative direct/group projection convergence.

### 0.9.6.25 restart/reconnect anti-resurrection status
Build 0.9.6.25 is **IN PROGRESS**, not repository-validated for product-point purposes. The implemented reconnect barrier has a green full baseline gate (`34060082292`) and blocks blind cloud/group Outbox replay until explicit server reads complete. It safely handles server-present accepted rows, prior-server-backed disappearing rows that are now authoritatively absent, legitimate never-server-backed queued work, and unexpected ordinary server-backed absence. The remaining exact crash window is: Firestore accepts a send, the browser/device crashes before either Outbox deletion or durable `serverBacked:true` observation, the message later disappears from the server, and the sender restarts with a stale Outbox row plus `serverBacked:false`. Current trace-free/no-tombstone rules provide no durable fact that distinguishes that state from truly never-sent work. No 0.9.6.25 point is earned until this conflict is resolved. Weighted completion therefore remains **69.5/100, reported as 70%**.

## 0.9.7.0–0.9.7.4 attachment send checkpoint — repository validated

Builds 0.9.7.0 through 0.9.7.4 establish one attachment send owner and wire photo, file, audio and video selection/capture through bounded local AES-256-GCM chunk encryption, encrypted Outbox staging, ciphertext-only Firebase Storage upload through `firebase.js`, and the existing direct/group E2EE message commit path. Attachment keys travel only inside E2EE message ciphertext. Size limits are photo 12 MiB, file 20 MiB, audio 25 MiB, video 50 MiB. Storage client delete is denied; disappearing attachment deletion remains reserved for the purge owner in 0.9.7.8. Full Rebuild Baseline Security Gate `34063327957` SUCCESS. No live Firebase or htest deployment occurred. Runtime version is 0.9.7.4. Next build is 0.9.7.5 receive/decrypt/display/play.

## 0.9.7.5–0.9.7.9 attachment phase closeout — repository validated

Runtime 0.9.7.9 completes the allocated attachment phase: integrity-checked receive/decrypt with explicit object-URL lifecycle; UID-scoped offline/cache recovery policy; message-level receipt authority; trace-free disappearing-attachment purge planning and serialized storage/local-before-source execution; and the permanent attachment closeout matrix. Firebase Storage download remains solely in `firebase.js`. Client Storage deletion remains denied; server purge dependencies are injected into the dedicated purge executor and no live Firebase deployment occurred. Full Rebuild Baseline Security Gate `34064314857` SUCCESS. Next allocated build is 0.9.8.0 invitation deterministic-owner rebuild; rejected 0.9.4.12-.15 invite/install logic remains forbidden.

## 0.9.8.0–0.9.8.5 invitation/install checkpoint — repository validated

Runtime 0.9.8.5 completes the invitation/join/install phase. `invitation-owner.js` is the sole serialized invitation mutation coordinator while `firebase.js` remains the sole Firebase repository/SDK owner. Pure `invitation-policy.js` enforces single-use lifecycle, issuer roles and target roles. Auth and Settings request invitation work through that owner. Firestore emulator coverage proves anonymous validation of a known token, unauthorized issuance/revocation denial, owner issuance/revocation, atomic accepted-invitation + active-profile enrollment, and second-redemption denial. Joined active profiles flow into existing direct/group discovery without device binding.

`install-guidance.js` owns only an optional predefined Settings Install panel. It never mutates invitation, account, messaging or service-worker state and never uses automatic install prompting. iOS uses Safari Share -> Add to Home Screen; Android/Fire and desktop use browser-provided install/add/shortcut commands when available. The rejected 0.9.4.12–0.9.4.15 invite/install logic was not restored or adapted. Protected iPhone Back/wrap, Settings deterministic ownership and two-pane architecture remain gated. Full Rebuild Baseline Security Gate `34065528714` SUCCESS. No live Firebase or htest deployment occurred. Next allocated build: 0.9.9.0 Group Info completion.


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

User-device evidence confirms the selector is readable and no longer white, but its size, shape, spacing and alignment do not match the quick-reply widgets. FDA-IPAD-006 remains OPEN — DEFERRED by explicit user direction and must be included with the next necessary 0.9.9.8 acceptance repair rather than consuming another isolated cosmetic pass. No product point is earned; total completion remains 96.0/100.0 (96%).

## 0.9.9.8 direct-send acceptance blocker — 2026-09-07

Real iPad-to-iPhone direct-message acceptance failed at the first send: `IPAD TEST 1` remained at Sending for more than one minute. FDA-DM-001 records the diagnosed unbounded pre-send authoritative reconciliation wait. Required exit remains permanent bounded/fail-closed Outbox regression coverage, full baseline green, corrected `main` deployment, and successful automatic Sent → Delivered → Read device proof. No point is earned; total remains 96.0/100.0 (96%).

### 0.9.9.8 FDA-DM-001 repair candidate — 2026-09-07

A 12-second authoritative-reconciliation boundary is added inside the established serialized `app.js` Outbox/reconnect path. Timeout policy requeues only unattempted Outbox-backed Sending rows, preserves encrypted Outbox authority, exposes a clear Firebase timeout, and cannot mint receipt state. Permanent baseline coverage and targeted local gates pass. The build remains IN PROGRESS until the full baseline is green, corrected `main` is deployed, and the iPad-to-iPhone Sent → Delivered → Read test passes. Total remains 96.0/100.0 (96%).

### 0.9.9.8 FDA-DM-001 expanded candidate — 2026-09-07

The reconciliation-only candidate failed real-device retest and earns no credit. Expanded repair serializes the complete direct Outbox cycle, bounds reconciliation/peer/key-envelope/send-confirmation stages, keeps pre-attempt timeouts Queued, keeps ambiguous attempted work Failed, blocks attempted-row requeue, and forces deterministic same-version service-worker cache replacement. Targeted permanent gates pass locally. Full baseline plus corrected `main` deployment and successful Sent → Delivered → Read device proof remain required. Total remains 96.0/100.0 (96%).

Expanded candidate `90460aea19c0d5204c91b2542d59905b1edff246` passed full baseline `34085040014` and was promoted to `main` as `321d182cbd08cb690fa4df7caf96221ef69d09b4`; Pages `34085354728` succeeded. Repository/deployment criteria for this repair candidate are satisfied, but FDA-DM-001 and 0.9.9.8 remain IN PROGRESS until fresh device proof confirms bounded status plus real Firebase Sent → Delivered → Read. No point is earned; total remains 96.0/100.0 (96%).

Second-launch device evidence confirms both preserved rows become Queued, satisfying only the bounded-state/Outbox-preservation portion of FDA-DM-001. Authenticated Firebase send/receipt proof still fails to begin and remains the critical next diagnosis. FDA-IOS-001 is a separate minor deferred blank-startup/loading-feedback issue to bundle with later minor repairs. No point is earned; total remains 96.0/100.0 (96%).

### 0.9.9.8 FDA-DM-001 authenticated-session/verification-path candidate — 2026-09-07

Diagnosis found a competing trigger: the Verify handler called lower-level `flushQueued()` instead of the sole serialized authoritative reconcile/Outbox owner. The repair removes that bypass, routes verification retries through `flushQueuedAfterAuthoritativeReconcile()`, and force-refreshes the Firebase Auth token through sole `firebase.js` SDK owner before reconciliation. Stage-specific 12-second failures preserve Queued before attempt and Failed after an ambiguous attempt. The user pressed Verify without comparing fingerprints; this is saved trust only and no keys are reset. Full baseline, `main` deployment and real Sent → Delivered → Read proof remain required. No point is earned; total remains 96.0/100.0 (96%).

Repository/deployment criteria are satisfied by authoritative candidate `6e6d5e84beb7e12173a5708835842512d44a92d4`, full baseline `34087534090` SUCCESS, `main` promotion `529a56d1f8e45d463a47d8c6150f95b4937ee87b`, Firebase adapter `34087731108` SUCCESS, Pages `34087730948` SUCCESS and live anchor/config verification. Device Sent → Delivered → Read remains unearned. Total remains 96.0/100.0 (96%).

### 0.9.9.8 retry-backlog/startup/PIN fail-closed candidate — 2026-09-07

The previous device retest failed: second launch blanked for more than two minutes, iPhone PIN appeared unset, and a new message returned Sending → Queued after restart. Corrective scope is allocated within 0.9.9.8: coalesce duplicate recovery triggers, avoid forced token refresh when Firebase already has a valid token, retain stage errors visibly, render an immediate accessible startup spinner, and fail closed when PIN storage cannot be read. Permanent Outbox and startup/PIN tests pass locally. Full baseline, `main` deployment and device acceptance remain required. No point is earned; total remains 96.0/100.0 (96%).

Repository/deployment criteria are satisfied by authoritative `429855f037c3f9f0fb2a0f31ff1371a21f273922`, full baseline `34125430406` SUCCESS, `main` `2dcbd8a558ed8bf355ebec1c6bbc82e59948b29f`, and Pages `34125666157` SUCCESS. Live anchors and protected config match. Device startup/PIN/send/receipt proof remains unearned; total stays 96.0/100.0 (96%).

User-device evidence now satisfies the FDA-IOS-001 startup-feedback and FDA-IOS-002 PIN-preservation portions: spinner appears until the PIN screen and the original PIN unlocks. Direct-message acceptance remains blocked because the iPad reports its Account E2EE identity is not unlocked. Queued preservation passes; Sent → Delivered → Read remains unearned. Do not reset identities or accept a changed fingerprint without comparison. Total remains 96.0/100.0 (96%).

### 0.9.9.8 FDA-DM-001 outgoing-decrypt candidate — 2026-09-07

- [x] Both real-device Account Encryption screens show READY.
- [x] Preserved rows reached Sent, proving Firebase write acceptance.
- [x] Diagnose incoming-only decrypt direction for sender-owned rows.
- [x] Add one direction-aware service path and permanent two-direction tests.
- [x] Correct compatibility-key warning without accepting un-compared trust.
- [ ] Complete normal baseline on exact candidate.
- [ ] Promote exact green candidate and verify Pages.
- [ ] User proves readable Sent → Delivered → Read.

0.9.9.8 remains IN PROGRESS and earns zero additional points. Total remains 96.0/100.0 (96%).

Full normal baseline requested on the exact outgoing-decrypt repair candidate; completion and device credit remain pending the result.

Baseline runs `34130208522` and `34130353052` failed only because the permanent Outbox cache assertion still expected prior revision `001d` while the candidate correctly advanced to `001e`. All preceding security steps, including account direct-message crypto/service, passed. The assertion is updated to the exact new revision; no security invariant is weakened. A complete rerun is required.

Corrected authoritative commit `fbfb296b2c29ce367fae7c38abc2b5147f14d509` passed the complete Rebuild Baseline Security Gate run `34130779064` SUCCESS, including Outbox, startup/PIN, account direct-message crypto/service, rules and all prior security gates. Repository validation is satisfied; exact-tree `main` promotion and device receipts remain pending. Completion remains 96.0/100.0 (96%).

Final documented authoritative commit `243e1698f5efad09e03587cce0c8689c81ff4659` passed complete baseline `34131152754`. Its exact tree was promoted to `main` as `a08d985a8308b9f9da9fabc3c127beefc452fe04`; Pages run `34131445802` completed SUCCESS. Protected `firebase-config.js` remained blob `b81026dcc07b7374d1f48d0cb094764ce28319bd`; `config-firestore.js` remains absent. User-device readable Sent → Delivered → Read is still required. Completion remains 96%.

### Branch-authority simplification — 2026-09-07

By explicit user decision, allocate branch/process maintenance within the current 0.9.9.8 stabilization session: all future code, documentation, gates and Pages tests occur directly on `main`. The rebuild branch is frozen as history. Remove the automatic documentation mirror and retarget the permanent full baseline push trigger to `main`. This process simplification earns no product point. Completion remains 96%.

### 0.9.9.8 readonly transport-row candidate — 2026-09-07

- [x] Record exact real-device readonly-property error.
- [x] Diagnose compose-policy freeze versus sole Outbox status owner.
- [x] Preserve one-time disappearing expiry stamping.
- [x] Add mutable status-transition regression assertion.
- [ ] Full baseline green on `main`.
- [ ] Pages green and repeated user-device receipt proof.

No point earned; completion remains 96%.

### 0.9.9.8 single visible FIDUNIO PIN candidate — 2026-09-07

- [x] One Account and one Security area replace separate Firebase/lock/encryption/device-key presentation.
- [x] New FIDUNIO PINs are exactly six digits; optional device unlock remains.
- [x] Local and account-E2EE derivations remain separately salted and owned.
- [x] Existing installation PIN mismatch fails closed; legacy verification remains for migration compatibility.
- [x] Permanent `test:user-access-key-ux` gate added to the full baseline.
- [x] Full baseline `34139245770` and Pages `34139244639` green for commit `5e22a9484029d02f9f6691b82329a55d4695c848`.
- [ ] Fresh-account and existing-installation device acceptance.

No point earned; completion remains 96%.

### 0.9.9.8 sender-owned accepted direct deletion and one-PIN UX

- [x] Server-only sender/member validation core implemented and tested.
- [x] Deterministic attachment prefix removal precedes physical message deletion.
- [x] Client routes Delete for Everyone only through `firebase.js` callable ownership.
- [x] Browser Firestore delete remains denied.
- [x] `MESSAGE-DELETION-AUTHORITY.md` and `USER-ACCESS-KEY-UX.md` created as critical documents.
- [ ] Dedicated message-delete service account provisioned with reviewed minimum permissions.
- [ ] Callable deployed and authenticated denial/success tested.
- [x] One-PIN fresh setup and ordinary unlock presentation implemented and repository-gated.
- [x] Technical key controls removed from ordinary-user Settings UI.
- [ ] Existing installations with different prior PINs deliberately migrated or clean-reset and device-tested.
- [ ] Clean iPhone/iPad account lifecycle accepted.

No point earned; completion remains 96%.

### 0.9.9.8 FDA-DM-002 pending-message deletion candidate

- [x] Press-and-hold actions limited to outgoing Queued/Sending/Failed rows.
- [x] Cancellation reserved with the one `app.js` Outbox coordinator.
- [x] Physical local message/history/Outbox removal uses the established purge owner.
- [x] No Firestore delete, tombstone, duplicate retry owner or fabricated receipt.
- [x] Permanent `test:pending-message-delete` added to the full baseline.
- [x] Full baseline `34136342719` and Pages `34136342110` green.
- [x] User confirmed the queued message was deleted; restart/reconnect non-retry remains part of final device matrix.

No point earned; completion remains 96%.

## FIDUNIO 1.1.6 notification routing checkpoint — 2026-09-09

- N4 real-device acceptance passed: a backgrounded iPhone received the generic `FIDUNIO — New message` notification after the live Eventarc/Cloud Run invocation permission was corrected.
- Live N4 trigger: `notifyDirectMessageCreatedV1`; Eventarc trigger region is `nam5`; the trigger service account has `roles/run.invoker` only on the N4 Cloud Run service.
- N5 candidate adds deterministic notification-tap routing. The service worker may focus/open FIDUNIO and pass only opaque direct-message routing intent. `app.js` remains the route/message owner and resolves the conversation through existing Firestore/E2EE state.
- Notification metadata never creates a message row, decrypts content, or writes receipts. Cold-open routing waits behind the normal local PIN/auth gates.
- Device acceptance still required for N5 warm-open and cold-open taps before N5 is closed.

## FIDUNIO 1.1.9 — optional sender display-name notifications — 2026-09-09

**Status: REPOSITORY CANDIDATE; live Firestore rules + N4 Function deployment and device acceptance required.** Private notifications remain the default. Each notification installation may explicitly opt in with `showSenderName: true`. The server resolves the sender only from authoritative `users/{senderUid}.displayName`, never from message `senderName`, and sends `FIDUNIO — New message from <display name>` only to opted-in installations. Non-opted installations remain `FIDUNIO — New message`. Message text, attachment names, email, UID, phone, ciphertext and decrypted content remain excluded. This changes no Firestore/E2EE/message/receipt authority.


### FIDUNIO 1.1.17 notification-owner repair

- [x] Replace common FCM notification-plus-data send with bounded data-only payload.
- [x] Keep server-side recipient derivation, installation fan-out and invalid-token pruning.
- [x] Preserve private default and installation-scoped sender-name opt-in.
- [x] Register the existing service worker as a module.
- [x] Initialize only a named Firebase Messaging worker app from unchanged firebase-config.js.
- [x] Use onBackgroundMessage as the sole background display owner.
- [x] Attach only opaque route data to the displayed notification.
- [x] Preserve existing notificationclick -> URL -> PIN -> app.js route/message authority.
- [x] Add permanent data-only, privacy, module-registration and click-routing gates.
- [ ] Full Rebuild Baseline Security Gate passes on exact candidate.
- [ ] Exact GitHub Pages deployment passes.
- [ ] Deploy reviewed notifyDirectMessageCreatedV1 backend candidate.

## FIDUNIO 1.1.28 N6 group notifications

- [x] Preserve FIDUNIO 1.1.24 as the device-accepted direct-notification checkpoint.
- [x] Derive group recipients server-side from current authoritative `memberUids`; exclude sender.
- [x] Fan out only to enabled installations; bound FCM multicast batches to 500 and reuse stale-token cleanup.
- [x] Keep payload data-only and limited to route type, opaque conversation/message IDs and bounded generic body.
- [x] Accept `group-message` through the existing worker, installation inbox and activation mutex.
- [x] Revalidate current group membership through the central Firebase owner after PIN.
- [x] Feed the exact notified row through the existing serialized group decrypt/projection owner before snapshot/cache/receipt maintenance.
- [x] Consume only after exact row and group composer are mounted; fail closed for missing/unauthorized targets and retain transient failures.
- [x] Add permanent backend privacy/fan-out and frontend single-owner N6 gates; retain direct N5 and activation/composer gates.
- [x] Push exact 1.1.28 candidate to `main`; verify all workflows and live Pages.
- [ ] Deploy and verify only `recovery:notifyGroupMessageCreatedV1` through the pinned Cloud Shell handoff.
- [ ] Device acceptance: iPhone/iPad, warm/background and terminated/cold, one group and multiple pending conversations, multiple installations, sender exclusion, removed member, deleted message, direct-notification regression, group compose/receipt/scroll regression.

## FIDUNIO 1.1.29 N6 group retrieval correction

- [x] Record the iPad result: exact group/message displayed, but 2 of 4 trials showed `Missing or insufficient permissions`.
- [x] Preserve the live 1.1.28 backend Function; do not redeploy rules or backend notification code.
- [x] Retain one active group conversation identity and reuse its stream across repeated activation.
- [x] Make stream close terminate projection, history, receipt, error and late-priority work.
- [x] Add permanent N6 and receipt/lifecycle regression assertions.
- [ ] Pass the complete repository security gate and exact Pages deployment.
- [ ] Repeat iPad and iPhone background/cold group notification tests at least five times each with no permission banner.
- [ ] iPhone and iPad device acceptance passes.

- [x] Initial full gate 34436219194: notification N2/N3/N4/N5 and preceding security stages passed; stopped only at stale 1.1.9 shell-revision assertion.
- [x] Update the permanent Outbox cache assertion to require exact 1.1.17-data-only-sw-owner revision without weakening behavior.
- [ ] Complete full baseline rerun from the beginning.

- [x] Full rerun 34436403470 passed stages 1–81; stopped only at the second stale 1.1.9 shell assertion in the direct-message basic-path gate.
- [x] Scan all 78 permanent test files and confirm no additional 1.1.9-fcm-sender-name assertions remain after correcting the direct-message gate.
- [ ] Complete third full baseline run.

### FIDUNIO 1.1.18 iPad notification click correction — REJECTED

- [x] Record iPhone 1.1.17 exact-route pass twice and iPad Settings-resume failure twice.
- [x] Device rejected: iPad still returned to Settings twice.
- [x] Device rejected: user found iPhone 1.1.17 more stable and better performing.
- [x] Remove the returned-client postMessage/focus experiment completely.
- [x] Restore the exact 1.1.17 frontend version, cache revision and permanent expectations.
- [x] Keep the successful live 1.1.17 backend unchanged.
- [x] Keep delayed iPad message projection separate under the rogue-code investigation.
- [ ] Full Rebuild Baseline Security Gate passes on exact restored 1.1.17 frontend.
- [ ] Exact GitHub Pages restoration passes.

### FIDUNIO 1.1.19 one-shot notification diagnostics

- [x] Recover and document all prior diagnostic findings before implementation.
- [x] Preserve the restored 1.1.17 notification routing action unchanged.
- [x] Add one isolated serialized worker/page diagnostic ledger.
- [x] Trace FCM receipt/display/click, clients/open result, bootstrap/PIN/hydration, route gates and projection/render.
- [x] Add visible Settings access and copyable full report.
- [x] Preserve full opaque IDs/URLs and redact security-secret values only.
- [x] Add permanent diagnostic coverage and shell-version gates.
- [ ] Full Rebuild Baseline Security Gate passes.
- [ ] Exact GitHub Pages deployment passes.
- [ ] One iPad report and one iPhone control report captured.
- [ ] Diagnostic code removed after evidence-based repair allocation.

### FIDUNIO 1.1.20 installation-local notification inbox

- [x] Allocate version 1.1.20 and deterministic cache revision.
- [x] Persist only validated opaque direct-message route before notification display.
- [x] Read only after hydration, unlock and authenticated Firebase readiness.
- [x] Collapse same-conversation records; require chooser for multiple conversations.
- [x] Consume selected/rejected route records without UID-global state or timers.
- [x] Preserve existing click URL, backend, Firebase rules/config, E2EE, Outbox and receipts.
- [x] Remove all 1.1.19 diagnostic runtime, page, Settings link and gate.
- [x] Add permanent installation-local inbox regression gate.
- [x] Reconcile notification, runtime, defect, acceptance and cumulative documents.
- [ ] Full Rebuild Baseline Security Gate passes on exact commit.
- [ ] Push exact commit to `main` and verify GitHub Pages deployment.
- [ ] Complete mandatory iPhone/iPad 1.1.20 device matrix.

### FIDUNIO 1.1.21 activation/composer ownership repair

- [x] Read mandatory coding, deterministic UI, notification and rogue-code authorities before implementation.
- [x] Remove process-lifetime notification-inbox read caching.
- [x] Route hydration, unlock, auth, foreground, connectivity and worker signals through one activation promise owner.
- [x] Stop lifecycle activation from force-replacing an already-owned direct-message subscription.
- [x] Persist/render the exact direct-chat selection before consuming its pending route.
- [x] Add per-conversation in-memory draft/focus/caret/scroll ownership; clear it on sign-out.
- [x] Make cloud, receipt, group, peer-name, attachment and Outbox callbacks request composer-safe background projection.
- [x] Add permanent activation/composer ownership gate to the normal baseline.
- [x] Reconcile affected architecture, defect, acceptance and release documents.
- [x] All locally runnable non-emulator baseline tests pass, including notification, direct-message, receipt, attachment, Outbox, startup/PIN and iPhone/iPad UI gates.
- [ ] Full Rebuild Baseline Security Gate passes on the exact 1.1.21 commit.
- [ ] Promote the exact validated tree to `main` and verify Pages.
- [ ] Complete repeated iPhone/iPad notification and active-composer acceptance.

### FIDUNIO 1.1.22 cold-route/immediate-projection/newest-entry repair

- [x] Record 1.1.21 device failures separately: iPhone cold-route fallback, 10+ second new-row display, and oldest-message entry.
- [x] Preserve `requestAppActivation()` and `render()` as the sole activation and UI owners.
- [x] Resolve stale/questionable cold-route conversation metadata through one server-authoritative `firebase.js` read before rejection.
- [x] Retain the pending route on transient failure and until the exact target composer is mounted.
- [x] Reuse already authenticated immutable e2ee:3 plaintext and decrypt only new/unavailable rows.
- [x] Project merged message state before IndexedDB durability and server Read-receipt recovery.
- [x] Remove navigation scroll from persistent per-conversation composer state.
- [x] Preserve only a one-render same-chat viewport; open intentional conversation/notification entry at latest message.
- [x] Add a permanent cold-route/projection/newest-entry gate and include it in the full baseline.
- [x] Reconcile notification, runtime, defect, acceptance, release and cumulative documents.
- [x] Focused notification, activation, direct-message, receipt, Outbox, LTE and iPhone UI gates pass locally.
- [x] Full Rebuild Baseline Security Gate `34494444866` passes on exact 1.1.22 runtime commit `c2e98d802c5ea2851885f4f5bb2a08ef67af7f4c`; Recovery `34494444546`, Firebase Adapter `34494444308`, and Rules Emulator `34494444767` also pass.
- [x] Push the exact 1.1.22 runtime tree to `main`; GitHub Pages run `34494429455` succeeds and the live site serves version `1.1.22` with shell revision `1.1.22-notification-projection-owner`.
- [x] Complete the FIDUNIO 1.1.22 iPhone/iPad focused acceptance matrix: **FAILED** — inconsistent row timing/scroll and terminated-iPhone fallback reject the candidate.

### FIDUNIO 1.1.23 deterministic activation/snapshot/viewport correction

- [x] Record 1.1.22 real-device rejection without treating intermittent successes as acceptance.
- [x] Close the activation-promise release window with a synchronous serialized handoff.
- [x] Preserve one live direct-message listener on re-entry; remove competing `getDocs()` history delivery.
- [x] Replace FIFO snapshot backlog with one active plus one latest pending snapshot.
- [x] Give central renders a generation and reject stale deferred viewport callbacks.
- [x] Retain deliberate latest-entry intent across intervening background projections until applied.
- [x] Preserve composer draft/focus/caret and scrolled-up versus near-bottom semantics.
- [x] Update release, defect, acceptance, notification, lifecycle, ownership, ramifications and cumulative records.
- [x] Focused notification, activation, direct-message, receipt, Outbox, LTE and iPhone UI gates pass locally.
- [x] Complete full local repository baseline and all emulator-backed security suites.
- [x] Push exact runtime tree `49be379988f7498d74db43a916438341bad12ef8` to `main` as `9fa9bb62ade01c5b6a3bcf01fc9f7fd6ccb6e57c`; Rebuild Baseline `34501753123`, Firebase Adapter `34501753059`, and Pages `34501752319` complete SUCCESS, and live Pages serves version `1.1.23`.
- [ ] Complete the repeated 1.1.23 iPhone/iPad acceptance matrix.

### FIDUNIO 1.1.24 keyed notification-priority build

- [x] Record the 1.1.23 device evidence and isolate background/warm iPad latency.
- [x] Keep one activation owner, one live Firestore listener/delivery owner, and one render owner.
- [x] Add keyed exact-message server read, ID deduplication, non-authoritative merge, and priority-before-maintenance scheduling.
- [x] Keep PIN transition mounted with “Opening message…”; retain pending route on bounded miss and show “Loading new message…”.
- [x] Require the exact notified row plus conversation-bound composer before consuming the pending record.
- [x] Add permanent behavioral and integration gates and service-worker cache inclusion.
- [x] Complete full local non-emulator and emulator-backed repository validation.
- [x] Push exact runtime tree `9a3bcea96c726958c58f788980792f051921dabe` to `main` as `17210008b89da26ee137cbbd529bb222c09fc164`; Rebuild Baseline `34529867052`, E2EE Rules `34529867135`, E2EE Recovery `34529866986`, Firebase Adapter `34529867158`, and Pages `34529864925` complete SUCCESS; live Pages serves version `1.1.24` and cache revision `1.1.24-notification-priority-semaphore`.
- [x] Complete the repeated iPhone/iPad matrix above — user tested every defined scenario at least five times on both devices; all behaved as expected. Mark 1.1.24 DEVICE ACCEPTED and the checkpoint baseline (2026-09-10).

### Approved N6 group-notification implementation boundary

- [x] Derive recipients from the authoritative current active group-member list at notification-processing time; exclude the sender.
- [x] Fan out only to enabled registered installations using a generic payload with opaque conversation/message identifiers.
- [x] Reuse the 1.1.24 single activation, message-delivery and render owners for PIN-to-exact-group-message routing.
- [x] Keep existing membership/history-entitlement, Firestore and E2EE rules as final access authority; fail closed for stale, deleted or unauthorized targets.
- [x] Do not add a join-before-message notification check or message-time recipient snapshot for the initial implementation.
- [x] Implementation began only after the user's explicit build authorization.

### FIDUNIO 1.1.28 N6 group-notification build

- [x] Derive recipients from current authoritative group membership and exclude the sender.
- [x] Fan out opaque data-only payloads to enabled installations in FCM batches of at most 500.
- [x] Reuse the 1.1.24 activation mutex, durable pending inbox and central render owner.
- [x] Revalidate current membership after PIN and route one exact server read through the sole group decrypt/projection owner.
- [x] Preserve membership, Firestore and E2EE as final access authority; consume missing/unauthorized routes and retain transient failures.
- [x] Add permanent backend privacy/fan-out/batching, route, priority and ownership gates.
- [x] Pass all 82 non-emulator tests, all five Firestore emulator suites, Functions import, syntax, protected-config and diff checks locally.
- [x] Publish implementation commit `c273f0bfc0275c612fb91c916da0f4d08109dcaa` to `main`.
- [x] Prepare `gn.txt`, pinned to that implementation commit, to deploy and verify only `notifyGroupMessageCreatedV1`.
- [x] Verify GitHub and Pages: implementation runs Recovery `34594246788`, Firebase Adapter `34594246812`, Rebuild Baseline `34594246886`, and Pages `34594246065` completed SUCCESS; final handoff runs Rebuild Baseline `34594531574` and Pages `34594530919` completed SUCCESS. Live Pages serves version `1.1.28`, cache revision `1.1.28-group-notifications`, and the `group-message` route.
- [ ] Run `gn.txt` in Cloud Shell and record ACTIVE Function, runtime SA, Eventarc trigger and exact Cloud Run invoker evidence.
- [ ] Complete repeated iPhone/iPad group-notification acceptance.

### FIDUNIO 1.1.25 password-change correction

- [x] Diagnose the Settings-to-E2EE PIN property mismatch before changing code.
- [x] Pass the existing PIN as explicit `oldPin` and `newPin` for forward rewrap and rollback.
- [x] Give Change Password its own Current Password field and clear transient secrets after success.
- [x] Add a permanent password-change bridge/rollback/UI ownership gate to the full baseline.
- [x] Complete the full local repository baseline: all 70 non-emulator test groups and all five Firestore emulator security suites pass.
- [ ] Push the complete runtime plus outstanding local documentation to `main` and verify every workflow/Pages deployment.
- [ ] Complete the 1.1.25 real-device acceptance steps in `DEVICE-ACCEPTANCE-BUGS.md`.

### FIDUNIO 1.1.26 local identity revision repair

- [x] Preserve the successful Firebase password change and identify the stale local E2EE revision as the post-login failure.
- [x] Save the current runtime identity revision after forward rewrap and rollback.
- [x] Bound affected-device repair to the same UID/keyId with a stale revision and reuse the existing password/PIN unlock owner.
- [x] Keep missing and different-key installations rejected.
- [ ] Complete repository baseline, push to `main`, verify workflows/Pages, and perform the affected-device acceptance steps.

### FIDUNIO 1.1.27 Forgot Password recovery completion

- [x] Prove the Firebase reset-email call was wired but the E2EE recovery transition was unreachable/incomplete.
- [x] Persist one expiring email-bound reset handoff only after Firebase accepts the email request.
- [x] Route post-reset sign-in through one authentication-owned recovery screen before application startup.
- [x] Require the existing six-digit PIN and reuse the established server session/retry/hold/revision authority.
- [x] Restore and rewrap the same identity under the new password, save the local revision, and consume the handoff only after success.
- [x] Offer authenticated missing-local installations bounded PIN-gated recovery instead of stranding them.
- [x] Add a permanent Forgot Password integration gate to the full workflow.
- [ ] Complete full baseline, push runtime plus all outstanding documentation to `main`, verify workflows/Pages, and run the 1.1.27 device matrix.

### FIDUNIO 1.1.30 optimistic outgoing projection correction

- [x] Record 1.1.29 cold/warm group-notification acceptance on iPad and iPhone.
- [x] Preserve the existing render-before-Outbox requirement.
- [x] Add one memory-only owner that retains a staged outgoing text or attachment across direct/group listener projection.
- [x] Release the reservation only on exact authoritative-ID projection, explicit purge/delete or sign-out.
- [x] Keep encrypted Outbox, transport attempt, Firebase, E2EE, receipt, notification and membership authority unchanged.
- [x] Add permanent behavioral coverage for empty/unrelated snapshots, confirmation, deletion and hidden-message non-resurrection.
- [x] Reconfirm **Start Account Recovery** as a deferred selected-user action under User Administration in `TODO.md`.
- [x] Complete full local non-emulator baseline, all five Firestore emulator security suites, Functions notification/delete tests, syntax, protected-config and diff checks.
- [x] Push runtime commit `b3bcaa8014b35c9bfffb908555fa9052bc7cd60f` to `main`; Rebuild Baseline Security Gate `34603708400` and Pages `34603708508` completed SUCCESS, and remote `version.js` serves 1.1.30.
- [ ] Complete the 1.1.30 iPhone/iPad device matrix.

### FIDUNIO 1.1.31 direct-message projection restore

- [x] Identify 1.1.30 as the exact direct-path regression point.
- [x] Restore the direct listener projection to the accepted 1.1.29 implementation.
- [x] Remove direct text and direct attachment staging from the group-only reservation owner.
- [x] Keep the 1.1.29 group-notification stream correction and group-only reservation integration unchanged.
- [x] Add a permanent source boundary that fails if group-only optimistic projection enters direct messaging.
- [x] Pass focused direct send/read-receipt/Outbox/notification and group-isolation tests.
- [x] Complete full local non-emulator validation, all five Firestore emulator suites, Functions notification/delete tests, syntax, protected-config and diff checks.
- [ ] Push to `main` and verify Pages/security checks.
- [ ] Complete the narrow bidirectional iPhone/iPad direct-message acceptance.

### FIDUNIO 1.1.32 mass sender-owned message deletion

- [x] Extend the existing message-delete core rather than add client Firestore delete or a second backend owner.
- [x] Select only authoritative direct/group rows whose `senderUid` equals the authenticated UID, in server pages of at most 25.
- [x] Revalidate sender and membership per row and preserve attachment/group receipt/history-trace cleanup before source deletion.
- [x] Add **Delete My Sent Messages** to Direct Chat Info and Group Info with irreversible confirmation, disabled controls and visible count progress.
- [x] Serialize client page requests and physically purge only server-confirmed IDs from UID-local state/history/attachment runtime.
- [x] Preserve messages from other senders and Queued/Sending/Failed Outbox rows.
- [x] Add permanent callable-core and UI/ownership gates to the full baseline workflow.
- [x] Complete all 72 non-emulator test groups, all five Firestore emulator security suites, Functions import, syntax, protected-config and diff checks locally.
- [x] Push the complete 1.1.31 + 1.1.32 runtime and pending todo documentation to `main`; authenticated connector commits `d4909f9b831aa5a4f07c5a9b04b633cbf117ff2d` and `355beff7c56fa3fd3a0c930f82cd0a1c32ccc94b`, with successful security and Pages workflows.
- [x] Prepare short root script `m.txt`, pinned to published implementation commit `d4909f9b831aa5a4f07c5a9b04b633cbf117ff2d`, to deploy and verify only `deleteMyMessagesForEveryoneV1`.
- [x] Deploy and verify `deleteMyMessagesForEveryoneV1` using the dedicated message-delete identity; user reported `m.txt` completed successfully and the Function is ACTIVE on 2026-09-11.
- [ ] Complete the direct/group iPhone/iPad acceptance matrix in `DEVICE-ACCEPTANCE-BUGS.md`.

### FIDUNIO 1.1.33 immediate mass-delete projection convergence

- [x] Record the 1.1.32 direct-device failure: two Sent rows were physically removed on both devices, but one sender row remained temporarily before the final listener snapshot.
- [x] Preserve the deployed backend and existing single-message deletion path unchanged.
- [x] Reserve only server-confirmed bulk-deleted IDs in one conversation-keyed, memory-only projection owner before local purge.
- [x] Suppress those IDs from direct/group intermediate projections; release each only after full server-backed absence, never cache/partial absence.
- [x] Reset the non-persistent convergence owner on sign-out; create no hidden-ID tombstone or accepted-ID registry.
- [x] Add a behavioral gate covering pre-delete, intermediate, cache-only, final authoritative, conversation-isolation and reset cases.
- [x] Complete all 82 non-emulator workflow steps and all five Firestore emulator suites locally; syntax, diff and focused convergence gates pass.
- [x] Publish exact tree to `main` as `1ce5eab49c7573622a028cfeb800755173d3fdfe`; Rebuild Baseline `34627532056`, Rules `34627532087`, Recovery `34627532062`, Firebase Adapter `34627532036`, and Pages `34627531490` completed SUCCESS.
- [x] Repeat direct deletion on 1.1.33; user confirmed the immediate-convergence correction works.
- [ ] Complete group and remaining iPhone/iPad neighboring regression acceptance.
