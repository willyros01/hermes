# FIDUNIO Device-Acceptance Bug Ledger

**STATUS: CRITICAL DURABLE DOCUMENT — READ AND UPDATE DURING EVERY USER-DEVICE ACCEPTANCE OR RC-STABILIZATION TASK**

This root-level ledger records defects found only through real-device acceptance. It supplements `BUG-LIST.md`; it does not replace the authoritative build ledger in `FIDUNIO-BUILD-CHECKLIST.md`.

## Required record fields

Every entry must preserve: bug ID, build, date, reporter/device, severity, acceptance area, expected behavior, observed behavior, evidence, architecture constraints, status, repair build, validation evidence, and exit criteria.

## Open defects — 0.9.9.7 device acceptance

### FDA-IPAD-001 — Conversation-screen widgets missing

- **Build under test:** 0.9.9.8 deployed from `main`
- **Date reported:** 2026-09-06
- **Reporter/device:** User; iPad landscape; existing Home-Screen installation
- **Severity:** HIGH — release-candidate blocker
- **Acceptance area:** iPad/tablet two-pane conversation UI
- **Expected behavior:** The established supported conversation widgets/tools remain visible and usable in the conversation pane, consistent with the protected iPad checkpoint.
- **Observed behavior:** The conversation-screen widgets are absent.
- **Evidence:** User report and supplied iPad landscape screenshot during 0.9.9.7 acceptance.
- **Architecture constraints:** Preserve the established responsive owner and two-pane lifecycle. Do not add a competing renderer, MutationObserver repair, orientation timing hack, or reload synchronization.
- **Status:** OPEN — REPRODUCED BY USER
- **Repair build:** 0.9.9.8 RC stabilization
- **Exit criteria:** Supported widgets are restored on iPad portrait and landscape; iPhone compact behavior remains unchanged; repository UI/lifecycle gates pass; user repeats and accepts the device test.

### FDA-IPAD-002 — Text size regressed on iPad

- **Build under test:** 0.9.9.8 deployed from `main`
- **Date reported:** 2026-09-06
- **Reporter/device:** User; iPad landscape; existing Home-Screen installation
- **Severity:** HIGH — accessibility and release-candidate blocker
- **Acceptance area:** Readable larger-text behavior
- **Expected behavior:** The established readable text scale and Settings A/A+/A++ behavior apply consistently to the iPad conversation experience.
- **Observed behavior:** Conversation-screen text is materially smaller than the previously accepted iPad presentation.
- **Evidence:** User report and supplied iPad landscape screenshot during 0.9.9.7 acceptance.
- **Architecture constraints:** Preserve the existing Settings owner and accessible text-scale tokens. Do not create a second settings/text-size owner or solve this with device-specific timing.
- **Status:** OPEN — REPRODUCED BY USER
- **Repair build:** 0.9.9.8 RC stabilization
- **Exit criteria:** User-readable text sizing is restored on iPad portrait and landscape without breaking iPhone wrap-around or larger-text layouts; repository responsive/settings gates pass; user accepts the result.

### FDA-IPAD-003 — Conversation pane overlaps established iPad layout

- **Build under test:** 0.9.9.8 deployed from `main`
- **Date reported:** 2026-09-06
- **Reporter/device:** User; iPad landscape; existing Home-Screen installation
- **Severity:** CRITICAL — layout integrity and release-candidate blocker
- **Acceptance area:** iPad/tablet adaptive two-pane layout
- **Expected behavior:** Navigation/list and conversation panes occupy their predefined non-overlapping areas, with established controls fully visible.
- **Observed behavior:** The conversation screen overlaps other iPad layout content.
- **Evidence:** User report and supplied iPad landscape screenshot during 0.9.9.7 acceptance.
- **Architecture constraints:** Preserve one responsive route/body owner and one deterministic render path. No second orientation listener, MutationObserver lifecycle repair, reload synchronization, or arbitrary delay.
- **Status:** OPEN — REPRODUCED BY USER
- **Repair build:** 0.9.9.8 RC stabilization
- **Exit criteria:** No overlap in iPad portrait or landscape, including rotation and foreground return; the two-pane layout and iPhone single-pane layout remain intact; full required repository gate passes; user repeats and accepts the device test.

## Acceptance consequence

