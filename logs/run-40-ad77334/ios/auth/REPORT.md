# FIDUNIO authenticated iPhone native simulator results

**FAIL — 22 passed, 1 failed, 0 blocked**

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

### R03 — PASS: Native group message Reply composer sends ciphertext-only response

Native Reply action and composer, encrypted group reply stored; peer-side quote rendering still unverified

### R04 — PASS: Direct emoji picker applies and removes all six emotions

All six direct reactions added/removed from actual UI and checked in Firestore

### R05 — PASS: Direct Delete for Me hides only sender local copy

Deleted native direct row locally; recipient-authoritative message remains in Firestore

### R06 — PASS: Archive and unarchive direct conversation using native Messages controls

Archive and Unarchive used live UI and updated both filtered conversation lists

### R09 — PASS: Group send continuity on immediate navigation interruption

One encrypted group message reached Sent and remained unique after immediate navigation away and return; real network loss not simulated

### R07 — FAIL: Group reaction stress — four complete six-emoji cycles across native chat reopen

Error: Timed out waiting for authoritative removal 😂; ; screen:  Native Simulator Group ● 4 members • Secure Sign Out New members see conversation only from their join time unless an admin explicitly grants earlier history. October 25, 2026 Native Test Alice 4:53 AM NATIVE_GROUP_1792904025199 Sent Native Test Alice 4:54 AM Native Test Alice NATIVE_GROUP_1792904025199 NATIVE_REPLY_1792904083341 Sent Native Test 
    at wait (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:26:200)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async exercise (file:///Users/runner/work/hermes/hermes/build/simulator/native-emoji-stress.mjs:97:11)
    at async test (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:34:20)
    at async runEmojiStress (file:///Users/runner/work/hermes/hermes/build/simulator/native-emoji-stress.mjs:149:15)
    at async file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:306:3
SIMULATOR DIAGNOSTIC PHASE: start:app-ready

### R08 — PASS: Direct reaction stress — four complete six-emoji cycles across native chat reopen

direct 4 cycles × 6 emoji = 24 authentic add/remove pairs; Firestore and UI synchronized after each step

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

### group-reply-composer

![group-reply-composer](21-group-reply-composer.png)

### group-reply-encrypted

![group-reply-encrypted](22-group-reply-encrypted.png)

### native-direct-six-emoji

![native-direct-six-emoji](23-native-direct-six-emoji.png)

### native-direct-delete-for-me

![native-direct-delete-for-me](24-native-direct-delete-for-me.png)

### native-archive-dialog

![native-archive-dialog](25-native-archive-dialog.png)

### native-unarchived-messages

![native-unarchived-messages](26-native-unarchived-messages.png)

### stress-group-completed-cycle-1

![stress-group-completed-cycle-1](27-stress-group-completed-cycle-1.png)

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
  Actual native screenshot: 21-group-reply-composer.png
  Actual native screenshot: 22-group-reply-encrypted.png
PASS R03

R04: Direct emoji picker applies and removes all six emotions
  Actual native screenshot: 23-native-direct-six-emoji.png
PASS R04

R05: Direct Delete for Me hides only sender local copy
  Actual native screenshot: 24-native-direct-delete-for-me.png
PASS R05

R06: Archive and unarchive direct conversation using native Messages controls
  Actual native screenshot: 25-native-archive-dialog.png
  Actual native screenshot: 26-native-unarchived-messages.png
PASS R06
Release extension native scenarios complete: 3/3 primary passed; direct extension PASS

R09: Group send continuity on immediate navigation interruption
SEND-INTERRUPTION pre-navigation {"newDocs":1,"states":["sent"]}
SEND-INTERRUPTION PASS {"id":"8501da89-0c6c-4c82-b563-919d13aef9aa","initialStates":["sent"],"finalState":"sent","newDocs":1}
PASS R09

R07: Group reaction stress — four complete six-emoji cycles across native chat reopen
REACTION-STRESS precondition group native Sent + authoritative Firestore confirmed for 5cc713ab-2463-447c-be67-3cdc0d15f71f
REACTION-CLICK {"op":"fid-sim-group-1-apply-1792904132998-v3q5g1j0hno","kind":"group","emoji":"👍","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1792904134400-0q37lysn8yy","kind":"group","emoji":"👍","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1792904134400-0q37lysn8yy","kind":"group","emoji":"👍","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=👍 message=5cc713ab-2463-447c-be67-3cdc0d15f71f
REACTION-CLICK {"op":"fid-sim-group-1-apply-1792904135750-0jzqfv2y0wgl","kind":"group","emoji":"❤️","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1792904137132-7eo6ru9n2ps","kind":"group","emoji":"❤️","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1792904137132-7eo6ru9n2ps","kind":"group","emoji":"❤️","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=❤️ message=5cc713ab-2463-447c-be67-3cdc0d15f71f
REACTION-CLICK {"op":"fid-sim-group-1-apply-1792904138517-gte5ljcj9on","kind":"group","emoji":"😂","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1792904139872-637b221jaa2","kind":"group","emoji":"😂","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1792904139872-637b221jaa2","kind":"group","emoji":"😂","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=😂 message=5cc713ab-2463-447c-be67-3cdc0d15f71f
REACTION-CLICK {"op":"fid-sim-group-1-apply-1792904141213-yyxm83b63b","kind":"group","emoji":"😮","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1792904142569-p8slktvhjak","kind":"group","emoji":"😮","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1792904142569-p8slktvhjak","kind":"group","emoji":"😮","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=😮 message=5cc713ab-2463-447c-be67-3cdc0d15f71f
REACTION-CLICK {"op":"fid-sim-group-1-apply-1792904143946-0l6qxlvh0tw","kind":"group","emoji":"😢","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1792904145377-1car0m378tx","kind":"group","emoji":"😢","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1792904145377-1car0m378tx","kind":"group","emoji":"😢","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=😢 message=5cc713ab-2463-447c-be67-3cdc0d15f71f
REACTION-CLICK {"op":"fid-sim-group-1-apply-1792904146723-qmf6hyfqwed","kind":"group","emoji":"🙏","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1792904148114-3vz5038a17j","kind":"group","emoji":"🙏","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1792904148114-3vz5038a17j","kind":"group","emoji":"🙏","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=🙏 message=5cc713ab-2463-447c-be67-3cdc0d15f71f
  Actual native screenshot: 27-stress-group-completed-cycle-1.png
REACTION-CLICK {"op":"fid-sim-group-2-apply-1792904153951-o4nqb4iccr9","kind":"group","emoji":"👍","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1792904155404-12re8o9tjw6","kind":"group","emoji":"👍","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1792904155404-12re8o9tjw6","kind":"group","emoji":"👍","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=👍 message=5cc713ab-2463-447c-be67-3cdc0d15f71f
REACTION-CLICK {"op":"fid-sim-group-2-apply-1792904156757-lmyfob1tb1k","kind":"group","emoji":"❤️","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1792904158090-uezm2pnubng","kind":"group","emoji":"❤️","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1792904158090-uezm2pnubng","kind":"group","emoji":"❤️","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=❤️ message=5cc713ab-2463-447c-be67-3cdc0d15f71f
REACTION-CLICK {"op":"fid-sim-group-2-apply-1792904159557-2swr5lj18ys","kind":"group","emoji":"😂","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1792904160966-j22p880uyyq","kind":"group","emoji":"😂","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1792904160966-j22p880uyyq","kind":"group","emoji":"😂","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS FAIL: {"type":"group","conversationId":"uL0gjcZiz3hX3tAvugh2","messageId":"5cc713ab-2463-447c-be67-3cdc0d15f71f","emoji":"😂","cycle":2,"phase":"remove","serverReaction":"😂","server":{"Fq8zb2Rcvb0P2w0hIyImklHVyZaR":"😂"},"ui":"{\"chips\":[{\"text\":\"😂\",\"mine\":true}],\"menu\":[],\"modalText\":null,\"rowMeta\":\"Sent\\n\",\"alerts\":[]}","error":"Timed out waiting for authoritative removal 😂; ; screen:  Native Simulator Group ● 4 members • Secure Sign Out New members see conversation only from their join time unless an admin explicitly grants earlier history. October 25, 2026 Native Test Alice 4:53 AM NATIVE_GROUP_1792904025199 Sent Native Test Alice 4:54 AM Native Test Alice NATIVE_GROUP_1792904025199 NATIVE_REPLY_1792904083341 Sent Native Test "}
FAIL R07: Error: Timed out waiting for authoritative removal 😂; ; screen:  Native Simulator Group ● 4 members • Secure Sign Out New members see conversation only from their join time unless an admin explicitly grants earlier history. October 25, 2026 Native Test Alice 4:53 AM NATIVE_GROUP_1792904025199 Sent Native Test Alice 4:54 AM Native Test Alice NATIVE_GROUP_1792904025199 NATIVE_REPLY_1792904083341 Sent Native Test 
    at wait (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:26:200)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async exercise (file:///Users/runner/work/hermes/hermes/build/simulator/native-emoji-stress.mjs:97:11)
    at async test (file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:34:20)
    at async runEmojiStress (file:///Users/runner/work/hermes/hermes/build/simulator/native-emoji-stress.mjs:149:15)
    at async file:///Users/runner/work/hermes/hermes/build/simulator/device-auth-run.mjs:306:3
SIMULATOR DIAGNOSTIC PHASE: start:app-ready
  Actual native screenshot: 28-R07-failure.png

R08: Direct reaction stress — four complete six-emoji cycles across native chat reopen
REACTION-STRESS precondition direct native Sent + authoritative Firestore confirmed for 4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1792904219031-ughq8boj2jm","kind":"direct","emoji":"👍","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1792904220315-h68ah0nmqkf","kind":"direct","emoji":"👍","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1792904220315-h68ah0nmqkf","kind":"direct","emoji":"👍","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=👍 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1792904221578-vjue9j5lb1","kind":"direct","emoji":"❤️","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1792904222873-qbsn1akszxi","kind":"direct","emoji":"❤️","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1792904222873-qbsn1akszxi","kind":"direct","emoji":"❤️","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=❤️ message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1792904224108-52tc5ia9egs","kind":"direct","emoji":"😂","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1792904225364-btzxqo3uyph","kind":"direct","emoji":"😂","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1792904225364-btzxqo3uyph","kind":"direct","emoji":"😂","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=😂 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1792904226860-02xikno72kqx","kind":"direct","emoji":"😮","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1792904228244-sertlz2nx3k","kind":"direct","emoji":"😮","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1792904228244-sertlz2nx3k","kind":"direct","emoji":"😮","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=😮 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1792904229559-gobovybvcbs","kind":"direct","emoji":"😢","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1792904230832-tafvq1oyqqd","kind":"direct","emoji":"😢","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1792904230832-tafvq1oyqqd","kind":"direct","emoji":"😢","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=😢 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1792904232113-uu2mljsro1c","kind":"direct","emoji":"🙏","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1792904233441-2vnnp2z56fb","kind":"direct","emoji":"🙏","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1792904233441-2vnnp2z56fb","kind":"direct","emoji":"🙏","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=🙏 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
  Actual native screenshot: 29-stress-direct-completed-cycle-1.png
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1792904238773-ncesfvomh69","kind":"direct","emoji":"👍","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1792904240208-id3sbmiaqy","kind":"direct","emoji":"👍","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1792904240208-id3sbmiaqy","kind":"direct","emoji":"👍","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=👍 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1792904241520-sh2zdqogmya","kind":"direct","emoji":"❤️","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1792904242762-eiyct7b5gjp","kind":"direct","emoji":"❤️","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1792904242762-eiyct7b5gjp","kind":"direct","emoji":"❤️","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=❤️ message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1792904244028-q7h5ca6d0z","kind":"direct","emoji":"😂","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1792904245297-dl2chl8tn0f","kind":"direct","emoji":"😂","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1792904245297-dl2chl8tn0f","kind":"direct","emoji":"😂","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=😂 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1792904246577-r1nad63mhz","kind":"direct","emoji":"😮","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1792904247880-dt7x1lclwg9","kind":"direct","emoji":"😮","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1792904247880-dt7x1lclwg9","kind":"direct","emoji":"😮","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=😮 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1792904249217-nh8ww2l6gqo","kind":"direct","emoji":"😢","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1792904250464-g27pdj8pqnm","kind":"direct","emoji":"😢","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1792904250464-g27pdj8pqnm","kind":"direct","emoji":"😢","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=😢 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1792904251705-kfctcoqhfjn","kind":"direct","emoji":"🙏","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1792904252954-pyu8r8wf18c","kind":"direct","emoji":"🙏","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1792904252954-pyu8r8wf18c","kind":"direct","emoji":"🙏","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=🙏 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
  Actual native screenshot: 30-stress-direct-completed-cycle-2.png
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1792904258181-dr4zy5oyktf","kind":"direct","emoji":"👍","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1792904259469-xfxwdjo4jb","kind":"direct","emoji":"👍","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1792904259469-xfxwdjo4jb","kind":"direct","emoji":"👍","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=👍 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1792904260718-hfywvcg7tmc","kind":"direct","emoji":"❤️","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1792904261955-rbadqpurgj","kind":"direct","emoji":"❤️","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1792904261955-rbadqpurgj","kind":"direct","emoji":"❤️","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=❤️ message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1792904263219-bpiwrjn978w","kind":"direct","emoji":"😂","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1792904264483-obie0aqxmsi","kind":"direct","emoji":"😂","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1792904264483-obie0aqxmsi","kind":"direct","emoji":"😂","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=😂 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1792904265722-8x5eb6y153","kind":"direct","emoji":"😮","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1792904266969-15oqscxy926","kind":"direct","emoji":"😮","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1792904266969-15oqscxy926","kind":"direct","emoji":"😮","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=😮 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1792904268212-9fzputg6v6s","kind":"direct","emoji":"😢","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1792904269455-cr78ktj9y4t","kind":"direct","emoji":"😢","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1792904269455-cr78ktj9y4t","kind":"direct","emoji":"😢","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=😢 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1792904270760-8vwxurx79h","kind":"direct","emoji":"🙏","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1792904271999-914wt3ug1u6","kind":"direct","emoji":"🙏","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1792904271999-914wt3ug1u6","kind":"direct","emoji":"🙏","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=🙏 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
  Actual native screenshot: 31-stress-direct-completed-cycle-3.png
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1792904277502-f6hriclhb4t","kind":"direct","emoji":"👍","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1792904278792-abd3dfa3n8d","kind":"direct","emoji":"👍","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1792904278792-abd3dfa3n8d","kind":"direct","emoji":"👍","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=👍 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1792904280092-g1aq0htw7x","kind":"direct","emoji":"❤️","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1792904281345-hzw60nmulzk","kind":"direct","emoji":"❤️","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1792904281345-hzw60nmulzk","kind":"direct","emoji":"❤️","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=❤️ message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1792904282696-inklwkt7whc","kind":"direct","emoji":"😂","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1792904284002-c2e35ut2xbj","kind":"direct","emoji":"😂","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1792904284002-c2e35ut2xbj","kind":"direct","emoji":"😂","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=😂 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1792904285298-8csr8el1a08","kind":"direct","emoji":"😮","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1792904286550-82tf3nxy5ra","kind":"direct","emoji":"😮","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1792904286550-82tf3nxy5ra","kind":"direct","emoji":"😮","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=😮 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1792904287809-pid1y5ztc8j","kind":"direct","emoji":"😢","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1792904289120-cxkcwskmdkm","kind":"direct","emoji":"😢","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1792904289120-cxkcwskmdkm","kind":"direct","emoji":"😢","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=😢 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1792904290444-xkhbximiqgo","kind":"direct","emoji":"🙏","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1792904291682-l51tpndcuh","kind":"direct","emoji":"🙏","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1792904291682-l51tpndcuh","kind":"direct","emoji":"🙏","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=🙏 message=4b1b2a4a-7e58-4b99-8563-35709647a8d1
  Actual native screenshot: 32-stress-direct-completed-cycle-4.png
PASS R08
REACTION-STRESS summary interruptedGroupSend=true group=false direct=true; no release approval implied.
Native simulator suite contains failures or blocked tests; NO release approval.

```
