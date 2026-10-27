# FIDUNIO/Hermes historical branch lookup — 2026-10-27

This is the permanent search index for the original 52 branch tips audited on 2026-10-27. Search here FIRST when asked for an old checkpoint, fix, version, diagnostic, implementation, or document.

**Archive mechanism:** the `archive` HEAD is a 40-parent merge-like commit (one production `main` parent and 39 distinct historical tip parents). Therefore the commit histories for all 44 branch names below remain reachable from a SINGLE archive branch. Entries sharing the same original SHA intentionally appear separately; those names were distinct branches. This is not a GitHub folder, rename, or source-code copy.

**Branch deletion status:** NONE of the original 52 branches were deleted by this archive operation. Historical branches remain until the owner separately approves an exact deletion list, and then only after a fresh reachability/recovery audit.

## Branches retained outside the proposed cleanup

| Branch | Status | Snapshot tip |
| --- | --- | --- |
| `Android` | Retain — active/operations | `57d697d95faa8ca07c2d44e442838a08f0c674eb` |
| `backups` | Retain — active/operations | `d5ed4fc90dcab5cbb80e36c4c904f1b60209a782` |
| `ios` | Retain — active/operations | `76807147f68b450565c717a0aeec93848864a5c5` |
| `main` | Retain — active/operations | `5efb7eb1436c48b84a48a7fb27dd91cfde6ff249` |
| `main-3` | Retain — retired notice only | `26c6a68f511b246beaed5570ae105bdfef6c23b5` |
| `main2` | Retain — retired notice only | `74ef90f73fd066bbe9819a7abc5eaa35997b52fe` |
| `simulator-evidence` | Retain — active/operations | `2bfa7a30636806d0576439bbc07906ce21f2154e` |
| `simulator-tests` | Retain — active/operations | `beb7a51c06a33372f94e0c0452d597ffd06fed2a` |

`main` is the ONLY production web/GitHub Pages source; `ios` builds iOS TestFlight; capital-`Android` builds the signed APK. `main2` and `main-3` are historical **non-runnable retirement notice** branches, NOT active web applications. Backups and simulators remain separate.

## Inactive branch names and exact historical tip commits (44)

