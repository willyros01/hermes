## Disappearing attachments — 0.9.9.19

**Status: NOT YET DEVICE-TESTABLE until live backend handoff succeeds.** After deployment, test a fresh direct photo and a fresh group attachment with 5 minutes: recipients can open before expiry; expiry begins from the accepted Read authority; after expiry the message and encrypted attachment disappear from all devices; close/reopen must not restore them; unread attachments must remain beyond the duration until authoritative Read.

## Date/time presentation — 0.9.9.18

**Status: DEVICE ACCEPTED.** Group date, sender name/time, and direct date separator are working.

## Direct chat date separators — 0.9.9.18 correction

**Status: DEVICE CANDIDATE.** 0.9.9.17 failed: direct chats showed no date separator. Root cause was projection loss of authoritative Firestore `createdAt`, not the renderer. 0.9.9.18 carries `createdAt` into direct display rows. Confirm existing and new direct messages show the horizontal-line `Month D, YYYY` separator, same-day messages share one separator, times remain visible, and close/reopen preserves it.

## Direct chat date separators — 0.9.9.17

**Status: DEVICE CANDIDATE.** Confirm iPhone/iPad one-to-one conversations show the same horizontal-line `Month D, YYYY` separator at day boundaries as groups, same-day messages do not repeat the date, message times remain present, and close/reopen preserves the layout. Group sender name/time and group date behavior remain unchanged.

## Group sender time — 0.9.9.16 correction

**Status: DEVICE CANDIDATE.** 0.9.9.15 failed device presentation because existing projected group rows showed sender names without time. 0.9.9.16 resolves time from the legacy display field when present, otherwise from authoritative `createdAt`. Confirm existing and newly sent group messages show `Sender Name  h:mm AM/PM`, date separators remain correct, and close/reopen preserves the display.

## Group sender time — 0.9.9.15

**Status: DEVICE CANDIDATE.** Confirm on iPhone/iPad that each group message shows the creator name with that message's time immediately beside the name, the 0.9.9.14 date separator remains correct, same-day messages do not repeat the date, sender names remain correct, and close/reopen preserves the layout.

## Group date separators — 0.9.9.14

**Status: DEVICE CANDIDATE.** Confirm on iPhone/iPad that a line-and-date separator appears between different calendar dates, the date is `Month D, YYYY`, every message still shows time only, same-day messages do not repeat the date, sender-name labels remain correct, and reopen preserves the layout.

# FIDUNIO Device Acceptance — Current Evidence

## Group chat sender labels — 0.9.9.13

**Status: DEVICE CANDIDATE.**

Acceptance: in an existing group, confirm incoming and outgoing bubbles show the correct FIDUNIO sender name on iPhone and iPad; send from at least two members if available; close/reopen and confirm labels persist; open a direct chat and confirm no sender label is added there.

## Disappearing text — direct-message device acceptance

**Status: DEVICE ACCEPTED for direct text on FIDUNIO 0.9.9.12 — 2026-09-08.**

Fresh real-device acceptance after live scheduler/index recovery passed the complete direct 5-minute path: message sent, recipient opened it and authoritative state advanced to Read, the message physically disappeared on both sender and recipient after the read-based expiry window plus scheduler interval, and after closing/reopening both apps the purged message did not return. This validates the direct-text physical purge and local anti-resurrection path on real devices. Unread protection also passed on real devices: a 5-minute disappearing message remained present beyond five minutes while the recipient had not Read it, proving expiry does not start from send or delivery time. Group acceptance also passed on real devices: the group message was sent and received by all tested recipients, all required Reads were confirmed, the message disappeared from sender and all recipients after expiry, and it did not return after close/reopen. The disappearing-text feature is therefore DEVICE ACCEPTED and closed for this activation checkpoint. Attachments remain intentionally non-disappearing.

## Audio recorder send — MIME normalization

**Status: DEVICE ACCEPTED on FIDUNIO 0.9.9.11 — 2026-09-08.**

Real-device acceptance completed on iPhone after the 0.9.9.11 MIME-normalization correction.

Accepted evidence:

