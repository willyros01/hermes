# FIDUNIO iOS Capacitor Migration Checklist

**Status:** Phase 0 architecture corrected to Capacitor/shared-JS model — 2026-10-03

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
- [ ] Reconcile the corrected Capacitor architecture into both branch heads and verify final workflows.

## Phase 1 — Capacitor project foundation

- [ ] Confirm exact Capacitor versions to pin.
- [ ] Add `@capacitor/core`, `@capacitor/ios`, `@capacitor/cli` and only required plugins.
- [ ] Commit deterministic package lock.
- [ ] Add FIDUNIO `capacitor.config.*`.
- [ ] Define an explicit allow-list of web assets copied into the iOS `webDir`.
- [ ] Build the iOS web payload from the same root application files; do not fork the application into a second code tree.
- [ ] Generate/sync the Xcode project deterministically in CI/build, following the Scorecard pattern where practical.
- [ ] Add Capacitor branch/build verification.
- [ ] Preserve current web/PWA execution with no Capacitor dependency at runtime.

## Phase 2 — Apple/Firebase application setup

- [ ] Select/register FIDUNIO iOS bundle ID.
- [ ] Confirm Apple Developer team and App Store Connect API credentials.
- [ ] Create the App Store Connect FIDUNIO app record.
- [ ] Register the iOS app in the existing Firebase project as needed for native integrations.
- [ ] Handle `GoogleService-Info.plist` safely if required by selected native Firebase plugins.
- [ ] Enable only required capabilities.
- [ ] Add read-only Apple setup verification before TestFlight uploads.

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

- [ ] Add deterministic iOS build/audit/TestFlight workflow modeled on Scorecard.
- [ ] Before each iOS candidate, synchronize accepted shared `main` changes into `ios`.
- [ ] Shared fixes found on iOS are reconciled to `main`, gated there, then synchronized back to `ios`.
- [ ] Keep iOS-only native/plugin/build files isolated.
- [ ] Verify both branches' shared-file drift before release.
- [ ] Complete web <-> iOS interoperability acceptance.

## Promotion/synchronization rule

The goal is one application with two distributions, not two implementations. Shared FIDUNIO JavaScript should remain the same whenever possible. A change discovered in iOS that affects shared application behavior must not remain as a hidden iOS-only fork; reconcile it with `main`, validate the web app, and synchronize the accepted shared result back to `ios`. Native plugin/config/build changes may remain iOS-only.
