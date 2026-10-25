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

### R09 — PASS: Group send continuity on immediate navigation interruption

One encrypted group message reached Sent and remained unique after immediate navigation away and return; real network loss not simulated

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

R09: Group send continuity on immediate navigation interruption
SEND-INTERRUPTION pre-navigation {"newDocs":1,"states":["sent"]}
SEND-INTERRUPTION PASS {"id":"5d0d2fd6-ff47-4d78-8395-7fe80d1f97df","initialStates":["sent"],"finalState":"sent","newDocs":1}
PASS R09

R07: Group reaction stress — four complete six-emoji cycles across native chat reopen
REACTION-STRESS precondition group native Sent + authoritative Firestore confirmed for fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-1-apply-1792904106771-no8nwd3la6","kind":"group","emoji":"👍","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1792904108173-2q0b9jfjz8n","kind":"group","emoji":"👍","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1792904108173-2q0b9jfjz8n","kind":"group","emoji":"👍","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=👍 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-1-apply-1792904110137-msiipcm9fbb","kind":"group","emoji":"❤️","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1792904111542-u24mzcwn9m","kind":"group","emoji":"❤️","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1792904111542-u24mzcwn9m","kind":"group","emoji":"❤️","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=❤️ message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-1-apply-1792904113498-skiaybvpamp","kind":"group","emoji":"😂","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1792904114909-z0quvom0zic","kind":"group","emoji":"😂","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1792904114909-z0quvom0zic","kind":"group","emoji":"😂","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=😂 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-1-apply-1792904116696-wrgm8gwb3j","kind":"group","emoji":"😮","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1792904118250-2bw4atmjoaw","kind":"group","emoji":"😮","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1792904118250-2bw4atmjoaw","kind":"group","emoji":"😮","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=😮 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-1-apply-1792904120298-ja0coltxh8","kind":"group","emoji":"😢","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1792904121664-z1qpzpmwhlq","kind":"group","emoji":"😢","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1792904121664-z1qpzpmwhlq","kind":"group","emoji":"😢","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=😢 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-1-apply-1792904123109-g8ybzpxwjma","kind":"group","emoji":"🙏","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-1-remove-1792904124859-nqib7v6upvd","kind":"group","emoji":"🙏","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-1-remove-1792904124859-nqib7v6upvd","kind":"group","emoji":"🙏","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=1/4 emoji=🙏 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
  Actual native screenshot: 27-stress-group-completed-cycle-1.png
