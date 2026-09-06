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
| Disappearing attachments | NOT DONE | Purge attachment metadata, encrypted chunks/blobs, thumbnails/previews, local decrypted object URLs/cache, message references, and attachment-specific receipts together. |
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
- 0.9.7.5 and later allocated builds: **0.0 earned so far**.
- **Current total: 80.0 / 100.0, reported as 80%.**

This 80.0-point ledger is authoritative until another allocated build earns points or a validated item regresses.


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
| **0.9.7.5** | **CURRENT — Attachment receive/decrypt/display/play.** Integrity-check every chunk before exposing decrypted object; lifecycle owns object-URL creation/revocation. | Direct/group photo/file/audio/video receive tests; corrupt/missing chunks fail closed. | CURRENT |
| **0.9.7.6** | **Attachment offline retention + Outbox/history integration.** Pending encrypted attachment work is authoritative only in Outbox; downloaded attachment cache remains rebuildable and UID-scoped. | Offline restart/reconnect tests green; account-switch isolation proven. | PLANNED |
| **0.9.7.7** | **Attachment receipts/lifecycle.** Message-level status remains authoritative; attachment transport cannot manufacture independent Sent/Delivered/Read semantics. | Direct/group receipt tests green with attachments. | PLANNED |
| **0.9.7.8** | **Disappearing attachment trace-free purge.** Extend server/local purge owner to attachment manifest, encrypted chunks/blobs, thumbnails/previews, object URLs/cache, Outbox and references. | Expired attachment leaves no FIDUNIO-controlled trace; stale/offline client cannot restore it. | PLANNED |
| **0.9.7.9** | **Attachment phase security closeout.** Run complete attachment + disappearing + offline + account-isolation matrix. | Full baseline security gate and attachment-specific matrix green. | PLANNED |

### 0.9.8.x — invitations, joining and safe PWA install

| Allocated build | Component / detailed task | Exit criteria | State |
|---|---|---|---|
| **0.9.8.0** | **Invitation deterministic-owner rebuild.** Re-audit current invitation code and establish one serialized invitation owner/write path; do not adapt rejected 0.9.4.12-.15 invite-install logic. | Architecture/rules tests green before changing install behavior. | PLANNED |
| **0.9.8.1** | **Invitation create/send/use/join end-to-end.** Owner/Admin issue invitation; recipient validates/redeems; account/profile enrollment is real Firebase-backed behavior. | Happy path + used/revoked/expired/role/unauthorized tests green. | PLANNED |
| **0.9.8.2** | **Invitation account/conversation association.** Joined user appears correctly to permitted contacts/groups without prototype identity or manual device binding. | Cross-account conversation/group discovery tests green. | PLANNED |
| **0.9.8.3** | **Safe install-to-Home-Screen owner.** Build install guidance independently from invitation redemption; preserve manifest/icons/service-worker foundation and browser-specific supported paths. | Install flow cannot mutate invitation/account state; iPhone/iPad/desktop support paths documented/tested. | PLANNED |
| **0.9.8.4** | **Invite + install coexistence regression gate.** Specifically reproduce the historical bug class where automatic icon/install behavior broke Settings/two-pane behavior, and prove the new architecture cannot do so. | Two-pane Settings, iPhone back/wrap and invitation flows remain green with install code present. | PLANNED |
| **0.9.8.5** | **Account/invitation/install phase closeout.** Reconcile account creation/sign-in/sign-out/recovery, invitation-only enrollment and install guidance. | Complete repository gate green; no rejected historical implementation restored. | PLANNED |

### 0.9.9.x — UI completion, regression hardening and release candidate

| Allocated build | Component / detailed task | Exit criteria | State |
|---|---|---|---|
| **0.9.9.0** | **Group Info completion.** Integrate earlier-history controls from 0.9.6.29, remove obsolete placeholders, and finish tablet landscape layout without redesigning established two-pane behavior. | Group Info functional + responsive tests green. | PLANNED |
| **0.9.9.1** | **Direct Chat Info completion.** Replace remaining placeholder behavior with supported real actions or remove unsupported controls deliberately. | No Direct Chat Info placeholder actions remain. | PLANNED |
| **0.9.9.2** | **Prototype/simulation cleanup.** Remove remaining test banners, simulated local message-state timers and tool-button alert placeholders only after their real replacements exist. | Search/runtime gates prove no forbidden simulation owner remains. | PLANNED |
| **0.9.9.3** | **Responsive/lifecycle regression hardening.** Verify iPhone single-pane + prominent Back/wrap, iPad/tablet/desktop two-pane, Group Info landscape, Settings lifecycle, rotation/resize and live receipts. | Repository UI/lifecycle gates green with no observer/timer/reload rescue architecture. | PLANNED |
| **0.9.9.4** | **Complete 1.0 repository candidate gate.** Run all rules, E2EE, recovery, groups, disappearing content, attachments, invitations/install, offline and runtime authority tests as one coherent candidate. | Every required 1.0 repository gate green. FCM 1.1 and App Check enforcement 1.2 excluded. | PLANNED |
| **0.9.9.5** | **Final documentation/setup/package reconciliation.** Update cumulative README/memory/checklist/setup, remove temporary one-shot files/workflows, verify protected config exclusion, prepare one coherent candidate package/checkpoint. | Docs match executable source; no temporary materializers; protected configs untouched. | PLANNED |
| **0.9.9.6** | **Atomic deployment to `htest`.** Deploy only the coherent 1.0 release candidate, not incremental slices. | htest source/version exactly matches gated candidate. | PLANNED |
| **0.9.9.7** | **User-device acceptance pass.** iPhone + iPad + two-account/two-device + offline/reconnect + disappearing + attachments + invitation/install + recovery proof. Fire HD constraints verified where applicable. | User/device acceptance recorded; recovery item can leave `BLOCKED — USER DEVICE PROOF`. | PLANNED |
| **0.9.9.8** | **Reserved release-candidate stabilization build.** Apply only defects discovered by 0.9.9.7 using normal owner/debug-first rules; no opportunistic feature expansion. | All acceptance regressions closed and complete security gate green again. | PLANNED |
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
