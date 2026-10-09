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

### Phase 1 validation

- iOS validation head: `c5cc8e641b9dcdadab17f579ee1db208076145cf`.
- Capacitor iOS branch preflight `37137850059`: SUCCESS.
- Rebuild Baseline Security Gate `37137850079`: SUCCESS.
- Capacitor iOS shell `37137850047`: SUCCESS, including fresh project generation and unsigned Simulator compilation.
- Apple/Firebase registration is intentionally still open in Phase 2.


## 2026-10-09 — Notification lease and sender-name reconciliation (verified checkpoint)

- Production web authority: `main` at `b57ea9515efe5fa1143c2c06ba91659f965ae471`. Native TestFlight authority: `ios` at `f586060c7791fb2b33f17dd4752c84a15b67b4f1`. `main-3` is a separate experimental web branch; do not merge it blindly or deploy it over production.
- Installation-scoped sender-name privacy preference is stored locally under `fidunio.notification.sender-name.v2.<installationId>`; the corresponding cloud `users/<uid>/notificationDevices/<installationId>.showSenderName` field is updated with a bounded `updateDoc` helper. The checkbox commits the local preference only after a successful cloud write and restores the prior value on failure. Lease activation/renewal passes `showSenderName` from the installation preference so it does not revert to false on renewal. Message content, email and attachment names must not be exposed in push text.
- The existing lease/session owner remains the single serialized path for claim/revoke; the sender-name change must not introduce a second token owner. Successful logout revokes the current lease, while offline/timeout/unconfirmed revoke must not be represented as successful. Expired or inactive leases require server-side cleanup; do not assert that every offline logout has been revoked immediately.
- Web Settings notification ON/OFF UI now reflects a confirmed operation without waiting for a second potentially timing-out Firestore status read. This is a UI-status improvement, not a change to token delivery or Firebase enforcement.
- Verification: `main` Main Notification Lease Gate, Pages deployment, and baseline security checks passed on `b57ea951`; user confirmed production web notification fix working. `ios` notification lease, browser regressions, preflight, shell, security and TestFlight workflows passed on `f586060c`; user confirmed iOS sender-name fix working on device. GitHub TestFlight workflow success does not independently prove Apple processing or App Store approval.
- Regression history: `3cab589` on main failed the notification lease gate because the new sender-name setter omitted a closing parenthesis; fixed on main `b57ea951` and ios `f586060c`. Never bypass syntax/lease gates.
- Outstanding verification, not declared defects: multi-account logout/relogin and offline revoke, stale-token expiry/renewal, unexpected multi-route 'New messages' inbox modal, and full cross-platform regression (PIN/biometrics, attachments, blocking, account deletion, message routing). Do not claim complete certification from sender-name acceptance alone.
- Production Firebase rules were surgically updated during `main-3` investigation to permit bounded preference/registration writes on lease-shaped notification device documents. Deployment was performed separately in Cloud Shell and confirmed by the user. Do not reapply rules, rotate tokens, or alter Firebase production configuration merely to synchronize documentation.
