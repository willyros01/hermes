## 2026-10-11 — Mandatory ios/main-3 functional equivalence

**Functional equivalence dictates the code written on `main-3`. Identical source code is not the acceptance criterion.**

After the user-confirmed completion of the current sync, every change on `ios` must be assessed and implemented on `main-3` in the same work item so both versions deliver equivalent functionality. This includes features, fixes, security/privacy behavior, state transitions, error handling and lifecycle behavior. Do not defer the web implementation until a later bulk sync.

Use the existing abstraction/platform-adapter layer: preserve shared feature owners and contracts, and implement browser and native capabilities behind their bounded adapters. The implementation on `main-3` is selected by the required functional outcome, not by copying the iOS patch. Different code or platform presentation is acceptable when it delivers the same operation, result and security guarantees. Do not scatter platform conditionals or create duplicate feature/state/Firebase/E2EE owners.

Native packaging/signing/plugin mechanics may remain iOS-specific, but “native-only” is not an exemption for user-facing behavior. Record the corresponding web behavior or a reasoned no-functional-impact assessment. An unavailable browser capability is an explicit unresolved parity gap; it is not proof of equivalence.

For every iOS change:
- Record the required behavior and the corresponding `main-3` implementation/adapter boundary.
- Preserve one-resource/one-owner serialization, deterministic lifecycle results, large fonts and high contrast.
- Validate the changed functionality and neighboring regressions on both exact branch revisions, including relevant offline/failure/security paths.
- Record branch commits, tests and remaining device checks in the applicable checklist and cumulative `hermes-memory.txt`.
- Do not close the change or claim functional equivalence from source presence, a matching diff, or a green build alone. Device-dependent claims require applicable real-device evidence.

`main` remains the protected production web/shared-backend authority. This rule does not authorize blind merges, production promotion, live Firebase changes or a new release. It supersedes older workflow wording that allowed iOS behavior changes to accumulate before web reconciliation.

**Checkpoint:** the user reported the sync complete on 2026-10-11. Independent functional-equivalence audit remains pending; this documentation update does not certify parity.

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
