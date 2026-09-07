# FIDUNIO Current Rebuild — Recovery Entry Point

**Current development branch:** `fidunio-complete-rebuild`

If a ChatGPT session is interrupted or a handover is required, start here:

1. Read `hermes-memory.txt` completely, beginning with its mandatory-first-read instructions.
2. Read `FIDUNIO-BUILD-CHECKLIST.md` completely and use it as the authoritative operational completion ledger.
3. Read the architecture/security documents required by `hermes-memory.txt` before consequential code changes.
4. Perform executable development on `fidunio-complete-rebuild` until the complete candidate is security-gated and deliberately promoted.

Current product decision: disappearing direct and group messages use a fixed interval that starts from each recipient account's first authoritative Read event. Group timers are per recipient, not first-reader-global. Exact purge implementation remains in progress.

## Main-branch recovery mirror

A curated set of recovery-critical documentation is automatically mirrored from `fidunio-complete-rebuild` to `main` by `.github/workflows/mirror-rebuild-docs-to-main.yml`.

The copies on `main` are for discovery, outage recovery, and handover. The authoritative in-progress executable source remains `fidunio-complete-rebuild` until final promotion. Do **not** infer that application code on `main` is the current rebuild.

## Mirrored documents

- `CURRENT-REBUILD.md`
- `hermes-memory.txt`
- `FIDUNIO-BUILD-CHECKLIST.md`
- `hermes-setup.txt`
- `CODING-GUIDELINES.md`
- `RUNTIME-AUTHORITY-MAP.md`
- `architecture-ownership.txt`
- `ACCOUNT-E2EE-FIRESTORE-AUTHORITY.md`
- `ACCOUNT-E2EE-DIRECT-MESSAGE-FORMAT.md`
- `ACCOUNT-E2EE-GROUP-MESSAGE-FORMAT.md`
- `E2EE-RECOVERY-PROTOCOL.md`
- `DETERMINISTIC-UI-LIFECYCLE.md`
- `BUG-LIST.md`
- `DEVICE-ACCEPTANCE-BUGS.md`

## Mirror rule

When any mirrored source document changes on `fidunio-complete-rebuild`, the workflow updates only these curated documentation files on `main`. It does not merge or copy unfinished application code.

## 0.9.6.16 purge continuation
Group disappearing purge now has deterministic history-grant trace planning and grant/copy versions in its server read basis. Physical group deletion remains deliberately fail-closed pending a race-safe new-grant barrier and one revalidated receipt/grant/source commit. Live Firebase and htest remain untouched.

## 0.9.6.17 purge barrier
New group history-grant creation is now basis-visible to disappearing purge: the same transaction must update group `updatedAt`, and repository Rules enforce that barrier. Clean gate `34054522196` passed. Physical group deletion remains fail-closed pending one revalidated receipt/grant/source commit. No live Firebase or htest change.

## 0.9.6.18 copy purge barrier
New group history-copy writes are now basis-visible: every genuinely new copy chunk must atomically update group `updatedAt`, and repository Rules enforce it. Clean gate `34054991773` passed. Group physical trace deletion remains the next secure slice. Live Firebase and htest remain untouched.

## 0.9.6.19 receipt purge barrier
Group receipt creation/advance is now purge-basis-visible through an atomic parent `receiptRevision`. Clean gate `34055638377` passed. Group physical trace deletion remains fail-closed; next work is the bounded server trace commit, then local/offline anti-resurrection. Live Firebase and htest remain untouched.

## 0.9.6.20 atomic group physical trace commit
The server-only repository now revalidates and atomically removes/reconciles the complete Firestore group disappearing-message trace set. Browser deletes remain closed. Next security slice is local/offline anti-resurrection convergence (cache + encrypted Outbox, then remaining attachment/notification traces). Live Firebase and htest remain untouched. Overall first rebuild remains approximately 65%.