REACTION-CLICK {"op":"fid-sim-group-2-apply-1792904129621-a0y2jmq7uqn","kind":"group","emoji":"👍","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1792904131009-b4h1dm0wt35","kind":"group","emoji":"👍","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1792904131009-b4h1dm0wt35","kind":"group","emoji":"👍","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=👍 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-2-apply-1792904132714-j83ub0leyd","kind":"group","emoji":"❤️","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1792904134584-qc0wa7qybmm","kind":"group","emoji":"❤️","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1792904134584-qc0wa7qybmm","kind":"group","emoji":"❤️","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=❤️ message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-2-apply-1792904136448-xqwebh2w8sa","kind":"group","emoji":"😂","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1792904137825-cs9gxnjuoe","kind":"group","emoji":"😂","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1792904137825-cs9gxnjuoe","kind":"group","emoji":"😂","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=😂 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-2-apply-1792904139258-wmlqdlpnv7p","kind":"group","emoji":"😮","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1792904140769-el85y0o51j9","kind":"group","emoji":"😮","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1792904140769-el85y0o51j9","kind":"group","emoji":"😮","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=😮 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-2-apply-1792904142191-gcvcf98jxaa","kind":"group","emoji":"😢","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1792904143577-y36sfrzcqlk","kind":"group","emoji":"😢","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1792904143577-y36sfrzcqlk","kind":"group","emoji":"😢","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=😢 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-2-apply-1792904145014-zrmmxl1kuo","kind":"group","emoji":"🙏","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-2-remove-1792904146484-snhkrofq4n","kind":"group","emoji":"🙏","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-2-remove-1792904146484-snhkrofq4n","kind":"group","emoji":"🙏","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=2/4 emoji=🙏 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
  Actual native screenshot: 28-stress-group-completed-cycle-2.png
REACTION-CLICK {"op":"fid-sim-group-3-apply-1792904151259-x6tnii4fhxn","kind":"group","emoji":"👍","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1792904152648-f9kx05vvsf6","kind":"group","emoji":"👍","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1792904152648-f9kx05vvsf6","kind":"group","emoji":"👍","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=👍 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-3-apply-1792904154097-3l4ksm32lap","kind":"group","emoji":"❤️","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1792904155482-zke8sg9vscf","kind":"group","emoji":"❤️","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1792904155482-zke8sg9vscf","kind":"group","emoji":"❤️","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=❤️ message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-3-apply-1792904156914-i4dt7m76hpp","kind":"group","emoji":"😂","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1792904158323-flrdqg6ijp","kind":"group","emoji":"😂","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1792904158323-flrdqg6ijp","kind":"group","emoji":"😂","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=😂 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-3-apply-1792904159742-i3etxsb46d","kind":"group","emoji":"😮","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1792904161278-n906ox7vue","kind":"group","emoji":"😮","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1792904161278-n906ox7vue","kind":"group","emoji":"😮","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=😮 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-3-apply-1792904163176-3mnhv8sqqnx","kind":"group","emoji":"😢","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1792904164590-biniy60eim","kind":"group","emoji":"😢","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1792904164590-biniy60eim","kind":"group","emoji":"😢","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=😢 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-3-apply-1792904166373-ulsco499zr","kind":"group","emoji":"🙏","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-3-remove-1792904168205-pqcq5b0e8h","kind":"group","emoji":"🙏","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-3-remove-1792904168205-pqcq5b0e8h","kind":"group","emoji":"🙏","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=3/4 emoji=🙏 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
  Actual native screenshot: 29-stress-group-completed-cycle-3.png
REACTION-CLICK {"op":"fid-sim-group-4-apply-1792904173139-axlwkxkr35d","kind":"group","emoji":"👍","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1792904174522-mjh0ykq81c","kind":"group","emoji":"👍","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1792904174522-mjh0ykq81c","kind":"group","emoji":"👍","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=👍 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-4-apply-1792904176119-2gwr58pj4i9","kind":"group","emoji":"❤️","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1792904177935-wszoz37zmba","kind":"group","emoji":"❤️","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1792904177935-wszoz37zmba","kind":"group","emoji":"❤️","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=❤️ message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-4-apply-1792904179466-zk5mp7lkh1n","kind":"group","emoji":"😂","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1792904181099-dksqnfpeof","kind":"group","emoji":"😂","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1792904181099-dksqnfpeof","kind":"group","emoji":"😂","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=😂 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-4-apply-1792904182555-ugdqo7wqxx","kind":"group","emoji":"😮","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1792904183950-822h6etcdqw","kind":"group","emoji":"😮","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1792904183950-822h6etcdqw","kind":"group","emoji":"😮","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=😮 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-4-apply-1792904185401-rky4mtpkxx","kind":"group","emoji":"😢","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1792904186885-cktl6436rwi","kind":"group","emoji":"😢","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1792904186885-cktl6436rwi","kind":"group","emoji":"😢","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=😢 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
REACTION-CLICK {"op":"fid-sim-group-4-apply-1792904188540-55uo3yrh1zv","kind":"group","emoji":"🙏","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-group-4-remove-1792904190391-7wqr2qq5sa3","kind":"group","emoji":"🙏","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-group-4-remove-1792904190391-7wqr2qq5sa3","kind":"group","emoji":"🙏","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS group cycle=4/4 emoji=🙏 message=fcb51b83-31ad-4576-9302-03e4d4a819c2
  Actual native screenshot: 30-stress-group-completed-cycle-4.png
PASS R07

R08: Direct reaction stress — four complete six-emoji cycles across native chat reopen
REACTION-STRESS precondition direct native Sent + authoritative Firestore confirmed for d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1792904196586-0p9r3ce5kx6q","kind":"direct","emoji":"👍","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1792904198001-ny17hbj6ns","kind":"direct","emoji":"👍","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1792904198001-ny17hbj6ns","kind":"direct","emoji":"👍","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=👍 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1792904199474-0rg6a80kcscp","kind":"direct","emoji":"❤️","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1792904200862-kcv76pfg4np","kind":"direct","emoji":"❤️","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1792904200862-kcv76pfg4np","kind":"direct","emoji":"❤️","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=❤️ message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1792904202319-vo0a3bnyjx","kind":"direct","emoji":"😂","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1792904203702-y6285wedibn","kind":"direct","emoji":"😂","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1792904203702-y6285wedibn","kind":"direct","emoji":"😂","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=😂 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1792904205124-x1ljjgs2vti","kind":"direct","emoji":"😮","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1792904206512-v3j9rktvrq8","kind":"direct","emoji":"😮","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1792904206512-v3j9rktvrq8","kind":"direct","emoji":"😮","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=😮 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1792904207939-96tmvmqxlp","kind":"direct","emoji":"😢","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1792904209334-8i8z15y4t7y","kind":"direct","emoji":"😢","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1792904209334-8i8z15y4t7y","kind":"direct","emoji":"😢","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=😢 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-1-apply-1792904210833-1q2rae0swof","kind":"direct","emoji":"🙏","cycle":1,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-1-remove-1792904212248-76xmtg8811","kind":"direct","emoji":"🙏","cycle":1,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-1-remove-1792904212248-76xmtg8811","kind":"direct","emoji":"🙏","cycle":1,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=1/4 emoji=🙏 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
  Actual native screenshot: 31-stress-direct-completed-cycle-1.png
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1792904216926-xl84w9mje4o","kind":"direct","emoji":"👍","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1792904218332-rtwf3jz8dgi","kind":"direct","emoji":"👍","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1792904218332-rtwf3jz8dgi","kind":"direct","emoji":"👍","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=👍 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1792904219778-lc3g8tvzwjo","kind":"direct","emoji":"❤️","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1792904221209-zd6z85ugkt9","kind":"direct","emoji":"❤️","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1792904221209-zd6z85ugkt9","kind":"direct","emoji":"❤️","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=❤️ message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1792904222627-j1lisy7hxx","kind":"direct","emoji":"😂","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1792904224006-gla5jkn3tlr","kind":"direct","emoji":"😂","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1792904224006-gla5jkn3tlr","kind":"direct","emoji":"😂","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=😂 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1792904225433-ql47cj56u0b","kind":"direct","emoji":"😮","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1792904226845-36z7jmof80t","kind":"direct","emoji":"😮","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1792904226845-36z7jmof80t","kind":"direct","emoji":"😮","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=😮 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1792904228256-enqstslq3mh","kind":"direct","emoji":"😢","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1792904229656-lrh19psr84m","kind":"direct","emoji":"😢","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1792904229656-lrh19psr84m","kind":"direct","emoji":"😢","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=😢 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-2-apply-1792904231083-x47owk9zfxr","kind":"direct","emoji":"🙏","cycle":2,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-2-remove-1792904232485-gp7n61493eh","kind":"direct","emoji":"🙏","cycle":2,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-2-remove-1792904232485-gp7n61493eh","kind":"direct","emoji":"🙏","cycle":2,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=2/4 emoji=🙏 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
  Actual native screenshot: 32-stress-direct-completed-cycle-2.png
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1792904237165-1zrl6oge1wn","kind":"direct","emoji":"👍","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1792904238564-ybs1wq7czvp","kind":"direct","emoji":"👍","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1792904238564-ybs1wq7czvp","kind":"direct","emoji":"👍","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=👍 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1792904239986-xmif28d8n8","kind":"direct","emoji":"❤️","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1792904241398-g3cq2voomf4","kind":"direct","emoji":"❤️","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1792904241398-g3cq2voomf4","kind":"direct","emoji":"❤️","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=❤️ message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1792904242836-8s8jr5gcsua","kind":"direct","emoji":"😂","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1792904244221-eqljrfcyd5j","kind":"direct","emoji":"😂","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1792904244221-eqljrfcyd5j","kind":"direct","emoji":"😂","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=😂 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1792904245656-6771dp1s57h","kind":"direct","emoji":"😮","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1792904247071-ayf4ggxnp8","kind":"direct","emoji":"😮","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1792904247071-ayf4ggxnp8","kind":"direct","emoji":"😮","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=😮 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1792904248492-cu7iz1rixx","kind":"direct","emoji":"😢","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1792904249872-7cddt4pi2mn","kind":"direct","emoji":"😢","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1792904249872-7cddt4pi2mn","kind":"direct","emoji":"😢","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=😢 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-3-apply-1792904251330-cfhjuxg4pje","kind":"direct","emoji":"🙏","cycle":3,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-3-remove-1792904252707-bg8plmgji8","kind":"direct","emoji":"🙏","cycle":3,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-3-remove-1792904252707-bg8plmgji8","kind":"direct","emoji":"🙏","cycle":3,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=3/4 emoji=🙏 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
  Actual native screenshot: 33-stress-direct-completed-cycle-3.png
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1792904257349-58n2aw31n5t","kind":"direct","emoji":"👍","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1792904258731-n11o2j7qfwf","kind":"direct","emoji":"👍","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1792904258731-n11o2j7qfwf","kind":"direct","emoji":"👍","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=👍 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1792904260156-oyqs6nwe7kq","kind":"direct","emoji":"❤️","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1792904261560-a2t0tiavz2e","kind":"direct","emoji":"❤️","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1792904261560-a2t0tiavz2e","kind":"direct","emoji":"❤️","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=❤️ message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1792904262990-rmwyqlaff0b","kind":"direct","emoji":"😂","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1792904264386-xr23lqnfgzh","kind":"direct","emoji":"😂","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1792904264386-xr23lqnfgzh","kind":"direct","emoji":"😂","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=😂 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1792904265803-i295qbwwlj","kind":"direct","emoji":"😮","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1792904267190-ndw45jyu8e8","kind":"direct","emoji":"😮","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1792904267190-ndw45jyu8e8","kind":"direct","emoji":"😮","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=😮 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1792904268590-bat3hps40z5","kind":"direct","emoji":"😢","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1792904269995-6i3r4v9pyoj","kind":"direct","emoji":"😢","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1792904269995-6i3r4v9pyoj","kind":"direct","emoji":"😢","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=😢 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
REACTION-CLICK {"op":"fid-sim-direct-4-apply-1792904271430-opq3oskv2qf","kind":"direct","emoji":"🙏","cycle":4,"phase":"apply","disabled":false,"connected":true,"pressed":"false","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-CLICK {"op":"fid-sim-direct-4-remove-1792904272802-imrqpcs1zz9","kind":"direct","emoji":"🙏","cycle":4,"phase":"remove","disabled":false,"connected":true,"pressed":"true","handler":true,"delivered":1,"disabledAfter":true,"connectedAfter":true,"evaluations":1,"inspectorReplay":false}
REACTION-REMOVE-OBSERVATION {"op":"fid-sim-direct-4-remove-1792904272802-imrqpcs1zz9","kind":"direct","emoji":"🙏","cycle":4,"ui":"{\"dialogOpen\":false,\"buttonDisabled\":null,\"chipCount\":0}"}
REACTION-STRESS PASS direct cycle=4/4 emoji=🙏 message=d4c41ee9-9114-4718-9ccf-940e9a696a3e
  Actual native screenshot: 34-stress-direct-completed-cycle-4.png
PASS R08
REACTION-STRESS summary interruptedGroupSend=true group=true direct=true; no release approval implied.

```
