# FIDUNIO authenticated iPhone native simulator results

**FAIL — 21 passed, 2 failed, 0 blocked**

- Installed app: disposable native debug binary built from ios release source
- Local Firebase: Auth, Firestore with original rules, Storage — demo-fidunio-simulator-tests ONLY
- Backend exception: enrollRecoveryV1 uses a localhost implementation of the repository recovery wrapper; production Cloud Functions are NOT validated.
- Native UI operations are genuine app control gestures via OS WebView inspector; database assertions read the emulator, not production.
- No ADM, APNs, FCM provider delivery, physical biometrics, real camera, or peer-device decryption is claimed.

## Functional results

### N01 — FAIL: Accept legal Terms and open actual Join form

Error: Timed out waiting for Join tab; ; screen:  FIDUNIO could not finish starting Sign-in could not be loaded. Check your connection and retry. Your secure data has not been reset. Retry Startup
    at wait (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:26:200)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:72:5
    at async test (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:34:20)
    at async file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:69:12
SIMULATOR DIAGNOSTIC PHASE: unavailable

### N01R — PASS: Recover after failed native startup using visible Retry Startup button

Original N01 FAIL remains recorded; built-in Retry Startup reached Join without resetting account

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

### R03 — PASS: Native group message Reply composer sends ciphertext-only response

Native Reply action and composer, encrypted group reply stored; peer-side quote rendering still unverified

### R04 — PASS: Direct emoji picker applies and removes all six emotions

All six direct reactions added/removed from actual UI and checked in Firestore

### R05 — PASS: Direct Delete for Me hides only sender local copy

Deleted native direct row locally; recipient-authoritative message remains in Firestore

### R06 — PASS: Archive and unarchive direct conversation using native Messages controls

Archive and Unarchive used live UI and updated both filtered conversation lists

### R07 — FAIL: Group reaction stress — four complete six-emoji cycles across native chat reopen