- Audio source chooser behaved correctly.
- Record Audio used the microphone and did not launch the camera.
- A short recording completed successfully.
- Stop & Send no longer produced the unsupported-attachment-type rejection.
- The sender-side audio bubble appeared.
- The recipient received the audio attachment.
- Recipient playback succeeded.
- The previously failing recorder-send path is therefore accepted on the real device.

0.9.9.10 had already established that the chooser and microphone recorder were correct but the send failed after recording because the recorder-provided MIME value was rejected. 0.9.9.11 canonicalizes codec-parameterized recorder MIME values before attachment validation while preserving audio-only validation and the existing encrypted attachment send path.

The audio recorder/send issue is closed for device acceptance.

## Audio tool — source chooser and recorder

**Status: SUPERSEDED BY ACCEPTED 0.9.9.11 — 2026-09-08.**

0.9.9.10 established that **Record Audio / Choose Audio File / Cancel** displayed correctly, Record Audio used microphone capture rather than launching the camera, and the saved-audio chooser used the audio-file path. Its recorded-audio send then exposed the MIME-normalization defect corrected and accepted in 0.9.9.11 above.

## Issue 3 — iPhone composer clearance + video chooser

**Status: DEVICE ACCEPTED on FIDUNIO 0.9.9.9z — 2026-09-08.**

The user reported that the Issue 3 acceptance set was good on the deployed build. This closes the iPhone composer/footer overlap and scroll-position defect and accepts the added Video source chooser. Accepted scope includes the phone bottom-content clearance behavior, the video **Photo Library / Camera / Cancel** chooser, and preservation of the existing attachment send path. No further Issue 3 correction is pending.

## Issue 2 — LTE outgoing-message visibility

**Status: DEVICE ACCEPTED on FIDUNIO 0.9.9.9y — 2026-09-08.**

Real-device acceptance completed on iPhone using the reported failure path:

- Wi-Fi was turned off and the device transitioned to cellular/LTE.
- One unique outgoing text was sent.
- The outgoing bubble appeared immediately.
- No duplicate bubble/message appeared.
- The original dangerous behavior — composer clears while the conversation shows no trace of the send attempt — did not reproduce.

The iPad LTE case is **N/A** because the test iPad has no cellular capability. This is not a missing acceptance test for the reported defect; the defect specifically depended on a Wi-Fi → cellular transition. The permanent regression gate continues to enforce render-before-Outbox ordering in source, while iPhone device proof covers the real network-transition path.

Issue 2 is closed for device acceptance.

## Issue 1 — iOS camera video continuity

**Status: DEVICE ACCEPTED on FIDUNIO 0.9.9.9x — 2026-09-08.**

Real-device acceptance completed after deployment of main commit `4d55154e5998bc6a80ac24a649335c2fe8fcc97d`.

Accepted evidence:

- Settings showed version 0.9.9.9x.
- A roughly 20-second camera video sent successfully from iPhone, appeared locally, and reached the recipient.
- The same roughly 20-second camera-video test succeeded from iPad.
- Cancelling the native camera flow and returning to FIDUNIO did not weaken ordinary background locking; leaving the app afterward required the PIN as expected.
- Returning after a successful camera capture likewise restored normal locking; leaving the app afterward required the PIN as expected.
- After closing and reopening both apps, the successfully sent video remained accessible.

The earlier explanation that the original 20-second failure was caused by a detached file input/background lock interaction was a hypothesis, not instrumented proof of root cause. The deployed 0.9.9.9x picker-session change is accepted because the required real-device behavior now passes; do not rewrite historical evidence to claim the precise original cause was proven.

Issue 1 is closed for device acceptance.

## FIDUNIO 1.1.6 notification routing checkpoint — 2026-09-09

- N4 real-device acceptance passed: a backgrounded iPhone received the generic `FIDUNIO — New message` notification after the live Eventarc/Cloud Run invocation permission was corrected.
- Live N4 trigger: `notifyDirectMessageCreatedV1`; Eventarc trigger region is `nam5`; the trigger service account has `roles/run.invoker` only on the N4 Cloud Run service.

## FDA-NOTIFY-003 — N6 group notification acceptance