The 0.9.9.7 real-device acceptance pass is **FAILED / BLOCKED** by FDA-IPAD-001 through FDA-IPAD-003. The 0.9.9.8 stabilization point remains unearned. Promotion readiness 0.9.9.9 and 1.0 promotion are prohibited until these defects are repaired, repository-gated, redeployed, and accepted by the user. Whole first-rebuild completion remains **96.0 / 100.0 (96%)**.


## 0.9.9.8 repair candidate — 2026-09-07

- **FDA-IPAD-001 diagnosis:** the supported composer remains in `renderChat`, but the reported device entered the empty-conversation route. The tablet tool CSS also retained an obsolete eight-column allocation after the supported tool set was reduced to Photo/File/Audio/Video. The candidate adds explicit direct/group cloud-discovery pending/error presentation and changes only the tablet tool allocation to four columns. It does not fabricate a conversation or restore quarantined data.
- **FDA-IPAD-002 diagnosis:** the protected root A/A+/A++ owner remains intact, but tablet chrome used fixed pixel sizes that did not scale from it. The candidate converts affected tablet brand/navigation/tool labels to `rem`-based sizing. It does not create another Settings owner.
- **FDA-IPAD-003 diagnosis:** Sign Out was added inside the same narrow tablet icon cluster used by Settings and New Conversation after the protected checkpoints. The candidate gives Sign Out its own bounded sidebar row while retaining the established sidebar renderer.
- **Repository evidence:** targeted `test:ipad-rc-stabilization`, release-candidate UI/lifecycle and Storage-wiring gates pass locally. Full baseline and user-device acceptance are still pending.
- **Status:** REPAIR CANDIDATE — NOT CLOSED. Closure still requires full green baseline, promotion to `main`, Pages success and repeated user iPad portrait/landscape acceptance.


### FDA-IPAD-004 — Standalone status bar obscures tablet headers

- **Build under test:** 0.9.9.8 repair promoted to `main`
- **Date reported:** 2026-09-06 device time / 2026-09-07 work session
- **Reporter/device:** User; iPad landscape; existing Home-Screen installation
- **Severity:** CRITICAL — layout/accessibility blocker
- **Expected behavior:** Sidebar and chat headers begin below the iPad status bar.
- **Observed behavior:** FIDUNIO branding and the active conversation header are partially hidden beneath the system status bar.
- **Evidence:** User screenshot after first 0.9.9.8 repair deployment.
- **Diagnosis:** Home-Screen mode can report a zero CSS safe-area inset even while the status bar overlays the page; the prior fallback padding was insufficient.
- **Repair candidate:** A tablet-only bounded top reserve on the existing sidebar/header owners.
- **Status:** REPAIR CANDIDATE — NOT CLOSED.
- **Exit criteria:** Both headers remain fully visible in iPad portrait/landscape and after foreground return; user accepts the result.

### FDA-IPAD-005 — Tablet shell leaves unused right-side viewport

- **Build under test:** 0.9.9.8 repair promoted to `main`
- **Date reported:** 2026-09-06 device time / 2026-09-07 work session
- **Reporter/device:** User; iPad landscape; existing Home-Screen installation
- **Severity:** HIGH — adaptive-layout blocker
- **Expected behavior:** The established two-pane shell fills the available iPad application window.
- **Observed behavior:** The two-pane application occupies only the left portion of the display and leaves a large unused black area on the right.
- **Evidence:** User screenshot after first 0.9.9.8 repair deployment.
- **Diagnosis:** The tablet shell used viewport width inside a flex body while the `#app` owner itself had no explicit full-width flex growth contract in standalone mode.
- **Repair candidate:** Give the existing `#app` owner full flex width and size the existing tablet shell to that owner; no new layout owner.
- **Status:** REPAIR CANDIDATE — NOT CLOSED.
- **Exit criteria:** Two-pane shell fills the available iPad portrait/landscape window without breaking compact iPhone layout; user accepts the result.

### First repair device evidence

The same screenshot confirms that the Firestore conversation “Jax Rosales,” quick phrases, disappearing selector and message composer were restored, and Sign Out no longer crosses horizontally into the chat pane. FDA-IPAD-001 and the horizontal component of FDA-IPAD-003 are therefore visibly improved but remain open until the complete corrected layout and four-tool panel are user-accepted. FDA-IPAD-002 remains open pending the user’s readability judgment.


### FDA-IPAD-006 — Native disappearing selector breaks dark visual family