Error: Timed out waiting for authoritative removal 😂; ; screen:  Native Simulator Group ● 4 members • Secure Sign Out New members see conversation only from their join time unless an admin explicitly grants earlier history. October 25, 2026 Native Test Alice 3:51 AM NATIVE_GROUP_1792900288164 Sent Native Test Alice 3:52 AM Native Test Alice NATIVE_GROUP_1792900288164 NATIVE_REPLY_1792900358540 Sent Native Test 
    at wait (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:26:200)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async exercise (file:///Users/runner/work/hermes/hermes/build/simulator/native-emoji-stress.mjs:91:11)
    at async test (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:34:20)
    at async runEmojiStress (file:///Users/runner/work/hermes/hermes/build/simulator/native-emoji-stress.mjs:110:15)
    at async file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:306:3
SIMULATOR DIAGNOSTIC PHASE: start:app-ready

### R08 — PASS: Direct reaction stress — four complete six-emoji cycles across native chat reopen

direct 4 cycles × 6 emoji = 24 authentic add/remove pairs; Firestore and UI synchronized after each step

## Captured native screens

### N01-failure

![N01-failure](01-N01-failure.png)

### native-startup-recovered

![native-startup-recovered](02-native-startup-recovered.png)

### native-join-completed

![native-join-completed](03-native-join-completed.png)

### native-authenticated-messages

![native-authenticated-messages](04-native-authenticated-messages.png)

### native-settings-large-dark

![native-settings-large-dark](05-native-settings-large-dark.png)

### native-admin-invitation

![native-admin-invitation](06-native-admin-invitation.png)

### native-direct-chat

![native-direct-chat](07-native-direct-chat.png)

### native-direct-message-sent

![native-direct-message-sent](08-native-direct-message-sent.png)

### native-disappearing-setting

![native-disappearing-setting](09-native-disappearing-setting.png)

### native-emoji-reaction

![native-emoji-reaction](10-native-emoji-reaction.png)

### native-group-created

![native-group-created](11-native-group-created.png)

### native-group-admin

![native-group-admin](12-native-group-admin.png)

### native-group-message-sent

![native-group-message-sent](13-native-group-message-sent.png)

### native-group-member-added

![native-group-member-added](14-native-group-member-added.png)

### native-notification-settings

![native-notification-settings](15-native-notification-settings.png)

### native-user-blocked

![native-user-blocked](16-native-user-blocked.png)

### native-user-unblocked

![native-user-unblocked](17-native-user-unblocked.png)

### native-persisted-settings

![native-persisted-settings](18-native-persisted-settings.png)

### all-native-emoji-tested

![all-native-emoji-tested](19-all-native-emoji-tested.png)

### delete-for-me-dialog

![delete-for-me-dialog](20-delete-for-me-dialog.png)

### delete-for-me-hidden

![delete-for-me-hidden](21-delete-for-me-hidden.png)

### group-reply-composer

![group-reply-composer](22-group-reply-composer.png)

### group-reply-encrypted

![group-reply-encrypted](23-group-reply-encrypted.png)

### native-direct-six-emoji

![native-direct-six-emoji](24-native-direct-six-emoji.png)

### native-direct-delete-for-me

![native-direct-delete-for-me](25-native-direct-delete-for-me.png)

### native-archive-dialog

![native-archive-dialog](26-native-archive-dialog.png)

### native-unarchived-messages

![native-unarchived-messages](27-native-unarchived-messages.png)

### R07-failure

![R07-failure](28-R07-failure.png)

### stress-direct-completed-cycle-1

![stress-direct-completed-cycle-1](29-stress-direct-completed-cycle-1.png)

### stress-direct-completed-cycle-2

![stress-direct-completed-cycle-2](30-stress-direct-completed-cycle-2.png)

### stress-direct-completed-cycle-3

![stress-direct-completed-cycle-3](31-stress-direct-completed-cycle-3.png)

### stress-direct-completed-cycle-4

![stress-direct-completed-cycle-4](32-stress-direct-completed-cycle-4.png)

## Execution record

```text
Native authenticated ios suite. LOCAL demo-only accounts.

N01: Accept legal Terms and open actual Join form
FAIL N01: Error: Timed out waiting for Join tab; ; screen:  FIDUNIO could not finish starting Sign-in could not be loaded. Check your connection and retry. Your secure data has not been reset. Retry Startup
    at wait (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:26:200)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:72:5
    at async test (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:34:20)
    at async file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:69:12
SIMULATOR DIAGNOSTIC PHASE: unavailable
  Actual native screenshot: 01-N01-failure.png

N01R: Recover after failed native startup using visible Retry Startup button
  Actual native screenshot: 02-native-startup-recovered.png
PASS N01R
  Local Firestore HTTP probe: {"state":"reachable"}

N02: Consume a real single-use admin invite, set PIN, create E2EE identity through native Join
  Actual native screenshot: 03-native-join-completed.png
  Actual native screenshot: 04-native-authenticated-messages.png
  SIMULATOR-ONLY iPhone volatile CryptoKey fallback was used; IndexedDB key persistence/restart NOT VERIFIED
PASS N02

N03: Change actual native Settings: A++, Dark, and preview option
  Actual native screenshot: 05-native-settings-large-dark.png
PASS N03

N04: Admin creates a new user invitation from native Settings
  Actual native screenshot: 06-native-admin-invitation.png
PASS N04

N05: Start a native direct conversation with Bob
  Actual native screenshot: 07-native-direct-chat.png
PASS N05

N06: Send encrypted direct text and confirm NO plaintext in emulator
  Actual native screenshot: 08-native-direct-message-sent.png
PASS N06

N07: Set disappearing timer in real native direct conversation
  Actual native screenshot: 09-native-disappearing-setting.png
PASS N07

N08: React with an emoji to an accepted direct message
  Actual native screenshot: 10-native-emoji-reaction.png
PASS N08

N09: Create group from native app and verify admin controls
  Actual native screenshot: 11-native-group-created.png
  Actual native screenshot: 12-native-group-admin.png
PASS N09

N10: Send a native group message and verify encrypted group record
  Actual native screenshot: 13-native-group-message-sent.png
PASS N10

N11: Use native group administrator to add a member
  Actual native screenshot: 14-native-group-member-added.png
PASS N11

N12: Show native notification configuration controls (delivery requires real devices)
  Actual native screenshot: 15-native-notification-settings.png
PASS N12

N13: Block and unblock a native user in Safety settings
  SIMULATOR ONLY: approved the expected Block User confirmation programmatically because the hosted iOS native alert disconnects Web Inspector; physical native dialog NOT VERIFIED
  Actual native screenshot: 16-native-user-blocked.png
  Actual native screenshot: 17-native-user-unblocked.png
PASS N13

N14: A++ and Dark settings survive leaving and reopening native Settings
  Actual native screenshot: 18-native-persisted-settings.png
PASS N14

R01: Full six-emoji native picker: apply, change, remove each choice
  Actual native screenshot: 19-all-native-emoji-tested.png
PASS R01

R02: Group Delete for Me hides local message but keeps shared ciphertext
  Actual native screenshot: 20-delete-for-me-dialog.png
  Actual native screenshot: 21-delete-for-me-hidden.png
PASS R02

R03: Native group message Reply composer sends ciphertext-only response
  Actual native screenshot: 22-group-reply-composer.png
  Actual native screenshot: 23-group-reply-encrypted.png
PASS R03

R04: Direct emoji picker applies and removes all six emotions
  Actual native screenshot: 24-native-direct-six-emoji.png
PASS R04

R05: Direct Delete for Me hides only sender local copy
  Actual native screenshot: 25-native-direct-delete-for-me.png
PASS R05

R06: Archive and unarchive direct conversation using native Messages controls
  Actual native screenshot: 26-native-archive-dialog.png
  Actual native screenshot: 27-native-unarchived-messages.png
PASS R06
Release extension native scenarios complete: 3/3 primary passed; direct extension PASS

R07: Group reaction stress — four complete six-emoji cycles across native chat reopen
REACTION-STRESS precondition group native Sent + authoritative Firestore confirmed for 655cba25-fdcb-4935-b774-836a0eb85523
REACTION-CLICK {"kind":"group","emoji":"👍","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"group","emoji":"👍","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS group cycle=1/4 emoji=👍 message=655cba25-fdcb-4935-b774-836a0eb85523
REACTION-CLICK {"kind":"group","emoji":"❤️","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"group","emoji":"❤️","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS group cycle=1/4 emoji=❤️ message=655cba25-fdcb-4935-b774-836a0eb85523
REACTION-CLICK {"kind":"group","emoji":"😂","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"group","emoji":"😂","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS FAIL: {"type":"group","conversationId":"Zfa8TT73kT6aP69WkjMu","messageId":"655cba25-fdcb-4935-b774-836a0eb85523","emoji":"😂","cycle":1,"phase":"remove","serverReaction":"😂","server":{"aixpervTNqKfSV4wACvVJjKnRDRY":"😂"},"ui":"{\"chips\":[{\"text\":\"😂\",\"mine\":true}],\"menu\":[],\"modalText\":null,\"rowMeta\":\"Sent\\n\",\"alerts\":[]}","error":"Timed out waiting for authoritative removal 😂; ; screen:  Native Simulator Group ● 4 members • Secure Sign Out New members see conversation only from their join time unless an admin explicitly grants earlier history. October 25, 2026 Native Test Alice 3:51 AM NATIVE_GROUP_1792900288164 Sent Native Test Alice 3:52 AM Native Test Alice NATIVE_GROUP_1792900288164 NATIVE_REPLY_1792900358540 Sent Native Test "}
FAIL R07: Error: Timed out waiting for authoritative removal 😂; ; screen:  Native Simulator Group ● 4 members • Secure Sign Out New members see conversation only from their join time unless an admin explicitly grants earlier history. October 25, 2026 Native Test Alice 3:51 AM NATIVE_GROUP_1792900288164 Sent Native Test Alice 3:52 AM Native Test Alice NATIVE_GROUP_1792900288164 NATIVE_REPLY_1792900358540 Sent Native Test 
    at wait (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:26:200)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async exercise (file:///Users/runner/work/hermes/hermes/build/simulator/native-emoji-stress.mjs:91:11)
    at async test (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:34:20)
    at async runEmojiStress (file:///Users/runner/work/hermes/hermes/build/simulator/native-emoji-stress.mjs:110:15)
    at async file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:306:3
SIMULATOR DIAGNOSTIC PHASE: start:app-ready
  Actual native screenshot: 28-R07-failure.png

R08: Direct reaction stress — four complete six-emoji cycles across native chat reopen
REACTION-STRESS precondition direct native Sent + authoritative Firestore confirmed for 03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"👍","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"👍","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=1/4 emoji=👍 message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"❤️","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"❤️","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=1/4 emoji=❤️ message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"😂","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"😂","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=1/4 emoji=😂 message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"😮","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"😮","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=1/4 emoji=😮 message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"😢","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"😢","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=1/4 emoji=😢 message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"🙏","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"🙏","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=1/4 emoji=🙏 message=03413315-fbba-4653-a50e-825ecdb60808
  Actual native screenshot: 29-stress-direct-completed-cycle-1.png
REACTION-CLICK {"kind":"direct","emoji":"👍","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"👍","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=2/4 emoji=👍 message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"❤️","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"❤️","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=2/4 emoji=❤️ message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"😂","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"😂","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=2/4 emoji=😂 message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"😮","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"😮","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=2/4 emoji=😮 message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"😢","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"😢","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=2/4 emoji=😢 message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"🙏","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"🙏","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=2/4 emoji=🙏 message=03413315-fbba-4653-a50e-825ecdb60808
  Actual native screenshot: 30-stress-direct-completed-cycle-2.png
REACTION-CLICK {"kind":"direct","emoji":"👍","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"👍","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=3/4 emoji=👍 message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"❤️","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"❤️","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=3/4 emoji=❤️ message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"😂","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"😂","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=3/4 emoji=😂 message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"😮","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"😮","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=3/4 emoji=😮 message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"😢","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"😢","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=3/4 emoji=😢 message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"🙏","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"🙏","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=3/4 emoji=🙏 message=03413315-fbba-4653-a50e-825ecdb60808
  Actual native screenshot: 31-stress-direct-completed-cycle-3.png
REACTION-CLICK {"kind":"direct","emoji":"👍","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"👍","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=4/4 emoji=👍 message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"❤️","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"❤️","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=4/4 emoji=❤️ message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"😂","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"😂","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=4/4 emoji=😂 message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"😮","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"😮","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=4/4 emoji=😮 message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"😢","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"😢","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=4/4 emoji=😢 message=03413315-fbba-4653-a50e-825ecdb60808
REACTION-CLICK {"kind":"direct","emoji":"🙏","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-CLICK {"kind":"direct","emoji":"🙏","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true}
REACTION-STRESS PASS direct cycle=4/4 emoji=🙏 message=03413315-fbba-4653-a50e-825ecdb60808
  Actual native screenshot: 32-stress-direct-completed-cycle-4.png
PASS R08
REACTION-STRESS summary group=false direct=true; no release approval implied.
Native simulator suite contains failures or blocked tests; NO release approval.

```
