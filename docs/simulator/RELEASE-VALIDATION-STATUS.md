# FIDUNIO release-validation status

**RELEASE VALIDATION: BLOCKED.** The prior 14/14 native Android and iPhone journeys are smoke/functional coverage, **not** comprehensive release certification.

The release gate must reject an incomplete or missing evidence manifest. Tests must run against immutable, matching source commits and local Firebase emulators. The following require independent evidence: all six emoji reactions, delete for me/everyone, replies, offline recovery, multi-account encrypted send/decrypt, photo/video/audio/files, read visibility, notifications, account lifecycle, settings persistence, and physical-device acceptance. Missing evidence is NOT VERIFIED, never PASS.

This file is documentation on the isolated simulator-tests branch; it does not affect production branches, signing, publishing or live Firebase.