- Build: FIDUNIO 1.1.29 correction candidate; 1.1.28 retained as the original N6 implementation checkpoint.
- Severity: release acceptance.
- Expected: an accepted encrypted group message notifies every enabled installation of each current member except the sender; tap/PIN opens the exact group at the new row without hijacking startup, composer or scroll.
- Implementation: server-authoritative current-member fan-out, opaque data-only payload, existing installation inbox/activation mutex, existing group delivery owner with keyed exact-message priority, central render only.
- Status: live Function deployment succeeded. Initial iPad testing routed and displayed the exact group message, but 2 of 4 trials exposed an intermittent Firestore permission banner. Version 1.1.29 prevents same-group stream replacement and closed-stream maintenance. Device acceptance remains open.
- Re-test: iPhone and iPad warm/background and terminated/cold at least five times each; multi-installation fan-out; sender exclusion; multiple-conversation chooser; removed member and deleted message fail-closed; direct notification checkpoint; typing/draft/focus; newest positioning; group receipts, Outbox, attachments and disappearing messages.
- Exit: all repository workflows green, Pages serves 1.1.29, the existing `notifyGroupMessageCreatedV1` deployment remains ACTIVE, and the user accepts the repeated device matrix with no permission banner.
- N5 candidate adds deterministic notification-tap routing. The service worker may focus/open FIDUNIO and pass only opaque direct-message routing intent. `app.js` remains the route/message owner and resolves the conversation through existing Firestore/E2EE state.
- Notification metadata never creates a message row, decrypts content, or writes receipts. Cold-open routing waits behind the normal local PIN/auth gates.
- Device acceptance still required for N5 warm-open and cold-open taps before N5 is closed.

## FIDUNIO 1.1.7 N5 warm-routing correction — 2026-09-09

**Status: DEVICE FAILED.** Warm-open N5 still failed on iPhone after 1.1.7. The generic notification arrived and PIN unlock worked, but FIDUNIO returned to the conversation list instead of the notified conversation.

The 1.1.7 attempt navigated the existing same-origin PWA window to the opaque notification-route URL. That did not reliably survive the iOS suspended-window lifecycle, so it is historical evidence only and is superseded by 1.1.8.

## FIDUNIO 1.1.8 N5 warm-open acceptance — 2026-09-09

**Status: DEVICE ACCEPTED for warm-open direct notification routing.**

The 1.1.8 correction always uses the service worker `openWindow()` notification-route path instead of relying on the existing suspended iPhone PWA window. The route carries only opaque notification type, conversation ID and message ID. The normal PIN gate remains mandatory; after successful PIN unlock, `app.js` remains the sole route/message owner and resolves the authoritative conversation through the existing Firestore/E2EE path.

Real-device acceptance on iPhone passed: the background notification remained the intended generic `FIDUNIO — New message`; tapping it presented the PIN screen; after PIN unlock FIDUNIO opened the notified direct conversation as expected.

N5 is **not yet fully closed**. Cold-open acceptance is still required: fully close FIDUNIO, send one new direct message, tap the notification, complete PIN unlock, and confirm the correct direct conversation opens rather than the conversation list.

## FIDUNIO 1.1.9 — optional sender display-name notifications — 2026-09-09

**Status: REPOSITORY CANDIDATE; live Firestore rules + N4 Function deployment and device acceptance required.** Private notifications remain the default. Each notification installation may explicitly opt in with `showSenderName: true`. The server resolves the sender only from authoritative `users/{senderUid}.displayName`, never from message `senderName`, and sends `FIDUNIO — New message from <display name>` only to opted-in installations. Non-opted installations remain `FIDUNIO — New message`. Message text, attachment names, email, UID, phone, ciphertext and decrypted content remain excluded. This changes no Firestore/E2EE/message/receipt authority.


## FDA-NOTIFY-002 — notification tap returns to Settings on iPhone and iPad

