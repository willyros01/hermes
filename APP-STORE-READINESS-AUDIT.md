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
- The former browser startup failure was a test-harness defect: the simulated native runtime did not model the newly required native App Check plugin. The harness now does, and both browser engines pass.
- The native iOS App Check dependency compiled successfully in the prior macOS shell run. That shell run timed out in simulator startup after an unusually long simulator boot/migration; it did not fail compilation.

## App Store review blockers discovered

### AS-001 — Self-service account deletion — BLOCKING

Apple requires an app that supports account creation to let the user initiate deletion from inside the app. FIDUNIO currently has administrator suspend/deactivate controls, but no user-owned Delete My Account implementation.

Required remediation:
- Settings -> Account -> Delete My Account.
- Clear irreversible warning and reauthentication.
- User initiates the request in-app; no email/phone call required to start it.
- Full account and associated personal data cleanup, subject only to documented legal retention.
- If completion is asynchronous/manual, show the expected completion period and provide completion confirmation.
- Preserve E2EE authority: group membership/ownership must be reconciled without silently weakening epoch/rekey invariants.
- Delete Firebase Auth last, only after server cleanup succeeds or reaches an explicitly recoverable terminal state.

Do not implement a shortcut that merely deactivates the account; that is not sufficient.

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

### AS-003 — User blocking — BLOCKING

No end-user Block User capability is currently proven.

Required remediation:
- Settings -> Safety -> Blocked Users;
- allow a user to block/unblock another active account;
- prevent blocked direct contact at Firestore-rule authority, not UI only;
- preserve existing conversation history for the user who owns it;
- group behavior must be explicit (for example, group membership/admin moderation remains separate).

### AS-004 — Objectionable-content filtering — BLOCKING FOR UGC REVIEW

No explicit pre-publication objectionable-content filter is currently proven.

Because FIDUNIO is end-to-end encrypted, remediation must not create a server plaintext-inspection path. The preferred architecture is a bounded local pre-send safety filter before encryption, with a documented policy and tests. The filter must not become a second message owner.

Policy wording/categories must be approved before activation so legitimate private communications are not arbitrarily blocked.

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
