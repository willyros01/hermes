# FIDUNIO release-validation status

**Current open regression:** [Issue #3](https://github.com/willyros01/hermes/issues/3) — intermittent native group emoji removal. [Run #34](https://github.com/willyros01/hermes/actions/runs/40150957216): Android 20/20 PASS, iPhone 19/20 PASS with group R01 😮 removal failed. Owner reports a similar real-device problem. [Run #35](https://github.com/willyros01/hermes/actions/runs/40153548941) adds diagnostics but its result is pending for this record. [Detailed test protocol](REACTION-REMOVAL-REPRODUCTION.md). Revalidate physical iPhone/Fire HD and all 88 required scenarios before any release.

**RELEASE VALIDATION: BLOCKED.** The prior 14/14 native Android and iPhone journeys are smoke/functional coverage, **not** comprehensive release certification.

The release gate must reject an incomplete or missing evidence manifest. Tests must run against immutable, matching source commits and local Firebase emulators. The following require independent evidence: all six emoji reactions, delete for me/everyone, replies, offline recovery, multi-account encrypted send/decrypt, photo/video/audio/files, read visibility, notifications, account lifecycle, settings persistence, and physical-device acceptance. Missing evidence is NOT VERIFIED, never PASS.

This file is documentation on the isolated simulator-tests branch; it does not affect production branches, signing, publishing or live Firebase.
