# FIDUNIO Native iOS Migration Checklist

**Status:** Phase 0 preparation active — 2026-10-03

## Phase 0 — repository and architecture preparation

- [x] User approved web/PWA + native iOS coexistence.
- [x] Keep one repository: `willyros01/hermes`.
- [x] Define `main` as production web/PWA + shared backend authority.
- [x] Approve dedicated `ios` branch for native development.
- [x] Permit native implementation under `ios/`.
- [x] Run the existing Rebuild Baseline Security Gate on both `main` and `ios`.
- [x] Document shared/web-only/iOS-only ownership.
- [x] Define same-account/same-E2EE-identity coexistence requirement.
- [x] Create `ios` branch from the final validated Phase 0 `main` head.
- [x] Add iOS branch-only preflight workflow.
- [x] Confirm final Phase 0 `main` and `ios` workflow success.

## Phase 1 — Apple/Firebase application setup

- [ ] Select and register FIDUNIO native iOS bundle ID.
- [ ] Confirm Apple Developer team and App Store Connect API credentials to use.
- [ ] Create App Store Connect FIDUNIO app record.
- [ ] Register iOS app in the existing Firebase project.
- [ ] Add `GoogleService-Info.plist` through the approved secret/config handling method; never expose private credentials.
- [ ] Enable required Apple capabilities only when needed: Push Notifications, Keychain Sharing if required, Associated Domains only if required.
- [ ] Add read-only Apple setup-check workflow before any TestFlight upload.

## Phase 2 — native project foundation

- [ ] Create native Swift/SwiftUI project under `ios/`.
- [ ] No Capacitor/webview app shell.
- [ ] Add deterministic build/version ownership for native app.
- [ ] Add native compile/test workflow on `ios`.
- [ ] Add TestFlight workflow only after signing prerequisites pass.
- [ ] Preserve GitHub Pages deployment from `main` only.

## Phase 3 — account and local security

- [ ] Firebase Authentication sign in.
- [ ] Join/new-account flow consistent with shared account contract.
- [ ] UID-scoped local activation.
- [ ] Native six-digit PIN owner.
- [ ] Face ID/Touch ID through LocalAuthentication.
- [ ] Keychain/Secure Enclave storage boundary.
- [ ] Explicit sign-out cleanup without deleting shared account data.

## Phase 4 — E2EE identity interoperability

- [ ] Detect existing authoritative account E2EE identity.
- [ ] Restore the same keyId/private identity through existing recovery authority.
- [ ] Never generate a replacement identity for an existing valid account.
- [ ] Persist native key material under one secure-storage owner.
- [ ] Enforce wrapper/revision reconciliation.
- [ ] Web login after native activation still decrypts existing messages.
- [ ] Native login after web activity still decrypts existing messages.

## Phase 5 — synchronized read path

- [ ] Direct conversation list.
- [ ] Group list/membership.
- [ ] Direct message decrypt/project.
- [ ] Group message decrypt/project.
- [ ] Join-time history boundary.
- [ ] Explicit granted history.
- [ ] Attachments receive/decrypt.
- [ ] Reactions projection.
- [ ] Sent/Read state projection.
- [ ] Server deletion/absence convergence.

## Phase 6 — synchronized write path

- [ ] Direct text send.
- [ ] Group text send.
- [ ] Attachment send.
- [ ] Reactions.
- [ ] Read receipts.
- [ ] Delete for Everyone.
- [ ] Mass delete.
- [ ] Conversation deletion.
- [ ] Group add/remove/re-add.
- [ ] History grants.
- [ ] Invitation acceptance/issuance as authorized.

## Phase 7 — native notifications

- [ ] APNs entitlement/provisioning.
- [ ] Firebase Messaging registration.
- [ ] Installation-local notification token owner.
- [ ] Direct notification exact-message routing.
- [ ] Group notification exact-message routing.
- [ ] Cold/warm/background/foreground acceptance.
- [ ] PIN/Face ID gate before protected content.
- [ ] Multi-device duplicate/route handling.

## Phase 8 — App Check

- [ ] Keep web App Check provider separate from native provider.
- [ ] Native uses App Attest/DeviceCheck.
- [ ] Start in metrics/monitoring mode.
- [ ] Verify valid traffic from TestFlight devices.
- [ ] Enable enforcement service-by-service only after web + native compatibility proof.

## Promotion rule

A branch being green does not by itself authorize a shared backend change. Native-only code may remain iOS-specific. Any change to shared Firebase schemas/rules/Functions/E2EE wire contracts requires explicit interoperability testing and reconciliation with `main` before it becomes authoritative.

