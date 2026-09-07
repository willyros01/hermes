# FIDUNIO Device-Acceptance Bug Ledger

**STATUS: CRITICAL DURABLE DOCUMENT — READ AND UPDATE DURING EVERY USER-DEVICE ACCEPTANCE OR RC-STABILIZATION TASK**

This root-level ledger records defects found only through real-device acceptance. It supplements `BUG-LIST.md`; it does not replace the authoritative build ledger in `FIDUNIO-BUILD-CHECKLIST.md`.

## Required record fields

Every entry must preserve: bug ID, build, date, reporter/device, severity, acceptance area, expected behavior, observed behavior, evidence, architecture constraints, status, repair build, validation evidence, and exit criteria.

## Open defects — 0.9.9.7 device acceptance

### FDA-IPAD-001 — Conversation-screen widgets missing

- **Build under test:** 0.9.9.8 deployed from `main`
- **Date reported:** 2026-09-06
- **Reporter/device:** User; iPad landscape; existing Home-Screen installation
- **Severity:** HIGH — release-candidate blocker
- **Acceptance area:** iPad/tablet two-pane conversation UI
- **Expected behavior:** The established supported conversation widgets/tools remain visible and usable in the conversation pane, consistent with the protected iPad checkpoint.
- **Observed behavior:** The conversation-screen widgets are absent.
- **Evidence:** User report and supplied iPad landscape screenshot during 0.9.9.7 acceptance.
- **Architecture constraints:** Preserve the established responsive owner and two-pane lifecycle. Do not add a competing renderer, MutationObserver repair, orientation timing hack, or reload synchronization.
- **Status:** OPEN — REPRODUCED BY USER
- **Repair build:** 0.9.9.8 RC stabilization
- **Exit criteria:** Supported widgets are restored on iPad portrait and landscape; iPhone compact behavior remains unchanged; repository UI/lifecycle gates pass; user repeats and accepts the device test.

### FDA-IPAD-002 — Text size regressed on iPad

- **Build under test:** 0.9.9.8 deployed from `main`
- **Date reported:** 2026-09-06
- **Reporter/device:** User; iPad landscape; existing Home-Screen installation
- **Severity:** HIGH — accessibility and release-candidate blocker
- **Acceptance area:** Readable larger-text behavior
- **Expected behavior:** The established readable text scale and Settings A/A+/A++ behavior apply consistently to the iPad conversation experience.
- **Observed behavior:** Conversation-screen text is materially smaller than the previously accepted iPad presentation.
- **Evidence:** User report and supplied iPad landscape screenshot during 0.9.9.7 acceptance.
- **Architecture constraints:** Preserve the existing Settings owner and accessible text-scale tokens. Do not create a second settings/text-size owner or solve this with device-specific timing.
- **Status:** OPEN — REPRODUCED BY USER
- **Repair build:** 0.9.9.8 RC stabilization
- **Exit criteria:** User-readable text sizing is restored on iPad portrait and landscape without breaking iPhone wrap-around or larger-text layouts; repository responsive/settings gates pass; user accepts the result.

### FDA-IPAD-003 — Conversation pane overlaps established iPad layout

- **Build under test:** 0.9.9.8 deployed from `main`
- **Date reported:** 2026-09-06
- **Reporter/device:** User; iPad landscape; existing Home-Screen installation
- **Severity:** CRITICAL — layout integrity and release-candidate blocker
- **Acceptance area:** iPad/tablet adaptive two-pane layout
- **Expected behavior:** Navigation/list and conversation panes occupy their predefined non-overlapping areas, with established controls fully visible.
- **Observed behavior:** The conversation screen overlaps other iPad layout content.
- **Evidence:** User report and supplied iPad landscape screenshot during 0.9.9.7 acceptance.
- **Architecture constraints:** Preserve one responsive route/body owner and one deterministic render path. No second orientation listener, MutationObserver lifecycle repair, reload synchronization, or arbitrary delay.
- **Status:** OPEN — REPRODUCED BY USER
- **Repair build:** 0.9.9.8 RC stabilization
- **Exit criteria:** No overlap in iPad portrait or landscape, including rotation and foreground return; the two-pane layout and iPhone single-pane layout remain intact; full required repository gate passes; user repeats and accepts the device test.

## Acceptance consequence

The 0.9.9.7 real-device acceptance pass is **FAILED / BLOCKED** by FDA-IPAD-001 through FDA-IPAD-003. The 0.9.9.8 stabilization point remains unearned. Promotion readiness 0.9.9.9 and 1.0 promotion are prohibited until these defects are repaired, repository-gated, redeployed, and accepted by the user. Whole first-rebuild completion remains **96.0 / 100.0 (96%)**.
