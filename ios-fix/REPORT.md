# FIDUNIO input probe — ios — fix

| Check | What | Expected | Observed | |
|---|---|---|---|---|
| COPY | Press and hold a message, tap Copy | sheet offers Copy; the phone clipboard then holds the message text | action sheet closed; NO Copy button | **DIFFERENT** |
| PASTE | Press and hold the message box, tap the phone's Paste | the copied text appears in the message box | simulator clipboard set; NO Paste found by the touch layer; message box now: "" | **DIFFERENT** |
| PICTURE-PASTE | A paste that carries a picture (what an iPhone sticker sends) | FIDUNIO sends it as a photo | a new message appeared ( 8:39 PM Sent ) | as expected |
| GRACE | Switch to another app for ~15 s, then back | FIDUNIO opens unlocked (5 min grace) | unlocked | as expected |
| HELP-SETTINGS | Settings → HELP Alert: Turn on, tick Simulator Bob, Save | "Saved."; the server has HELP on with Bob as the only contact | TEST ERROR: timed out: save result | **DIFFERENT** |
| HELP-BUTTON | Back to Messages | a red HELP button is on the Messages screen | HELP button shown | as expected |
| HELP-QUICK-TAP | HELP screen: a quick tap on the big button (not held) | nothing is sent (it needs a 2-second hold) | nothing sent | as expected |
| HELP-SEND | Press and hold the HELP button for 3 seconds; allow location when the phone asks | "Help alert sent", a Cancel button, and the server has an open alert for Bob | screen: "Help alert sent"; location prompts answered: Allow Once, Allow; server: NO alert | **DIFFERENT** |
| HELP-PICTURE | Tap the "I'm hurt" picture button | the button marks as sent | not marked sent | **DIFFERENT** |
| HELP-ACK | Bob answers "I'm on it" (from his phone) | Alice's HELP screen shows "Simulator Bob is coming" | no alert to answer | **DIFFERENT** |
| HELP-CHAT-CARDS | Open the chat with Bob | HELP cards in the chat: the alert with "Open location on a map", and "I'm hurt" | map link shown; chat text: 17 8:36 PM Sent 8:39 PM Sent You are now one of my HELP contacts. 8:40 PM Sending 🆘 HELP alert Open location on a map 8:41 PM Sending I'm hurt 8:41 PM Sending  | as expected |
| HELP-SAFE | Open the HELP alert from the banner, tap "I'm safe now" | the alert closes (server: safe); HELP screen is back to the big button | server: undefined; screen: big HELP button | **DIFFERENT** |
| HELP-INCOMING | Bob sends HELP to Alice (from his phone) | Alice's FIDUNIO opens "Simulator Bob needs help" by itself; "I'm on it" tells the server | screen: "HELP screen did not open" | **DIFFERENT** |
| HELP-TEST | Settings → "Test my HELP alert", then "Cancel — it was a mistake" | TEST alert sent, then cancelled (server: cancelled) | screen: "TEST — Help alert sent"; server: no test alert | **DIFFERENT** |
| HELP-PROTECT | Settings: tick "Protect this account", Save (asks PIN), then try Sign Out | PIN asked to protect; Sign Out then asks the PIN, and Cancel keeps Alice signed in | PIN asked to protect: true; server protected=undefined; Sign Out asked PIN: true; after Cancel still signed in: true | **DIFFERENT** |

### COPY — 02-copy-sheet.png

![02-copy-sheet.png](02-copy-sheet.png)

### PASTE — 04-after-paste.png

![04-after-paste.png](04-after-paste.png)

### PICTURE-PASTE — 05-picture-paste.png

![05-picture-paste.png](05-picture-paste.png)

### GRACE — 06-back-after-15s.png

![06-back-after-15s.png](06-back-after-15s.png)

### HELP-BUTTON — 08-help-fab.png

![08-help-fab.png](08-help-fab.png)

### HELP-QUICK-TAP — 09-help-quick-tap.png

![09-help-quick-tap.png](09-help-quick-tap.png)

### HELP-SEND — 10-help-sent.png

![10-help-sent.png](10-help-sent.png)

### HELP-PICTURE — 11-help-picture.png

![11-help-picture.png](11-help-picture.png)

### HELP-CHAT-CARDS — 12-help-chat-cards.png

![12-help-chat-cards.png](12-help-chat-cards.png)

### HELP-SAFE — 13-help-safe.png

![13-help-safe.png](13-help-safe.png)

### HELP-INCOMING — 14-help-incoming.png

![14-help-incoming.png](14-help-incoming.png)

### HELP-TEST — 15-help-test.png

![15-help-test.png](15-help-test.png)

### HELP-TEST — 16-help-test-cancelled.png

![16-help-test-cancelled.png](16-help-test-cancelled.png)

### HELP-PROTECT — 17-help-protect-signout.png

![17-help-protect-signout.png](17-help-protect-signout.png)