- **Observed:** restored 1.1.9 backend/frontend; both devices follow notification -> tap -> PIN -> Settings.
- **Latency evidence:** iPhone notification approximately 1–2 seconds; reported iPad delivery event approximately 30+ seconds and remains separately unclassified.
- **1.1.17 candidate:** data-only backend payload; one Firebase Messaging service-worker display owner; existing click URL/PIN/app route retained.
- **Not changed:** rogue lifecycle paths, direct projection ordering, Settings, Outbox, receipts, E2EE, groups, attachments and disappearing content.
- **Required acceptance:** exactly one notification; tap/PIN opens exact direct chat on both devices; ordinary resume stays on prior screen; private and sender-name modes; cold/warm paths; same-UID multiple installations.
- **Status:** OPEN — repository, deployment and device proof pending.

### 1.1.17 device result and rejected 1.1.18 — 2026-09-10

- **iPhone:** PASS twice; notification -> PIN -> exact direct conversation, approximately five seconds.
- **iPad:** FAIL twice; notification -> PIN -> Settings. On first resume, Profile and User Administration were still loading.
- **Classification:** iPad resumed-window click-route loss; Settings loading is recorded as supporting lifecycle evidence, not independently classified as a Settings defect.
- **1.1.18 result:** REJECTED. iPad behavior was unchanged twice; user found iPhone 1.1.17 more stable and better performing.
- **Restoration:** remove all 1.1.18 returned-client message/focus code and restore exact 1.1.17 frontend/cache behavior; leave the deployed 1.1.17 backend unchanged.
- **Separate projection evidence:** one iPad message appeared only after leaving/re-entering the conversation; another appeared after about five seconds. Track under FDA-DM-001, not FDA-NOTIFY-002.
- **Status:** OPEN on restored 1.1.17 for clean-baseline investigation.

### 1.1.19 one-shot diagnostic procedure

- Confirm visible version 1.1.19 on both devices.
- In Settings -> Notifications -> Open Notification Diagnostics, choose Clear and Start Test.
- Return to FIDUNIO Settings, background the installed PWA, send exactly one direct message, tap its notification, enter PIN and observe the final screen.
- Reopen Notification Diagnostics, Refresh, Copy Full Report and return the complete report.
- Run iPad first, then repeat once on iPhone as control; do not clear either ledger until its report is copied.
- Record notification delay, any flicker/overlay, final screen and whether the message was already visible or required leave/re-entry.

### 1.1.19 one-shot iPad result — CONCLUSIVE

- FCM background callback: PASS; correct direct-message conversation/message identifiers received.
- Worker notification display: PASS, 86 ms after callback.
- FIDUNIO `notificationclick`: ABSENT.
- Worker client enumeration/`openWindow()`: NOT EXECUTED.
- Resumed URL: plain `/hermes/`, without notification route.
- App pending route through PIN/Firebase readiness: `null`.
- Direct conversation after PIN: restored matching `selectedId`; not notification-route success.
- Firestore/E2EE message presence: PASS; new message included in authoritative 48-row snapshot.
- Projection timing: approximately 3.7–4.0 seconds, with repeated subscription/projection passes; track separately from FDA-NOTIFY-002.
- FDA-NOTIFY-002 status: OPEN, root boundary proven upstream of application routing.
- Diagnostic allocation: CLOSED; no further diagnostic release.
- Next acceptance design: installation-local pending inbox; sole pending route opens, multiple pending routes show chooser; test manual-open tradeoff explicitly.

### FIDUNIO 1.1.20 mandatory notification acceptance

After confirming 1.1.20 and completing two installed-PWA launches on each device: (1) leave Settings selected, background, receive one notification, tap, enter PIN and confirm the exact direct conversation on iPad and iPhone; (2) repeat from Messages and from another direct conversation; (3) confirm an ordinary resume with no newly displayed notification preserves the prior screen; (4) send two notifications for one conversation and confirm one direct destination; (5) send notifications from two conversations and confirm the New messages chooser selects the requested conversation; (6) explicitly document that manual launch after a notification may consume the sole pending route on iPad; (7) confirm the new message appears, is readable and produces authentic Delivered/Read behavior; (8) send/receive text and one existing attachment to prove the message pipeline is untouched. No further diagnostic build is permitted.

### FIDUNIO 1.1.21 notification and composer acceptance

