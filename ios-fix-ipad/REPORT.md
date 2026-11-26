# FIDUNIO input probe — ios iPad — fix

| Check | What | Expected | Observed | |
|---|---|---|---|---|
| STARTUP-ONCE | After sign-in, count how many times each start-up step started | every step exactly once, in order | order: notification upkeep → conversations → blocked users → groups → HELP → activation → publish E2EE key / counts: {"notification upkeep":1,"conversations":1,"blocked users":1,"groups":1,"HELP":1,"activation":1,"publish E2EE key":1} | as expected |
| IPAD-LAYOUT | iPad simulator, chat with Bob open | two-panel layout (list on the left, chat on the right) | two-panel with chat open | as expected |
| IPAD-BAR-LIVE | With the chat open, HELP contacts arrive from the server (Bob chosen on another device); touch nothing | the red HELP bar appears in the left panel within 20 s, without touching anything | HELP bar shown; still in chat: true; trace ["15:38:15 start","15:38:15 stop","15:38:17 settings snapshot exists=false cache=false pending=false contacts=-","15:38:17 settings applied (server read) contacts=0","15:38:57 settings snapshot exists=true cache=false pending=false contacts=1","15:38:57 settings applied (server read) contacts=1","15:38:57 bar redrawn shown"] | as expected |
| IPAD-BAR-RESTART-1 | Restart FIDUNIO, unlock with the PIN, touch nothing (round 1 of 3) | the red HELP bar is there within 20 s, without touching anything | unlocked: true; HELP bar shown; route: messages; trace ["15:39:32 start","15:39:32 stop","15:39:32 settings snapshot exists=true cache=false pending=false contacts=1","15:39:32 settings applied (server read) contacts=1","15:39:32 bar redrawn shown"] | as expected |
| IPAD-BAR-RESTART-2 | Restart FIDUNIO, unlock with the PIN, touch nothing (round 2 of 3) | the red HELP bar is there within 20 s, without touching anything | unlocked: true; HELP bar shown; route: messages; trace ["15:40:08 start","15:40:08 stop","15:40:08 settings snapshot exists=true cache=false pending=false contacts=1","15:40:08 settings applied (server read) contacts=1","15:40:08 bar redrawn shown"] | as expected |
| IPAD-BAR-RESTART-3 | Restart FIDUNIO, unlock with the PIN, touch nothing (round 3 of 3) | the red HELP bar is there within 20 s, without touching anything | unlocked: true; HELP bar shown; route: messages; trace ["15:40:48 start","15:40:48 stop","15:40:49 settings snapshot exists=true cache=false pending=false contacts=1","15:40:49 settings applied (server read) contacts=1","15:40:49 bar redrawn shown"] | as expected |
| IPAD-SETTINGS-FILL | Restart FIDUNIO, unlock, open Settings at once; touch nothing else | every part of Settings filled; the page is never rebuilt while loading | filled after 2 s; page rebuilt while open: 0 time(s); still filled 8 s later: true | as expected |

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
