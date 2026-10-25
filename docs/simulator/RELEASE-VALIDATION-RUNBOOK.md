# FIDUNIO — recurring release-validation runbook

## Reaction-regression investigation and repeat testing

[Issue #3](https://github.com/willyros01/hermes/issues/3) is **OPEN**. The owner independently reports failed reaction removal on a real device; iPhone run #34 failed removing group 😮 while Android run #34 passed. Preserve that evidence even if later runs are green. The repeatable native stress protocol, state diagnostics and physical-device acceptance requirements are in [Simulator release-validation and R01 emoji investigation](docs/simulator/REACTION-REMOVAL-REPRODUCTION.md). Current release status stays **BLOCKED** until all 88 cases are independently supported; neither this nor the diagnostic harness authorizes a production app fix.

**CURRENT STATUS: BLOCKED — NOT RELEASE-CERTIFIED.** A six-stage green simulator regression run is not proof of complete release validation.

## Purpose

Run the same 88 mandatory scenarios against the actual `Android` and `ios` branch sources, while keeping the separate `simulator-tests` harness outside release branches. Capture genuine installed-app screenshots and Firebase Auth/Firestore evidence for every native assertion. Reject missing or stale results. An owner still decides whether to release.

## Execution

1. Open [FIDUNIO isolated simulator and Firebase regression suite](https://github.com/willyros01/hermes/actions/workflows/simulator-suite.yml).
2. Select **Run workflow**, choosing branch **`simulator-tests`**. The manual run includes the **FAIL CLOSED — all 88 functions** release gate.
3. Wait until all native and supporting stages terminate, then open **fidunio-release-readiness** under Artifacts. `release-gate.md` enumerates EVERY missing piece of evidence (including native, peer and physical).
4. Inspect the six-stage test results and all captured screenshots. If a test fails or is blocked, investigate it rather than copying an earlier PASS.
5. Only when the exact-build release gate says `READY_FOR_OWNER_REVIEW`, review its independent evidence before approving release. This gate does not automatically publish or sign anything.

## Evidence contract

- Manifest: [release-manifest.json](../../build/simulator/release-manifest.json) — **88 required scenarios**, never quietly drop a case.
- Native journey tests: [device-auth-run.mjs](../../build/simulator/device-auth-run.mjs) and [native-release-extensions.mjs](../../build/simulator/native-release-extensions.mjs), plus [native-release-more.mjs](../../build/simulator/native-release-more.mjs).
- Exact release source: the Android job reads the `Android` branch; the iPhone job reads the `ios` branch. Both save immutable commit hashes with their results. The release gate compares those to fresh, read-only release-branch checkouts.
- Each simulator PASS must include a distinct case ID, a successful assertion, and a real screenshot file in its native artifact.
- Peer-side E2EE decryption, receipt visibility, cloud deletion, provider notifications, and other independent-user conditions require separate peer evidence. Fire HD ADM and iPhone APNs, real camera, biometrics, accessibility and restart durability require physical-device evidence.
- Extra acceptance evidence is recorded in `release-attestations.json` with `status=PASS`, `expected_met=true`, `reviewed_by`, `reviewed_at`, `evidence_url` and both exact release-source SHAs. Blank fields or old builds cannot pass.
- A local test server stands in only for enrollment recovery; it is **not** a pass for production Firebase Cloud Functions.
- Simulator-only iOS cryptographic-key storage and confirmation compatibility patches must remain clearly labeled. They do not validate native OS dialogs or key persistence after restart.

## Release decision

**Never release on the strength of 14/14 or another small subset.** The total readiness gate is separate, mandatory for validation, and BLOCKED if even one required function lacks valid evidence. The owner must separately approve real-device acceptance and a release. No production branch or cloud rules changes are part of this runbook.

## Current development scope

The new native assertions exercise all six emoji choices in group and direct chat, each reaction add/remove, both group/direct Delete for Me and shared-message preservation, group Reply send, and archive/unarchive of a direct conversation. These checks are incomplete coverage of the broader delete-for-everyone, offline recovery, attachments, multi-account and notification acceptance inventory. **The gap register is authoritative until each scenario is independently implemented and verified.**