1.1.20 is rejected by device evidence: iPad routed twice and then stopped; iPhone did not route. For 1.1.21, activate the new worker with two complete launches per device. On both iPhone and iPad, repeat at least three times from Settings: background/lock, receive, tap, PIN, exact direct conversation. Repeat once from Messages and once from another conversation. Verify ordinary resume without a newly displayed notification preserves the prior screen and verify the multiple-conversation chooser.

FDA-COMPOSER-001 acceptance: type a distinctive unsent multi-line draft and leave the keyboard active while (1) an incoming message arrives, (2) its receipt/status changes, (3) connectivity changes, and (4) the app backgrounds/resumes through PIN. At each step verify identical draft text, keyboard/focus, caret position and stable scroll. Then send once and confirm exactly one bubble plus authentic Sent/Delivered/Read. Repeat on iPhone, iPad portrait and iPad landscape. Repeat with one attachment completing in the open conversation. No diagnostic release is authorized.

### FIDUNIO 1.1.22 focused acceptance matrix

1. Confirm visible version 1.1.22 after two complete launches on each installed PWA.
2. iPhone background: leave Settings selected, background/lock, receive one direct notification, tap, enter PIN and confirm the exact sender conversation opens at its newest message. Repeat five times and record notification-to-visible-row time; target is immediate after chat data becomes available, with no persistence/Read-receipt wait.
3. iPhone terminated: fully close FIDUNIO, receive/tap one notification, enter PIN and confirm the exact direct conversation—not Messages or Settings—opens at its newest row. Repeat three times.
4. iPad background and terminated: repeat the same exact-route/latest-row checks at least five and three times respectively, in both portrait and landscape during the matrix.
5. Ordinary navigation: enter the target from the Messages list on both devices and confirm the newest message is visible, not the oldest. Scroll upward, allow a background receipt/new-message projection, and confirm that active viewport is preserved unless it was already near bottom.
6. Active composition: keep a distinctive multi-line draft, focus and caret while an incoming row and receipt update arrive. Confirm no jump or lost text, then send once and confirm one bubble.
7. Neighbor regression: ordinary resume with no new notification preserves the prior screen; multiple conversations still show the chooser; text plus one attachment send/receive; authentic Sent/Delivered/Read; offline queue/reconnect; iPad sidebar and Settings/Profile/User Administration loading.

The build changes no Firebase backend/rules/config, notification privacy, PIN/auth, E2EE format/key, receipt writer, Outbox, attachment/group/disappearing authority or Settings host. These remain regression checks, not rewritten functionality.

### FIDUNIO 1.1.23 focused acceptance matrix

1. Confirm visible version 1.1.23 after two complete launches on each installed PWA.
2. iPhone background: notification -> PIN -> exact direct chat -> newest row visible. Repeat at least five times and record each notification-to-visible-row interval; no run may fall to Messages/Settings or show the oldest row.
3. iPhone terminated: fully close FIDUNIO and repeat notification -> PIN -> exact direct chat at least five times. This is the critical 1.1.22 regression boundary.
4. iPad background and terminated: perform the same five-run checks, including portrait and landscape. Exact conversation, newest position and visible new row are independently required.
5. Open the same and a different direct conversation from Messages repeatedly; every deliberate entry opens newest. Scroll upward and receive a background row/receipt; a scrolled-up view stays stable while a near-bottom view follows the newest row.
6. Hold a distinctive multiline draft with focus/caret while notification, snapshot, receipt, foreground and connectivity signals occur. No text loss, cursor jump, duplicate send or whole-screen refresh is permitted.
7. Regression boundary: ordinary no-notification resume, multiple-notification chooser, Sent/Delivered/Read, offline queue/reconnect, group chat, one attachment, iPad sidebar, and Settings/Profile/User Administration loading.

The device matrix closes only with consistent repeated behavior. An occasional successful route, fast row, or correct scroll position does not pass.

### FIDUNIO 1.1.24 priority-semaphore acceptance matrix