- **Build under test:** 0.9.9.8 second repair promoted to `main`
- **Date reported:** 2026-09-06 device time / 2026-09-07 work session
- **Reporter/device:** User; iPad landscape; existing Home-Screen installation
- **Severity:** MEDIUM — visible RC polish/accessibility defect
- **Expected behavior:** The disappearing-message selector uses the established navy/teal/gray visual family and remains readable with a large touch target.
- **Observed behavior:** iPad renders the selector as a bright white native button inside the dark composer.
- **Evidence:** User screenshot after the full-width/safe-area repair.
- **Diagnosis:** The native iPad select appearance was not explicitly themed.
- **Repair candidate:** CSS-only styling on the existing `#disappearSelect` owner with panel background, teal indicator, readable foreground, focus outline and 42px minimum target.
- **Status:** REPAIR CANDIDATE — NOT CLOSED.
- **Exit criteria:** Selector visually matches the dark composer in iPad portrait/landscape and remains readable/operable; user accepts the result.

#### Post-deployment user evidence — 2026-09-07

The user confirmed that the bright white native appearance is removed and the control is readable, but rejected its visual integration: the selector's size, shape, spacing and alignment do not match the adjacent quick-reply widgets. Per the user's direction, do not make another isolated cosmetic change now. Keep FDA-IPAD-006 **OPEN — DEFERRED** and address it with the next necessary 0.9.9.8 acceptance repair. The eventual repair must align the existing selector with the established widget visual language without changing its disappearing-message owner, behavior or accessible target size.

The same screenshot provides positive evidence for FDA-IPAD-004 and FDA-IPAD-005: both headers clear the status bar and the two-pane shell fills the available width. Those items remain open only until explicit user acceptance.

### FDA-DM-001 — Direct message remains at Sending indefinitely

- **Build under test:** 0.9.9.8 promoted to `main`
- **Date reported:** 2026-09-07 device time and work session
- **Reporter/device:** User; iPad landscape; existing Home-Screen installation; cloud direct conversation with Jax Rosales
- **Severity:** CRITICAL — real direct-message transport acceptance blocker
- **Expected behavior:** A connected encrypted direct message advances from Sending to Sent after Firestore acknowledgment; a temporarily unavailable Firebase path remains safely queued or exposes a bounded failure instead of waiting forever.
- **Observed behavior:** `IPAD TEST 1` remained at Sending for more than one minute and did not reach the receiving device during the observation period.
- **Evidence:** User screenshot showing the outgoing message at 12:07 AM still labeled Sending after the user reported more than one minute of no progress.
- **Diagnosis:** `sendCurrent()` persists the encrypted Outbox row and paints Sending before `flushQueuedAfterAuthoritativeReconcile()` completes. That path awaits authoritative `getDocFromServer` / `getDocsFromServer` reconciliation with no bounded timeout. Safari may report `navigator.onLine` while the Firebase server path is stalled, leaving the UI indefinitely at Sending before the actual encrypted Firestore send is attempted. Current evidence does not prove that the message reached Firestore.
- **Required repair constraint:** Preserve `app.js` as the sole Outbox/reconnect mutation owner and `firebase.js` as the sole Firebase SDK owner. Add a bounded, fail-closed transition so a pre-send reconciliation stall cannot remain Sending forever; never manufacture Sent/Delivered/Read and never create a second replay path.
- **Status:** REPAIR CANDIDATE — NOT CLOSED.
- **Exit criteria:** Permanent regression coverage proves bounded pre-send reconciliation behavior and Outbox preservation; full baseline passes; corrected `main` deployment passes real iPad-to-iPhone encrypted send plus automatic Sent → Delivered → Read acceptance without a reply from the receiving device.

#### FDA-DM-001 bounded repair candidate — 2026-09-07

The existing `app.js` serialized Outbox/reconnect owner now bounds authoritative reconciliation at 12 seconds. On timeout, the pure policy selects only visible Sending rows that still have an encrypted Outbox record with `sendAttempted !== true`; `app.js` returns those rows to Queued, persists state, renders, and shows the explicit sender `Firebase did not respond in time. The message remains safely queued.` Attempted rows are never selected, the timeout deletes no Outbox record, and no Sent/Delivered/Read state is created. `firebase.js`, Firebase rules and protected configuration are unchanged. Permanent `outbox-reconciliation-boundary.test.mjs` coverage and targeted Outbox/receipt/runtime gates pass locally. Full baseline, `main` promotion and user-device retest remain required.