## 0.9.6.21 local anti-resurrection decision foundation
A pure local convergence planner now requires explicit prior server-backed observation plus authoritative server absence before identifying disappearing cache/Outbox traces for removal. Cache-only absence and device time remain non-authoritative; no tombstone is created. Next work is serialized IndexedDB/application wiring and restart/reconnect proof, then remaining attachment/object-URL/notification traces. Live Firebase and htest remain untouched. Overall first rebuild remains approximately 65%.

## 0.9.6.22 local physical purge wiring
The existing application/local-persistence owner can now physically remove planned disappearing IDs from live message state, encrypted history and matching encrypted Outbox rows under one serialized active-UID guard, with no tombstone. Full security gate `34058248816` is SUCCESS, so the build earns its allocated +1.0 point and weighted completion is now 68%. Next allocated work after green validation is 0.9.6.23 authoritative direct/group projection convergence. Live Firebase and htest remain untouched.

## 0.9.6.23 authoritative projection convergence
Direct and group message projections now distinguish cache-only snapshots from server-backed authority. Server-backed rows retain explicit disappearing metadata and prior-server observation; authoritative absence invokes the existing local convergence planner and serialized physical purge before projection persistence. Cache-only emptiness cannot purge. Group snapshot metadata now reaches the app projection, and granted-history authority is refreshed from server so stale cached grant copies cannot become authoritative resurrection material. Full gate `34059145963` passed. Weighted first-rebuild completion is **69%**. Next allocated build is 0.9.6.24 restart/reconnect stale-client anti-resurrection proof. Live Firebase and htest remain untouched.

### 0.9.6.23 final grant-source authority strengthening
Final review caught and closed a subtle group-history resurrection boundary: a grant-only projected copy is not proof that its original source message still exists. `e2ee-account-group-history-projection.js` now marks ordinary retained source rows `authoritativeSource:true` and grant-only rows `authoritativeSource:false`; `disappearing-authoritative-projection.js` excludes grant-only rows from authoritative source-presence IDs and suppresses a grant-only row when authoritative source absence plans that disappearing ID for purge. The permanent projection and group-conversation gates cover this distinction. Full baseline security gate `34059145963` passed on the strengthened implementation. Live Firebase and `htest` were not touched.

### Mandatory build reallocation after 0.9.6.23
Repository review reconfirmed the known 0.9.6.20 omission: group physical purge still lacks an explicit conservative transaction write-count ceiling. Per the pre-allocation rule, this security repair is allocated **before implementation** as 0.9.6.24. The previous 0.9.6.24–0.9.6.29 work shifts to 0.9.6.25–0.9.6.30. The weighted denominator remains 100: 0.9.6.24 receives 0.5 point and restart/reconnect 0.9.6.25 receives 0.5 point; later shifted builds retain their prior points. Current earned completion remains 69%.

### 0.9.6.24 bounded group-purge transaction writes
The known 0.9.6.20 write-limit omission is closed. `disappearing-purge-firestore-admin-adapter.mjs` now computes the complete group purge transaction write count before scheduling any mutation and caps it at 400. Exactly 400 writes are accepted; 401 fails closed with `PURGE_TRACE_TOO_LARGE` and zero scheduled writes. Oversized traces remain intact for a future safe lease/chunk design; there is no source-first chunking, tombstone, browser delete permission, or live Firebase change. Full baseline security gate `34059468538` passed. Runtime version is 0.9.6.24. Weighted ledger is 69.5/100, reported as **70%**. Next allocated build is 0.9.6.25 restart/reconnect stale-client anti-resurrection proof.

### 0.9.6.25 restart/reconnect replay barrier — IN PROGRESS
Runtime version is now **0.9.6.25**. `disappearing-reconnect-recovery.js` is the pure restart/reconnect Outbox decision owner. `firebase.js` remains the sole client Firebase owner and now exposes explicit server-only direct/group source-ID probes; `app.js` remains the sole local mutation/controller owner and serializes reconnect reconciliation before any cloud/group Outbox replay. Server-present Outbox IDs are treated as already accepted, prior-server-backed disappearing IDs that are authoritatively absent are physically purged before retry, and only never-server-backed absent work may replay. Cache-only absence and client time remain non-authoritative; no tombstone is created. Full baseline security gate **34060082292** passed on head `cb05fadc749fd42cdbbccc64fc3bb1972b854d41`.

