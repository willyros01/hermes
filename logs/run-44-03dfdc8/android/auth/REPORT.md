# FIDUNIO authenticated Android native simulator results

**PASS — 23 passed, 0 failed, 0 blocked**

- Installed app: disposable native debug binary built from Android release source
- Local Firebase: Auth, Firestore with original rules, Storage — demo-fidunio-simulator-tests ONLY
- Backend exception: enrollRecoveryV1 uses a localhost implementation of the repository recovery wrapper; production Cloud Functions are NOT validated.
- Native UI operations are genuine app control gestures via OS WebView inspector; database assertions read the emulator, not production.
- No ADM, APNs, FCM provider delivery, physical biometrics, real camera, or peer-device decryption is claimed.

## Functional results

### N01 — PASS: Accept legal Terms and open actual Join form

Observed on native device

### N02 — PASS: Consume a real single-use admin invite, set PIN, create E2EE identity through native Join

Admin invitation accepted; real Auth profile and account E2EE identity created in local Firebase

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

Real native Safety UI blocked then unblocked an existing FIDUNIO account

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

### R09 — PASS: Group send continuity while encrypted Outbox is held through navigation

Encrypted Outbox was held before network delivery, survived navigation while Sending, then delivered exactly once with native Sent UI

### R07 — PASS: Group reaction stress — four complete six-emoji cycles across native chat reopen

group 4 cycles × 6 emoji = 24 authentic add/remove pairs; Firestore and UI synchronized after each step

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

### stress-group-completed-cycle-2

![stress-group-completed-cycle-2](28-stress-group-completed-cycle-2.png)

### stress-group-completed-cycle-3

![stress-group-completed-cycle-3](29-stress-group-completed-cycle-3.png)

### stress-group-completed-cycle-4

![stress-group-completed-cycle-4](30-stress-group-completed-cycle-4.png)

### stress-direct-completed-cycle-1

![stress-direct-completed-cycle-1](31-stress-direct-completed-cycle-1.png)

### stress-direct-completed-cycle-2

![stress-direct-completed-cycle-2](32-stress-direct-completed-cycle-2.png)

### stress-direct-completed-cycle-3

![stress-direct-completed-cycle-3](33-stress-direct-completed-cycle-3.png)

### stress-direct-completed-cycle-4

![stress-direct-completed-cycle-4](34-stress-direct-completed-cycle-4.png)

## Execution record

