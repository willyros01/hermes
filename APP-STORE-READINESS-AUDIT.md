# FIDUNIO App Store and migration readiness audit

Date: 2026-10-04
Branch: `ios`
Purpose: one-time pre-TestFlight audit before the next remediation build.

## Release decision

**HOLD — do not build/upload the next TestFlight yet.**

The next TestFlight is the post-remediation candidate. A build is authorized only after the source/security gates are green and every blocking item below is either completed or explicitly accepted as a documented external configuration step.

## Proven green at audit start

- Shared FIDUNIO architecture remains one application with bounded platform adapters.
- Native notifications are device accepted on iPhone and iPad for direct/group delivery and exact notification routing.
- APNs/Firebase notification credential blocker is closed and is not a routine re-audit dependency.
- Native App Check implementation is behind `firebase-platform-adapter.js`; web remains reCAPTCHA Enterprise and native iOS uses App Attest/DeviceCheck through the Capacitor native token -> Firebase JS SDK CustomProvider bridge.
- Firebase App Check enforcement remains OFF by approved policy.
- Exact-head repository gates after the App Check browser-harness repair passed: native preflight, Chromium/WebKit browser release regressions, and Rebuild Baseline Security Gate.
- At source head `b31f3a4066e4c92e10d6e2ce632ee60f4aad74b0`, native preflight, Chromium/WebKit browser release regressions, and the complete Rebuild Baseline Security Gate all passed.
- The former browser startup failure was a test-harness defect: the simulated native runtime did not model the newly required native App Check plugin. The harness now does, and both browser engines pass.
- The native iOS App Check dependency compiled successfully in the prior macOS shell run. That shell run timed out in simulator startup after an unusually long simulator boot/migration; it did not fail compilation.

## App Store review blockers discovered

### AS-001 — Self-service account deletion — PARTIAL SOURCE REMEDIATION / COMPLETION STILL BLOCKING

The `ios` branch now has **Settings -> Delete My Account** with current-password reauthentication, the existing six-digit FIDUNIO PIN, a user-owned deletion request, cancel-while-pending, and an Admin/Owner request queue.

The shared deletion-preparation owner now:
- deletes the requesting user's own sent direct and group messages through the existing controlled deletion callable;
- leaves non-owned groups through the existing E2EE membership/epoch-rotation owner;
- deliberately refuses to silently delete groups the requester owns; the owner must explicitly delete those groups first;
- marks the request cleanup-complete only after group membership cleanup succeeds;
- prevents Admin processing until that cleanup-complete barrier is present.

Still blocking:
- the final server-side account/personal-data/Firebase-Auth deletion processor is not yet implemented or deployed;
- completion confirmation is not yet operational;
- system-owner deletion needs an explicit ownership-transfer/continuity rule.

Do not call deactivation or a pending request "account deleted." Firebase Auth must be deleted last, after controlled server cleanup succeeds.

### AS-002 — Report Abuse — SOURCE IMPLEMENTED / LIVE DEPLOYMENT REQUIRED

Settings -> Safety -> Report Abuse is now implemented on the `ios` source branch with:
- bounded reason category;
- optional reported user;
- optional 1000-character detail;
- private Firestore report record;
- reporter may read their own report;
- system Admin/Owner can list and resolve/dismiss reports;
- no unrelated conversation plaintext is copied into the report.

Security-rule and wiring tests are part of the baseline gate.

Remaining:
- deploy the updated Firestore rules under controlled check-before-change/rollback procedure;
- verify a real user can submit and an Admin can review it;
- document response/moderation procedure.

### AS-003 — User blocking — SOURCE IMPLEMENTED / LIVE RULE DEPLOYMENT REQUIRED

The `ios` branch now has **Settings -> Safety -> Blocked Users**. Users can block/unblock another account. Firestore rules enforce the block in both directions for new direct conversations, direct-message sends, and direct-message reactions; this is not a UI-only block.

Group membership remains a separate group-admin/moderation concern. Existing conversation history is not silently destroyed.

Remaining:
- deploy the updated Firestore rules under the controlled snapshot/check-before-change procedure;
- verify real-device block/unblock and attempted direct contact in both directions.

### AS-004 — Objectionable-content filtering — SOURCE IMPLEMENTED CANDIDATE

The `ios` branch now has a shared web/iOS **pre-encryption on-device message safety policy**. It executes before text enters the Outbox or encryption path, does not send plaintext to a moderation server, and is not user-disableable.