The build is deliberately **not** marked repository-validated for the 1.0 ledger because one exact crash/idempotency boundary remains unresolved: if Firestore accepts a send and the browser crashes before the Outbox is deleted or any durable `serverBacked:true` observation is recorded, then the source later expires and is physically purged before that device returns, restart state is indistinguishable from genuinely never-sent queued work. A per-message tombstone/accepted-ID registry would violate the current trace-free rule; delaying purge until sender acknowledgement can violate disappearance semantics; a durable per-device/replay-channel high-water mark may solve replay but would intentionally retain non-content anti-replay state caused by expired traffic and therefore needs an explicit architecture/privacy decision before adoption. The contract records `postCommitPreObservationCrashGapClosed:false`. No live Firebase or `htest` change was made. The allocated 0.5 point remains unearned, so weighted completion stays **69.5/100 (70% normal status)**. Do not begin 0.9.6.26 until this boundary is resolved.

### 0.9.6.25 fail-closed restart/reconnect closeout — REPOSITORY-VALIDATED
User approved the conservative fail-closed resolution for the post-commit/pre-observation crash boundary. The encrypted IndexedDB Outbox now records `sendAttempted:true` durably before direct or group cloud transmission. Reconnect performs an authoritative server read first. Server-present IDs are accepted and their stale Outbox record is removed; prior-server-backed disappearing IDs that are authoritatively absent are physically purged; never-attempted and never-server-backed work may replay; but an attempted ID that is authoritatively absent is marked failed and **never automatically replayed** because FIDUNIO cannot distinguish a definite pre-commit failure from accepted-then-expired content after a crash. The sender can deliberately send a new message instead. No server tombstone, accepted-ID registry, client clock authority, reload or timer-rescue architecture was introduced.

Focused materialization test passed and full baseline security gate `34060880885` is SUCCESS on `593c078727b6e5fc062a0b20e9d3cf88b2bc1797`. Build 0.9.6.25 earns its allocated 0.5 point, making the weighted ledger **70.0/100 (70%)**. Next allocated build is **0.9.6.26 multi-device expiry convergence foundation**. Live Firebase and `htest` remain untouched.

### Combined 0.9.6.26 / 0.9.6.27 pass — REPOSITORY-VALIDATED
0.9.6.26 proves same-UID installations independently converge a server-backed disappearing message after authoritative source purge: live projection, encrypted history and matching encrypted Outbox traces are removed on each device, while cache-only absence cannot authorize purge and attempted stale Outbox work cannot replay. 0.9.6.27 adds one persisted future-message duration preference and compact composer control. The pure compose owner normalizes Off/5m/1h/1d/7d; `app.js` snapshots the selection into a newly created message and propagates it through both direct and group encrypted Outbox/send paths. Already-sent message metadata is not rewritten when the preference changes. Full gate `34061730677` SUCCESS on `b3086fb894b2e9d904264300b60c04a68668f3dc`. Runtime 0.9.6.27. Weighted completion **72.0/100**. Next allocated build: **0.9.6.28 disappearing text end-to-end security closeout**. Live Firebase and `htest` untouched.

## 0.9.6.28-0.9.6.30 combined repository checkpoint
The three pre-attachment builds are repository-validated by full gate `34062508968` SUCCESS. Disappearing text has a permanent end-to-end closeout matrix; Group Info now delegates admin beginning/date earlier-history grants to the validated server-backed grant runtime; direct Read receipt mutation has one deterministic subscription path with foreground/pageshow recovery retained. Runtime is 0.9.6.30 and weighted completion is 75%. Next work is 0.9.7.0 attachment transport/data authority. Real-device receipt proof remains in the release-candidate acceptance phase. Live Firebase and htest remain untouched.

## 0.9.7.0–0.9.7.4 attachment send checkpoint — repository validated

