# FIDUNIO 1.1.83 rebuild plan — owner-authorized Nov 24 2026, 22:34 (Willy)

Willy: "keep on building incl the redesign HELP without asking for my permission. You only stop
once the new TestFlight and APK on the website address everything we discussed. No stopping for
decision. One main program code, same function module for every device, device-dependent code
inside same-named function modules, observe hermes-memory.txt and related docs as guideline."

Hard limits that still hold: NO live Firebase change by Claude (prepare a 3-letter .txt Cloud Shell
script for Willy instead); never change the PIN or the encryption key; never package firebase-config.js.

Branches: fix/nov24-ios, fix/nov24-android, fix/nov24-web (worktrees /home/claude/hermes,
/tmp/fix-android, /tmp/fix-web). Release: ios (TestFlight trigger = build/ios-testflight-release.json),
Android (APK, Cuberoot publishes), main (web). Version 1.1.83 (version.js + README ledger).

## Phase 1 — PIN (lock PIN == encryption PIN, owner design)
1. auth-ui-clean.js renderSessionUnlock: saved key present but NO lock PIN record → password + PIN
   screen; verify ONLY with unlockAccountE2EE({uid,password,pin}) (no recovery/rewrap fallback);
   success → setLocalPin(same pin) → save identity → open; failure → stay locked, nothing changed.
2. enterAfterPasswordSignIn (saved-key path) must ask the PIN too → renderSessionUnlock.
3. app.js renderUnlock: remove "Continue to FIDUNIO" with no PIN → locked screen, button reloads
   into the start-up password + PIN gate.
4. local-security.js queueConfigMutation: apply each change to the freshly read stored record
   (lock time / Face ID changes can never write over the PIN).
5. Tests + simulator check: delete only the lock PIN record → password+PIN restores same PIN; wrong
   PIN stays locked; password sign-in asks PIN.

## Phase 2 — one main program, same-named device modules
- Remove the iOS shell change (FidunioViewController, storyboard class) and the Wi-Fi plugins
  (iOS Swift, Android Java, wifi-info entitlement): KISS HELP drops the Wi-Fi name.
- back-platform-adapter.js (was android-back-platform-adapter.js): Android = Back; iOS/web no-op.
- app-state-platform-adapter.js: "app left / came back" signals (native pause/resume + App plugin +
  web visibility) used by local-security.js instead of Capacitor calls inside it.
- help-platform-adapter.js: urgent notification channel (Android creates it; iOS/web no-op) and
  location (one call, same answer shape everywhere).
- Shared files byte-identical on all three branches; only build/native folders differ.

## Phase 3 — KISS HELP (storyboard https://claude.ai/artifact/RKFose2qr6mm1SShgjyWDw)
Child: Messages shows one full-width red HELP bar above the tabs (covers nothing; tablet: bottom of
the left list). No banners, no FAB. HELP screen: one giant button, hold 2 s (ring). Sent: "HELP is
sent — <names> are being called", "Write a message", "I'm OK now". Someone answers: green "<name>
is coming", "Write a message", "I'm OK now". Write a message → the HELP chat.
HELP chat: one E2EE group "HELP — <child profile name>" = child + chosen contacts, created/updated
at Setup Save with the existing group code; alert/location/answers are posted there.
Helper: notification "HELP — <child>"; tapping it (or opening/unlocking FIDUNIO while an alert is
open and unanswered) shows the red screen: "<child> needs HELP", time, map, "Open in Maps",
"I'm coming" → marks answer, opens the HELP chat.
Setup (Settings → Safety → HELP): tick contacts (profile names), Save. Removed: Protect this
account, Test button, picture buttons, note box, 5-second Cancel, Wi-Fi, banners.
Names: always the FIDUNIO profile display name.
Server (needs Willy's script, hl2.txt): ring every 30 s until someone answers or the child is OK,
no limit (sweep every minute sends now and again 30 s later); body "HELP — <name>". The app must
keep working with the current server meanwhile (2-minute re-alerts).

## Phase 4 — test, release, report
All unit tests; simulator journeys (iPhone + Android) incl. update-over-existing-install; then
1.1.83 to ios (TestFlight), Android (APK → Cuberoot website), main (web); README ledger,
hermes-memory.txt, TODO.md; final report to Willy in large headings + hl2.txt with steps.
