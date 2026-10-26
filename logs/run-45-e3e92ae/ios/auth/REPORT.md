# FIDUNIO authenticated iPhone native simulator results

**PASS — 23 passed, 0 failed, 0 blocked**

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
SEND-INTERRUPTION VERIFIED-IN-FLIGHT {"local":[{"id":"33a75084-5ccc-4980-a60e-b0dcde9aca5d","state":"8:54 PM\nSending\n"}],"authoritativeDocs":0,"outbox":"durably-staged"}
SEND-INTERRUPTION Outbox resumed after leaving group chat
SEND-INTERRUPTION PASS {"id":"33a75084-5ccc-4980-a60e-b0dcde9aca5d","wasPendingBeforeNavigation":true,"finalState":"sent","newDocs":1}
PASS R09

R07: Group reaction stress — four complete six-emoji cycles across native chat reopen
REACTION-STRESS precondition group native Sent + authoritative Firestore confirmed for cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793048081369-n2p1e1lp59c","kind":"group","emoji":"👍","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793048083031-afvxnwl3kht","kind":"group","emoji":"👍","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793048083031-afvxnwl3kht","kind":"group","emoji":"👍","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=👍 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793048084683-kbupsdnlru9","kind":"group","emoji":"❤️","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793048086231-rv0ysj1enj","kind":"group","emoji":"❤️","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793048086231-rv0ysj1enj","kind":"group","emoji":"❤️","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=❤️ message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793048087629-82nxqow1l1t","kind":"group","emoji":"😂","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793048089030-c8bto5ocml7","kind":"group","emoji":"😂","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793048089030-c8bto5ocml7","kind":"group","emoji":"😂","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=😂 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793048090448-ke1eeye9znb","kind":"group","emoji":"😮","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793048091865-xoi8zcvlml","kind":"group","emoji":"😮","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793048091865-xoi8zcvlml","kind":"group","emoji":"😮","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=😮 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793048093284-8vpxu7s08kg","kind":"group","emoji":"😢","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793048094749-17segmxeabp","kind":"group","emoji":"😢","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793048094749-17segmxeabp","kind":"group","emoji":"😢","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":1}"}
REACTION-STRESS PASS group cycle=1/4 emoji=😢 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-1-apply-1793048096469-3kqtg3y6zsp","kind":"group","emoji":"🙏","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1793048098109-sdxx75oqo4s","kind":"group","emoji":"🙏","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1793048098109-sdxx75oqo4s","kind":"group","emoji":"🙏","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=🙏 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
  Actual native screenshot: 27-stress-group-completed-cycle-1.png
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793048105646-wiae6fwh7r9","kind":"group","emoji":"👍","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793048107241-kuhgex28xr","kind":"group","emoji":"👍","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793048107241-kuhgex28xr","kind":"group","emoji":"👍","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":1}"}
REACTION-STRESS PASS group cycle=2/4 emoji=👍 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793048108903-k204vzkedi","kind":"group","emoji":"❤️","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793048110301-a6058ou6n5q","kind":"group","emoji":"❤️","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793048110301-a6058ou6n5q","kind":"group","emoji":"❤️","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=❤️ message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793048111763-onp3mvkfwtd","kind":"group","emoji":"😂","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793048113267-zhz1gzhvwj","kind":"group","emoji":"😂","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793048113267-zhz1gzhvwj","kind":"group","emoji":"😂","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=😂 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793048114822-ty5cv8bm17q","kind":"group","emoji":"😮","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793048116420-phyvh77zv2k","kind":"group","emoji":"😮","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793048116420-phyvh77zv2k","kind":"group","emoji":"😮","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=😮 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793048117787-rzbnv6a09y","kind":"group","emoji":"😢","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793048119170-ct5u8y2x01k","kind":"group","emoji":"😢","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793048119170-ct5u8y2x01k","kind":"group","emoji":"😢","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=😢 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-2-apply-1793048120535-k3snmabt15e","kind":"group","emoji":"🙏","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1793048121970-k806hwipuy","kind":"group","emoji":"🙏","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1793048121970-k806hwipuy","kind":"group","emoji":"🙏","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=🙏 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
  Actual native screenshot: 28-stress-group-completed-cycle-2.png
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793048127259-0vr3hi0c9hli","kind":"group","emoji":"👍","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793048128733-hqse22ry1ds","kind":"group","emoji":"👍","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793048128733-hqse22ry1ds","kind":"group","emoji":"👍","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=👍 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793048130323-g56giapiw9","kind":"group","emoji":"❤️","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793048131755-rsy94ub0y3","kind":"group","emoji":"❤️","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793048131755-rsy94ub0y3","kind":"group","emoji":"❤️","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=❤️ message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793048133214-sg9s4lqmwcr","kind":"group","emoji":"😂","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793048134672-6or68e91zah","kind":"group","emoji":"😂","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793048134672-6or68e91zah","kind":"group","emoji":"😂","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=😂 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793048136418-c2huoleab4","kind":"group","emoji":"😮","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793048138139-ysb76gb80li","kind":"group","emoji":"😮","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793048138139-ysb76gb80li","kind":"group","emoji":"😮","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=😮 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793048139795-tcez22v5td8","kind":"group","emoji":"😢","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793048141637-pj6kqqnaqh","kind":"group","emoji":"😢","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793048141637-pj6kqqnaqh","kind":"group","emoji":"😢","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":1}"}
REACTION-STRESS PASS group cycle=3/4 emoji=😢 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-3-apply-1793048143398-ff9azslans","kind":"group","emoji":"🙏","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1793048145624-0kyncycscs7f","kind":"group","emoji":"🙏","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1793048145624-0kyncycscs7f","kind":"group","emoji":"🙏","cycle":3,"ui":"{\"dialogOpen\":true,\"buttonDisabled\":true,\"chipCount\":1}"}
REACTION-STRESS PASS group cycle=3/4 emoji=🙏 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
  Actual native screenshot: 29-stress-group-completed-cycle-3.png
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793048153573-zihwhnft9bp","kind":"group","emoji":"👍","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793048155979-dhkwpx0qvvw","kind":"group","emoji":"👍","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793048155979-dhkwpx0qvvw","kind":"group","emoji":"👍","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":1}"}
REACTION-STRESS PASS group cycle=4/4 emoji=👍 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793048158501-8ldc05w06e","kind":"group","emoji":"❤️","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793048160685-z2b22zn1ann","kind":"group","emoji":"❤️","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793048160685-z2b22zn1ann","kind":"group","emoji":"❤️","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":1}"}
REACTION-STRESS PASS group cycle=4/4 emoji=❤️ message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793048162747-6tv0umgospd","kind":"group","emoji":"😂","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793048166308-ceq9pj6jmk","kind":"group","emoji":"😂","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793048166308-ceq9pj6jmk","kind":"group","emoji":"😂","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":1}"}
REACTION-STRESS PASS group cycle=4/4 emoji=😂 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793048168145-0ohs2n2ya1bk","kind":"group","emoji":"😮","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793048170094-iv94cszkouo","kind":"group","emoji":"😮","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793048170094-iv94cszkouo","kind":"group","emoji":"😮","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=😮 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793048171596-pcz4rtnig6q","kind":"group","emoji":"😢","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793048173077-aovsd5jjn08","kind":"group","emoji":"😢","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793048173077-aovsd5jjn08","kind":"group","emoji":"😢","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=😢 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
REACTION-CLICK {"op":"fid-sim-group-4-apply-1793048174583-md23vpgj2j","kind":"group","emoji":"🙏","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1793048176134-60yink9od29","kind":"group","emoji":"🙏","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1793048176134-60yink9od29","kind":"group","emoji":"🙏","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=🙏 message=cc5a5e10-7d2d-4730-b22b-a4048535aadb
  Actual native screenshot: 30-stress-group-completed-cycle-4.png
PASS R07

R08: Direct reaction stress — four complete six-emoji cycles across native chat reopen
REACTION-STRESS precondition direct native Sent + authoritative Firestore confirmed for 6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793048186618-e7y9s5mvt65","kind":"direct","emoji":"👍","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793048188740-kmndwsddnlj","kind":"direct","emoji":"👍","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793048188740-kmndwsddnlj","kind":"direct","emoji":"👍","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=👍 message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793048190757-0wxckv4dli8","kind":"direct","emoji":"❤️","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793048192170-ckwt8n11zqg","kind":"direct","emoji":"❤️","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793048192170-ckwt8n11zqg","kind":"direct","emoji":"❤️","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=❤️ message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793048193694-qg3ca13px4j","kind":"direct","emoji":"😂","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793048195222-29nfjsawoes","kind":"direct","emoji":"😂","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793048195222-29nfjsawoes","kind":"direct","emoji":"😂","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=😂 message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793048197210-i59uowv4w7","kind":"direct","emoji":"😮","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793048198684-dlc3asohir","kind":"direct","emoji":"😮","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793048198684-dlc3asohir","kind":"direct","emoji":"😮","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=😮 message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793048200397-xjnqyv2aq3q","kind":"direct","emoji":"😢","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793048202824-yut0ss8os3","kind":"direct","emoji":"😢","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793048202824-yut0ss8os3","kind":"direct","emoji":"😢","cycle":1,"ui":"{\"dialogOpen\":true,\"buttonDisabled\":true,\"chipCount\":1}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=😢 message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1793048205572-stew0npr51","kind":"direct","emoji":"🙏","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1793048208098-diz7h4yzvrr","kind":"direct","emoji":"🙏","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1793048208098-diz7h4yzvrr","kind":"direct","emoji":"🙏","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=🙏 message=6c947e79-5644-4114-bd3e-582b423320cb
  Actual native screenshot: 31-stress-direct-completed-cycle-1.png
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793048222282-uhdd2w5v2ep","kind":"direct","emoji":"👍","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793048223855-dzffazwjqcr","kind":"direct","emoji":"👍","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793048223855-dzffazwjqcr","kind":"direct","emoji":"👍","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=👍 message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793048225305-11kv4s38mzxi","kind":"direct","emoji":"❤️","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793048226745-g55o9itfa9p","kind":"direct","emoji":"❤️","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793048226745-g55o9itfa9p","kind":"direct","emoji":"❤️","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=❤️ message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793048228444-ssns7dfoju","kind":"direct","emoji":"😂","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793048229913-qt55fxlubdf","kind":"direct","emoji":"😂","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793048229913-qt55fxlubdf","kind":"direct","emoji":"😂","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=😂 message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793048231621-lfmgs65iep","kind":"direct","emoji":"😮","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793048233038-xevtyfkt1j","kind":"direct","emoji":"😮","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793048233038-xevtyfkt1j","kind":"direct","emoji":"😮","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=😮 message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793048234451-1vh974kt7wf","kind":"direct","emoji":"😢","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793048236016-0now4ttnnqko","kind":"direct","emoji":"😢","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793048236016-0now4ttnnqko","kind":"direct","emoji":"😢","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=😢 message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1793048237381-s90i7m422tm","kind":"direct","emoji":"🙏","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1793048238874-mxgsj3pp13","kind":"direct","emoji":"🙏","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1793048238874-mxgsj3pp13","kind":"direct","emoji":"🙏","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=🙏 message=6c947e79-5644-4114-bd3e-582b423320cb
  Actual native screenshot: 32-stress-direct-completed-cycle-2.png
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793048245630-uhvkbztgoj","kind":"direct","emoji":"👍","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793048247059-5feeavw1z","kind":"direct","emoji":"👍","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793048247059-5feeavw1z","kind":"direct","emoji":"👍","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=👍 message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793048248343-are6wk6h8r","kind":"direct","emoji":"❤️","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793048249950-a1wjmc2cmn5","kind":"direct","emoji":"❤️","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793048249950-a1wjmc2cmn5","kind":"direct","emoji":"❤️","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=❤️ message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793048251517-zuajkzo170r","kind":"direct","emoji":"😂","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793048253041-cmsgc1poox6","kind":"direct","emoji":"😂","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793048253041-cmsgc1poox6","kind":"direct","emoji":"😂","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=😂 message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793048254340-jnoqa5zsln","kind":"direct","emoji":"😮","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793048255605-0dogsjfj4d1b","kind":"direct","emoji":"😮","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793048255605-0dogsjfj4d1b","kind":"direct","emoji":"😮","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=😮 message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793048256940-6g8wlvi295","kind":"direct","emoji":"😢","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793048258270-lo6bt6ew1v","kind":"direct","emoji":"😢","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793048258270-lo6bt6ew1v","kind":"direct","emoji":"😢","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=😢 message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1793048259562-mijyga61f3","kind":"direct","emoji":"🙏","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1793048260818-aw3byd5hux6","kind":"direct","emoji":"🙏","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1793048260818-aw3byd5hux6","kind":"direct","emoji":"🙏","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=🙏 message=6c947e79-5644-4114-bd3e-582b423320cb
  Actual native screenshot: 33-stress-direct-completed-cycle-3.png
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793048265894-iexv0octo2","kind":"direct","emoji":"👍","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793048267190-2fanhsphc8p","kind":"direct","emoji":"👍","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793048267190-2fanhsphc8p","kind":"direct","emoji":"👍","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=👍 message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793048268446-dcfmt3nmi8p","kind":"direct","emoji":"❤️","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793048269728-125bisjrl8ye","kind":"direct","emoji":"❤️","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793048269728-125bisjrl8ye","kind":"direct","emoji":"❤️","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=❤️ message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793048271027-0ekwxevyxk6h","kind":"direct","emoji":"😂","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793048272317-y1bfhvo053m","kind":"direct","emoji":"😂","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793048272317-y1bfhvo053m","kind":"direct","emoji":"😂","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=😂 message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793048273582-56ujrw8ul0i","kind":"direct","emoji":"😮","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793048274868-8rrd8zaench","kind":"direct","emoji":"😮","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793048274868-8rrd8zaench","kind":"direct","emoji":"😮","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=😮 message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793048276166-q8831oyfpuh","kind":"direct","emoji":"😢","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793048277438-rue8igge5p","kind":"direct","emoji":"😢","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793048277438-rue8igge5p","kind":"direct","emoji":"😢","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=😢 message=6c947e79-5644-4114-bd3e-582b423320cb
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1793048278730-6yfbcxd0xcv","kind":"direct","emoji":"🙏","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1793048280041-aopinoqwxts","kind":"direct","emoji":"🙏","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1793048280041-aopinoqwxts","kind":"direct","emoji":"🙏","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=🙏 message=6c947e79-5644-4114-bd3e-582b423320cb
  Actual native screenshot: 34-stress-direct-completed-cycle-4.png
PASS R08
REACTION-STRESS summary interruptedGroupSend=true group=true direct=true; no release approval implied.

```
