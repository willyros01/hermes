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


## iOS 1.1.57 startup/icon repair candidate — 2026-10-03

User-device report on TestFlight 1.1.56 (1): IOS-STARTUP-001 (blocking) remains on the initial “Opening your secure local data” screen; IOS-ICON-001 (branding) shows the Capacitor placeholder icon. Device: iPhone 18 Pro Max, iOS 27.0.1 (App Store Connect tester observation). Expected: cold launch reaches Sign In and home-screen icon uses the established FIDUNIO logo. The initial text alone does not identify a storage failure.

1.1.56 → 1.1.57 applies a native-only Firebase auth initialization without the unused browser popup/redirect resolver, preserving IndexedDB/local/session persistence and web getAuth defaults. Bootstrap owns only its original startup host, reports native load failures/30-second stalls, and retries through a full page reload without clearing storage or bypassing authentication/PIN. Firebase remains the sole service initializer; platform-runtime owns platform selection. The user approved resizing the existing opaque logo to 1024×1024 with macOS sips; build tooling installs it in the generated Xcode icon catalog.

Status: repair candidate, NOT device-accepted. A fresh iOS Simulator cold-start gate must visibly reach Sign In/Email/Password before TestFlight upload. Repository tests and signed upload results must be recorded separately after completion. Exit criteria: required checks green, user updates TestFlight and repeatedly reaches sign-in/correct icon, then existing-account/PIN/E2EE acceptance. No completion credit earned. main remains production 1.1.56; no live Firebase/config/rules/Functions/App Check enforcement changes. Native Face ID and push remain later phases. External tester wrosales@cuberoot-systems.com exists in FIDUNIO External Testing; no build access until Apple beta-review prerequisites are supplied and review succeeds.


## iOS authentication/recovery shared-code boundary — 2026-10-03

### Architecture decision reaffirmed
The iOS migration must continue to preserve the approved Capacitor + shared FIDUNIO JavaScript model. The iOS client does **not** own a separate login, PIN, account-E2EE recovery, identity-manager, or cryptographic implementation. The established web/PWA application code remains the shared authority, with platform differences kept behind bounded platform/runtime integration. Do not respond to IOS-AUTH-002 or IOS-AUTH-003 by rewriting the iOS authentication/recovery flow or duplicating it in Swift/native code.

### Verified shared path
Current repository inspection confirms web and iOS use the same `auth-ui-clean.js` login/recovery orchestration, `firebase.js` account functions after Firebase initialization, six-digit PIN handling, `e2ee-account-runtime.js`, `e2ee-account-recovery-client.js`, `e2ee-account-identity-manager.js`, `e2ee-account-crypto.js`, and the same server recovery callables `startE2EERecoveryV1` / `completeE2EERecoveryV1`. The intended path remains: email/password -> Firebase account authentication -> bind existing account E2EE identity -> PIN/recovery authority when local identity is absent -> restore the same established identity/keyId -> messaging.

### Relevant platform difference under investigation
The principal authentication-path difference currently identified is Firebase Auth initialization. Web uses `getAuth(app)`; native iOS 1.1.57 uses `initializeAuth(app,{persistence:[indexedDBLocalPersistence,browserLocalPersistence,browserSessionPersistence]})`. That native-only initialization was introduced to repair the 1.1.56 Capacitor startup failure. After initialization, both platforms return to the same `signInFidunio()` and shared E2EE/PIN/recovery path. This difference is an investigation lead only; it is **not yet established as the cause** of IOS-AUTH-002 or IOS-AUTH-003.

### Additional investigation boundary
The shared `firebase.js` currently loads Firebase Web SDK 12.18.0 modules dynamically from gstatic at runtime, including Auth and Functions. IOS-AUTH-002 occurs after successful initial authentication when shared recovery invokes the Firebase callable path. Repository inspection has found no FIDUNIO-authored literal `Invalid escape in identifier`, no intentional `eval` / `new Function` in the recovery path, and recovery-key base64url validation excludes backslash characters. The Firebase callable/WKWebView runtime boundary therefore remains a high-value investigation area, but no root cause is claimed yet.

