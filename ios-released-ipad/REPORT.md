# FIDUNIO input probe — ios iPad — released

| Check | What | Expected | Observed | |
|---|---|---|---|---|
| IPAD-LAYOUT | iPad simulator, chat with Bob open | two-panel layout (list on the left, chat on the right) | two-panel with chat open | as expected |
| IPAD-BAR-LIVE | With the chat open, HELP contacts arrive from the server (Bob chosen on another device); touch nothing | the red HELP bar appears in the left panel within 20 s, without touching anything | HELP bar MISSING; still in chat: true; trace ["13:34:33 start","13:34:33 stop","13:34:34 settings snapshot exists=false cache=false pending=false contacts=-","13:34:34 settings applied (server read) contacts=0","13:34:54 settings snapshot exists=true cache=false pending=false contacts=1","13:34:54 settings applied (server read) contacts=1"] | **DIFFERENT** |
| IPAD-BAR-RESTART-1 | Restart FIDUNIO, unlock with the PIN, touch nothing (round 1 of 3) | the red HELP bar is there within 20 s, without touching anything | unlocked: true; HELP bar MISSING; route: messages; trace ["13:35:50 start","13:35:50 stop","13:35:51 settings snapshot exists=true cache=false pending=false contacts=1","13:35:51 settings applied (server read) contacts=1"] | **DIFFERENT** |
| IPAD-BAR-RESTART-2 | Restart FIDUNIO, unlock with the PIN, touch nothing (round 2 of 3) | the red HELP bar is there within 20 s, without touching anything | unlocked: true; HELP bar MISSING; route: messages; trace ["13:37:04 start","13:37:04 stop","13:37:05 settings snapshot exists=true cache=false pending=false contacts=1","13:37:05 settings applied (server read) contacts=1"] | **DIFFERENT** |
| IPAD-BAR-RESTART-3 | Restart FIDUNIO, unlock with the PIN, touch nothing (round 3 of 3) | the red HELP bar is there within 20 s, without touching anything | unlocked: true; HELP bar MISSING; route: messages; trace ["13:38:07 start","13:38:07 stop","13:38:07 settings snapshot exists=true cache=false pending=false contacts=1","13:38:07 settings applied (server read) contacts=1"] | **DIFFERENT** |

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