#### First candidate failed device retest; expanded repair candidate — 2026-09-07

After the first candidate passed the repository gate and was promoted, the existing `IPAD TEST 1` initially appeared Failed. When the user sent new messages, the original row returned to Sending and both new rows remained Sending for more than one minute. This proves the reconciliation-only boundary was insufficient and exposed a second defect: reconciliation was serialized, but multiple lifecycle triggers could start overlapping post-reconciliation Outbox flushes. The expanded candidate serializes the entire reconcile → prepare/encrypt → attempt-marker → Firestore-confirmation cycle inside the existing `app.js` owner. It retains a 12-second boundary at reconciliation, peer resolution, envelope/key preparation and send confirmation. Pre-attempt timeout returns only unattempted work to Queued; post-attempt ambiguity remains Failed and cannot auto-replay. A disallowed attempted row can no longer be changed back to Queued by `flushQueued()`. The service-worker shell now includes the boundary module and uses cache revision `0.9.9.8-fda-dm-001b` so the same-version repair is deterministically installed. Status remains **REPAIR CANDIDATE — NOT CLOSED**.

Repository and deployment evidence: expanded candidate commit `90460aea19c0d5204c91b2542d59905b1edff246`; full Rebuild Baseline Security Gate `34085040014` SUCCESS; promoted `main` commit `321d182cbd08cb690fa4df7caf96221ef69d09b4`; Pages deployment `34085354728` SUCCESS; live `app.js`, boundary module and service-worker cache revision verified. FDA-DM-001 remains open pending fresh user-device evidence and authenticated Firebase communication proof.

#### Expanded-candidate iPad evidence — 2026-09-07

After the required second launch, both preserved messages display Queued rather than remaining Sending. This confirms the revised service-worker cache loaded, the bounded pre-attempt state transition executed, encrypted Outbox rows were retained, and no false receipt state was manufactured. It also confirms the underlying authenticated Firebase communication path did not complete during the bounded interval. FDA-DM-001 remains **OPEN — FIREBASE COMMUNICATION DIAGNOSIS REQUIRED**; do not send additional test messages until connectivity is isolated.

### FDA-IOS-001 — Blank screen during iPhone startup/authentication

- **Build under test:** 0.9.9.8 promoted to `main`
- **Date reported:** 2026-09-07 device time and work session
- **Reporter/device:** User; iPhone; existing FIDUNIO installation
- **Severity:** MINOR — deferred startup feedback/accessibility defect
- **Expected behavior:** During a lengthy startup/authentication wait, show a prominent accessible progress indicator and clear loading message until the first usable screen appears.
- **Observed behavior:** Logging in took a long pause and the iPhone displayed a blank screen until the first screen appeared.
- **Evidence:** User report during the FDA-DM-001 retest.
- **Probable scope:** Existing startup/authentication lifecycle presentation only. Do not add a second auth owner, polling loop, reload synchronization or timing-based lifecycle repair.
- **Requested disposition:** Record now and combine with other minor acceptance issues in a later bounded repair.
- **Status:** OPEN — DEFERRED; NO CODE CHANGE AUTHORIZED NOW.
- **Exit criteria:** Existing deterministic startup/auth owner exposes a readable loading state with visible spinner until routing is ready; iPhone startup test confirms there is no unexplained blank interval.

#### FDA-DM-001 authenticated-session/verification-path repair — 2026-09-07

The user clarified that each device's Verify button was pressed without comparing fingerprints. That action is a stored trust decision, not proof that the fingerprints matched; no key reset or regeneration is authorized. Code diagnosis found a concrete ownership defect: the Verify handler called `flushQueued()` directly and bypassed the authoritative serialized reconcile/Outbox cycle. The candidate routes verification-triggered work through `flushQueuedAfterAuthoritativeReconcile()`. Before reconciliation, sole Firebase SDK owner `firebase.js` forces a current authenticated ID token. The 12-second boundary now names the exact failing stage: authentication refresh, reconciliation, peer resolution, envelope preparation, or send confirmation. Pre-attempt ambiguity remains Queued; post-attempt ambiguity remains Failed; no receipt is fabricated. Cache revision is `0.9.9.8-fda-dm-001c`. Protected Firebase configuration and Firebase rules are unchanged. FDA-DM-001 remains OPEN pending full gate, `main` deployment, and real Sent → Delivered → Read proof.
