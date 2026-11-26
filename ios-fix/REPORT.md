# FIDUNIO input probe — ios — fix

| Check | What | Expected | Observed | |
|---|---|---|---|---|
| STARTUP-ONCE | After sign-in, count how many times each start-up step started | every step exactly once, in order | order: notification upkeep → conversations → blocked users → groups → HELP → activation → publish E2EE key / counts: {"notification upkeep":1,"conversations":1,"blocked users":1,"groups":1,"HELP":1,"activation":1,"publish E2EE key":1} | as expected |
| COPY | Press and hold a message, tap Copy | sheet offers Copy; the phone clipboard then holds the message text | Copy button present; clipboard now: "Copy test 4417" | as expected |
| SELECT-TEXT | Press and hold a message, Select Text, press and hold one word, tap Copy, then Done | only that word is copied; Done goes back to the same chat | marked: "Copy"; copied: "Copy"; after Done: same chat | as expected |
| LINK | Send "Visit https://example.com today", tap the link: Cancel, then tap again: Open | "Open this link?" first; Cancel stays in the chat; Open shows the web page outside FIDUNIO | asked first: true; Cancel stayed in chat: true; after Open: Safari: Safari / dismiss popup / Close / View Bookmarks, Share Menu, and Open Tabs / You | as expected |
| PASTE | Press and hold the message box, tap the phone's Paste | the copied text appears in the message box | simulator clipboard set; NO Paste found by the touch layer; message box now: "" | **DIFFERENT** |
| PICTURE-PASTE | A paste that carries a picture (what an iPhone sticker sends) | FIDUNIO sends it as a photo | a new message appeared ( 4:05 PM Sent ) | as expected |
| GRACE | Switch to another app for ~15 s, then back | FIDUNIO opens unlocked (5 min grace) | unlocked | as expected |
| HELP-SETTINGS | Settings → HELP: the contacts list is closed; tap "Choose HELP contacts", tick Simulator Bob, Save | list closed at first; "Saved."; the server has Bob as the only HELP contact | list closed at first: true; screen: "Saved.", "HELP contacts: Simulator Bob"; server: enabled=true, contacts=1 | as expected |
| HELP-SAVE-REPEAT | 5 times: untick Bob → Save, then tick Bob → Save; check the contacts line and the HELP bar each time | every Save shows the right contacts, and the HELP bar follows | all 10 saves right | as expected |
| HELP-BAR | Back to Messages | one red HELP bar on the Messages screen, no banners | HELP bar shown; banners: none | as expected |
| HELP-QUICK-TAP | HELP screen: a quick tap on the big button (not held) | nothing is sent (it needs a 2-second hold) | nothing sent | as expected |
| HELP-SEND | Press and hold the HELP button for 3 seconds; allow location when the phone asks | red "HELP is sent — Simulator Bob is being called", the conversation on the same screen, "I'm OK now"; server has an open alert for Bob | screen: "HELP is sent Simulator Bob is being called. Stay where you are. You: HELP Open in Maps Send I'm OK now"; location prompts answered: Allow Once, Allow; server: open alert for Bob | as expected |
| HELP-WRITE | On the same HELP screen: type "Help chat 7731" in the big box and tap Send | the message shows in the conversation on the HELP screen (no separate chat screen) | conversation on HELP screen: You: HELP Open in Maps You: Help chat 7731 ; reached the server: yes (10→11) | as expected |
| HELP-COMING-SEEN | Alice starts typing "draft 88" (not sent); Bob answers "I'm coming" (from his phone) | green "Simulator Bob is coming" on the same screen; the conversation and the unsent "draft 88" are still there | green: true; screen: "Simulator Bob is coming Stay where you are. You: HELP Open in Maps You: Help cha"; unsent text kept: "draft 88"; conversation still shown: true | as expected |
| HELP-OK | Tap "I'm OK now", then open the regular chat with Bob | the alert closes (server: safe); the regular chat has everything from the HELP screen: HELP, "Help chat 7731", "I'm OK now" | server: safe; bar: "HELP"; regular chat has HELP + message + OK: true (ELP contacts. 4:09 PM Sent You are now one of my HELP contacts. 4:10 PM Sent HELP Open in Maps 4:10 PM Sent Help chat 7731 4:11 PM Sent I'm OK now 4:11 PM Sent ) | as expected |
| HELP-INCOMING | The chat with Bob is made as if BOB started it (member order Bob, Alice). Bob sends HELP to Alice; Alice taps "I'm coming", types "On my way 5512" and taps Send | red "Simulator Bob needs HELP" opens by itself; after "I'm coming" the conversation is on the same screen; the message is sent (no "Conversation could not be started"); the server has Alice's answer | chat made by Bob first: true; opened: "‹ Simulator Bob needs HELP Sent at 4:11 PM Location is on it"; server: Alice is coming; conversation: You: I'm OK now You: I'm coming You: On my way 5512 ; "could not be started": false | as expected |
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

### HELP-SAVE-REPEAT — 13-help-save-repeat.png

![13-help-save-repeat.png](13-help-save-repeat.png)

### HELP-BAR — 14-help-bar.png

![14-help-bar.png](14-help-bar.png)

### HELP-QUICK-TAP — 15-help-quick-tap.png

![15-help-quick-tap.png](15-help-quick-tap.png)

### HELP-SEND — 16-help-sent.png

![16-help-sent.png](16-help-sent.png)

### HELP-WRITE — 17-help-chat-on-screen.png

![17-help-chat-on-screen.png](17-help-chat-on-screen.png)

### HELP-COMING-SEEN — 18-help-coming.png

![18-help-coming.png](18-help-coming.png)

### HELP-OK — 19-help-ok-regular-chat.png

![19-help-ok-regular-chat.png](19-help-ok-regular-chat.png)

### HELP-INCOMING — 20-help-incoming.png

![20-help-incoming.png](20-help-incoming.png)

### HELP-INCOMING — 21-help-im-coming-chat.png

![21-help-im-coming-chat.png](21-help-im-coming-chat.png)

### HELP-SIGNOUT — 22-help-settings-kiss.png

![22-help-settings-kiss.png](22-help-settings-kiss.png)
