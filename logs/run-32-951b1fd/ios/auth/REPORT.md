# FIDUNIO authenticated iPhone native simulator results

**FAIL — 18 passed, 2 failed, 0 blocked**

- Installed app: disposable native debug binary built from ios release source
- Local Firebase: Auth, Firestore with original rules, Storage — demo-fidunio-simulator-tests ONLY
- Backend exception: enrollRecoveryV1 uses a localhost implementation of the repository recovery wrapper; production Cloud Functions are NOT validated.
- Native UI operations are genuine app control gestures via OS WebView inspector; database assertions read the emulator, not production.
- No ADM, APNs, FCM provider delivery, physical biometrics, real camera, or peer-device decryption is claimed.

## Functional results

### N01 — PASS: Accept legal Terms and open actual Join form

Observed on native device

### N02 — PASS: Consume a real single-use admin invite, set PIN, create E2EE identity through native Join

Admin invitation accepted; real Auth profile and account E2EE identity created in local Firebase (iPhone volatile key-cache workaround used)

### N03 — PASS: Change actual native Settings: A++, Dark, and preview option

On-device Settings widgets changed and rendered selected values

### N04 — PASS: Admin creates a new user invitation from native Settings

Admin UI created an authentic single-use invitation in local Firestore

### N05 — PASS: Start a native direct conversation with Bob

Observed on native device

### N06 — PASS: Send encrypted direct text and confirm NO plaintext in emulator

Native composer sent an encrypted message with no plaintext in Firestore

### N07 — PASS: Set disappearing timer in real native direct conversation

Actual per-conversation disappearing selector changed to 300 seconds

### N08 — PASS: React with an emoji to an accepted direct message

Native message action displayed and applied emoji reaction

### N09 — PASS: Create group from native app and verify admin controls

Real group creation and group-admin rename/add/remove controls visible in native app

### N10 — PASS: Send a native group message and verify encrypted group record

Actual native group composer wrote encrypted content to local Firestore

### N11 — PASS: Use native group administrator to add a member

Native Group Info added Owner account as a new member; Firestore membership confirmed

### N12 — PASS: Show native notification configuration controls (delivery requires real devices)

Notification UI exists and renders. Actual ADM/APNs push reception NOT tested

### N13 — PASS: Block and unblock a native user in Safety settings

Real native Safety UI blocked then unblocked an existing FIDUNIO account (one expected OS confirmation was simulator-autoaccepted)

### N14 — PASS: A++ and Dark settings survive leaving and reopening native Settings

A++ and Dark retained after navigating away and back within actual native app

### R01 — PASS: Full six-emoji native picker: apply, change, remove each choice

Six picker choices verified individually: applied, selected and removed in native UI and Firestore

### R02 — PASS: Group Delete for Me hides local message but keeps shared ciphertext

Delete for Me removed native message locally without deleting shared Firestore message

### R03 — FAIL: Native group message Reply composer sends ciphertext-only response

