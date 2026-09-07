# FIDUNIO Current Rebuild — Recovery Entry Point

## Basic direct-message transport candidate — 2026-09-07

By explicit user direction, direct one-to-one text messaging is the immediate priority and must not wait on account-key readiness or manual fingerprint verification. The minimal candidate sends new direct text through the existing authenticated Firestore/Outbox path in the plaintext format already allowed by current rules. Existing encrypted messages remain readable. No Firebase rules, App Check, group, attachment, or deletion change is included. Repository validation, `main` deployment, and real iPad-to-iPhone Sent → Delivered → Read proof remain required.

First iPad launch still exposed a legacy key-change/fingerprint banner. The follow-up removes direct-chat key status banners and routes the Info button to plain Chat Info; it does not expose verification or key controls.

Device proof confirms iPad → iPhone message transmission. The remaining Sent status is a Read-receipt return defect. The bounded candidate calls the existing recipient-only conversation Read owner whenever the direct chat opens, so a cached first snapshot cannot skip the server receipt.

**Sole authoritative development and deployment branch:** `main`

If a ChatGPT session is interrupted or a handover is required, start here:

1. Read `hermes-memory.txt` completely, beginning with its mandatory-first-read instructions.
2. Read `FIDUNIO-BUILD-CHECKLIST.md` completely and use it as the authoritative operational completion ledger.
3. Read the architecture/security documents required by `hermes-memory.txt` before consequential code changes.
4. Perform executable development directly on `main`; every substantive candidate must pass the normal security baseline before device acceptance credit.

Current product decision: disappearing direct and group messages use a fixed interval that starts from each recipient account's first authoritative Read event. Group timers are per recipient, not first-reader-global. Exact purge implementation remains in progress.

## Branch authority transition — 2026-09-07

By explicit user direction, `main` is now the single authority for application code, durable documentation, repository validation and GitHub Pages device testing. `fidunio-complete-rebuild` is a historical checkpoint only and must not receive new work or overwrite `main`. The former automatic recovery-document mirror is removed. The permanent Rebuild Baseline Security Gate runs on pushes to `main`. Protected Firebase configuration remains unchanged.

## 0.9.9.8 readonly transport-row repair — 2026-09-07

First direct-on-`main` iPad evidence showed `Attempted to assign to readonly property` and a row stuck at Sending. The disappearing compose policy froze the whole row, conflicting with the existing Outbox owner's required status mutation. The candidate keeps one-time expiry stamping but returns an application-owned mutable row, with regression coverage that transport state changes while expiry remains unchanged. Cache revision `001f`; full main gate/deployment/device proof pending. Completion remains 96%.

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


## 0.9.9.8 second iPad acceptance evidence — 2026-09-07

The first repair restored the real cloud conversation and composer/widgets and removed the horizontal Sign Out collision. The user screenshot also exposed FDA-IPAD-004 (standalone status-bar header clipping) and FDA-IPAD-005 (unused right-side viewport). A tablet-only follow-up candidate adds a bounded safe-top fallback and gives the existing `#app`/tablet-shell owner full flex width. Targeted iPad, candidate UI and receipt-lifecycle gates pass locally. All five device defects remain open until full baseline, `main` deployment and repeated user acceptance. Completion remains 96.0/100.0 (96%).


## 0.9.9.8 third iPad acceptance finding — 2026-09-07

The second screenshot confirms the safe-area and full-width repairs visually, while exposing FDA-IPAD-006: iPad painted the native disappearing selector white inside the dark composer. The bounded CSS-only candidate themes the existing selector with the established panel/accent/ink variables and preserves an accessible 42px target. No render, Firebase, storage, E2EE or receipt owner changes. Targeted gates and user acceptance remain required; completion remains 96%.

## FDA-IPAD-006 deferred visual-alignment evidence — 2026-09-07

The deployed theme repair removed the white native selector and preserved readability, but user-device evidence shows the selector is not aesthetically aligned with the quick-reply widgets. At the user's direction, no additional code change is made now. Keep FDA-IPAD-006 OPEN — DEFERRED and combine its visual-alignment repair with the next necessary 0.9.9.8 acceptance defect repair. No Firebase, E2EE, storage, receipt or disappearing-message ownership change is authorized. Completion remains 96%.

## FDA-DM-001 direct send stall — 2026-09-07