The first policy is intentionally narrow to reduce false positives. It blocks a bounded set of high-confidence targeted violent/self-harm abuse, sexual-extortion phrasing, and child-sexual-abuse-material terminology. Settings explains that encrypted attachment contents are not inspected; Report Abuse, Block User, and group administration remain available for other cases.

This is a bounded first filter, not a claim that every form of objectionable content can be detected automatically.

### AS-005 — Published support/contact information — BLOCKING

No published FIDUNIO support/contact information was found in the current application/public guide.

Required remediation:
- one verified contact method owned by Cuberoot/FIDUNIO;
- accessible from Settings -> About/Safety and from the public support/privacy page;
- do not publish an unverified or guessed mailbox.

### AS-006 — Privacy policy / App Store privacy metadata — BLOCKING

No FIDUNIO privacy-policy page is present in this repository.

Required remediation:
- public Privacy Policy URL;
- in-app easy-to-find link;
- policy must describe account/profile data, Firebase processing, notifications, encrypted message/attachment storage, retention/deletion, abuse reports, App Check, and third-party processors accurately;
- App Store Connect privacy answers must match the actual build and backend.

### AS-007 — App Review access — REQUIRED BEFORE SUBMISSION

FIDUNIO is public-download / invite-controlled access. Apple review must receive a working path through the gate.

Planned review scenario:
- provide Apple a valid Admin invitation or prepared Admin review account;
- reviewer can create additional invitations and exercise direct/group messaging;
- document that a system Admin does not have universal conversation visibility;
- keep backend available throughout review.

### AS-008 — App Check production registration — EXTERNAL CONFIGURATION / TEST REQUIRED

Source implementation exists and enforcement is intentionally OFF.

Before the post-remediation TestFlight can be called App Check accepted:
- verify the FIDUNIO iOS Firebase App Check registration is App Attest;
- verify the Apple distribution provisioning profile contains production App Attest entitlement;
- prove a valid App Check token on real iPhone/iPad;
- prove the existing web/PWA reCAPTCHA Enterprise App Check path;
- return to standby with enforcement OFF after the test.

### AS-009 — Exact signed iOS candidate — REQUIRED

Before upload:
- native iOS shell/cold-start smoke must pass at the exact candidate head or any CI infrastructure timeout must be isolated with evidence;
- signed IPA must pass bundle ID, Team ID, profile, push entitlement, production App Attest entitlement, Firebase plist, and export-compliance gates;
- do not upload if any release gate fails.

## One-time live Firebase migration audit still required

Source alignment does not prove deployed state. The one-time audit must verify, without mutating live data:

- Firestore rules deployed revision, including the new abuse-report rules when remediation is ready;
- Storage rules deployed revision;
- required Firestore indexes;
- recovery, deletion, disappearing-message and notification Functions expected from the candidate;
- service-account/IAM bindings used by those Functions;
- notification functions remain the proven aligned source;
- Firebase iOS app identity;
- App Check registration/metrics with enforcement OFF;
- no unexpected stale or duplicate function authority.

Perform this as one consolidated read-only audit. Do not turn App Check enforcement on as part of certification.

The repository now contains `fidunio-pretestflight-readonly-audit.txt`. It performs the live checks above without deploy/create/update/delete operations. It still must be executed against the authenticated Firebase project and its output reviewed before certification closes.

## Remediation order

1. Close source-level App Store blockers: account deletion design/implementation, blocking, filtering policy/implementation, support contact, privacy/support pages.
2. Finish Report Abuse deployment/test.
3. Complete App Check external registration and token acceptance while enforcement remains OFF.
4. Run the consolidated read-only live Firebase audit.
5. Fix only findings that are actually proven.
6. Run exact-head targeted gates plus final release gates.
7. Build/upload one post-remediation TestFlight and watch Apple processing through completion.
8. Perform focused iPhone/iPad acceptance for the newly changed areas.
9. Freeze the one-time migration certification and switch future releases to change-aware minimal gates.

## Future release policy after certification

Do not repeat the full migration audit for ordinary TestFlight builds. Revalidate only changed owners/dependencies plus:
- exact commit;
- relevant regression/security tests;
- signed IPA identity/entitlement/Firebase checks;
- upload/processing result.

Stable external dependencies (including APNs and App Check registration) are rechecked only when related configuration changes or a functional failure gives evidence that they may have drifted.