```text
Native authenticated android suite. LOCAL demo-only accounts.

N01: Accept legal Terms and open actual Join form
  Actual native screenshot: 01-native-join-screen.png
PASS N01
  Local Firestore HTTP probe: {"state":"reachable"}

N02: Consume a real single-use admin invite, set PIN, create E2EE identity through native Join
  Actual native screenshot: 02-native-join-completed.png
  Actual native screenshot: 03-native-authenticated-messages.png
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

R09: Group send continuity while encrypted Outbox is held through navigation
SEND-INTERRUPTION Outbox hold armed before Send
SEND-INTERRUPTION VERIFIED-IN-FLIGHT {"local":[{"id":"cfb1e464-072d-455b-8597-6067e564235f","state":"8:29 PM\nSending"}],"authoritativeDocs":0,"outbox":"durably-staged"}
SEND-INTERRUPTION Outbox resumed after leaving group chat
SEND-INTERRUPTION PASS {"id":"cfb1e464-072d-455b-8597-6067e564235f","wasPendingBeforeNavigation":true,"finalState":"sent","newDocs":1}
PASS R09

R07: Group reaction stress — four complete six-emoji cycles across native chat reopen
REACTION-STRESS precondition group native Sent + authoritative Firestore confirmed for d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793046603926-uta1va6ouj9","kind":"group","emoji":"👍","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793046605300-yobbxmza59","kind":"group","emoji":"👍","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793046605300-yobbxmza59","kind":"group","emoji":"👍","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=👍 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793046606723-6q35fek27tr","kind":"group","emoji":"❤️","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793046608127-ofbgsywkcaq","kind":"group","emoji":"❤️","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793046608127-ofbgsywkcaq","kind":"group","emoji":"❤️","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=❤️ message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793046609994-fbjzj582dx","kind":"group","emoji":"😂","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793046611383-mn14vfz0ogc","kind":"group","emoji":"😂","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793046611383-mn14vfz0ogc","kind":"group","emoji":"😂","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=😂 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793046612828-dq4nbinew2m","kind":"group","emoji":"😮","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793046614358-5t7jj8goyvs","kind":"group","emoji":"😮","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793046614358-5t7jj8goyvs","kind":"group","emoji":"😮","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=😮 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793046616128-hmjn93xh3xt","kind":"group","emoji":"😢","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793046617527-mfei5rd3doi","kind":"group","emoji":"😢","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793046617527-mfei5rd3doi","kind":"group","emoji":"😢","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=😢 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793046618982-2kszk46ljka","kind":"group","emoji":"🙏","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793046620797-c2klohkwzn4","kind":"group","emoji":"🙏","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793046620797-c2klohkwzn4","kind":"group","emoji":"🙏","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=🙏 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
  Actual native screenshot: 27-stress-group-completed-cycle-1.png
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793046625780-9lkmfkdt9xc","kind":"group","emoji":"👍","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793046627161-oyffbuets8","kind":"group","emoji":"👍","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793046627161-oyffbuets8","kind":"group","emoji":"👍","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=👍 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793046628590-5399zgjagph","kind":"group","emoji":"❤️","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793046630146-e3x9kb37xhc","kind":"group","emoji":"❤️","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793046630146-e3x9kb37xhc","kind":"group","emoji":"❤️","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=❤️ message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793046632046-32gjyypv6dx","kind":"group","emoji":"😂","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793046633487-a090jiu84f","kind":"group","emoji":"😂","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793046633487-a090jiu84f","kind":"group","emoji":"😂","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=😂 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793046634909-rp8edfd7fqg","kind":"group","emoji":"😮","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793046636451-8zpfpfyfkm6","kind":"group","emoji":"😮","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793046636451-8zpfpfyfkm6","kind":"group","emoji":"😮","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=😮 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793046638240-lksmeygsjlo","kind":"group","emoji":"😢","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793046639694-uo3n9e7r88i","kind":"group","emoji":"😢","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793046639694-uo3n9e7r88i","kind":"group","emoji":"😢","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=😢 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793046641117-35yk9yg2xp","kind":"group","emoji":"🙏","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793046642696-4ck9fdzfh03","kind":"group","emoji":"🙏","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793046642696-4ck9fdzfh03","kind":"group","emoji":"🙏","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=🙏 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
  Actual native screenshot: 28-stress-group-completed-cycle-2.png
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793046647374-epvctb9uhsu","kind":"group","emoji":"👍","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793046648777-fhn9nyyky45","kind":"group","emoji":"👍","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793046648777-fhn9nyyky45","kind":"group","emoji":"👍","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=👍 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793046650254-b8skdcbanpu","kind":"group","emoji":"❤️","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793046651757-3janigna8pb","kind":"group","emoji":"❤️","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793046651757-3janigna8pb","kind":"group","emoji":"❤️","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=❤️ message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793046653485-2ef82xegzie","kind":"group","emoji":"😂","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793046654950-7x88jkpyevg","kind":"group","emoji":"😂","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793046654950-7x88jkpyevg","kind":"group","emoji":"😂","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=😂 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793046656701-gk1sts3jxf","kind":"group","emoji":"😮","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793046658486-a8s7naopltc","kind":"group","emoji":"😮","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793046658486-a8s7naopltc","kind":"group","emoji":"😮","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=😮 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793046660305-ccd8of6r8be","kind":"group","emoji":"😢","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793046661683-2ans6camk5h","kind":"group","emoji":"😢","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793046661683-2ans6camk5h","kind":"group","emoji":"😢","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=😢 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793046663285-msvvf60gfd","kind":"group","emoji":"🙏","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793046664811-gqnlj3cmu6","kind":"group","emoji":"🙏","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793046664811-gqnlj3cmu6","kind":"group","emoji":"🙏","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=🙏 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
  Actual native screenshot: 29-stress-group-completed-cycle-3.png
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793046669940-9kazfiz9655","kind":"group","emoji":"👍","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793046671333-2j77y6p9u4u","kind":"group","emoji":"👍","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793046671333-2j77y6p9u4u","kind":"group","emoji":"👍","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=👍 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793046672890-beqqh104ye9","kind":"group","emoji":"❤️","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793046674509-a0h3f5dmyw7","kind":"group","emoji":"❤️","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793046674509-a0h3f5dmyw7","kind":"group","emoji":"❤️","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=❤️ message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793046676351-d3xrxsi03n7","kind":"group","emoji":"😂","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793046677751-j3eyanc6uh9","kind":"group","emoji":"😂","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793046677751-j3eyanc6uh9","kind":"group","emoji":"😂","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=😂 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793046679353-nause20su1r","kind":"group","emoji":"😮","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793046681128-u6mjxeoa1ei","kind":"group","emoji":"😮","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793046681128-u6mjxeoa1ei","kind":"group","emoji":"😮","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=😮 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793046682931-swkeycdr5ao","kind":"group","emoji":"😢","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793046684566-lpd2xr68il8","kind":"group","emoji":"😢","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793046684566-lpd2xr68il8","kind":"group","emoji":"😢","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=😢 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793046686390-nmes3uuw35g","kind":"group","emoji":"🙏","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793046688151-0vkh1ae01rj","kind":"group","emoji":"🙏","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793046688151-0vkh1ae01rj","kind":"group","emoji":"🙏","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=🙏 message=d703d9bf-b863-445d-89ea-f36f2d38d0a4
  Actual native screenshot: 30-stress-group-completed-cycle-4.png
PASS R07

R08: Direct reaction stress — four complete six-emoji cycles across native chat reopen
REACTION-STRESS precondition direct native Sent + authoritative Firestore confirmed for c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793046694450-80iy6t221yk","kind":"direct","emoji":"👍","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793046695817-q9jwyrupo8","kind":"direct","emoji":"👍","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793046695817-q9jwyrupo8","kind":"direct","emoji":"👍","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=👍 message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793046697249-jjxid36wsv","kind":"direct","emoji":"❤️","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793046698638-9xrud8mjfst","kind":"direct","emoji":"❤️","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793046698638-9xrud8mjfst","kind":"direct","emoji":"❤️","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=❤️ message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793046700102-hrjbe4kt1ha","kind":"direct","emoji":"😂","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793046701538-ita7pw349uf","kind":"direct","emoji":"😂","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793046701538-ita7pw349uf","kind":"direct","emoji":"😂","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=😂 message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793046702946-0eypgrylw4u6","kind":"direct","emoji":"😮","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793046704329-l9d6f6k5m3k","kind":"direct","emoji":"😮","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793046704329-l9d6f6k5m3k","kind":"direct","emoji":"😮","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=😮 message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793046705775-istg3mkqdt","kind":"direct","emoji":"😢","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793046707196-d5igi1bq96f","kind":"direct","emoji":"😢","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793046707196-d5igi1bq96f","kind":"direct","emoji":"😢","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=😢 message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793046708620-qnadg0zrkz","kind":"direct","emoji":"🙏","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793046709973-8bpx0hw8tz9","kind":"direct","emoji":"🙏","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793046709973-8bpx0hw8tz9","kind":"direct","emoji":"🙏","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=🙏 message=c4177948-dec7-4952-a620-eecd4852e478
  Actual native screenshot: 31-stress-direct-completed-cycle-1.png
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793046714614-zlik6rcjapr","kind":"direct","emoji":"👍","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793046716009-l6gp6y2kcg","kind":"direct","emoji":"👍","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793046716009-l6gp6y2kcg","kind":"direct","emoji":"👍","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=👍 message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793046717429-p2om8r4u4te","kind":"direct","emoji":"❤️","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793046718806-35phmc5h5xt","kind":"direct","emoji":"❤️","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793046718806-35phmc5h5xt","kind":"direct","emoji":"❤️","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=❤️ message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793046720212-oerd6xvrqbj","kind":"direct","emoji":"😂","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793046721599-nvi7zmvx8tg","kind":"direct","emoji":"😂","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793046721599-nvi7zmvx8tg","kind":"direct","emoji":"😂","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=😂 message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793046723044-bgn8w2ixydj","kind":"direct","emoji":"😮","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793046724414-zofwf2pr5uk","kind":"direct","emoji":"😮","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793046724414-zofwf2pr5uk","kind":"direct","emoji":"😮","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=😮 message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793046725836-97q9z2fhnei","kind":"direct","emoji":"😢","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793046727210-nk5qe9as8i","kind":"direct","emoji":"😢","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793046727210-nk5qe9as8i","kind":"direct","emoji":"😢","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=😢 message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793046728629-1foqcdvq1h2","kind":"direct","emoji":"🙏","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793046730005-27t98ok8q4e","kind":"direct","emoji":"🙏","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793046730005-27t98ok8q4e","kind":"direct","emoji":"🙏","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=🙏 message=c4177948-dec7-4952-a620-eecd4852e478
  Actual native screenshot: 32-stress-direct-completed-cycle-2.png
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793046734645-kihewvltf9","kind":"direct","emoji":"👍","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793046736033-3ojquefjwxe","kind":"direct","emoji":"👍","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793046736033-3ojquefjwxe","kind":"direct","emoji":"👍","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=👍 message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793046737470-wmb9tskr0ze","kind":"direct","emoji":"❤️","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793046738853-so2x9vaaxt","kind":"direct","emoji":"❤️","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793046738853-so2x9vaaxt","kind":"direct","emoji":"❤️","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=❤️ message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793046740251-y9rce2h2zo","kind":"direct","emoji":"😂","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793046741660-hypk5jjl7tk","kind":"direct","emoji":"😂","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793046741660-hypk5jjl7tk","kind":"direct","emoji":"😂","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=😂 message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793046743086-cr8gfj8shlv","kind":"direct","emoji":"😮","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793046744462-l4pfh24zcl","kind":"direct","emoji":"😮","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793046744462-l4pfh24zcl","kind":"direct","emoji":"😮","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=😮 message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793046745865-r7kvv0dpd9","kind":"direct","emoji":"😢","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793046747250-vwt8s5eu5y","kind":"direct","emoji":"😢","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793046747250-vwt8s5eu5y","kind":"direct","emoji":"😢","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=😢 message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793046748664-ecm0mn18hu","kind":"direct","emoji":"🙏","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793046750056-4ka4ofjj486","kind":"direct","emoji":"🙏","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793046750056-4ka4ofjj486","kind":"direct","emoji":"🙏","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=🙏 message=c4177948-dec7-4952-a620-eecd4852e478
  Actual native screenshot: 33-stress-direct-completed-cycle-3.png
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793046754693-8ndqbaw84zb","kind":"direct","emoji":"👍","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793046756092-jps6llek6in","kind":"direct","emoji":"👍","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793046756092-jps6llek6in","kind":"direct","emoji":"👍","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=👍 message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793046757511-jgsfhbczura","kind":"direct","emoji":"❤️","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793046758906-ytxiqkr8i78","kind":"direct","emoji":"❤️","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793046758906-ytxiqkr8i78","kind":"direct","emoji":"❤️","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=❤️ message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793046760320-5lb6u4f7rzb","kind":"direct","emoji":"😂","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793046761706-q6kdn0q2yws","kind":"direct","emoji":"😂","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793046761706-q6kdn0q2yws","kind":"direct","emoji":"😂","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=😂 message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793046763123-5tokrr9q0q","kind":"direct","emoji":"😮","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793046764494-cwka2d67t6","kind":"direct","emoji":"😮","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793046764494-cwka2d67t6","kind":"direct","emoji":"😮","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=😮 message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793046765906-7qndfngl9pv","kind":"direct","emoji":"😢","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793046767294-qkz05c0onvh","kind":"direct","emoji":"😢","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793046767294-qkz05c0onvh","kind":"direct","emoji":"😢","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=😢 message=c4177948-dec7-4952-a620-eecd4852e478
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793046768732-wce4ahbygu","kind":"direct","emoji":"🙏","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793046770103-22cm33n9rl9","kind":"direct","emoji":"🙏","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793046770103-22cm33n9rl9","kind":"direct","emoji":"🙏","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=🙏 message=c4177948-dec7-4952-a620-eecd4852e478
  Actual native screenshot: 34-stress-direct-completed-cycle-4.png
PASS R08
REACTION-STRESS summary interruptedGroupSend=true group=true direct=true; no release approval implied.

```
