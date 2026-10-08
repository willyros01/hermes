# FIDUNIO main-3 web retrofit checkpoint

Date: 2026-10-08
Target branch: main-3 ONLY. The main and ios refs are immutable inputs during this operation.

## Source and rollback
- Original main-3 HEAD: 8ce96f85f132da078bbfc237825e78f139deea96
- Reference ios HEAD: 8ef5b3dec3329093ba790265c489b086a31d7271
- Reference ios tree: 43cf2ecef46947dacdcbba97a29a3481b73876bd
- This candidate snapshots the ios application tree into a NEW main-3 commit with the old main-3 commit as parent. It is NOT a merge and it does not advance the ios branch.

## Retrofit acceptance requirements — NOT YET COMPLETE
1. Web runtime uses browser paths of every platform adapter; Capacitor native modules must not be required for normal web startup.
2. Service worker, notifications and click routing remain browser-owned, not APNs-owned.
3. Login, terms, PIN, E2EE recovery, attachments, direct/group messaging, receipts, reactions, block, abuse reporting, deletion, and per-conversation disappearing settings work in browser with correct permissions.
4. Restore web-only PWA support and web gold ring; iOS blue ring remains iOS-only.
5. Run syntax, security, browser (Chromium/WebKit) and Firestore emulator tests on the exact main-3 SHA. Check PWA install/notification and iPhone/iPad responsive behavior.
6. Use test accounts and isolated preview only; do not touch production Pages, Firebase rules/functions, App Check enforcement, main, or ios.
7. Do not promote/deploy as production until acceptance is explicitly completed.

This document does not claim functional validation, TestFlight release, or browser deployment.
