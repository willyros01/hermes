# FIDUNIO input probe — android — fix

| Check | What | Expected | Observed | |
|---|---|---|---|---|
| COPY | Press and hold a message, tap Copy | sheet offers Copy; the phone clipboard then holds the message text | Copy button present; clipboard now: " Copy test 4417" | as expected |
| PASTE | Press and hold the message box, tap the phone's Paste | the copied text appears in the message box | phone Copy (keyboard shortcut) used; phone Paste (keyboard shortcut) used; message box now: "Paste test 2286" | as expected |
| PICTURE-PASTE | A paste that carries a picture (what an iPhone sticker sends) | FIDUNIO sends it as a photo | a new message appeared (8:27 PM Sent) | as expected |
| KEYBOARD-GIF | A GIF handed over by the keyboard (fix branch: native hand-over event) | FIDUNIO sends it as a photo | GIF message appeared | as expected |
| KEYBOARD-GIF-OFFER | Does the message box tell the keyboard it accepts GIFs? | yes on the fix branch | GIF types offered to the keyboard | as expected |
| CAMERA | Photo → Take a Picture | the camera opens | in front: com.android.camera2/com.android.camera.CaptureActivity | as expected |
| GRACE | Switch to another app for ~15 s, then back | FIDUNIO opens unlocked (5 min grace) | unlocked | as expected |
| BACK-CHAT | Back swipe from the edge while in a chat | goes back to the Messages list, FIDUNIO stays in front | Messages list shown | as expected |
| BACK-POPUP | Back swipe with a pop-up open | the pop-up closes first | pop-up was open; after Back: closed, chat still shown | as expected |
| BACK-MAIN | Back swipe on the Messages list | FIDUNIO goes to the background (still running) | started on Messages list; in front: com.android.settings/.Settings; FIDUNIO still running | as expected |
| BACK-RETURN | Return right after the Back swipe | unlocked (within grace) | unlocked | as expected |
| BACK-KEY | 3-button Back key while in a chat | goes back to the Messages list | Messages list shown | as expected |
| HELP-SETTINGS | Settings → HELP Alert: Turn on, tick Simulator Bob, Save | "Saved."; the server has HELP on with Bob as the only contact | TEST ERROR: timed out: save result | **DIFFERENT** |
| HELP-BUTTON | Back to Messages | a red HELP button is on the Messages screen | HELP button shown | as expected |
| HELP-QUICK-TAP | HELP screen: a quick tap on the big button (not held) | nothing is sent (it needs a 2-second hold) | nothing sent | as expected |
| HELP-SEND | Press and hold the HELP button for 3 seconds; allow location when the phone asks | "Help alert sent", a Cancel button, and the server has an open alert for Bob | screen: "Help alert sent"; location prompts answered: ONLY THIS TIME; server: NO alert | **DIFFERENT** |
| HELP-PICTURE | Tap the "I'm hurt" picture button | the button marks as sent | not marked sent | **DIFFERENT** |
| HELP-ACK | Bob answers "I'm on it" (from his phone) | Alice's HELP screen shows "Simulator Bob is coming" | no alert to answer | **DIFFERENT** |
| HELP-CHAT-CARDS | Open the chat with Bob | HELP cards in the chat: the alert with "Open location on a map", and "I'm hurt" | map link shown; chat text: ent 8:27 PM Sent 8:27 PM Sent You are now one of my HELP contacts. 8:29 PM Sending 🆘 HELP alert Open location on a map 8:30 PM Sending I'm hurt 8:30 PM Sending | as expected |
| HELP-SAFE | Open the HELP alert from the banner, tap "I'm safe now" | the alert closes (server: safe); HELP screen is back to the big button | server: undefined; screen: big HELP button | **DIFFERENT** |
| HELP-INCOMING | Bob sends HELP to Alice (from his phone) | Alice's FIDUNIO opens "Simulator Bob needs help" by itself; "I'm on it" tells the server | screen: "HELP screen did not open" | **DIFFERENT** |
| HELP-TEST | Settings → "Test my HELP alert", then "Cancel — it was a mistake" | TEST alert sent, then cancelled (server: cancelled) | screen: "TEST — Help alert sent"; server: no test alert | **DIFFERENT** |
| HELP-PROTECT | Settings: tick "Protect this account", Save (asks PIN), then try Sign Out | PIN asked to protect; Sign Out then asks the PIN, and Cancel keeps Alice signed in | TEST ERROR: Android WebView did not answer within 20 seconds | **DIFFERENT** |

### COPY — 02-copy-sheet.png

![02-copy-sheet.png](02-copy-sheet.png)

### PASTE — 04-after-paste.png

![04-after-paste.png](04-after-paste.png)

### PICTURE-PASTE — 05-picture-paste.png

![05-picture-paste.png](05-picture-paste.png)

### KEYBOARD-GIF — 06-keyboard-gif.png

![06-keyboard-gif.png](06-keyboard-gif.png)

### CAMERA — 07-after-take-picture.png

![07-after-take-picture.png](07-after-take-picture.png)

### GRACE — 08-back-after-15s.png

![08-back-after-15s.png](08-back-after-15s.png)

### BACK-CHAT — 09-back-from-chat.png

![09-back-from-chat.png](09-back-from-chat.png)

### BACK-POPUP — 10-back-popup.png

![10-back-popup.png](10-back-popup.png)

### BACK-MAIN — 11-back-main.png

![11-back-main.png](11-back-main.png)

### BACK-RETURN — 12-return-after-back.png

![12-return-after-back.png](12-return-after-back.png)

### BACK-KEY — 13-back-key.png

![13-back-key.png](13-back-key.png)

### HELP-BUTTON — 15-help-fab.png

![15-help-fab.png](15-help-fab.png)

### HELP-QUICK-TAP — 16-help-quick-tap.png

![16-help-quick-tap.png](16-help-quick-tap.png)

### HELP-SEND — 17-help-sent.png

![17-help-sent.png](17-help-sent.png)

### HELP-PICTURE — 18-help-picture.png

![18-help-picture.png](18-help-picture.png)

### HELP-CHAT-CARDS — 19-help-chat-cards.png

![19-help-chat-cards.png](19-help-chat-cards.png)

### HELP-SAFE — 20-help-safe.png

![20-help-safe.png](20-help-safe.png)

### HELP-INCOMING — 21-help-incoming.png

![21-help-incoming.png](21-help-incoming.png)

### HELP-TEST — 22-help-test.png

![22-help-test.png](22-help-test.png)

### HELP-TEST — 23-help-test-cancelled.png

![23-help-test-cancelled.png](23-help-test-cancelled.png)
