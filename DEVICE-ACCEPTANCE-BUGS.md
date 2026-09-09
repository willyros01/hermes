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
- N5 candidate adds deterministic notification-tap routing. The service worker may focus/open FIDUNIO and pass only opaque direct-message routing intent. `app.js` remains the route/message owner and resolves the conversation through existing Firestore/E2EE state.
- Notification metadata never creates a message row, decrypts content, or writes receipts. Cold-open routing waits behind the normal local PIN/auth gates.
- Device acceptance still required for N5 warm-open and cold-open taps before N5 is closed.