### Interpretation of current device evidence
The user's same credentials work in the web app, and the first TestFlight attempt reaches Recover Secure Messaging, demonstrating successful authentication before recovery failure. IOS-AUTH-003 must therefore not be documented or treated as proof that the password itself is invalid. The current sign-in handler encloses Firebase sign-in and later E2EE binding/entry in one catch boundary, so a post-authentication failure can be surfaced on the sign-in UI. Persisted native auth/session behavior after IOS-AUTH-002 remains under investigation.

### Protected repair direction
Investigation and any later proposed correction must start at the smallest iOS-specific/platform boundary and preserve the working shared web/PWA login, PIN, recovery authority, E2EE identity/keyId and cryptographic owners. No broad shared-code rewrite, replacement identity, weakened recovery, password reset workaround, production Firebase/App Check change, or native duplicate implementation is acceptable without separate architecture review and explicit authorization. At this checkpoint, documentation only is authorized; corrective application code remains unchanged.


## 1.1.59 adapter checkpoint

Platform-specific Firebase bootstrap now belongs to firebase-platform-adapter.js. firebase.js remains the shared Firebase service owner and does not branch on the native runtime. The shared authentication, PIN, recovery, and E2EE owners are unchanged.


## FIDUNIO 1.1.59 — pre-emptive startup/auth/recovery transition hardening — 2026-10-03

This checkpoint supersedes the earlier 1.1.58 implementation and extends the 1.1.59 adapter correction under the Hermes minimum-drift rules. The user explicitly authorized pre-emptive code changes so TestFlight acceptance is not forced to discover startup, login and recovery failures one screen at a time.

Architecture: `firebase-platform-adapter.js` is the bounded owner of web-vs-native Firebase bootstrap policy. Shared `firebase.js` no longer branches on iOS. Web remains Firebase JS 12.18.0 + `getAuth(app)`; iOS uses Firebase JS 12.19.0 + `initializeAuth(app,{persistence:browserLocalPersistence})` with no popup/redirect resolver. PIN, account E2EE, recovery callables, identity/keyId, Firestore schemas and cryptographic algorithms remain shared and unchanged.

Transition hardening: `auth-ui-clean.js` now separates Firebase credential authentication from post-auth E2EE/application activation; separates successful PIN recovery from subsequent `startApp()`; separates successful invitation redemption from subsequent secure startup; and makes application startup retry-safe. `appStarted` is not set until the complete `app.js` module graph imports successfully, and a failed import clears the in-flight startup promise so Retry Opening FIDUNIO can genuinely retry. Once Firebase authentication succeeds, a later E2EE/startup failure is explicitly reported as an authenticated transition failure and is not relabeled as invalid credentials. Once recovery succeeds, a later parser/startup failure is not relabeled as failed recovery. Once a one-time invitation creates the account, a later secure-startup failure retries the authenticated transition rather than redeeming the invitation again.

IOS-AUTH-002 evidence correction: the 1.1.57 recovery button catch enclosed both `recoverAccountE2EE()` and the later `startApp()` dynamic import. Therefore the observed JavaScriptCore `Invalid escape in identifier: '\\'` message did not prove the cryptographic recovery operation itself failed; it could have been emitted by post-recovery application startup. The defects remain open until real-device proof.

Pre-upload gates now additionally require: the Firebase platform-adapter contract; no native branch/persistence policy inside shared `firebase.js`; separate retry-safe auth/recovery/enrollment/startup boundaries; Chromium and WebKit parsing of the post-auth `app.js` graph; and a WebKit P-256 private CryptoKey -> IndexedDB -> read-back -> ECDH-use round trip matching FIDUNIO local E2EE storage. The complete existing recovery/crypto/Firestore/emulator baseline remains required. No production Firebase/App Check enforcement or `main` branch change is included.

Status: IOS-AUTH-002 and IOS-AUTH-003 are OPEN / IMPLEMENTED CANDIDATE, not device-accepted. Required workflows must pass on the exact final release-marker commit before upload. Device exit criteria remain first sign-in -> missing-local recovery -> correct existing PIN -> same identity/messages -> close/restart -> retained authenticated session -> correct secure unlock/startup without credential, parser or recovery misclassification.
