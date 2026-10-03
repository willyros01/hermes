# FIDUNIO iOS Capacitor Migration Checklist

**Status:** Phase 1 Capacitor project foundation COMPLETE — 2026-10-03

## Phase 0 — repository and architecture preparation

- [x] User approved web/PWA + iOS coexistence.
- [x] Keep one repository: `willyros01/hermes`.
- [x] Define `main` as production web/PWA + shared application/backend authority.
- [x] Approve dedicated `ios` branch for Capacitor/iOS development.
- [x] Use Scorecard as the process/reference model.
- [x] Choose **Capacitor + shared JavaScript**, not a SwiftUI rewrite.
- [x] Define minimum-drift branch synchronization policy.
- [x] Define same-account/same-E2EE-identity requirement.
- [x] Define narrow platform-adapter architecture for iOS-native integrations.
- [x] Keep GitHub Pages on `main` only.
- [x] Run the existing Rebuild Baseline Security Gate on both `main` and `ios`.
- [x] Create the `ios` branch.
- [x] Add iOS branch-only preflight workflow.
- [x] Reconcile the corrected Capacitor architecture into both branch heads and verify final workflows.

## Phase 1 — Capacitor project foundation

- [x] Pin Capacitor Core/iOS/CLI 8.5.2.
- [x] Add `@capacitor/core`, `@capacitor/ios`, `@capacitor/cli`; no feature plugins added prematurely.
- [x] Commit deterministic npm package lock.
- [x] Add `capacitor.config.json` with FIDUNIO / `io.github.willyros01.fidunio` / `www`.
- [x] Define explicit `build/www-files.txt` allow-list for the iOS `webDir`.
- [x] Build the iOS web payload from the same root application files; no second application code tree.
- [x] Generate/sync a fresh default Capacitor Xcode project in CI/build, following the Scorecard pattern.
- [x] Add Capacitor preflight + macOS shell generation/compile verification.
- [x] Preserve current web/PWA execution; Capacitor dependencies/build products remain iOS-branch build concerns.

## Phase 2 — Apple/Firebase application setup

- [x] Register explicit FIDUNIO iOS bundle ID `io.github.willyros01.fidunio`.
- [x] Confirm Team ID `VXMLKHF72B`; existing API key verified locally and four Hermes repository secrets provisioned.
- [x] Create and verify FIDUNIO app record `6818880685`, SKU `fidunio-ios-001`, locale `en-US`.
- [ ] Register the iOS app in the existing Firebase project as needed for native integrations.
- [ ] Handle `GoogleService-Info.plist` safely if required by selected native Firebase plugins.
- [x] Enable Push Notifications only as the selected initial capability; Apple includes its disabled In-App Purchase default.
- [x] Existing read-only `build/asc.mjs check` passed locally using the verified credentials; GitHub secret execution passed in runs `37156481701` and `37157602057`.

## Phase 3 — shared platform-adapter contracts

- [ ] Inventory direct browser dependencies in security, notifications, files, lifecycle, network and App Check.
- [ ] Define one shared JavaScript-facing platform service boundary.
- [ ] Preserve browser implementation on the web.
- [ ] Add iOS Capacitor implementation without scattering `isIOS` conditionals through feature owners.
- [ ] Add permanent adapter-contract tests.
- [ ] Ensure adapter calls are serialized where they mutate owned state.

## Phase 4 — native security integration

- [ ] Keep the same six-digit FIDUNIO PIN/account/E2EE application logic.
- [ ] Implement iOS biometric adapter with LocalAuthentication for direct Face ID/Touch ID.
- [ ] Implement native secure-storage adapter where required.
- [ ] Preserve established account identity/keyId and recovery/revision rules.
- [ ] Confirm browser WebAuthn remains web-only and iOS Capacitor no longer requires the browser passkey sheet for native biometric unlock.

## Phase 5 — synchronized data and messaging

- [ ] Same Firebase UID/account on web and iOS.
- [ ] Same E2EE identity/keyId.
- [ ] Direct/group list parity.
- [ ] Web send -> iOS receive/decrypt/project.
- [ ] iOS send -> web receive/decrypt/project.
- [ ] Sent/Read convergence.
- [ ] Attachments.
- [ ] Reactions.
- [ ] Disappearing content.
- [ ] Group add/remove/re-add and history grants.
- [ ] Delete for Everyone/mass delete/conversation deletion.
- [ ] Recovery and invitation flows.

## Phase 6 — native notifications/lifecycle

- [ ] APNs/FCM registration through one native adapter.
- [ ] Installation-local notification token ownership.
- [ ] Direct notification exact-message routing.
- [ ] Group notification exact-message routing.
- [ ] Cold/warm/background/foreground acceptance.
- [ ] PIN/Face ID gate before protected content.
- [ ] Multi-device route/duplicate handling.
- [ ] Preserve the same higher-level notification-routing functions where possible.

## Phase 7 — native App Check

- [ ] Keep web and iOS App Check providers behind the same platform-init concept.
- [ ] Web provider: reCAPTCHA Enterprise when activated.
- [ ] iOS provider: App Attest/DeviceCheck.
- [ ] Start with enforcement OFF/monitoring.
- [ ] Verify valid web and TestFlight traffic.
- [ ] Enable enforcement service-by-service only after coexistence proof.

