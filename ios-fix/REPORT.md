# FIDUNIO input probe — ios — fix

| Check | What | Expected | Observed | |
|---|---|---|---|---|
| STARTUP-ONCE | After sign-in, count how many times each start-up step started | every step exactly once, in order | order: notification upkeep → conversations → blocked users → groups → HELP → activation → publish E2EE key / counts: {"notification upkeep":1,"conversations":1,"blocked users":1,"groups":1,"HELP":1,"activation":1,"publish E2EE key":1} | as expected |
| COPY | Press and hold a message, tap Copy | sheet offers Copy; the phone clipboard then holds the message text | Copy button present; clipboard now: "Copy test 4417" | as expected |
| SELECT-TEXT | Press and hold a message, Select Text, press and hold one word, tap Copy, then Done | only that word is copied; Done goes back to the same chat | marked: "Copy"; copied: "Copy"; after Done: same chat | as expected |
| LINK | Send "Visit https://example.com today", tap the link: Cancel, then tap again: Open | "Open this link?" first; Cancel stays in the chat; Open shows the web page outside FIDUNIO | asked first: true; Cancel stayed in chat: true; after Open: Safari: Safari / dismiss popup / Close / View Bookmarks, Share Menu, and Open Tabs / You | as expected |
| PASTE | Press and hold the message box, tap the phone's Paste | the copied text appears in the message box | simulator clipboard set; NO Paste found by the touch layer; message box now: "" | **DIFFERENT** |
| PICTURE-PASTE | A paste that carries a picture (what an iPhone sticker sends) | FIDUNIO sends it as a photo | a new message appeared ( 7:05 PM Sending ) | as expected |
| GRACE | Switch to another app for ~15 s, then back | FIDUNIO opens unlocked (5 min grace) | unlocked | as expected |
| HELP-SETTINGS | Settings → HELP: the contacts list is closed; tap "Choose HELP contacts", tick Simulator Bob, Save | list closed at first; "Saved."; the server has Bob as the only HELP contact | list closed at first: true; screen: "Saved.", "HELP contacts: Simulator Bob"; server: enabled=true, contacts=1 | as expected |
| HELP-SAVE-REPEAT | 5 times: untick Bob → Save, then tick Bob → Save; check the contacts line and the HELP bar each time | every Save shows the right contacts, and the HELP bar follows | all 10 saves right | as expected |
| HELP-BAR | Back to Messages | one red HELP bar on the Messages screen, no banners | HELP bar shown; banners: none | as expected |
| HELP-QUICK-TAP | HELP screen: a quick tap on the big button (not held) | nothing is sent (it needs a 2-second hold) | nothing sent | as expected |
| HELP-DARK | Dark mode on; open the HELP hold screen | the title, hint and back arrow are clearly readable (contrast 4.5 or more) | contrast of title / hint / back: [15.2,15.2,15.2] | as expected |
| HELP-SEND | Press and hold the HELP button for 3 seconds; allow location when the phone asks | red "HELP is sent — Simulator Bob is being called", the conversation on the same screen, "I'm OK now"; server has an open alert for Bob | screen: "HELP is sent Simulator Bob is being called. Stay where you are. You: HELP Open in Maps You: {"fidunioAttachment":1,"atta"; location prompts answered: Allow Once, Allow; server: open alert for Bob | as expected |
| HELP-WRITE | On the same HELP screen: type "Help chat 7731" in the big box and tap Send | the message shows in the conversation on the HELP screen (no separate chat screen) | conversation on HELP screen: KoI0ooZRGHfHde_yZFlE9BxPcQHo4W3iRSYqPDJ63hx/69ebe168-52fa-43b8-8015-b546544e3347/848f399e-4387-48c7-a764-9ddd243ce28a/chunks/0"]}} Not sent — tap to send again ; reached the server: yes (9→10) | **DIFFERENT** |
| HELP-COMING-SEEN | Alice starts typing "draft 88" (not sent); Bob answers "I'm coming" (from his phone) | green "Simulator Bob is coming" on the same screen; the conversation and the unsent "draft 88" are still there | green: true; screen: "Simulator Bob is coming Stay where you are. You: HELP Open in Maps You: Help cha"; unsent text kept: "draft 88"; conversation still shown: true | as expected |
| HELP-OK | Tap "I'm OK now", then open the regular chat with Bob | the alert closes (server: safe); the regular chat has everything from the HELP screen: HELP, "Help chat 7731", "I'm OK now" | server: safe; bar: "HELP"; regular chat has HELP + message + OK: true (M Sent Help chat 7731 7:11 PM Sent I'm OK now 7:11 PM Sent Photo was not sent. Press and hold this message to delete it, then try sending again. 7:05 PM Failed ) | as expected |
| HELP-INCOMING | The chat with Bob is made as if BOB started it (member order Bob, Alice). Bob sends HELP to Alice; Alice taps "I'm coming", types "On my way 5512" and taps Send | red "Simulator Bob needs HELP" opens by itself; after "I'm coming" the conversation is on the same screen; the message is sent (no "Conversation could not be started"); the server has Alice's answer | chat made by Bob first: true; opened: "‹ Simulator Bob needs HELP Sent at 7:12 PM Location is on it"; server: Alice is coming; conversation: 546544e3347/848f399e-4387-48c7-a764-9ddd243ce28a/chunks/0"]}} Not sent — tap to send again You: On my way 5512 Sending… ; "could not be started": false | as expected |
| HELP-RESUME | Bob sends HELP while FIDUNIO is in the background; Alice opens FIDUNIO again — back from the background (no PIN) — and taps nothing | the red "Simulator Bob needs HELP" screen is there by itself | screen: helpAlert "‹ Simulator Bob needs HELP Sent at 7:12 PM Location is on it"; HELP trace ["19:09:49 settings card contacts=0 (Saved.)","19:09:49 settings snapshot exists=true cache=false pending=false contacts=0","19:10:00 settings card contacts=0","19:10:03 settings card contacts=0","19:10:09 settings snapshot exists=true cache=false pending=true contacts=1","19:10:09 settings applied (this phone's save) contacts=1","19:10:09 saved contacts=1","19:10:09 settings snapshot exists=true cache=false pending=false contacts=1","19:10:10 settings card contacts=1 (Saved.)","19:12:49 HELP contact of 1"] | as expected |
| HELP-RESUME-RESTART | Bob sends HELP while FIDUNIO is in the background; Alice opens FIDUNIO again — FIDUNIO restarted and unlocked with the PIN — and taps nothing | the red "Simulator Bob needs HELP" screen is there by itself | screen: helpAlert "‹ Simulator Bob needs HELP Sent at 7:13 PM Location is on it"; HELP trace ["19:13:58 start","19:13:58 stop","19:13:58 settings snapshot exists=true cache=false pending=false contacts=1","19:13:58 settings applied (server read) contacts=1","19:13:58 reach saved false","19:13:58 HELP contact of 1"] | as expected |
| HELP-REMINDER | Bob chose Alice as a HELP contact; notifications were never turned on on this phone. Switch away and back | a red reminder on Messages: "Turn on notifications to hear HELP." with one button "Turn on" | reminder: "Turn on notifications to hear HELP. Turn on "; trace ["19:13:58 stop","19:13:58 settings snapshot exists=true cache=false pending=false contacts=1","19:13:58 settings applied (server read) contacts=1","19:13:58 reach saved false","19:13:58 HELP contact of 1","19:14:19 HELP contact of 1"] | as expected |
| HELP-TURN-ON | Tap "Turn on" and allow notifications when the phone asks | the phone asks once; after Allow the reminder goes away (or, if the test server cannot register this simulator, a clear message says why) | phone asked: Allow; reminder still shown: "Turn on notifications to hear HELP. Turn on "; message: Notifications could not be turned on: Firebase is not configured: GoogleService-Info.plist is missing from the app bundle. Check the connection and try again.; server reach: {"ab75aa64-9f21-4021-8ab3-6247544d0568":false} | as expected |
| HELP-TAP-ALARM | Bob sends HELP; Alice sees it and goes back to Messages; FIDUNIO goes to the background; the HELP alarm notification arrives and Alice taps it | FIDUNIO opens on the big red "Simulator Bob needs HELP" screen (not the regular chat) | banner tapped (FIDUNIO); screen: messages "" | **DIFFERENT** |
| HELP-TAP-CHAT | Same HELP still on: back to Messages, background; the CHAT notification of a message in the HELP conversation arrives and Alice taps it | the big red HELP screen opens (not the regular chat) | banner tapped (FIDUNIO); screen: messages "" | **DIFFERENT** |
| HELP-TAP-CHAT-AFTER | Bob taps "I'm OK now" (HELP over); Alice taps a chat notification from Bob | the regular chat with Bob opens, as usual | banner tapped (FIDUNIO); screen: messages | **DIFFERENT** |
| HELP-REACH | Alice's Settings → HELP with Bob chosen; Bob's notifications not confirmed, then Bob turns them on (from his phone) | first: "Simulator Bob can't hear HELP yet."; after Bob turns them on and Settings is opened again: no warning | before: "Simulator Bob can't hear HELP yet."; after: "no warning" | as expected |
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

### HELP-DARK — 16-help-dark.png

![16-help-dark.png](16-help-dark.png)

### HELP-SEND — 17-help-sent.png

![17-help-sent.png](17-help-sent.png)

### HELP-WRITE — 18-help-chat-on-screen.png

![18-help-chat-on-screen.png](18-help-chat-on-screen.png)

### HELP-COMING-SEEN — 19-help-coming.png

![19-help-coming.png](19-help-coming.png)

### HELP-OK — 20-help-ok-regular-chat.png

![20-help-ok-regular-chat.png](20-help-ok-regular-chat.png)

### HELP-INCOMING — 21-help-incoming.png

![21-help-incoming.png](21-help-incoming.png)

### HELP-INCOMING — 22-help-im-coming-chat.png

![22-help-im-coming-chat.png](22-help-im-coming-chat.png)

### HELP-RESUME — 23-help-resume.png

![23-help-resume.png](23-help-resume.png)

### HELP-RESUME-RESTART — 24-help-resume-restart.png

![24-help-resume-restart.png](24-help-resume-restart.png)

### HELP-REMINDER — 25-help-reminder.png

![25-help-reminder.png](25-help-reminder.png)

### HELP-TURN-ON — 26-help-turn-on.png

![26-help-turn-on.png](26-help-turn-on.png)

### HELP-TAP-ALARM — 27-help-tap-alarm.png

![27-help-tap-alarm.png](27-help-tap-alarm.png)

### HELP-TAP-CHAT — 28-help-tap-chat.png

![28-help-tap-chat.png](28-help-tap-chat.png)

### HELP-TAP-CHAT-AFTER — 29-help-tap-chat-after.png

![29-help-tap-chat-after.png](29-help-tap-chat-after.png)

### HELP-REACH — 30-help-reach-warning.png

![30-help-reach-warning.png](30-help-reach-warning.png)

### HELP-REACH — 31-help-reach-ok.png

![31-help-reach-ok.png](31-help-reach-ok.png)

### HELP-SIGNOUT — 32-help-settings-kiss.png

![32-help-settings-kiss.png](32-help-settings-kiss.png)