| Original branch name | Exact commit SHA | Purpose at time of snapshot |
| --- | --- | --- |
| `checkpoint-0.9.5.1-settings-pass` | `a1136963d47ed837c3275e356015c50e486ba9fa` | Checkpoint |
| `checkpoint-0.9.5.3-before-runtime-cleanup` | `c3780052b034b5a945176913e94b8315c7815143` | Checkpoint |
| `checkpoint-0.9.5.4-receipts-pass-point` | `fdfc32e379046230724edb4499d1786608918cc1` | Checkpoint |
| `checkpoint-0.9.5.5-before-e2ee-diagnostics` | `d0c82f12e433d5fc9d7b247b38d94466ca164c2d` | Checkpoint |
| `checkpoint-0.9.5.6-before-stable-identity` | `162d59939aaab7eb0190a3d8442bb3ded2d7f11e` | Checkpoint |
| `checkpoint-0.9.5.7-identity-pass` | `e2c99a9257cf79f82583b5bc101c6ebb41bc7ad2` | Checkpoint |
| `checkpoint-0.9.6.0-empty-runtime-pass` | `b401e5507e963b8d2d87ba8d9c3dce41bbe159dc` | Checkpoint |
| `checkpoint-account-e2ee-lifecycle-pass` | `293b5f45b033e0e6b2e4f83cc94a79913e604189` | Checkpoint |
| `checkpoint-rebuild-account-dm-v3-crypto-rules` | `ca9222bdb7171ae60de5b2b9c08bf5b9327f52c9` | Checkpoint |
| `checkpoint-rebuild-account-e2ee-auth-binding` | `251679cd9240e45f335536fed9bed5bc43e76157` | Checkpoint |
| `checkpoint-rebuild-baseline-recovery-pass` | `e2d2e10031182781f6887b2cd1a971701aa21e3a` | Checkpoint |
| `checkpoint-rebuild-group-foundation` | `6d410df0e7650e288732592ba8707de36249320f` | Checkpoint |
| `checkpoint-rebuild-group-ui-pass` | `3b29c1ea53b1cd45376e95def1fd8eedd7e1588b` | Checkpoint |
| `checkpoint-rebuild-new-message-owner` | `b4731926432af3a986af991d2f51db86acea0fd1` | Checkpoint |
| `checkpoint-settings-explicit-hook-pass` | `0b1ecae119a523e3da9c4efc9519578ae2f5765b` | Checkpoint |
| `checkpoint-settings-firebase-owner-pass` | `f837acfc4b88cfacb0358359891110018b4c94ad` | Checkpoint |
| `checkpoint-sole-firebase-sdk-owner-pass` | `b164a12ab2c2a86c88aaac70cfdf4079114d9243` | Checkpoint |
| `docs/rogue-code-audit-2026-09-10` | `0c334a6ac746cd0cf1dfdbcf330c7bda4115d54a` | Documentation |
| `feature/reaction-authors-Android` | `428d8c3a0b62b5c76cc67a463b9d17ded9c41bd2` | Feature candidate |
| `feature/reaction-authors-ios` | `c1198e5e369977604ef4fa535d5f7563661bed62` | Feature candidate |
| `feature/reaction-authors-main` | `675917fea7814da2d41a0ab3024ed6ecf0373c68` | Feature candidate |
| `feature/reaction-authors-main-3` | `da3594cc0281de6962440509e85669f5a698ab77` | Feature candidate |
| `fidunio-1.1.55-biometric-unlock` | `9f64c62a0ea6ce5974af7cc8e24fbe08ca7c076b` | Rebuild/migration |
| `fidunio-complete-rebuild` | `c66f0269c0f5fc5495a8a9d0d8c79abf737362c6` | Rebuild/migration |
| `fidunio-rebuild-baseline-2026-09-05` | `bda5efee19333b4b3a3108341d30431d20447754` | Rebuild/migration |
| `fix/emoji-intent-Android` | `38b0797c1bc57ff3937c96fecba92d2d01780135` | Fix candidate |
| `fix/emoji-intent-ios` | `5fd9987d4e3327d8bad9f99ac321720e01cb9de6` | Fix candidate |
| `fix/emoji-intent-main` | `b87109d00bba8eca0ab0f4becd4c1d6ded243a0d` | Fix candidate |
| `fix/emoji-intent-main-3` | `271c2d0ccb07addf09ea5f223b35287e4baa7e2c` | Fix candidate |
| `htest` | `31dac2c0b551429a5a4ba7cf7c967e6316e9a9e6` | Historical work |
| `main-backup-2026-10-11` | `37dde623aab2c257a72b7aa49605870a26f3b72c` | Backup/safety |
| `notif-serialized-handoff-work` | `f2aa95a05b515f6382cfc1201aca36babd325378` | Historical work |
| `notification-projection-fix` | `b069d1cdec8b2a265abc0b04b7d222a6b00a50e0` | Historical work |
| `option2-serialized-notification-handoff` | `f2aa95a05b515f6382cfc1201aca36babd325378` | Historical work |
| `pin-biometric-redesign` | `1aad82cff5f279dca5778778d292bc4e4bd55d39` | Historical work |
| `pre-1.1.12-notification-serialization-checkpoint` | `f2aa95a05b515f6382cfc1201aca36babd325378` | Backup/safety |
| `pre-option2-backup-20260909` | `f2aa95a05b515f6382cfc1201aca36babd325378` | Backup/safety |
| `pre-option2-safety` | `f2aa95a05b515f6382cfc1201aca36babd325378` | Backup/safety |
| `release/0.9.0` | `d3e61a544b6e029a60ea7deed8ba8306154b30c8` | Release |
| `release/0.9.0-prep` | `1d39b42d294452fc02f93ab85deeb8a055fd45a3` | Release |
| `release/0.9.1` | `50a04e0c8064c9376825591d433ca070b1c417af` | Release |
| `release/0.9.4` | `b53ecf2b4dc40a294661308b52f70b8ee15b495b` | Release |
| `stabilization-0.9.4.10-restart` | `51a278b2ac5cc9eeb83a557a64e58417ccc01697` | Historical work |
| `temp-unused` | `f2aa95a05b515f6382cfc1201aca36babd325378` | Historical work |

## Recovery assurance

- Every one of these 44 historical tip SHAs was successfully checked as an ancestor of a local test commit with the same parent topology (2026-10-27).
- An independent `hermes-git-recovery-2026-10-27.bundle` (328,310,151 bytes) was cloned in isolation; all 52 branch refs and 44 annotated `archive/<original-branch>` tags were recovered with exact target SHAs.
- SHA-256 of independent bundle: `ae72fa7dab8e6ea27f059b80d88480e0387149d979ae8587136e16761b5845e0`.
- The owner authorized the complete bundle to be stored in **private ChatGPT Library**. GitHub does NOT hold the 44 separately named annotated archive tags as of this record; those tags are in the independent bundle. The archive branch itself protects the 44 histories by ancestry.
- Recovery instructions: [RECOVERY.md](RECOVERY.md). Do not force-push or delete the `archive` branch. Treat its tip as immutable and consider applying GitHub branch ruleset protection.

**Policy:** No new runnable web stage, no automatic iOS/APK build, no Firebase change, and no historical branch deletion as a side effect of documentation or archiving.