1. Confirm visible version 1.1.24 after two complete launches on each installed PWA.
2. On iPhone and iPad, run at least eight notification taps from background and eight after forced termination: notification → PIN → exact direct conversation; the notified row must already be visible at the newest position when chat appears.
3. During PIN completion, verify the transition says “Opening message…” and no Settings, Messages-list, stale chat, overlay flicker, or oldest-position frame becomes visible.
4. Exercise delayed/offline delivery: the exact chat may show “Loading new message…”, the pending route must remain retryable, and later listener delivery must render and consume it exactly once.
5. Send rapid notifications for the same message, two messages in one conversation, and two conversations. Verify keyed deduplication, correct final target, no duplicate row, and no second listener/render owner.
6. With no notification, unlock/resume normally and verify no targeted message read or forced chat navigation occurs.
7. While typing during incoming messages, verify text, focus, caret, input height, and viewport do not jump or clear. Enter via the conversation list and verify newest positioning.
8. Regress Sent/Delivered/Read, offline Outbox/reconnect, message deletion, disappearing text, group chat, one attachment, iPad sidebar, notification chooser, and Settings/Profile/User Administration loading.

**Acceptance result (2026-09-10): PASS / CHECKPOINT.** The user completed every defined scenario at least five times on both iPhone and iPad and reported that all behavior was as expected. Release 1.1.24 is device accepted and recorded as the checkpoint baseline.

## FIDUNIO 1.1.25 password-change acceptance

1. Confirm visible version 1.1.25 after two complete launches.
2. In Settings → Profile → Change Password, enter the current password, a new password twice, and the existing six-digit FIDUNIO PIN.
3. Confirm “Password changed successfully,” with no PIN-validation error and no lost Settings/Profile content.
4. Sign out; confirm the old password fails and the new password signs in.
5. Confirm the existing PIN/biometric unlock still works, the same conversations/history decrypt, and direct/group send and receive remain functional.
6. Confirm Profile Save, email unchanged, Settings/Profile/User Administration loading, notifications and ordinary app restart remain unchanged.

Device acceptance remains required. Do not use Forgot Password or recovery for this normal password-change test.

## FIDUNIO 1.1.26 affected-device repair acceptance

1. Confirm version 1.1.26 after two complete launches.
2. On the device affected by 1.1.25, sign in using the new password.
3. At “Resynchronize secure messaging,” enter the existing six-digit FIDUNIO PIN and press Restore Messaging.
4. Confirm the original conversations and messages open and decrypt; do not rejoin or use Forgot Password.
5. Sign out and sign in again with the new password; confirm normal PIN/biometric unlock without another resynchronization prompt.
6. Change the password once more only after steps 1–5 pass, then verify the next login succeeds normally and the same history remains available.

## FIDUNIO 1.1.27 Forgot Password acceptance

1. Confirm version 1.1.27 after two complete launches and record the test account's current history.
2. Sign out, enter the enrolled email, press Forgot Password once, and confirm the new message explains that the existing PIN will be required.
3. Open the Firebase email, choose a new password, return to FIDUNIO, and sign in with that new password.
4. Confirm FIDUNIO does not open Messages or Settings first; it must show Recover Secure Messaging.
5. Enter one deliberately wrong PIN and confirm recovery fails without opening the app. Do not repeat more than once because server attempt limits are intentional.
6. Enter the existing six-digit PIN, confirm recovery succeeds, and verify the same direct/group history decrypts with no replacement identity.
7. Sign out and sign in again with the new password. Confirm normal PIN/biometric behavior and no repeated recovery screen.
8. On the second device, sign in using the new password. If its local identity is current it must open normally; if unavailable it must offer PIN-gated recovery rather than the former stranded-installation error.
9. Regress password change, direct/group send-receive, notifications, receipts, Outbox, attachments, Settings/Profile/User Administration, and app restart on iPhone and iPad.

## FIDUNIO 1.1.29 N6 acceptance closeout

**DEVICE ACCEPTED 2026-09-11.** The user reports cold and warm group-notification tests passed on both iPad and iPhone. The 1.1.28 intermittent permission banner did not recur on the 1.1.29 single-stream correction.

## FIDUNIO 1.1.30 Sending → Sent visibility acceptance

