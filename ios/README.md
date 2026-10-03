# FIDUNIO Native iOS

This directory is the native iOS client workspace for FIDUNIO.

## Branch authority

- Develop native iOS code on the repository `ios` branch.
- `main` remains the production web/PWA and shared Firebase/backend authority.
- This client must interoperate with the same Firebase UID/account, message/group/storage contracts and account E2EE identity used by the web client.
- Do not copy browser-local state as account authority.
- Do not create a second Firebase backend or alternate message schema.

## Technology target

- Swift + SwiftUI.
- Firebase Apple SDKs.
- CryptoKit / Security / Keychain.
- LocalAuthentication for Face ID/Touch ID.
- UserNotifications + Firebase Messaging.
- App Attest/DeviceCheck for native App Check when activated.

FIDUNIO native iOS is not planned as a Capacitor or webview wrapper.

## Current phase

Phase 0 only: architecture, branch safety and CI preparation.

No Xcode project, bundle identifier, Apple signing, Firebase iOS registration or TestFlight upload should be created until the Phase 1 prerequisites in `../IOS-MIGRATION-CHECKLIST.md` are explicitly satisfied.
