# FIDUNIO iOS — Capacitor workspace

This directory is the iOS-specific workspace for the FIDUNIO Capacitor distribution.

## Branch authority

- Develop iOS packaging/native integration on the repository `ios` branch.
- `main` remains the production web/PWA and shared application/Firebase authority.
- The established root HTML/CSS/JavaScript application is the primary codebase for both web and iOS.
- Keep shared JavaScript synchronized with `main`; do not fork messaging, E2EE, Outbox, groups, attachments, recovery or deletion into separate Swift implementations.
- Do not create a second Firebase backend or alternate message schema.

## Technology target

- Capacitor packages the existing FIDUNIO web application for iOS.
- JavaScript remains the application/business/security logic wherever practical.
- Native Swift/Objective-C is limited to narrow Capacitor bridges and required iOS configuration.
- iOS-only capabilities are hidden behind JavaScript-facing platform adapters:
  - LocalAuthentication for Face ID/Touch ID.
  - Keychain/Secure Enclave where native secure storage is required.
  - APNs/FCM native notification lifecycle.
  - Native file/share/lifecycle/network integrations where they improve reliability.
  - App Attest/DeviceCheck for native Firebase App Check when activated.

The goal is the same model that has worked well for Scorecard: **one web codebase, minimal branch drift, iOS-specific native integration behind a thin boundary.**

## Current phase

Phase 0/early Phase 1 preparation only.

Before TestFlight work, follow `../IOS-MIGRATION-CHECKLIST.md`: pin Capacitor versions, define the explicit iOS web-asset allow-list, add the Capacitor config/build pipeline, then establish Apple/Firebase identifiers and signing.
