# FIDUNIO Device Acceptance — Current Evidence

## Issue 2 — LTE outgoing-message visibility

**Status: DEVICE CANDIDATE on FIDUNIO 0.9.9.9y — 2026-09-08.**

Required acceptance: while a direct conversation is open, switch Wi-Fi off so the device uses LTE, send one unique text, and confirm the outgoing bubble appears immediately without leaving/re-entering the conversation. The row may briefly show Sending/Queued but must remain visible, must not duplicate, and must later advance through the normal cloud state. Repeat once from iPhone and once from iPad. Issue 3 remains untouched.

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

Issue 1 is closed for device acceptance. Issues 2 (LTE outgoing-message visibility) and 3 (iPhone composer overlap/scroll position) remain separate and were not changed by this acceptance closeout.
