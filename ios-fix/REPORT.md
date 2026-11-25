# FIDUNIO input probe — ios — fix

| Check | What | Expected | Observed | |
|---|---|---|---|---|
| STARTUP-ONCE | After sign-in, count how many times each start-up step started | every step exactly once, in order | order: notification upkeep → conversations → blocked users → groups → HELP → activation → publish E2EE key / counts: {"notification upkeep":1,"conversations":1,"blocked users":1,"groups":1,"HELP":1,"activation":1,"publish E2EE key":1} | as expected |
| COPY | Press and hold a message, tap Copy | sheet offers Copy; the phone clipboard then holds the message text | Copy button present; clipboard now: "Copy test 4417" | as expected |
| SELECT-TEXT | Press and hold a message, Select Text, press and hold one word, tap Copy, then Done | only that word is copied; Done goes back to the same chat | marked: "Copy"; copied: "Copy"; after Done: same chat | as expected |
| LINK | Send "Visit https://example.com today", tap the link: Cancel, then tap again: Open | "Open this link?" first; Cancel stays in the chat; Open shows the web page outside FIDUNIO | asked first: true; Cancel stayed in chat: true; after Open: Safari is running (opened by FIDUNIO) | as expected |
| PASTE | Press and hold the message box, tap the phone's Paste | the copied text appears in the message box | simulator clipboard set; NO Paste found by the touch layer; message box now: "" | **DIFFERENT** |
| PICTURE-PASTE | A paste that carries a picture (what an iPhone sticker sends) | FIDUNIO sends it as a photo | a new message appeared ( 8:03 AM Sent ) | as expected |
| GRACE | Switch to another app for ~15 s, then back | FIDUNIO opens unlocked (5 min grace) | unlocked | as expected |
| HELP-SETTINGS | Settings → HELP: the contacts list is closed; tap "Choose HELP contacts", tick Simulator Bob, Save | list closed at first; "Saved."; the server has Bob as the only HELP contact | list closed at first: true; screen: "Saved.", "HELP contacts: Nobody yet"; server: enabled=true, contacts=1 | **DIFFERENT** |
| HELP-BAR | Back to Messages | one red HELP bar on the Messages screen, no banners | no HELP bar; banners: none | **DIFFERENT** |
| HELP-QUICK-TAP | HELP screen: a quick tap on the big button (not held) | nothing is sent (it needs a 2-second hold) | TEST ERROR: #helpFab not on screen | **DIFFERENT** |
| HELP-SEND | Press and hold the HELP button for 3 seconds; allow location when the phone asks | red "HELP is sent — Simulator Bob is being called", "Write a message", "I'm OK now"; server has an open alert for Bob | TEST ERROR: Cannot read properties of null (reading 'x') | **DIFFERENT** |
| HELP-WRITE | Tap "Write a message", type and send "Where are you?" | the HELP chat with Bob opens, with the HELP card and the map link; the message is sent | TEST ERROR: #helpWrite not on screen | **DIFFERENT** |
| HELP-COMING-SEEN | Bob answers "I'm coming" (from his phone); Alice opens the HELP bar | green "Simulator Bob is coming", "Write a message", "I'm OK now" | no alert to answer | **DIFFERENT** |
| HELP-OK | Tap "I'm OK now" | the alert closes (server: safe); back on Messages with the plain HELP bar | TEST ERROR: #helpOk not on screen | **DIFFERENT** |
| HELP-INCOMING | Bob sends HELP to Alice (from his phone) | Alice's FIDUNIO opens the red "Simulator Bob needs HELP" by itself; "I'm coming" tells the server and opens the chat with Bob | opened: "‹ Simulator Bob needs HELP Sent at 8:04 AM Location is on its way… I'm coming"; server: Alice is coming; chat opened: true | as expected |
| HELP-SIGNOUT | Settings: Sign Out button | no PIN asked for Sign Out (protection removed); not tapped | Sign Out shown: true; Protect/Test removed: true | as expected |

### COPY — 02-copy-sheet.png

![02-copy-sheet.png](02-copy-sheet.png)

### SELECT-TEXT — 03-select-text-marked.png

![03-select-text-marked.png](03-select-text-marked.png)

### SELECT-TEXT — 04-select-text-done.png

![04-select-text-done.png](04-select-text-done.png)

### LINK — 05-link-ask.png

![05-link-ask.png](05-link-ask.png)

### LINK — 06-link-opened.png

![06-link-opened.png](06-link-opened.png)

### PASTE — 08-after-paste.png

![08-after-paste.png](08-after-paste.png)

### PICTURE-PASTE — 09-picture-paste.png

![09-picture-paste.png](09-picture-paste.png)

### GRACE — 10-back-after-15s.png

![10-back-after-15s.png](10-back-after-15s.png)

### HELP-SETTINGS — 11-help-settings-closed.png

![11-help-settings-closed.png](11-help-settings-closed.png)

### HELP-SETTINGS — 12-help-settings-saved.png

![12-help-settings-saved.png](12-help-settings-saved.png)

### HELP-BAR — 13-help-bar.png

![13-help-bar.png](13-help-bar.png)

### HELP-INCOMING — 18-help-incoming.png

![18-help-incoming.png](18-help-incoming.png)

### HELP-INCOMING — 19-help-im-coming.png

![19-help-im-coming.png](19-help-im-coming.png)

### HELP-SIGNOUT — 20-help-settings-kiss.png

![20-help-settings-kiss.png](20-help-settings-kiss.png)
