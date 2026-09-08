# FIDUNIO Device Acceptance — Current Evidence

## Audio tool — source chooser and recorder

**Status: DEVICE CANDIDATE on FIDUNIO 0.9.9.10 — 2026-09-08.**

Acceptance on iPhone: tap Audio and confirm **Record Audio / Choose Audio File / Cancel**. Record Audio must request microphone access and must not launch the camera; record a short clip, use Stop & Send, and confirm it appears locally and reaches the peer. Choose Audio File must open saved audio selection without launching the camera; choose a valid saved audio file and send it. Reopen the conversation and confirm both audio attachments remain accessible. Confirm Photo and Video source choosers still behave normally.

## Issue 3 — iPhone composer clearance + video chooser

**Status: DEVICE CANDIDATE on FIDUNIO 0.9.9.9z — 2026-09-08.**

Acceptance on iPhone: open a conversation with enough messages to reach the bottom; verify the final message lines remain fully above the fixed composer, including with More/tools open and with a multi-line draft. Scroll to the bottom and verify it stays at the true end rather than leaving the last lines behind the composer. Then choose Video and verify both **Photo Library** and **Camera** paths open correctly; send one video from each source if practical. iPad two-pane layout must remain unchanged.

## Issue 2 — LTE outgoing-message visibility

**Status: DEVICE ACCEPTED on FIDUNIO 0.9.9.9y — 2026-09-08.**

Real-device acceptance completed on iPhone using the reported failure path:

- Wi-Fi was turned off and the device transitioned to cellular/LTE.
- One unique outgoing text was sent.
- The outgoing bubble appeared immediately.
- No duplicate bubble/message appeared.
- The original dangerous behavior — composer clears while the conversation shows no trace of the send attempt — did not reproduce.

The iPad LTE case is **N/A** because the test iPad has no cellular capability. This is not a missing acceptance test for the reported defect; the defect specifically depended on a Wi-Fi → cellular transition. The permanent regression gate continues to enforce render-before-Outbox ordering in source, while iPhone device proof covers the real network-transition path.

Issue 2 is closed for device acceptance. Issue 3 (iPhone composer overlap/scroll position) remains separate and untouched.

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

Issue 1 is closed for device acceptance. Issue 3 (iPhone composer overlap/scroll position) remains separate and was not changed by the Issue 1 or Issue 2 closeout.
