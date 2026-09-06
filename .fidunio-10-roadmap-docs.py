from pathlib import Path

check=Path('FIDUNIO-BUILD-CHECKLIST.md')
s=check.read_text()
marker='## FIDUNIO 1.0 allocated build roadmap'
if marker not in s:
    block=r'''
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
| **0.9.6.22** | **UID-scoped IndexedDB + encrypted Outbox physical purge wiring.** Preserve `disappearAfterSeconds` and prior-server-observation metadata in local records; route all local purge mutations through the existing serialized local-storage/application owner; delete matching history rows and Outbox rows before any retry; no second IndexedDB owner. | Focused local-storage tests prove exact-row deletion, unrelated rows retained, no tombstone, account isolation, and no retry after purge; full gate green. | CURRENT |
| **0.9.6.23** | **Authoritative direct/group projection convergence.** Direct and group server-backed snapshots must mark observed remote messages as server-backed; server-backed absence invokes the 0.9.6.21 planner; cache-only snapshots may merge but never purge; group granted-history projection cannot resurrect a purged source. | Direct/group projection tests cover server-present, authoritative-absent, cache-only-empty, granted-history copy, and pending-local cases; full gate green. | PLANNED |
| **0.9.6.24** | **Restart/reconnect stale-client anti-resurrection proof.** Persisted history + encrypted Outbox survive ordinary offline restart, but an already-authoritatively-purged disappearing ID is removed before reconnect flush/projection. Prove stale cache cannot re-upload or re-project expired material. | Cold-start, offline->online, stale snapshot and duplicate retry tests green; no `location.reload()`/timer rescue. | PLANNED |
| **0.9.6.25** | **Multi-device expiry convergence foundation.** Define and test same-UID device behavior after server purge; each device independently converges local traces to authoritative absence without installation-local lifetime authority. | Repository multi-device simulation proves both devices converge and neither can resurrect source/Outbox/history. | PLANNED |
| **0.9.6.26** | **Disappearing text settings/UI wiring.** Expose user-selected duration for direct/group text messages using existing immutable outer `disappearAfterSeconds`; show effective policy before send; do not redesign established chat layout. | UI/controller tests prove selected duration reaches direct/group send paths and already-sent message duration remains immutable. | PLANNED |
| **0.9.6.27** | **Disappearing text end-to-end security closeout.** Reconcile direct/group text purge, receipts, history grants, local cache, Outbox, stale clients and multi-device behavior as one release checkpoint. | Complete disappearing-text repository matrix green; checklist text-message items can move to DONE except attachment-specific work. | PLANNED |
| **0.9.6.28** | **Group earlier-history admin UI.** Enable Group Info date/beginning grant controls only against already-validated server-backed history source selection and grant runtime; preserve admin-only intent and from-join default. | UI integration + group history rules/runtime/projection tests green; no cache-only grant source. | PLANNED |
| **0.9.6.29** | **Receipt/lifecycle stabilization before attachment phase.** Close remaining iPad/two-pane live Sent->Read refresh behavior and verify direct/group receipt projection does not regress under disappearance handling. | Repository lifecycle tests green; ready for real-device proof later in 0.9.9.x. | PLANNED |

### 0.9.7.x — attachments / rich messaging required for 1.0

| Allocated build | Component / detailed task | Exit criteria | State |
|---|---|---|---|
| **0.9.7.0** | **Attachment transport/data authority.** Define one attachment owner, Firestore/Storage manifest/chunk/reference schema, E2EE metadata boundaries, size/type limits, and server/client ownership. Reuse existing attachment crypto foundation; no plaintext upload. | Architecture docs + schema/rules/emulator tests green before UI transport is enabled. | PLANNED |
| **0.9.7.1** | **Photo select/capture + encrypted send.** Direct and group photo path through one attachment owner, encrypted Outbox, upload confirmation and message reference. | Photo send tests incl. offline queue, tamper/error cleanup, direct/group. | PLANNED |
| **0.9.7.2** | **File select + encrypted send.** Generic supported file path with bounded size/type policy and no alternate upload owner. | Direct/group file send and error/retry tests green. | PLANNED |
| **0.9.7.3** | **Audio record/select + encrypted send.** Browser/PWA-supported recording/select flow, explicit permission handling, encrypted transport. | Audio send/playback payload tests and permission-failure path green. | PLANNED |
| **0.9.7.4** | **Video select/capture + encrypted send.** Bounded video handling with the same chunk/integrity owner and no memory-unbounded transform. | Direct/group video send tests, size-limit and interruption cleanup green. | PLANNED |
| **0.9.7.5** | **Attachment receive/decrypt/display/play.** Integrity-check every chunk before exposing decrypted object; lifecycle owns object-URL creation/revocation. | Direct/group photo/file/audio/video receive tests; corrupt/missing chunks fail closed. | PLANNED |
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
| **0.9.9.0** | **Group Info completion.** Integrate earlier-history controls from 0.9.6.28, remove obsolete placeholders, and finish tablet landscape layout without redesigning established two-pane behavior. | Group Info functional + responsive tests green. | PLANNED |
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
'''
    anchor='## Build Log'
    if anchor not in s: raise SystemExit('Build Log anchor missing')
    s=s.replace(anchor,block+'\n\n'+anchor,1)
    check.write_text(s)

mem=Path('hermes-memory.txt')
m=mem.read_text()
memmarker='FIDUNIO 1.0 PRE-ALLOCATED BUILD-NUMBER RULE'
if memmarker not in m:
    m=m.rstrip()+r'''

FIDUNIO 1.0 PRE-ALLOCATED BUILD-NUMBER RULE — USER REQUIREMENT
- `FIDUNIO-BUILD-CHECKLIST.md` must carry the detailed implementation task and an already-allocated target build number for every remaining component required for 1.0.0, including work that is only planned.
- Current allocation bands: 0.9.6.x disappearing/anti-resurrection; 0.9.7.x attachments; 0.9.8.x invitations/install; 0.9.9.x UI/regression/release-candidate; 1.0.0 final promotion.
- A reserved number is not the runtime version until that slice is materially implemented. If an unexpected security/regression build must be inserted, update the checklist allocation before coding and never silently reuse a completed number.
- Every substantive build report must identify its allocated build number, detailed steps completed/remaining, validation evidence, and overall first-rebuild completion percentage.
'''
    mem.write_text(m+'\n')
print('1.0 detailed build allocation added')