## Phase 8 — TestFlight and branch synchronization

- [x] Add deterministic iOS build/audit/TestFlight workflow modeled on Scorecard, with exact-commit required checks and a distribution-signed archive audit.
- [ ] Before each iOS candidate, synchronize accepted shared `main` changes into `ios`.
- [ ] Shared fixes found on iOS are reconciled to `main`, gated there, then synchronized back to `ios`.
- [ ] Keep iOS-only native/plugin/build files isolated.
- [ ] Verify both branches' shared-file drift before release.
- [ ] Complete web <-> iOS interoperability acceptance.

## Promotion/synchronization rule

The goal is one application with two distributions, not two implementations. Shared FIDUNIO JavaScript should remain the same whenever possible. A change discovered in iOS that affects shared application behavior must not remain as a hidden iOS-only fork; reconcile it with `main`, validate the web app, and synchronize the accepted shared result back to `ios`. Native plugin/config/build changes may remain iOS-only.

### Phase 1 validation

- iOS validation head: `c5cc8e641b9dcdadab17f579ee1db208076145cf`.
- Capacitor iOS branch preflight `37137850059`: SUCCESS.
- Rebuild Baseline Security Gate `37137850079`: SUCCESS.
- Capacitor iOS shell `37137850047`: SUCCESS, including fresh project generation and unsigned Simulator compilation.
- Apple/Firebase registration is intentionally still open in Phase 2.


## Pre-TestFlight native-shell compatibility checkpoint — 2026-10-03

Repository implementation is prepared on the `ios` branch before Apple registration:

- Added one bounded `platform-runtime.js` authority for web versus Capacitor iOS selection.
- Web service-worker registration is disabled only inside the native iOS shell; the accepted web/PWA path remains unchanged.
- Browser Web Push controls are not exposed in the native shell; APNs/FCM remains a later dedicated native adapter.
- Browser reCAPTCHA Enterprise App Check initialization is skipped only in the native shell while App Check enforcement remains OFF; native App Attest/DeviceCheck remains a later controlled phase.
- Browser WebAuthn/passkey biometric enrollment/unlock is not used inside the native shell. PIN remains the first-shell local unlock path until the LocalAuthentication Face ID adapter is implemented.
- Browser Home Screen installation guidance is replaced by installed-iOS-app guidance inside Capacitor.
- Invitation, Quick Start, and recovery links created inside the native shell resolve to the public FIDUNIO web origin rather than a private `capacitor://` URL.
- Firebase Auth/Firestore/Storage, E2EE, Outbox, direct/group messaging, receipts, attachments, recovery authority, deletion authority, and live Firebase configuration were not changed.
- No web runtime version bump: these changes exist only on the `ios` migration branch.

Validation after correcting an initially caught platform-module newline syntax defect:
- Capacitor iOS branch preflight: run 37139976180 — SUCCESS.
- Full Rebuild Baseline Security Gate: run 37139976192 — SUCCESS.
- Capacitor iOS shell: run 37139976206 — SUCCESS, including fresh Capacitor generation and unsigned simulator compilation.

Apple Phase 2 registration remains the next external-account step.


## Apple registration closeout — 2026-10-03

See `IOS-APPLE-REGISTRATION.md` for verified Apple identity, capability, credential and validation facts. Apple setup is complete; Firebase native SDK registration remains later work. FIDUNIO's independent current-shell encryption assessment is documented in `IOS-EXPORT-COMPLIANCE.md`; first uploaded-build processing remains to verify. Existing pre-registration GitHub gates were read and passed; no TestFlight build was uploaded and no live Firebase/App Check or `main` change was made.


## Current-shell export compliance — 2026-10-03

- [x] Independently inventory FIDUNIO's iOS payload encryption (82 allow-listed JS/HTML files reviewed).
- [x] Consult current Apple documentation and WebKit's native Web Crypto implementation documentation.
- [x] Record current iOS OS-provided encryption / documentation-exempt self-assessment in `IOS-EXPORT-COMPLIANCE.md`.
- [x] Apply `ITSAppUsesNonExemptEncryption=false` to generated iOS Info.plist via a dedicated post-sync build script.
- [x] Verify first uploaded TestFlight archive declaration and App Store Connect compliance processing: `1.1.56 (1)`, workflow `37157602057` SUCCESS; Apple `VALID`, `usesNonExemptEncryption=false`.

No non-OS encryption documentation was uploaded and no Apple approval/code is claimed. Reassess if encryption implementations, protocols or runtime change.


## First TestFlight build — 2026-10-03

Version `1.1.56`, build `1`, uploaded from `ios` commit `9b5efe5f9db91a80c93e2cd0b67b2bb17b1e8a50`. Exact-commit preflight, Simulator compilation and full security baseline passed before upload. Apple processed build ID `4273f40c-2550-4016-982e-43b43c4e320f` as VALID. Device installation, same-account/E2EE coexistence, native branding, Face ID and APNs/FCM acceptance remain open. Do not count TestFlight upload as feature completion.
