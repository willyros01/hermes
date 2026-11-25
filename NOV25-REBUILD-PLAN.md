# READ THIS FIRST — before any more FIDUNIO 1.1.83 work (Willy, 25 Nov 2026 02:39)
Any session resuming this work MUST read this whole file before touching code, tests or releases.

## Status at 02:39, 25 Nov 2026
- DONE and pushed on fix/nov24-ios, fix/nov24-android, fix/nov24-web: Phases 1-3 below, version 1.1.83,
  README/TODO/checklist/hermes-memory entries, hl2.txt (Android branch; Willy runs it himself).
- Owner corrections since 22:39: sign-in stays PASSWORD-ONLY when the PIN record exists (PIN asked only when
  the record is missing); HELP contacts list collapsed until "Choose HELP contacts".
- NOT RELEASED. TestFlight / APK / web are still 1.1.82. Nothing was changed in Firebase.
- Simulator run 1: all HELP + PIN repair passed. Run 2: Android HELP contacts saved on the server but the screen
  showed "Nobody yet" and no HELP bar -> traced to a DOUBLE START (see Phase 5). Run 4 is on the code before Phase 5.
- WAITING FOR WILLY'S "GO" ON PHASE 5. Recommended: option 2 (narrow). Do NOT start Phase 5 without his go.
- RELEASE TRAP: the newest commit pushed to ios / Android / main must NOT contain "[skip ci]" (it would skip the TestFlight / APK / web build).
- Open owner question: none other. Reply to his questions first, in large headings, before doing anything.

## Phase 5 — start-up serialization (owner guideline: start a step, WAIT for it to end, then the next; no race conditions)
Code trace (app.js initializeFirebaseLayer, firebase.js initFirebase):
1. The sign-in screen signs the user in BEFORE app.js loads, so firebase.js authUser is already set.
2. app.js `await initFirebase(cb)` adds an onAuthStateChanged listener, then the "after init" line
   (`firebaseUser=getFirebaseUser(); if(firebaseUser){...}`) starts jobs = START 1.
3. Firebase then calls the new listener with the current user = START 2. So EVERY start-up starts these twice.
   The after-init place has no purpose (Firebase always reports the signed-in user to a new listener).
Per job:
- publishMyE2EEKey: in-flight promise guard; can repeat the same writes afterwards (wasted, harmless).
- startNotificationRegistrationMaintenance: generation counter guard; lease activate is serialized (wasted work).
- beginBlockedUsersSubscription: NO guard — restart empties blockedUserIds until the new watch answers = REAL RACE.
- helpOwner.start: NO guard originally (Claude added it in 1.1.82, copying the pattern) — the run-2 failure.
  Backstop added 25 Nov (same uid -> no restart) and HELP removed from the after-init place (commit e50aaae).
- requestAppActivation: called from both places but properly queued (mutex) — follows the guideline.
- Also: help-owner.js start() calls initFirebase() which adds ANOTHER auth listener every start (never removed).
History: the double start existed in the first app.js in GitHub (2 Sep: key publish), Oct 4 (notifications),
Oct 5 (blocked users), Nov 24 (HELP, by Claude). No recorded reason.
Recommended change (option 2, narrow; needs Willy's GO):
1. Remove the after-init start place entirely; jobs start ONCE, only from the signed-in report.
2. In that report run the jobs in order, each awaited before the next; a failed step is shown/logged and the
   following steps still run (a notification failure must not stop messages loading).
3. HELP: started once and awaited; help-owner must not call initFirebase() (no extra listener) — get services
   without registering a listener.
4. Keep existing guards as backstops.
Proof before release: simulator run that COUNTS each job's starts (must be exactly 1 on Android and iPhone),
then the full probe (HELP, PIN repair, copy, links, Back, grace). Release only after both pass.

---

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
