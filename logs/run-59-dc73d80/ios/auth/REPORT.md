# FIDUNIO authenticated iPhone native simulator results

**PASS — 24 passed, 0 failed, 0 blocked**

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

### R09 — PASS: Group send continuity while encrypted Outbox is held through navigation

Encrypted Outbox was held before network delivery, survived navigation while Sending, then delivered exactly once with native Sent UI

### R07 — PASS: Group reaction stress — four complete six-emoji cycles across native chat reopen

group 4 cycles × 6 emoji = 24 authentic add/remove pairs; Firestore and UI synchronized after each step

### R08 — PASS: Direct reaction stress — four complete six-emoji cycles across native chat reopen

direct 4 cycles × 6 emoji = 24 authentic add/remove pairs; Firestore and UI synchronized after each step

### R10 — PASS: Real native group emoji chip opens correct authors after a second authenticated account reacts

Native owner message + signed-in Bob peer transaction + real UI chip names. Multi-author, change, remove, owner reaction retained; no ID leak.

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

### native-reaction-authors-1-🙏

![native-reaction-authors-1-🙏](35-native-reaction-authors-1-🙏.png)

### native-reaction-authors-2-🙏

![native-reaction-authors-2-🙏](36-native-reaction-authors-2-🙏.png)

### native-reaction-authors-1-❤️

![native-reaction-authors-1-❤️](37-native-reaction-authors-1-❤️.png)

## Execution record