Builds 0.9.7.0 through 0.9.7.4 establish one attachment send owner and wire photo, file, audio and video selection/capture through bounded local AES-256-GCM chunk encryption, encrypted Outbox staging, ciphertext-only Firebase Storage upload through `firebase.js`, and the existing direct/group E2EE message commit path. Attachment keys travel only inside E2EE message ciphertext. Size limits are photo 12 MiB, file 20 MiB, audio 25 MiB, video 50 MiB. Storage client delete is denied; disappearing attachment deletion remains reserved for the purge owner in 0.9.7.8. Full Rebuild Baseline Security Gate `34063327957` SUCCESS. No live Firebase or htest deployment occurred. Runtime version is 0.9.7.4. Next build is 0.9.7.5 receive/decrypt/display/play.

## 0.9.7.5–0.9.7.9 attachment phase closeout — repository validated

Runtime 0.9.7.9 completes the allocated attachment phase: integrity-checked receive/decrypt with explicit object-URL lifecycle; UID-scoped offline/cache recovery policy; message-level receipt authority; trace-free disappearing-attachment purge planning and serialized storage/local-before-source execution; and the permanent attachment closeout matrix. Firebase Storage download remains solely in `firebase.js`. Client Storage deletion remains denied; server purge dependencies are injected into the dedicated purge executor and no live Firebase deployment occurred. Full Rebuild Baseline Security Gate `34064314857` SUCCESS. Next allocated build is 0.9.8.0 invitation deterministic-owner rebuild; rejected 0.9.4.12-.15 invite/install logic remains forbidden.

## 0.9.8.0–0.9.8.5 invitation/install checkpoint — repository validated

Runtime 0.9.8.5 completes the invitation/join/install phase. `invitation-owner.js` is the sole serialized invitation mutation coordinator while `firebase.js` remains the sole Firebase repository/SDK owner. Pure `invitation-policy.js` enforces single-use lifecycle, issuer roles and target roles. Auth and Settings request invitation work through that owner. Firestore emulator coverage proves anonymous validation of a known token, unauthorized issuance/revocation denial, owner issuance/revocation, atomic accepted-invitation + active-profile enrollment, and second-redemption denial. Joined active profiles flow into existing direct/group discovery without device binding.

`install-guidance.js` owns only an optional predefined Settings Install panel. It never mutates invitation, account, messaging or service-worker state and never uses automatic install prompting. iOS uses Safari Share -> Add to Home Screen; Android/Fire and desktop use browser-provided install/add/shortcut commands when available. The rejected 0.9.4.12–0.9.4.15 invite/install logic was not restored or adapted. Protected iPhone Back/wrap, Settings deterministic ownership and two-pane architecture remain gated. Full Rebuild Baseline Security Gate `34065528714` SUCCESS. No live Firebase or htest deployment occurred. Next allocated build: 0.9.9.0 Group Info completion.


## 0.9.9.0-0.9.9.5 repository candidate checkpoint — 2026-09-06
Group Info landscape/responsive completion, real Direct Chat Info-only behavior, prototype/simulation retirement and responsive/lifecycle hardening are repository-validated. Permanent candidate UI/lifecycle coverage is in the normal baseline. Full gate 34066875377 SUCCESS. Runtime checkpoint 0.9.9.5. Weighted ledger 95.5/100 (reported 96%). Next: 0.9.9.6 atomic htest deployment. Do not claim 0.9.9.7 device acceptance until the user actually tests iPhone/iPad/two-account/offline/disappearing/attachments/invitation/install/recovery. Live Firebase is still not to be changed.


## 0.9.9.6 htest deployment checkpoint — 2026-09-06
Full gate 34067021824 SUCCESS on exact candidate 31dac2c0b551429a5a4ba7cf7c967e6316e9a9e6; htest branch created at that exact SHA with runtime 0.9.9.6. Weighted ledger 96.0/100. 0.9.9.7 is now CURRENT but BLOCKED — USER DEVICE PROOF. Do not award 0.9.9.7, run 0.9.9.8 stabilization, or claim 0.9.9.9 promotion readiness without actual device acceptance evidence. Live Firebase remains untouched.


