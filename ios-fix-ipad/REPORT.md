# FIDUNIO input probe — ios iPad — fix

| Check | What | Expected | Observed | |
|---|---|---|---|---|
| STARTUP-ONCE | After sign-in, count how many times each start-up step started | every step exactly once, in order | order: notification upkeep → conversations → blocked users → groups → HELP → activation → publish E2EE key / counts: {"notification upkeep":1,"conversations":1,"blocked users":1,"groups":1,"HELP":1,"activation":1,"publish E2EE key":1} | as expected |
| IPAD-LAYOUT | iPad simulator, chat with Bob open | two-panel layout (list on the left, chat on the right) | two-panel with chat open | as expected |
| IPAD-BAR-LIVE | With the chat open, HELP contacts arrive from the server (Bob chosen on another device); touch nothing | the red HELP bar appears in the left panel within 20 s, without touching anything | HELP bar shown; still in chat: true; trace ["18:36:46 settings snapshot exists=false cache=false pending=false contacts=-","18:36:46 settings applied (server read) contacts=0","18:36:46 reach saved false","18:36:46 HELP contact of 0","18:37:20 settings snapshot exists=true cache=false pending=false contacts=1","18:37:20 settings applied (server read) contacts=1","18:37:20 bar redrawn shown","18:37:20 notice shown"] | as expected |
| IPAD-BAR-RESTART-1 | Restart FIDUNIO, unlock with the PIN, touch nothing (round 1 of 3) | the red HELP bar is there within 20 s, without touching anything | unlocked: true; HELP bar shown; route: messages; trace ["18:37:54 start","18:37:54 stop","18:37:55 settings snapshot exists=true cache=false pending=false contacts=1","18:37:55 settings applied (server read) contacts=1","18:37:55 bar redrawn shown","18:37:55 notice shown","18:37:55 reach saved false","18:37:55 HELP contact of 0"] | as expected |
| IPAD-BAR-RESTART-2 | Restart FIDUNIO, unlock with the PIN, touch nothing (round 2 of 3) | the red HELP bar is there within 20 s, without touching anything | unlocked: true; HELP bar shown; route: messages; trace ["18:38:37 start","18:38:37 stop","18:38:37 settings snapshot exists=true cache=false pending=false contacts=1","18:38:37 settings applied (server read) contacts=1","18:38:37 bar redrawn shown","18:38:37 notice shown","18:38:37 reach saved false","18:38:38 HELP contact of 0"] | as expected |
| IPAD-BAR-RESTART-3 | Restart FIDUNIO, unlock with the PIN, touch nothing (round 3 of 3) | the red HELP bar is there within 20 s, without touching anything | unlocked: true; HELP bar shown; route: messages; trace ["18:39:18 start","18:39:18 stop","18:39:19 settings snapshot exists=true cache=false pending=false contacts=1","18:39:19 settings applied (server read) contacts=1","18:39:19 bar redrawn shown","18:39:19 notice shown","18:39:19 reach saved false","18:39:19 HELP contact of 0"] | as expected |
| IPAD-SETTINGS-FILL | Restart FIDUNIO, unlock, open Settings at once; touch nothing else | every part of Settings filled; the page is never rebuilt while loading | filled after 1.7 s; page rebuilt while open: 0 time(s); still filled 8 s later: true | as expected |
| IPAD-HELP-RESUME | Bob sends HELP to Alice while FIDUNIO is in the background (Home screen); Alice opens FIDUNIO again and taps nothing | the red "Simulator Bob needs HELP" screen is there by itself | screen: helpAlert "‹ Simulator Bob needs HELP Sent at 6:40 PM Location is on it"; HELP trace ["18:39:55 settings applied (server read) contacts=1","18:39:55 bar redrawn shown","18:39:55 notice shown","18:39:56 reach saved false","18:39:56 HELP contact of 0","18:39:59 settings card contacts=1","18:39:59 settings card contacts=1","18:40:40 HELP contact of 1"] | as expected |

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