1. Confirm visible version 1.1.30 after two complete launches on iPhone and iPad.
2. From each device, send one unique direct text and one unique group text.
3. The outgoing bubble must appear immediately with **Sending** and remain continuously visible until it changes to **Sent**, **Delivered**, or **Read**.
4. Repeat once while another message arrives or a receipt changes, exercising listener projection during the send.
5. Repeat one direct and one group send after Wi-Fi is disabled; the row must remain visible as Queued/Sending and must not duplicate after reconnect.
6. Send one attachment in direct and group chat; its staged row must remain visible through upload and confirmation.
7. Press and hold one pending test row and delete it; it must not reappear from optimistic projection.
8. Regress cold/warm group notifications, composer draft/focus, latest-message positioning and group receipts.

Exit: every staged row remains visible, each exact authoritative server row replaces it once, no duplicate appears, all repository checks pass, and Pages serves 1.1.30.

**1.1.30 direct scope rejected.** Direct Sending/Sent/Read behavior regressed. Use 1.1.31 for retest.

## FIDUNIO 1.1.31 direct-message restore acceptance

1. Confirm visible version 1.1.31 after two complete launches.
2. Send one unique direct message from iPad to iPhone. Confirm continuous **Sending → Sent → Delivered → Read** and readable text on both devices.
3. Reverse direction from iPhone to iPad and confirm the same sequence.
4. Repeat once while the recipient conversation is already open and once after it is opened from Messages.
5. Confirm no disappearance, duplicate, delayed reappearance or group-notification regression.

This acceptance is deliberately limited to the restored direct-message behavior.

## FIDUNIO 1.1.32 mass sender-deletion acceptance

Prerequisite: Pages serves visible version 1.1.32 and callable `deleteMyMessagesForEveryoneV1` is ACTIVE under `fidunio-message-delete@fidunio-fef13.iam.gserviceaccount.com`.

1. In one direct conversation, create at least two accepted messages from the test sender, one accepted message from the other account, and one sender attachment. Restart both devices and confirm all rows are present.
2. On the sender device open **Chat Info → Delete My Sent Messages**. Confirm the warning names the conversation, says the operation is for everyone and cannot be undone, and says other people's and unsent messages are preserved.
3. Cancel once and confirm nothing changes. Reopen, confirm deletion, and observe disabled controls plus **Deleting…** progress followed by the exact deleted count.
4. Confirm every accepted sender-owned text/attachment disappears on sender and recipient, while the other account's message remains. Close/reopen both devices and confirm deleted rows do not return.
5. Repeat steps 1–4 in a group with accepted rows from the deleting sender and at least two other members. Confirm other senders' rows, membership, group history access, receipts for retained rows, and group notifications remain functional.
6. If practical, queue or fail one unsent message before the operation; confirm it remains available under its existing individual retry/cancel behavior and is not counted as a sent-message deletion.
7. Regress single-message **Delete for Me**, sender-only **Delete for Everyone**, bidirectional direct Sending → Sent → Delivered → Read, group send/receipts, one new attachment, and iPhone/iPad large-text layout.

Exit: only the authenticated sender's accepted rows are physically absent everywhere, attachment/group traces do not reappear, other senders and unsent rows remain, failure is explicit, and the existing messaging/notification paths pass regression.

## FDA-MASSDEL-001 — one sender row lingers after bulk deletion

- **Build/device evidence:** On 1.1.32, two direct messages reached Sent. **Delete My Sent Messages** removed one immediately; the second remained temporarily on the sender screen, then disappeared without another action. Both disappeared on the receiver.
- **Severity:** High acceptance defect; physical deletion succeeds but delayed sender convergence makes the operation appear incomplete.
- **Cause:** The backend correctly deletes selected rows sequentially. The active listener can deliver/project an intermediate snapshot containing the later row after local purge and before the final server-backed empty snapshot.
- **1.1.33 correction:** One conversation-keyed memory-only owner suppresses only server-confirmed deleted IDs from in-flight/intermediate direct/group projections until authoritative absence releases them. No timer, reload, forced subscription, persistent hidden ID, backend change or second Firebase owner.
- **Status:** CORRECTION CANDIDATE. All 82 non-emulator workflow steps and five Firestore emulator suites pass locally; `main`/Pages proof and repeat direct/group device acceptance required.