Error: Timed out waiting for actionable message 3f8691d6-bda3-4142-9050-84c86296c96d; ; screen:  Native Simulator Group ● 4 members • Secure Sign Out New members see conversation only from their join time unless an admin explicitly grants earlier history. October 25, 2026 Native Test Alice 12:30 AM NATIVE_GROUP_1792888224504 Sent Yes No OK On my way Running late Call me Disappearing: Off 
    at wait (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:26:200)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async openActions (file:///Users/runner/work/hermes/hermes/build/simulator/native-release-extensions.mjs:9:5)
    at async test.requires (file:///Users/runner/work/hermes/hermes/build/simulator/native-release-extensions.mjs:70:5)
    at async test (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:34:20)
    at async runNativeReleaseExtensions (file:///Users/runner/work/hermes/hermes/build/simulator/native-release-extensions.mjs:64:11)
    a
SIMULATOR DIAGNOSTIC PHASE: start:app-ready

### R04 — FAIL: Direct emoji picker applies and removes all six emotions

Error: Timed out waiting for direct reaction saved; ; screen:  Simulator Bob ● Cloud Sign Out October 25, 2026 NATIVE_DIRECT_1792888202690 12:30 AM Sent Yes No OK On my way Running late Call me Disappearing: 5 minutes 
    at wait (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:26:200)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async test.requires (file:///Users/runner/work/hermes/hermes/build/simulator/native-release-more.mjs:31:4)
    at async test (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:34:20)
    at async runExtraActions (file:///Users/runner/work/hermes/hermes/build/simulator/native-release-more.mjs:22:10)
    at async runNativeReleaseExtensions (file:///Users/runner/work/hermes/hermes/build/simulator/native-release-extensions.mjs:84:14)
    at async file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:286:3
SIMULATOR DIAGNOSTIC PHASE: start:app-ready

### R05 — PASS: Direct Delete for Me hides only sender local copy

Deleted native direct row locally; recipient-authoritative message remains in Firestore

### R06 — PASS: Archive and unarchive direct conversation using native Messages controls

Archive and Unarchive used live UI and updated both filtered conversation lists

## Captured native screens

### native-join-screen

![native-join-screen](01-native-join-screen.png)

### native-join-completed

![native-join-completed](02-native-join-completed.png)

### native-authenticated-messages

![native-authenticated-messages](03-native-authenticated-messages.png)

### native-settings-large-dark

![native-settings-large-dark](04-native-settings-large-dark.png)

### native-admin-invitation

![native-admin-invitation](05-native-admin-invitation.png)

### native-direct-chat

![native-direct-chat](06-native-direct-chat.png)

### native-direct-message-sent

![native-direct-message-sent](07-native-direct-message-sent.png)

### native-disappearing-setting

![native-disappearing-setting](08-native-disappearing-setting.png)

### native-emoji-reaction

![native-emoji-reaction](09-native-emoji-reaction.png)

### native-group-created

![native-group-created](10-native-group-created.png)

### native-group-admin

![native-group-admin](11-native-group-admin.png)

### native-group-message-sent

![native-group-message-sent](12-native-group-message-sent.png)

### native-group-member-added

![native-group-member-added](13-native-group-member-added.png)

### native-notification-settings

![native-notification-settings](14-native-notification-settings.png)

### native-user-blocked

![native-user-blocked](15-native-user-blocked.png)

### native-user-unblocked

![native-user-unblocked](16-native-user-unblocked.png)

### native-persisted-settings

![native-persisted-settings](17-native-persisted-settings.png)

### all-native-emoji-tested

![all-native-emoji-tested](18-all-native-emoji-tested.png)

### delete-for-me-dialog

![delete-for-me-dialog](19-delete-for-me-dialog.png)

### delete-for-me-hidden

![delete-for-me-hidden](20-delete-for-me-hidden.png)

### R03-failure

![R03-failure](21-R03-failure.png)

### R04-failure

![R04-failure](22-R04-failure.png)

### native-direct-delete-for-me

![native-direct-delete-for-me](23-native-direct-delete-for-me.png)

### native-archive-dialog

![native-archive-dialog](24-native-archive-dialog.png)

### native-unarchived-messages

![native-unarchived-messages](25-native-unarchived-messages.png)

## Execution record

```text
Native authenticated ios suite. LOCAL demo-only accounts.

N01: Accept legal Terms and open actual Join form
  Actual native screenshot: 01-native-join-screen.png
PASS N01
  Local Firestore HTTP probe: {"state":"reachable"}

N02: Consume a real single-use admin invite, set PIN, create E2EE identity through native Join
  Actual native screenshot: 02-native-join-completed.png
  Actual native screenshot: 03-native-authenticated-messages.png
  SIMULATOR-ONLY iPhone volatile CryptoKey fallback was used; IndexedDB key persistence/restart NOT VERIFIED
PASS N02

N03: Change actual native Settings: A++, Dark, and preview option
  Actual native screenshot: 04-native-settings-large-dark.png
PASS N03

N04: Admin creates a new user invitation from native Settings
  Actual native screenshot: 05-native-admin-invitation.png
PASS N04

N05: Start a native direct conversation with Bob
  Actual native screenshot: 06-native-direct-chat.png
PASS N05

N06: Send encrypted direct text and confirm NO plaintext in emulator
  Actual native screenshot: 07-native-direct-message-sent.png
PASS N06

N07: Set disappearing timer in real native direct conversation
  Actual native screenshot: 08-native-disappearing-setting.png
PASS N07

N08: React with an emoji to an accepted direct message
  Actual native screenshot: 09-native-emoji-reaction.png
PASS N08

N09: Create group from native app and verify admin controls
  Actual native screenshot: 10-native-group-created.png
  Actual native screenshot: 11-native-group-admin.png
PASS N09

N10: Send a native group message and verify encrypted group record
  Actual native screenshot: 12-native-group-message-sent.png
PASS N10

N11: Use native group administrator to add a member
  Actual native screenshot: 13-native-group-member-added.png
PASS N11

N12: Show native notification configuration controls (delivery requires real devices)
  Actual native screenshot: 14-native-notification-settings.png
PASS N12

N13: Block and unblock a native user in Safety settings
  SIMULATOR ONLY: approved the expected Block User confirmation programmatically because the hosted iOS native alert disconnects Web Inspector; physical native dialog NOT VERIFIED
  Actual native screenshot: 15-native-user-blocked.png
  Actual native screenshot: 16-native-user-unblocked.png
PASS N13

N14: A++ and Dark settings survive leaving and reopening native Settings
  Actual native screenshot: 17-native-persisted-settings.png
PASS N14

R01: Full six-emoji native picker: apply, change, remove each choice
  Actual native screenshot: 18-all-native-emoji-tested.png
PASS R01

R02: Group Delete for Me hides local message but keeps shared ciphertext
  Actual native screenshot: 19-delete-for-me-dialog.png
  Actual native screenshot: 20-delete-for-me-hidden.png
PASS R02

R03: Native group message Reply composer sends ciphertext-only response
FAIL R03: Error: Timed out waiting for actionable message 3f8691d6-bda3-4142-9050-84c86296c96d; ; screen:  Native Simulator Group ● 4 members • Secure Sign Out New members see conversation only from their join time unless an admin explicitly grants earlier history. October 25, 2026 Native Test Alice 12:30 AM NATIVE_GROUP_1792888224504 Sent Yes No OK On my way Running late Call me Disappearing: Off 
    at wait (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:26:200)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async openActions (file:///Users/runner/work/hermes/hermes/build/simulator/native-release-extensions.mjs:9:5)
    at async test.requires (file:///Users/runner/work/hermes/hermes/build/simulator/native-release-extensions.mjs:70:5)
    at async test (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:34:20)
    at async runNativeReleaseExtensions (file:///Users/runner/work/hermes/hermes/build/simulator/native-release-extensions.mjs:64:11)
    a
SIMULATOR DIAGNOSTIC PHASE: start:app-ready
  Actual native screenshot: 21-R03-failure.png

R04: Direct emoji picker applies and removes all six emotions
FAIL R04: Error: Timed out waiting for direct reaction saved; ; screen:  Simulator Bob ● Cloud Sign Out October 25, 2026 NATIVE_DIRECT_1792888202690 12:30 AM Sent Yes No OK On my way Running late Call me Disappearing: 5 minutes 
    at wait (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:26:200)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async test.requires (file:///Users/runner/work/hermes/hermes/build/simulator/native-release-more.mjs:31:4)
    at async test (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:34:20)
    at async runExtraActions (file:///Users/runner/work/hermes/hermes/build/simulator/native-release-more.mjs:22:10)
    at async runNativeReleaseExtensions (file:///Users/runner/work/hermes/hermes/build/simulator/native-release-extensions.mjs:84:14)
    at async file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:286:3
SIMULATOR DIAGNOSTIC PHASE: start:app-ready
  Actual native screenshot: 22-R04-failure.png

R05: Direct Delete for Me hides only sender local copy
  Actual native screenshot: 23-native-direct-delete-for-me.png
PASS R05

R06: Archive and unarchive direct conversation using native Messages controls
  Actual native screenshot: 24-native-archive-dialog.png
  Actual native screenshot: 25-native-unarchived-messages.png
PASS R06
Release extension native scenarios complete: 2/3 primary passed; direct extension FAIL/BLOCKED
Native simulator suite contains failures or blocked tests; NO release approval.

```