```text
Native authenticated ios suite. LOCAL demo-only accounts.

N01: Accept legal Terms and open actual Join form
  Actual native screenshot: 01-native-join-screen.png
PASS N01
  Local Firestore HTTP probe: {"state":"reachable"}
  Local Firestore SDK pre-Join probe: {"state":"success"}

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

R09: Group send continuity while encrypted Outbox is held through navigation
SEND-INTERRUPTION Outbox hold armed before Send
SEND-INTERRUPTION VERIFIED-IN-FLIGHT {"local":[{"id":"1adcc6f6-74c0-4974-a5f8-937e0b5c35e0","state":"4:22 AM\nSending\n"}],"authoritativeDocs":0,"outbox":"durably-staged"}
SEND-INTERRUPTION Outbox resumed after leaving group chat
SEND-INTERRUPTION PASS {"id":"1adcc6f6-74c0-4974-a5f8-937e0b5c35e0","wasPendingBeforeNavigation":true,"finalState":"sent","newDocs":1}
PASS R09

R07: Group reaction stress — four complete six-emoji cycles across native chat reopen
REACTION-STRESS precondition group native Sent + authoritative Firestore confirmed for 6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793074976058-jnwlemwfegf","kind":"group","emoji":"👍","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793074978979-bfx90enq89","kind":"group","emoji":"👍","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793074978979-bfx90enq89","kind":"group","emoji":"👍","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":1}"}
REACTION-STRESS PASS group cycle=1/4 emoji=👍 message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793074982644-kespv932ca","kind":"group","emoji":"❤️","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793074984820-cq86iquziiw","kind":"group","emoji":"❤️","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793074984820-cq86iquziiw","kind":"group","emoji":"❤️","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":1}"}
REACTION-STRESS PASS group cycle=1/4 emoji=❤️ message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793074987159-h0tuq772ynk","kind":"group","emoji":"😂","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793074988944-bl41c8pyv0q","kind":"group","emoji":"😂","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793074988944-bl41c8pyv0q","kind":"group","emoji":"😂","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":1}"}
REACTION-STRESS PASS group cycle=1/4 emoji=😂 message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793074991099-oho55np9ge","kind":"group","emoji":"😮","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793074993562-sej8k1gr7","kind":"group","emoji":"😮","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793074993562-sej8k1gr7","kind":"group","emoji":"😮","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=😮 message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793074995032-fe678rue17o","kind":"group","emoji":"😢","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793074996552-mjccd7uoh4c","kind":"group","emoji":"😢","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793074996552-mjccd7uoh4c","kind":"group","emoji":"😢","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=😢 message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793074998072-q2f11wwijbi","kind":"group","emoji":"🙏","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793074999565-6zn9okemgy","kind":"group","emoji":"🙏","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793074999565-6zn9okemgy","kind":"group","emoji":"🙏","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=🙏 message=6734295e-cc7b-4606-aab0-b638130b82e0
  Actual native screenshot: 27-stress-group-completed-cycle-1.png
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793075006717-rz0s2f60b5j","kind":"group","emoji":"👍","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793075008305-bgh2hbukvv","kind":"group","emoji":"👍","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793075008305-bgh2hbukvv","kind":"group","emoji":"👍","cycle":2,"ui":"{\"dialogOpen\":true,\"buttonDisabled\":true,\"chipCount\":1}"}
REACTION-STRESS PASS group cycle=2/4 emoji=👍 message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793075020590-pn77dv3fo7","kind":"group","emoji":"❤️","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793075022374-o0e7imw2evh","kind":"group","emoji":"❤️","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793075022374-o0e7imw2evh","kind":"group","emoji":"❤️","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=❤️ message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793075024041-j3hgqp73j0c","kind":"group","emoji":"😂","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793075025612-f4go2eig1i","kind":"group","emoji":"😂","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793075025612-f4go2eig1i","kind":"group","emoji":"😂","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=😂 message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793075027157-kg9u2kjvzro","kind":"group","emoji":"😮","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793075028963-w7tpnjh3kfo","kind":"group","emoji":"😮","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793075028963-w7tpnjh3kfo","kind":"group","emoji":"😮","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=😮 message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793075030495-0h70ydf81nek","kind":"group","emoji":"😢","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793075031985-qw26r004q4e","kind":"group","emoji":"😢","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793075031985-qw26r004q4e","kind":"group","emoji":"😢","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=😢 message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793075034172-5uye4kzxyxn","kind":"group","emoji":"🙏","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793075036060-8ra8pimciw","kind":"group","emoji":"🙏","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793075036060-8ra8pimciw","kind":"group","emoji":"🙏","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":1}"}
REACTION-STRESS PASS group cycle=2/4 emoji=🙏 message=6734295e-cc7b-4606-aab0-b638130b82e0
  Actual native screenshot: 28-stress-group-completed-cycle-2.png
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793075043837-jgrktcmbkg9","kind":"group","emoji":"👍","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793075045287-qnb1q1b2ol9","kind":"group","emoji":"👍","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793075045287-qnb1q1b2ol9","kind":"group","emoji":"👍","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=👍 message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793075046670-w94sb62kmm","kind":"group","emoji":"❤️","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793075048164-gh7szzengah","kind":"group","emoji":"❤️","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793075048164-gh7szzengah","kind":"group","emoji":"❤️","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=❤️ message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793075049592-gf1cxmep04b","kind":"group","emoji":"😂","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793075050999-ewt952xd70p","kind":"group","emoji":"😂","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793075050999-ewt952xd70p","kind":"group","emoji":"😂","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=😂 message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793075052398-nj0jon70eui","kind":"group","emoji":"😮","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793075053846-lq32lujry","kind":"group","emoji":"😮","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793075053846-lq32lujry","kind":"group","emoji":"😮","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=😮 message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793075055467-52sdnr0lnsr","kind":"group","emoji":"😢","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793075056998-cxfarxi5vkn","kind":"group","emoji":"😢","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793075056998-cxfarxi5vkn","kind":"group","emoji":"😢","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=😢 message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793075058826-m3q8ba7wl2","kind":"group","emoji":"🙏","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793075060239-289ehta3q34i","kind":"group","emoji":"🙏","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793075060239-289ehta3q34i","kind":"group","emoji":"🙏","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=🙏 message=6734295e-cc7b-4606-aab0-b638130b82e0
  Actual native screenshot: 29-stress-group-completed-cycle-3.png
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793075065887-z74crsfh4iq","kind":"group","emoji":"👍","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793075067373-56gux9prbtr","kind":"group","emoji":"👍","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793075067373-56gux9prbtr","kind":"group","emoji":"👍","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=👍 message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793075068749-xic75l6s7ic","kind":"group","emoji":"❤️","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793075070149-kqcksmucvbd","kind":"group","emoji":"❤️","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793075070149-kqcksmucvbd","kind":"group","emoji":"❤️","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=❤️ message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793075071528-o7wwiovnor","kind":"group","emoji":"😂","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793075072860-s2yfu8vwhd","kind":"group","emoji":"😂","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793075072860-s2yfu8vwhd","kind":"group","emoji":"😂","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=😂 message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793075074323-73guavftejp","kind":"group","emoji":"😮","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793075076839-mb1tte3mwg","kind":"group","emoji":"😮","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793075076839-mb1tte3mwg","kind":"group","emoji":"😮","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=😮 message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793075078312-co35ljvfa3f","kind":"group","emoji":"😢","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793075079731-eevqkvrbg9i","kind":"group","emoji":"😢","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793075079731-eevqkvrbg9i","kind":"group","emoji":"😢","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=😢 message=6734295e-cc7b-4606-aab0-b638130b82e0
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793075081426-39uu02rdymb","kind":"group","emoji":"🙏","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793075082886-i9ouaudad2j","kind":"group","emoji":"🙏","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793075082886-i9ouaudad2j","kind":"group","emoji":"🙏","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=🙏 message=6734295e-cc7b-4606-aab0-b638130b82e0
  Actual native screenshot: 30-stress-group-completed-cycle-4.png
PASS R07

R08: Direct reaction stress — four complete six-emoji cycles across native chat reopen
REACTION-STRESS precondition direct native Sent + authoritative Firestore confirmed for 16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793075091350-5xabtrnpuve","kind":"direct","emoji":"👍","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793075092664-2id1erdvrcq","kind":"direct","emoji":"👍","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793075092664-2id1erdvrcq","kind":"direct","emoji":"👍","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=👍 message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793075093954-r50msjuj3r","kind":"direct","emoji":"❤️","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793075095252-6jxupwdgn3w","kind":"direct","emoji":"❤️","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793075095252-6jxupwdgn3w","kind":"direct","emoji":"❤️","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=❤️ message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793075096642-vhlbgbvxfm","kind":"direct","emoji":"😂","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793075097948-u36pt183jc","kind":"direct","emoji":"😂","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793075097948-u36pt183jc","kind":"direct","emoji":"😂","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=😂 message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793075099210-6e97f6thcek","kind":"direct","emoji":"😮","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793075100534-8tkvxrzdr6b","kind":"direct","emoji":"😮","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793075100534-8tkvxrzdr6b","kind":"direct","emoji":"😮","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=😮 message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793075101925-d0wsyk28qie","kind":"direct","emoji":"😢","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793075103234-p5yvmcritaf","kind":"direct","emoji":"😢","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793075103234-p5yvmcritaf","kind":"direct","emoji":"😢","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=😢 message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793075104750-o8o6fksyyc","kind":"direct","emoji":"🙏","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793075106148-9s0e8tp4csl","kind":"direct","emoji":"🙏","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793075106148-9s0e8tp4csl","kind":"direct","emoji":"🙏","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=🙏 message=16967608-8a0b-4efe-9ff6-ec00f681e496
  Actual native screenshot: 31-stress-direct-completed-cycle-1.png
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793075111547-tmtoujmo19s","kind":"direct","emoji":"👍","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793075112879-h62ufr8d78l","kind":"direct","emoji":"👍","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793075112879-h62ufr8d78l","kind":"direct","emoji":"👍","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=👍 message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793075114281-lrzdhxna7ka","kind":"direct","emoji":"❤️","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793075115817-27co910c88i","kind":"direct","emoji":"❤️","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793075115817-27co910c88i","kind":"direct","emoji":"❤️","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=❤️ message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793075117202-9kb9efxtici","kind":"direct","emoji":"😂","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793075118524-x35f95n3hzh","kind":"direct","emoji":"😂","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793075118524-x35f95n3hzh","kind":"direct","emoji":"😂","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=😂 message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793075120064-icxmy7oks08","kind":"direct","emoji":"😮","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793075122522-8tmm6zdywag","kind":"direct","emoji":"😮","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793075122522-8tmm6zdywag","kind":"direct","emoji":"😮","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=😮 message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793075123896-ocqcirg9g2m","kind":"direct","emoji":"😢","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793075125198-zqw6lsoewrh","kind":"direct","emoji":"😢","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793075125198-zqw6lsoewrh","kind":"direct","emoji":"😢","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=😢 message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793075126573-5a0nzr295a5","kind":"direct","emoji":"🙏","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793075127867-qa84fwk11xm","kind":"direct","emoji":"🙏","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793075127867-qa84fwk11xm","kind":"direct","emoji":"🙏","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=🙏 message=16967608-8a0b-4efe-9ff6-ec00f681e496
  Actual native screenshot: 32-stress-direct-completed-cycle-2.png
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793075135041-u1ayrzb2k4","kind":"direct","emoji":"👍","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793075136549-giee75fv7","kind":"direct","emoji":"👍","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793075136549-giee75fv7","kind":"direct","emoji":"👍","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=👍 message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793075137926-0va6yirkw1m","kind":"direct","emoji":"❤️","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793075139232-jfm3biu1ke","kind":"direct","emoji":"❤️","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793075139232-jfm3biu1ke","kind":"direct","emoji":"❤️","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=❤️ message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793075140616-9lxx8gtx4hr","kind":"direct","emoji":"😂","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793075141930-fcmgrmhtqlh","kind":"direct","emoji":"😂","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793075141930-fcmgrmhtqlh","kind":"direct","emoji":"😂","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=😂 message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793075143209-g9as9b7ozsi","kind":"direct","emoji":"😮","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793075144475-psh2qhx7oy","kind":"direct","emoji":"😮","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793075144475-psh2qhx7oy","kind":"direct","emoji":"😮","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=😮 message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793075145826-7o4ewfe1tyw","kind":"direct","emoji":"😢","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793075147164-a8emr2v33z","kind":"direct","emoji":"😢","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793075147164-a8emr2v33z","kind":"direct","emoji":"😢","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=😢 message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793075148436-3lf6miu7i22","kind":"direct","emoji":"🙏","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793075149809-ox838zps4h","kind":"direct","emoji":"🙏","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793075149809-ox838zps4h","kind":"direct","emoji":"🙏","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=🙏 message=16967608-8a0b-4efe-9ff6-ec00f681e496
  Actual native screenshot: 33-stress-direct-completed-cycle-3.png
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793075155379-p1d5gaa0qb","kind":"direct","emoji":"👍","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793075156770-7b5z65hrzt9","kind":"direct","emoji":"👍","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793075156770-7b5z65hrzt9","kind":"direct","emoji":"👍","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=👍 message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793075158034-aztsvz50lm5","kind":"direct","emoji":"❤️","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793075159359-q2bnuf9fjo","kind":"direct","emoji":"❤️","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793075159359-q2bnuf9fjo","kind":"direct","emoji":"❤️","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=❤️ message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793075160816-e4xu8f4zfj","kind":"direct","emoji":"😂","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793075162222-u08wbg2lbs","kind":"direct","emoji":"😂","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793075162222-u08wbg2lbs","kind":"direct","emoji":"😂","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=😂 message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793075163632-st7xgvtqsf","kind":"direct","emoji":"😮","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793075165056-qshjyn6wxin","kind":"direct","emoji":"😮","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793075165056-qshjyn6wxin","kind":"direct","emoji":"😮","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=😮 message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793075166394-hhv53l3nge","kind":"direct","emoji":"😢","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793075167723-hrvhd69x53","kind":"direct","emoji":"😢","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793075167723-hrvhd69x53","kind":"direct","emoji":"😢","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=😢 message=16967608-8a0b-4efe-9ff6-ec00f681e496
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793075169361-bahosrdj68q","kind":"direct","emoji":"🙏","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793075170849-8dzf748m1mw","kind":"direct","emoji":"🙏","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793075170849-8dzf748m1mw","kind":"direct","emoji":"🙏","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=🙏 message=16967608-8a0b-4efe-9ff6-ec00f681e496
  Actual native screenshot: 34-stress-direct-completed-cycle-4.png
PASS R08
REACTION-STRESS summary interruptedGroupSend=true group=true direct=true; no release approval implied.

R10: Real native group emoji chip opens correct authors after a second authenticated account reacts
  Actual native screenshot: 35-native-reaction-authors-1-🙏.png
  Actual native screenshot: 36-native-reaction-authors-2-🙏.png
  Actual native screenshot: 37-native-reaction-authors-1-❤️.png
R10 PASS: exact cross-account Firestore writer Bob, native chip/button, real modal names, multi-author, change, remove, no UID exposure
PASS R10

```
