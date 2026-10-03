# FIDUNIO iOS Capacitor Coexistence Architecture

**Status:** Approved preparation baseline — revised 2026-10-03  
**Repository:** `willyros01/hermes`  
**Branches:** `main` = production web/PWA + shared application/backend authority; `ios` = Capacitor iOS integration and TestFlight development.

## Goal

Build an iOS FIDUNIO app using the same migration model proven in Scorecard: preserve the established HTML/CSS/JavaScript application and run it inside a Capacitor iOS shell, while hiding iOS-native security, notification, storage and lifecycle capabilities behind narrow JavaScript-facing platform adapters.

The web/PWA and iOS app are two distributions of the same FIDUNIO application, not two independently rewritten clients. A user signs into the same account from either client and sees the same authorized conversations, groups, messages, attachments, reactions, deletion state, memberships and receipts.

The primary objective is **minimum code drift**.

## Shared-code rule

The established FIDUNIO JavaScript remains the authoritative application logic wherever the platform permits it. In particular, the existing owners for Firebase, E2EE, Outbox, direct/group messaging, attachments, reactions, receipts, disappearing content, invitations, recovery, deletion and conversation projection remain shared.

Do not rewrite those systems in Swift merely because the iOS build is native-packaged.

Platform differences must be isolated behind a small set of JavaScript-facing contracts. Application code calls the same logical operation; the web implementation uses browser APIs while the iOS implementation may call a Capacitor plugin/native bridge.

Conceptual example:

```text
FIDUNIO shared JavaScript
        |
        +-- biometricUnlock()
        +-- secureStore()
        +-- registerNotifications()
        +-- openExternalFile()
        +-- getNetworkState()
        +-- initializeAppProtection()
                |
        +-------+--------+
        |                |
      web              iOS
 browser APIs     Capacitor/native bridge
```

Avoid scattering `if (isIOSNative)` branches throughout `app.js` and feature modules. One resource still has one owner and one bounded platform boundary.

## Authority split

### Shared application/backend authority

These remain canonical across web and iOS:

- Firebase Authentication account/UID.
- Existing JavaScript Firebase service ownership.
- Firestore conversation, direct-message, group, membership, receipt, reaction, invitation, recovery and deletion contracts.
- Firebase Storage encrypted attachment objects and authorization rules.
- Cloud Functions recovery, notification, deletion and administration authority.
- Account E2EE identity/keyId and wrapper/revision state.
- Group E2EE membership/epoch/history-boundary logic.
- Encrypted Outbox semantics and message-state transitions.
- Disappearing-content rules.
- Server-side deletion barriers and authoritative absence.
- Recovery authorization and account-vault cryptographic boundaries.
- Shared HTML/CSS/JavaScript UI unless an iOS-native capability requires a bounded adapter.

### Web/PWA platform implementation

The web distribution owns:

- Service worker/cache lifecycle.
- Web Push subscription representation.
- Browser WebAuthn/passkey UI.
- Browser file/install APIs.
- PWA install state/guidance.
- Browser network-capability reporting.
- reCAPTCHA Enterprise provider when web App Check is activated.

### iOS Capacitor platform implementation

The iOS distribution may substitute native implementations behind the same JavaScript-facing contracts for:

- Face ID/Touch ID via LocalAuthentication.
- Secrets/device-bound storage via Keychain/Secure Enclave as appropriate.
- APNs/FCM device registration and notification-open lifecycle.
- Native file/share/import/export integration.
- Native foreground/background/app lifecycle signals.
- More reliable native network-state reporting where available.
- App Attest/DeviceCheck as the native Firebase App Check provider.
- Other narrowly approved iOS capabilities that cannot be delivered reliably through the browser.

Capacitor is the bridge. Swift/Objective-C should be limited to plugins/native configuration needed for those platform services, not used to duplicate established application logic.

## E2EE coexistence rule

An existing FIDUNIO account has one account encryption identity. The Capacitor app must activate the same account identity and `keyId`; it must never silently create a replacement identity for an existing valid account.

Because the established E2EE implementation remains JavaScript, the preferred migration path is to preserve its data contracts and algorithms exactly and adapt only the platform-specific secure-storage boundary when needed.

A new iOS installation therefore follows the established account lifecycle:

