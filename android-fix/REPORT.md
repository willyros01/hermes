# FIDUNIO input probe — android — fix

| Check | What | Expected | Observed | |
|---|---|---|---|---|
| COPY | Press and hold a message, tap Copy | sheet offers Copy; the phone clipboard then holds the message text | Copy button present; clipboard now: " Copy test 4417" | as expected |
| SELECT-TEXT | Press and hold a message, Select Text, press and hold one word, tap Copy, then Done | only that word is copied; Done goes back to the same chat | marked: "Copy"; copied: "Copy"; after Done: same chat | as expected |
| PASTE | Press and hold the message box, tap the phone's Paste | the copied text appears in the message box | phone Copy (keyboard shortcut) used; phone Paste (keyboard shortcut) used; message box now: "   Paste test 2286" | as expected |
| PICTURE-PASTE | A paste that carries a picture (what an iPhone sticker sends) | FIDUNIO sends it as a photo | a new message appeared (9:23 PM Sent) | as expected |
| KEYBOARD-GIF | A GIF handed over by the keyboard (fix branch: native hand-over event) | FIDUNIO sends it as a photo | GIF message appeared | as expected |
| KEYBOARD-GIF-OFFER | Does the message box tell the keyboard it accepts GIFs? | yes on the fix branch | GIF types offered to the keyboard | as expected |
| CAMERA | Photo → Take a Picture | the camera opens | in front: com.android.camera2/com.android.camera.CaptureActivity | as expected |
| GRACE | Switch to another app for ~15 s, then back | FIDUNIO opens unlocked (5 min grace) | unlocked | as expected |
| BACK-CHAT | Back swipe from the edge while in a chat | goes back to the Messages list, FIDUNIO stays in front | Messages list shown | as expected |
| BACK-POPUP | Back swipe with a pop-up open | the pop-up closes first | pop-up was open; after Back: closed, chat still shown | as expected |
| BACK-MAIN | Back swipe on the Messages list | FIDUNIO goes to the background (still running) | started on Messages list; in front: com.android.settings/.Settings; FIDUNIO still running | as expected |
| BACK-RETURN | Return right after the Back swipe | unlocked (within grace) | unlocked | as expected |
| BACK-KEY | 3-button Back key while in a chat | goes back to the Messages list | Messages list shown | as expected |
| HELP-SETTINGS | Settings → HELP Alert: Turn on, tick Simulator Bob, Save | "Saved."; the server has HELP on with Bob as the only contact | screen: "Saved."; server: enabled=true, contacts=1 | as expected |
| HELP-BUTTON | Back to Messages | a red HELP button is on the Messages screen | no HELP button | **DIFFERENT** |
| HELP-QUICK-TAP | HELP screen: a quick tap on the big button (not held) | nothing is sent (it needs a 2-second hold) | TEST ERROR: #helpFab not on screen | **DIFFERENT** |
| HELP-SEND | Press and hold the HELP button for 3 seconds; allow location when the phone asks | "Help alert sent", a Cancel button, and the server has an open alert for Bob | TEST ERROR: Cannot read properties of null (reading 'x') | **DIFFERENT** |
| HELP-PICTURE | Tap the "I'm hurt" picture button | the button marks as sent | no picture buttons | **DIFFERENT** |
| HELP-ACK | Bob answers "I'm on it" (from his phone) | Alice's HELP screen shows "Simulator Bob is coming" | no alert to answer | **DIFFERENT** |
| HELP-CHAT-CARDS | Open the chat with Bob | HELP cards in the chat: the alert with "Open location on a map", and "I'm hurt" | NO map link; chat text: November 24, 2026 Copy test 4417 9:22 PM Sent 9:23 PM Sent 9:23 PM Sent You are now one of my HELP contacts. 9:25 PM Sent | **DIFFERENT** |
| HELP-SAFE | Open the HELP alert from the banner, tap "I'm safe now" | the alert closes (server: safe); HELP screen is back to the big button | TEST ERROR: .help-banner not on screen | **DIFFERENT** |
| HELP-INCOMING | Bob sends HELP to Alice (from his phone) | Alice's FIDUNIO opens "Simulator Bob needs help" by itself; "I'm on it" tells the server | opened: "🆘 Simulator Bob needs help"; server: Alice is on it | as expected |
| HELP-TEST | Settings → "Test my HELP alert", then "Cancel — it was a mistake" | TEST alert sent, then cancelled (server: cancelled) | screen: "no Cancel button seen"; server: no test alert | **DIFFERENT** |
| HELP-PROTECT | Settings: tick "Protect this account", Save (asks PIN), then try Sign Out | PIN asked to protect; Sign Out then asks the PIN, and Cancel keeps Alice signed in | PIN asked to protect: true; server protected=true; Sign Out asked PIN: true; after Cancel still signed in: true | as expected |

### COPY — 02-copy-sheet.png

![02-copy-sheet.png](02-copy-sheet.png)

### SELECT-TEXT — 03-select-text-marked.png

![03-select-text-marked.png](03-select-text-marked.png)

### SELECT-TEXT — 04-select-text-done.png

![04-select-text-done.png](04-select-text-done.png)

### PASTE — 06-after-paste.png

![06-after-paste.png](06-after-paste.png)

### PICTURE-PASTE — 07-picture-paste.png

![07-picture-paste.png](07-picture-paste.png)

### KEYBOARD-GIF — 08-keyboard-gif.png

![08-keyboard-gif.png](08-keyboard-gif.png)

### CAMERA — 09-after-take-picture.png

![09-after-take-picture.png](09-after-take-picture.png)

### GRACE — 10-back-after-15s.png

![10-back-after-15s.png](10-back-after-15s.png)

### BACK-CHAT — 11-back-from-chat.png

![11-back-from-chat.png](11-back-from-chat.png)

### BACK-POPUP — 12-back-popup.png

![12-back-popup.png](12-back-popup.png)

### BACK-MAIN — 13-back-main.png

![13-back-main.png](13-back-main.png)

### BACK-RETURN — 14-return-after-back.png

![14-return-after-back.png](14-return-after-back.png)

### BACK-KEY — 15-back-key.png

![15-back-key.png](15-back-key.png)

### HELP-SETTINGS — 16-help-settings-saved.png

![16-help-settings-saved.png](16-help-settings-saved.png)

### HELP-BUTTON — 17-help-fab.png

![17-help-fab.png](17-help-fab.png)

### HELP-PICTURE — 20-help-pictures.png

![20-help-pictures.png](20-help-pictures.png)

### HELP-CHAT-CARDS — 21-help-chat-cards.png

![21-help-chat-cards.png](21-help-chat-cards.png)

### HELP-INCOMING — 23-help-incoming.png

![23-help-incoming.png](23-help-incoming.png)

### HELP-INCOMING — 24-help-onit.png

![24-help-onit.png](24-help-onit.png)

### HELP-TEST — 25-help-test-cancelled.png

![25-help-test-cancelled.png](25-help-test-cancelled.png)

### HELP-PROTECT — 26-help-protect-signout.png

![26-help-protect-signout.png](26-help-protect-signout.png)