The first resumed direct-message device test failed: the iPad message `IPAD TEST 1` remained at Sending for more than one minute. The encrypted Outbox row is created and Sending is rendered before authoritative reconnect reconciliation completes. Its server-read chain is unbounded, so a stalled Firebase promise can leave the message at Sending before the actual encrypted Firestore write is attempted. This is a critical 0.9.9.8 acceptance blocker. Repair must remain inside the existing serialized Outbox/reconnect path and fail closed without fabricated receipts. Completion remains 96%.

## FDA-DM-001 bounded repair candidate — 2026-09-07

The existing `app.js` Outbox/reconnect owner now applies a 12-second boundary to authoritative reconciliation. A timeout returns only unattempted Outbox-backed Sending rows to Queued, preserves their encrypted Outbox records, and explicitly reports the Firebase timeout for the initiating sender. Attempted rows cannot be selected and no receipt state is manufactured. Permanent regression coverage is wired into the full baseline; targeted Outbox, receipt and runtime-authority gates pass locally. Full baseline, corrected `main` deployment and real-device acceptance remain required. Completion remains 96%.

## FDA-DM-001 expanded repair after failed retest — 2026-09-07

The first promoted candidate did not pass device acceptance: an existing Failed message returned to Sending and two newly sent messages remained Sending for more than one minute. The corrected candidate now serializes the complete reconcile/encrypt/send cycle, bounds every Firebase-dependent direct-send stage, prevents attempted rows from returning to the replay queue, and revises the service-worker shell cache while retaining runtime 0.9.9.8. This is still a candidate. Full baseline, corrected `main` deployment and fresh user-device proof remain mandatory. Completion remains 96%.

### Expanded candidate validation and deployment — 2026-09-07

Commit `90460aea19c0d5204c91b2542d59905b1edff246` passed full Rebuild Baseline Security Gate `34085040014`. It was promoted to `main` at `321d182cbd08cb690fa4df7caf96221ef69d09b4`; Pages run `34085354728` succeeded and live code/cache anchors were verified. FDA-DM-001 remains OPEN pending the user's fresh installed-iPad observation and authenticated Firebase send/receipt proof. Completion remains 96%.

## Current device evidence — queued correctly; Firebase connectivity unresolved — 2026-09-07

The second iPad launch shows both preserved messages as Queued. The repair therefore prevents indefinite Sending and preserves Outbox authority without false receipts. The underlying authenticated Firebase path still does not complete, so FDA-DM-001 remains open and further test sends are paused pending connectivity diagnosis. New minor FDA-IOS-001 records the iPhone's blank startup/login interval and defers an accessible spinner/loading state to a later bundled minor repair. Completion remains 96%.

## FDA-DM-001 authenticated Firebase session repair candidate — 2026-09-07

The Verify action was incorrectly bypassing the serialized authoritative reconcile/Outbox cycle and calling the lower-level queue flush. The candidate removes that competing trigger, routes all verification retries through the established owner, and uses sole `firebase.js` owner to force-refresh the authenticated ID token before reconciliation. Bounded errors identify auth refresh, reconciliation, peer resolution, envelope preparation or send confirmation. The user did not compare fingerprints before pressing Verify, so verification is treated only as a saved trust decision; keys are not reset. Runtime remains 0.9.9.8, completion remains 96%, and the defect stays open pending gate/deployment/device proof.

Candidate `6e6d5e84beb7e12173a5708835842512d44a92d4` passed complete baseline `34087534090` and was promoted to `main` as `529a56d1f8e45d463a47d8c6150f95b4937ee87b`. Firebase adapter run `34087731108` and Pages run `34087730948` succeeded. Live code/cache/config anchors were verified. FDA-DM-001 remains open solely pending fresh two-device transport/receipt evidence; completion remains 96%.

## 0.9.9.8 retry-backlog/startup/PIN fail-closed candidate — 2026-09-07

Fresh device evidence rejected the preceding candidate: launch remained blank for more than two minutes, the iPhone PIN appeared unset, and `ipad test 3` returned Sending → Queued after restart. The current candidate coalesces the three lifecycle recovery triggers instead of stacking bounded cycles; removes mandatory network token refresh from ordinary sends; shows retained Firebase stage errors; adds a large static startup spinner before asynchronous bootstrap; and treats local PIN storage failure as locked/unavailable rather than unconfigured. FDA-DM-001, FDA-IOS-001 and new FDA-IOS-002 remain open. Runtime remains 0.9.9.8 and completion remains 96%.

