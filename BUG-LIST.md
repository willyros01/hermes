# FIDUNIO / Hermes Bug List

This file is the durable working bug list for current development. Keep it concise, factual, and update status as issues are verified or resolved.

## Open bugs

### Fire HD 8 / Account Isolation
- **Account-local data is not isolated when different FIDUNIO users sign in on the same browser/device.**
  - Reported on Fire HD 8 after signing out of Alpha Account/Willy Rosales and signing in as Kyrie Rosales.
  - 0.9.5.2 still showed duplicate/misnamed conversation rows and mixed content from other accounts. Some old messages were plain text and some displayed as encrypted/unavailable.
  - The old Maria Santos / John Cruz / Family Group prototype conversations also reappeared on a fresh account boundary.
  - Additional root cause found: when no persisted `app-state` exists, legacy `app.js` starts from hard-coded prototype conversations/messages. The old bootstrap cleanup only cleaned persisted data, so a newly isolated empty account could expose those defaults again.
  - Additional migration problem found: 0.9.5.2 could faithfully preserve an already-contaminated pre-isolation `app-state`/history snapshot. Once mixed data exists, it cannot be safely assigned to one UID.
  - **0.9.5.3 TEST BUILD:** starts a new v3 account vault boundary. Pre-v3 app-state, Outbox, and history are treated as mixed/untrusted and quarantined instead of assigned to any account. Only a uniquely attributable E2EE identity/keypair may be preserved for its matching UID.
  - Each v3 account with no trusted snapshot receives an encrypted empty `app-state` before `app.js` loads, preventing the hard-coded prototype conversations from becoming the visible starting state.
  - Once an account is active under v3, subsequent UID switches save/restore that account's own app-state, Outbox, history, and E2EE/device identity normally.
  - Local PIN/config and the local encryption-at-rest key remain installation-wide.
  - Status: **awaiting Fire HD 8 validation on 0.9.5.3.**
  - Must preserve validated 0.9.5.1 Settings lifecycle; do not reuse the rejected 0.9.4.12 implementation.

### E2EE device identity proliferation / startup race
- **Root cause confirmed in 0.9.5.6 audit:** `initializeFirebaseLayer()` can request E2EE publication from both the auth-state callback and again after Firebase initialization resolves. The old keypair and device-ID create-if-missing functions were not protected by one initialization mutex, so concurrent first-start callers could generate competing ECDH keypairs/device IDs.
- This explains the large number of historical device IDs/envelopes seen in the diagnostic.
- **0.9.5.7 focused prevention build:** creates the keypair + device ID as one serialized pair, blocks silent repair of partial identity state, and serializes duplicate cloud publication. Ordinary startup no longer restores/replaces the active identity from quarantine.
- Cloud publication remains idempotent for the same device ID; stale historical device cleanup will be a separate explicit reset step after stability validation.
- Test gate: record the current diagnostic device ID, refresh/reopen several times and sign out/in once; the device ID and fingerprint must remain exactly unchanged and new messages must still send/decrypt/transition to Read.
- Status: **awaiting iPad/iPhone validation before cleanup/reset.**

### E2EE historical identity continuity
- **0.9.5.5 focused recovery build:** older E2EE-v2 messages can show `[Encrypted message — not available on this device]` after the v3 account-storage migration even though the same messages previously decrypted and retained correct Read receipts.
- Root cause under repair: the pre-v3 device keypair/identity may have been quarantined because account-level `e2eePublicJwk` is not a reliable ownership signal in a multi-device account; another device can overwrite that compatibility field.
- 0.9.5.5 resolves legacy identity ownership against the full per-user device registry (device ID and public JWK), requires exactly one matching UID, and only then restores the quarantined keypair/device identity to that active account.
- The post-migration v3 snapshot is preserved under a recovery checkpoint before any identity restore. Ambiguous ownership remains quarantined and is never guessed.
- Messaging transport, receipt logic, service-worker E2EE-v2 transform, Settings, PIN, and account-state payloads are otherwise unchanged in this increment.
- 0.9.5.5 result on iPad: current 0.9.5.4-era messages remain readable with correct receipts, but older 6:58/6:59 PM E2EE-v2 messages still report unavailable. Therefore 0.9.5.5 did not recover the historical identity.
- **0.9.5.6 diagnostic-only build:** adds a separate `e2ee-diagnostics.html` page that inventories existing local/vault device IDs and public-key fingerprints and compares them with cloud message envelope device IDs. It is read-only: no app-state, key, vault, message, receipt, or Firebase writes.
- Status: **diagnostic collection pending. No further key recovery until the report identifies whether the historical device identity still exists locally.**

### PIN / Local Security
- **Remove Local PIN does not work.**
  - Reported on FIDUNIO 0.9.5.1.
  - Other tested local-security controls are working: Change PIN, Lock Now, inactivity timeout, and existing PIN flows.
  - Treat as a focused local-security defect. Do not redesign the PIN/biometric architecture to fix it.

## Recently validated

### Settings lifecycle / late-added panels
- FIDUNIO 0.9.5.1: Profile, User Administration, and Invitations now appear immediately and remain available after leaving/re-entering Settings.
- On first cold load, Invitations may briefly show a loading state before data appears; subsequent opens are immediate. This is currently considered normal data-fetch latency, not a Settings lifecycle failure.
- Protected checkpoint branch: `checkpoint-0.9.5.1-settings-pass`.

### Group administration bounded bridge — resolved 2026-09-06
- Repository-first audit found `e2ee-account-group-app-integration.js` exported `renameGroupForApp`, `addGroupMemberForApp`, `removeGroupMemberForApp`, and `leaveGroupForApp` but did not import the delegated controller functions.
- Root cause: the earlier source-presence gate verified wrapper text/ownership boundaries but did not verify that each delegate was actually imported.
- Fixed in commit `8b72f00744cc4b882c7fb1df0ce48d3959f563ec`; `e2ee-account-group-app-integration.test.mjs` now gates all four controller imports and delegation paths.
- No Firebase, crypto, UI, or ownership boundary was moved. This is a bounded wiring repair.

### Disappearing restart/reconnect crash ambiguity — resolved 2026-09-06
- FIDUNIO 0.9.6.25 closes the post-commit/pre-observation replay ambiguity with the user-approved fail-closed policy.
- The local Outbox records `sendAttempted` before cloud transmission; an attempted message that is later absent from an authoritative server read is never auto-replayed.
- This prevents accepted-then-expired content from being resurrected after a browser crash without introducing a server tombstone or accepted-ID registry.
- Full baseline security gate `34060880885` passed; 0.9.6.25 is repository-validated.

## Development rule
- Before fixing any item in this list, read `CODING-GUIDELINES.md` and identify the owner, scope, lifecycle trigger, and serialized write path for the resource being changed.

## 0.9.6.3 validation boundary

No repository-gate failure is open for the account-E2EE v3 materialization. The remaining item is a required live-device validation gate, not a known code defect: first authenticated enrollment/unlock/recovery with stable keyId/history, followed by two-device e2ee:3 send/read/offline-Outbox verification. App Check remains OFF until that succeeds.

### iPad/two-pane Sent -> Read repository stabilization — 0.9.6.30
- The duplicate direct-message pre-projection Read mutation path was removed; the active direct subscription now owns one deterministic Read write/projection path.
- Foreground visibility/pageshow recovery remains explicit and group receipt updates remain serialized by the group conversation owner.
- Permanent lifecycle gate and full baseline `34062508968` pass.
- Status: **repository stabilization complete; real iPad/iPhone acceptance remains scheduled for 0.9.9.7 and is not claimed from repository tests alone.**

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