## 0.9.9.6 htest deployment checkpoint — 2026-09-06
Full gate 34067021824 SUCCESS on exact candidate 31dac2c0b551429a5a4ba7cf7c967e6316e9a9e6; htest branch created at that exact SHA with runtime 0.9.9.6. Weighted ledger 96.0/100. 0.9.9.7 is now CURRENT but BLOCKED — USER DEVICE PROOF. Do not award 0.9.9.7, run 0.9.9.8 stabilization, or claim 0.9.9.9 promotion readiness without actual device acceptance evidence. Live Firebase remains untouched.


## 0.9.9.8 Firebase Storage connectivity repair — IN PROGRESS — 2026-09-06
The 0.9.9.7 pre-acceptance connectivity check proved that the prior 0.9.7.x attachment gates were repository-only dependency-injection/source tests, not a real Firebase-backed attachment test. The live default bucket `fidunio-fef13.firebasestorage.app` was then created in `US-CENTRAL1`, the reviewed `storage.rules` compiled and deployed, and Firebase granted the required Storage-Rules-to-Firestore cross-service role. Firestore rules, Functions, Hosting, Auth, App Check, GitHub branches and protected Firebase configuration were not changed by that live setup.

Repository stabilization now registers `storage.rules` in `firebase.json` and adds a permanent Storage deployment-wiring gate. Runtime advances 0.9.9.6 -> 0.9.9.8 because 0.9.9.7 is the device-acceptance gate, not an implementation build. This does not complete attachment acceptance: authenticated real-device upload/download/authorization/offline/purge proof remains required. The 0.9.9.8 point remains unearned until the full repository gate is green and acceptance defects are closed. Overall ledger remains 96.0/100 (96%).


### 0.9.9.8 repository validation checkpoint — 2026-09-06
Commit `34c8d237eb8f08b8228f670b8ca958038b553aef` registers `storage.rules` in `firebase.json`, adds the permanent `storage-deployment-wiring.test.mjs` gate, advances runtime to 0.9.9.8, and preserves `firebase-config.js` unchanged at blob `b81026dcc07b7374d1f48d0cb094764ce28319bd`. Full Rebuild Baseline Security Gate `34072294756` completed SUCCESS, including the new Firebase Storage deployment-wiring step. This proves repository deployability, not real attachment operation. 0.9.9.8 remains IN PROGRESS pending authenticated iPhone/iPad upload, second-device download/decrypt, unauthorized denial, offline/reconnect and disappearing-attachment purge proof. No additional completion credit is earned; overall remains 96.0/100 (96%).


## 0.9.9.7 iPad acceptance failure — 2026-09-06

Real-device testing on the promoted `main` build exposed three release-candidate blockers: missing conversation widgets, materially regressed iPad text size, and conversation-pane overlap. The durable detailed records are FDA-IPAD-001 through FDA-IPAD-003 in `DEVICE-ACCEPTANCE-BUGS.md`. These are user-observed device failures, not repository simulations. Build 0.9.9.7 remains FAILED/BLOCKED; 0.9.9.8 remains the allocated RC stabilization build and earns no point until repair, full required gates, redeployment and repeated user acceptance. Overall completion remains 96.0/100.0 (96%).


## 0.9.9.8 iPad RC repair candidate — 2026-09-07

The bounded repair candidate addresses FDA-IPAD-001 through FDA-IPAD-003 without changing Firebase/E2EE/storage ownership. It separates Sign Out from the constrained tablet icon cluster, makes tablet brand/navigation/tool labels scale from the established root A/A+/A++ owner, changes the obsolete eight-slot tablet attachment grid to the four supported tools, and distinguishes Firebase conversation discovery from authoritative empty/error state. It does not fabricate conversations or restore quarantined cross-account data. Targeted iPad stabilization, release-candidate UI/lifecycle and Storage-wiring gates pass locally. Full baseline, promotion to `main`, Pages deployment and repeated user-device acceptance remain pending. Defects remain OPEN; 0.9.9.8 earns no point and total completion remains 96.0/100.0 (96%).
