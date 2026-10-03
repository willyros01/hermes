# FIDUNIO Native iOS Coexistence Architecture

**Status:** Approved preparation baseline — 2026-10-03  
**Repository:** `willyros01/hermes`  
**Branches:** `main` = production web/PWA + shared backend authority; `ios` = native iOS development.

## Goal

Build a genuinely native iOS FIDUNIO client that coexists with the existing web/PWA client. A user signs into the same FIDUNIO account from either client and sees the same authorized conversations, groups, messages, attachments, reactions, deletion state, memberships and receipts.

The native client is not a wrapper around the web UI and is not a replacement for the PWA. Both clients share the same Firebase backend contracts while keeping platform-local security, notification and cache state separate.

## Authority split

### Shared account/backend authority

These remain canonical across web and iOS:

- Firebase Authentication account/UID.
- Firestore conversation, direct-message, group, membership, receipt, reaction, invitation, recovery and deletion contracts.
- Firebase Storage encrypted attachment objects and authorization rules.
- Cloud Functions recovery, notification, deletion and administration authority.
- Account E2EE identity/keyId and authoritative wrapper/revision state.
- Group E2EE membership/epoch/history-boundary rules.
- Server-side deletion barriers and authoritative absence.
- Notification routing identifiers and server fan-out semantics.
- Recovery authorization and account-vault cryptographic boundaries.

The web implementation remains the currently validated reference implementation for these contracts until the native client proves interoperability.

### Web/PWA-only resources

The native client must not depend on or copy these as account authority:

- Service worker/cache lifecycle.
- IndexedDB/localStorage implementation details.
- Web Push subscription representation.
- Browser WebAuthn/passkey UI.
- PWA install state and browser installation guidance.
- DOM/render ownership and responsive web layout state.

### Native iOS-only resources

The native client owns these locally:

- SwiftUI/UIKit presentation and navigation.
- Keychain/Secure Enclave storage.
- Local Face ID/Touch ID through LocalAuthentication.
- APNs/FCM iOS device token registration.
- Native notification presentation/routing.
- Native local database/cache.
- Background task/lifecycle integration.
- App Attest/DeviceCheck App Check provider when App Check is activated.
- iOS accessibility, Dynamic Type, VoiceOver and platform UI behavior.

None of these device-local resources are restored directly from the web installation or portable vault.

## E2EE coexistence rule

An existing FIDUNIO account has one account encryption identity. The native client must restore/activate that same account identity and `keyId` through the established authenticated recovery authority. It must never silently generate a replacement account identity when a valid account already exists.

A new iOS installation therefore follows:

1. Firebase sign-in establishes the UID.
2. The client determines whether authoritative E2EE identity already exists.
3. For an existing account, recovery/bootstrap proves the existing PIN/server recovery authority and restores the same account identity.
4. The recovered private material is stored using native iOS secure storage under a native owner.
5. Current cloud membership, deletion and history authority is re-read before projecting conversations.
6. Device-specific notification/App Check/biometric registration is created fresh for that installation.

The portable `.fidunio` vault remains a recovery artifact, not the normal cross-device synchronization transport.

## Synchronization contract

Firebase is authoritative for cross-client synchronization. Required interoperability includes:

- Web send -> native receive/decrypt/project.
- Native send -> web receive/decrypt/project.
- Sent/Read convergence across clients.
- Direct and group reactions.
- Delete for Me remains installation-local.
- Delete for Everyone and conversation deletion converge from server authority.
- Group add/remove/re-add/history boundary and history grants.
- Attachment upload/download/decrypt from either client.
- Invitation acceptance and account discovery.
- Notification tap -> exact conversation/message.
- Password/recovery/account-key revision changes.
- Archive remains installation-local unless deliberately redesigned later.

No synchronization path may use one client's local cache as authority for the other.

## Repository and branch policy

- `main` is the live web/PWA and shared-backend authority.
- `ios` is the native-development branch.
- Native source belongs under `ios/`.
- GitHub Pages must remain deployed from `main` only.
- Rebuild Baseline Security Gate runs on both `main` and `ios` so native development cannot silently damage the web/shared contract.
- iOS-specific CI/TestFlight workflows may run from `ios` only.
- A native-only change does not need promotion into the web runtime.
- A shared contract change developed during iOS work must be reviewed as a shared change, tested against both clients, and reconciled into `main` before it is considered authoritative.
- Do not create a mirror/synchronization bot between branches.

## Native technology baseline

Target implementation:

- Swift + SwiftUI for primary UI.
- Firebase Apple SDKs for Auth, Firestore, Storage, Functions and Messaging.
- CryptoKit/Security/Keychain for native cryptographic and secure-storage primitives.
- LocalAuthentication for Face ID/Touch ID.
- UserNotifications + Firebase Messaging for notification delivery.
- App Attest/DeviceCheck for native App Check when activated.
- Native persistence selected only after its ownership and encryption boundary are documented.

No Capacitor/webview runtime is planned for FIDUNIO native iOS.

## Migration phases

### Phase 0 — preparation

- Freeze/document shared contracts.
- Establish `ios` branch from current validated `main`.
- Add branch validation.
- Define native source layout and ownership.
- Confirm Apple/Firebase identifiers before code that depends on them.

### Phase 1 — native shell and authentication

- Create native Xcode project.
- Establish bundle ID and Apple signing/TestFlight pipeline.
- Firebase initialization.
- Sign in/join UI.
- UID-local secure storage.
- Native PIN/Face ID lock owner.

### Phase 2 — E2EE account bootstrap

- Restore existing account identity/keyId.
- Native secure key persistence.
- Revision reconciliation.
- Recovery/fail-closed paths.
- Prove one account can alternate between web and native without identity replacement.

### Phase 3 — read-only synchronized messaging

- Conversation/group lists.
- Direct/group message decrypt/projection.
- Attachments receive.
- Receipts/reactions projection.
- History boundaries.

### Phase 4 — native send and mutations

- Direct/group text send.
- Attachments.
- Reactions.
- Read receipts.
- Group membership/history grants.
- Delete/archive semantics.
- Invitation flows.

### Phase 5 — notifications and background behavior

- APNs/FCM registration.
- Exact-message notification routing.
- PIN/Face ID gate.
- Background/foreground lifecycle.
- Multi-device routing and duplicate suppression.

### Phase 6 — TestFlight interoperability acceptance

Run a web <-> native matrix for every shared authority before promotion of any shared-contract changes.

## Non-goals for the preparation phase

This phase does not:

- change the live Firebase schema/rules/Functions;
- enable App Check enforcement;
- change the web runtime version;
- change existing E2EE/message/notification behavior;
- create a new account identity format;
- add voice calling;
- retire the PWA.