1. Firebase sign-in establishes the UID.
2. UID-local state activates through the same shared application owner.
3. The application determines whether authoritative E2EE identity already exists.
4. Existing recovery/bootstrap authority restores the same account identity when required.
5. iOS-specific device-bound secrets may be stored through the native secure-storage adapter.
6. Current cloud membership, deletion and history authority is re-read before conversation projection.
7. Native notification/App Check/biometric registrations are created for that installation.

The portable `.fidunio` vault remains recovery infrastructure, not the normal web/iOS synchronization transport.

## Branch and synchronization model

- `main` is the live web/PWA and shared-JavaScript/backend authority.
- `ios` begins from `main` and contains the Capacitor/iOS integration needed for TestFlight.
- Shared application changes should normally be authored once and kept equivalent across branches.
- Web fixes accepted on `main` are synchronized into `ios` before the next iOS release candidate.
- Shared fixes discovered during iOS testing should be promoted/reconciled to `main`, then the resulting shared state synchronized back to `ios`.
- iOS-only plugin/configuration/build changes remain on `ios` unless a shared file genuinely needs a platform-neutral change.
- Do not create automatic branch mirroring. Synchronization is controlled and gated.
- GitHub Pages remains `main` only.
- The Rebuild Baseline Security Gate runs on both branches to detect drift/regression in the shared application.

The intended long-term difference between branches should be small and understandable.

## Repository layout target

The Scorecard pattern is the reference:

```text
shared root HTML/CSS/JS          same or intentionally synchronized
platform adapter contracts      shared
web adapter implementations     main/shared
Capacitor configuration         ios branch
iOS plugin/native glue          ios branch
iOS build/TestFlight scripts    ios branch
generated Xcode project         preferably generated during CI/build
```

Do not maintain a hand-edited second copy of the whole web application under an iOS directory.

## Technology baseline

- Existing HTML/CSS/JavaScript application remains primary.
- Capacitor packages the application for iOS.
- Firebase Web SDK/application service layer remains shared unless a specific native substitution is explicitly justified.
- Capacitor/native plugins provide bounded iOS capabilities.
- Swift/Objective-C is permitted only for narrowly scoped native bridges/configuration.
- LocalAuthentication provides direct Face ID/Touch ID behavior for the native app.
- Keychain/Secure Enclave may back native secure-storage adapters.
- UserNotifications/APNs/FCM may back native notification adapters.
- App Attest/DeviceCheck may back native App Check.

## Migration phases

### Phase 0 — preparation

- Freeze/document shared contracts.
- Establish `ios` branch from validated `main`.
- Add branch validation.
- Adopt Capacitor/shared-JS architecture.
- Define platform adapter ownership and branch synchronization rules.
- Confirm Apple/Firebase identifiers before release-pipeline work.

### Phase 1 — Capacitor shell

- Add exact Capacitor dependencies and lockfile.
- Add `capacitor.config.*`.
- Define deterministic list/build step for web assets included in the iOS package.
- Generate the Xcode project from CI/build scripts rather than allowing generated project drift where practical.
- Establish bundle ID and signing/TestFlight pipeline.
- Confirm the unchanged shared app launches inside the Capacitor shell.

### Phase 2 — platform adapter layer

- Define shared JavaScript-facing platform interfaces.
- Keep browser implementations working unchanged on `main`.
- Add iOS implementations for Face ID, secure storage, notifications, lifecycle, files/network as required.
- Add permanent contract tests proving feature code calls the adapter rather than platform APIs directly.

### Phase 3 — E2EE/account interoperability

- Prove the same account/keyId works across PWA and Capacitor app.
- Preserve recovery/revision behavior.
- Confirm no platform adapter duplicates or replaces the E2EE owner.

### Phase 4 — messaging interoperability

- Web send -> iOS receive/decrypt/project.
- iOS send -> web receive/decrypt/project.
- Receipts, reactions, deletes, groups, attachments, history grants and disappearing content.

### Phase 5 — native notification/security acceptance

- Direct Face ID flow without the browser passkey banner.
- APNs/FCM exact-message routing.
- Cold/warm/background/foreground lifecycle.
- Keychain/native storage behavior.
- Native App Check monitoring when activated.

### Phase 6 — TestFlight coexistence acceptance

Run the complete web <-> iOS matrix before treating the iOS build as synchronized with the production web release.

## Non-goals for this preparation phase

This phase does not:

- rewrite FIDUNIO in Swift;
- change the live Firebase schema/rules/Functions;
- enable App Check enforcement;
- change the visible web runtime version;
- change existing E2EE/message/notification behavior;
- create a new account identity format;
- add voice calling;
- retire the PWA.