Authoritative `429855f037c3f9f0fb2a0f31ff1371a21f273922` passed full baseline `34125430406`; promoted `main` is `2dcbd8a558ed8bf355ebec1c6bbc82e59948b29f`; Pages `34125666157` succeeded. Live corrected anchors and protected config were verified. Device acceptance remains required and completion remains 96%.

## Device result: startup/PIN repaired; Account E2EE remains locked — 2026-09-07

The user accepted the new startup spinner on iPhone/iPad and successfully used the original iPhone local PIN. FDA-IOS-001 and FDA-IOS-002 are resolved. The iPad now exposes the actual pre-send blocker: its account E2EE identity is not unlocked. This is expected fail-closed behavior from the account-authoritative message service and does not prove Firebase communication failure. Do not reset keys or verify the changed peer fingerprint without comparison. Next acceptance action is to inspect the existing Settings → Account Encryption state and deliberately unlock the same durable identity. FDA-DM-001 remains open; completion remains 96%.

### 0.9.9.8 outgoing account-message read repair — 2026-09-07

Both devices now report Account Encryption READY. Preserved rows reached Sent, establishing Firebase write acceptance, but sender-side reading used the incoming-only direction. The candidate adds direction-aware v3 reading to the existing account message service, rejects unknown senders, retains exact AAD/keyId checks, and permanently tests both directions. Compatibility-device warning text no longer falsely says account E2EE is paused; no fingerprint is trusted automatically. Cache revision is `001e`. Full baseline, promotion and device proof remain required. Completion remains 96%.

First full runs `34130208522` and `34130353052` reached the Outbox gate after every earlier step passed, then failed because its exact cache-revision assertion remained pinned to `001d`. The candidate requires `001e`; update only that expected revision and rerun the entire baseline. This is test maintenance for deterministic cache invalidation, not a weakened invariant.

Corrected commit `fbfb296b2c29ce367fae7c38abc2b5147f14d509` passed full baseline `34130779064`. The sender-side read repair is repository-validated. Do not promote completion credit: exact-tree `main` deployment and user-device readable Sent → Delivered → Read remain required. Overall completion remains 96%.

Final docs tree `243e1698f5efad09e03587cce0c8689c81ff4659` passed full baseline `34131152754`, was promoted exactly to `main` as `a08d985a8308b9f9da9fabc3c127beefc452fe04`, and Pages `34131445802` succeeded. Device retest is next. 0.9.9.8 remains IN PROGRESS and total remains 96%.

Current FDA-DM-002 candidate adds pending-message deletion. Only outgoing Queued/Sending/Failed rows expose it. Cancellation stays inside the serialized encrypted Outbox authority and removes local traces without Firestore deletion. Full gate, deployment and device proof remain required; completion stays 96%.

The next bounded deletion layer is built but not deployed: sender-owned accepted direct messages route through server-only `deleteDirectMessageForEveryoneV1`; see `MESSAGE-DELETION-AUTHORITY.md`. Live IAM/Function deployment requires explicit authorization. The approved key UX is email/password plus one six-digit FIDUNIO PIN, with internal key details hidden; see `USER-ACCESS-KEY-UX.md`. Implementation remains incomplete and earns no point. Completion stays 96%.

## 0.9.9.8 single-PIN/security presentation candidate — 2026-09-07

Ordinary Settings now retains only Account email/password, one Security area, one six-digit FIDUNIO PIN, and optional device unlock. Separate Device Identity and Account Encryption options and technical key/fingerprint presentation are absent. Existing local-security and account-E2EE derivations remain separate and established owners remain unchanged. First setup writes the local verifier from the same transient PIN only after E2EE succeeds; a different existing installation PIN fails closed. Focused UX and established candidate/iPad/runtime gates pass locally. Full baseline, deployment and device proof remain required; completion stays 96%.

Candidate commit `5e22a9484029d02f9f6691b82329a55d4695c848` passed complete Rebuild Baseline Security Gate `34139245770`; Pages run `34139244639` succeeded. Repository/deployment criteria are green. Device acceptance remains required. Accepted-message Delete for Everyone remains deliberately disabled until its dedicated least-privilege callable is explicitly provisioned and deployed. Completion remains 96%.
