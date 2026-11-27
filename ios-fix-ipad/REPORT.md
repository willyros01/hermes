# FIDUNIO input probe — ios iPad — fix

| Check | What | Expected | Observed | |
|---|---|---|---|---|
| STARTUP-ONCE | After sign-in, count how many times each start-up step started | every step exactly once, in order | order: notification upkeep → conversations → blocked users → groups → HELP → activation → publish E2EE key / counts: {"notification upkeep":1,"conversations":1,"blocked users":1,"groups":1,"HELP":1,"activation":1,"publish E2EE key":1} | as expected |
| IPAD-LAYOUT | iPad simulator, chat with Bob open | two-panel layout (list on the left, chat on the right) | two-panel with chat open | as expected |
| IPAD-BAR-LIVE | With the chat open, HELP contacts arrive from the server (Bob chosen on another device); touch nothing | the red HELP bar appears in the left panel within 20 s, without touching anything | HELP bar shown; still in chat: true; trace ["22:40:02 settings snapshot exists=false cache=false pending=false contacts=-","22:40:02 settings applied (server read) contacts=0","22:40:02 reach saved false","22:40:02 HELP contact of 0","22:40:39 settings snapshot exists=true cache=false pending=false contacts=1","22:40:39 settings applied (server read) contacts=1","22:40:39 bar redrawn shown","22:40:39 notice shown"] | as expected |
| IPAD-BAR-RESTART-1 | Restart FIDUNIO, unlock with the PIN, touch nothing (round 1 of 3) | the red HELP bar is there within 20 s, without touching anything | unlocked: true; HELP bar shown; route: messages; trace ["22:41:11 start","22:41:11 stop","22:41:12 settings snapshot exists=true cache=false pending=false contacts=1","22:41:12 settings applied (server read) contacts=1","22:41:12 bar redrawn shown","22:41:12 notice shown","22:41:12 reach saved false","22:41:12 HELP contact of 0"] | as expected |
| IPAD-BAR-RESTART-2 | Restart FIDUNIO, unlock with the PIN, touch nothing (round 2 of 3) | the red HELP bar is there within 20 s, without touching anything | unlocked: true; HELP bar shown; route: messages; trace ["22:41:55 start","22:41:55 stop","22:41:56 settings snapshot exists=true cache=false pending=false contacts=1","22:41:56 settings applied (server read) contacts=1","22:41:56 bar redrawn shown","22:41:56 notice shown","22:41:56 reach saved false","22:41:56 HELP contact of 0"] | as expected |
| IPAD-BAR-RESTART-3 | Restart FIDUNIO, unlock with the PIN, touch nothing (round 3 of 3) | the red HELP bar is there within 20 s, without touching anything | unlocked: true; HELP bar shown; route: messages; trace ["22:42:38 start","22:42:38 stop","22:42:39 settings snapshot exists=true cache=false pending=false contacts=1","22:42:39 settings applied (server read) contacts=1","22:42:39 bar redrawn shown","22:42:40 reach saved false","22:42:40 HELP contact of 0","22:42:40 notice shown"] | as expected |
| IPAD-SETTINGS-FILL | Restart FIDUNIO, unlock, open Settings at once; touch nothing else | every part of Settings filled; the page is never rebuilt while loading | filled after 1.7 s; page rebuilt while open: 0 time(s); still filled 8 s later: true | as expected |
| IPAD-HELP-RESUME | Bob sends HELP to Alice while FIDUNIO is in the background (Home screen); Alice opens FIDUNIO again and taps nothing | the red "Simulator Bob needs HELP" screen is there by itself | screen: helpAlert "‹ Simulator Bob needs HELP Sent at 10:43 PM Location is on i"; HELP trace ["22:43:16 settings applied (server read) contacts=1","22:43:16 bar redrawn shown","22:43:16 notice shown","22:43:16 reach saved false","22:43:16 HELP contact of 0","22:43:20 settings card contacts=1","22:43:20 settings card contacts=1","22:44:00 HELP contact of 1"] | as expected |

### IPAD-LAYOUT — 02-ipad-two-panel.png

![02-ipad-two-panel.png](02-ipad-two-panel.png)

### IPAD-BAR-LIVE — 03-ipad-bar-live.png

![03-ipad-bar-live.png](03-ipad-bar-live.png)

### IPAD-BAR-RESTART-1 — 04-ipad-bar-restart-1.png

![04-ipad-bar-restart-1.png](04-ipad-bar-restart-1.png)

### IPAD-BAR-RESTART-2 — 05-ipad-bar-restart-2.png

![05-ipad-bar-restart-2.png](05-ipad-bar-restart-2.png)

### IPAD-BAR-RESTART-3 — 06-ipad-bar-restart-3.png

![06-ipad-bar-restart-3.png](06-ipad-bar-restart-3.png)

### IPAD-SETTINGS-FILL — 07-ipad-settings-filled.png

![07-ipad-settings-filled.png](07-ipad-settings-filled.png)

### IPAD-HELP-RESUME — 08-ipad-help-resume.png

![08-ipad-help-resume.png](08-ipad-help-resume.png)
