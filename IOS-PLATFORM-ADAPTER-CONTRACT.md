# FIDUNIO iOS Platform Adapter Contract

**Status:** Architecture contract — 2026-10-03

## Purpose

FIDUNIO uses one shared HTML/CSS/JavaScript application for the web/PWA and Capacitor iOS distributions. Platform-specific behavior must be hidden behind a small JavaScript-facing adapter boundary so feature owners do not fork by platform.

This document defines the initial contract. It does not yet authorize implementation of every adapter.

## Core rule

Feature owners call a platform service by capability. They do not directly decide whether they are running in Safari, a PWA or Capacitor unless the platform service itself owns that decision.

Preferred shape:

```js
await platform.biometricUnlock(...)
await platform.secureStore.get(...)
await platform.secureStore.set(...)
await platform.notifications.register(...)
await platform.notifications.consumeLaunchIntent(...)
await platform.files.pickRecoveryFile(...)
await platform.files.saveRecoveryFile(...)
await platform.network.getState(...)
await platform.appProtection.initialize(...)
```

The exact names may be refined during implementation, but there must be one bounded owner for each capability.

## Initial capability boundaries

### biometricUnlock

**Shared caller:** local-security/authentication owner.

**Web implementation:** existing WebAuthn credential flow.

**iOS implementation:** Capacitor bridge to LocalAuthentication.

**Invariant:** successful platform verification only releases the existing FIDUNIO unlock owner. It does not become a second PIN/E2EE/authentication authority.

### secureStore

**Shared callers:** only owners explicitly approved to persist device-bound secrets.

**Web implementation:** existing browser-owned secure/local persistence where applicable.

**iOS implementation:** Keychain/Secure Enclave-backed plugin where appropriate.

**Invariant:** account/application state does not move wholesale into Keychain. One persisted resource still has one owner.

### notifications

**Shared callers:** existing notification registration/routing owners.

**Web implementation:** Web Push/service-worker path.

**iOS implementation:** APNs/FCM + Capacitor/native notification lifecycle.

**Invariant:** the higher-level route remains opaque conversation/message identifiers and still passes through FIDUNIO authentication/app-ready gates before protected content renders.

### files

**Shared callers:** account-vault/import-export and attachment owners.

**Web implementation:** browser picker/download/share capabilities.

**iOS implementation:** Capacitor/native Files/Share document interaction.

**Invariant:** file selection/presentation changes do not bypass vault validation, attachment encryption or existing data owners.

### network

**Shared callers:** large-attachment policy and other explicitly approved network-sensitive features.

**Web implementation:** current browser network capability reporting and fail-closed unknown behavior.

**iOS implementation:** native network state if a reliable plugin/native bridge is selected.

**Invariant:** platform reporting supplies evidence to the existing policy owner; it does not independently start/pause/send an attachment.

### lifecycle

**Shared callers:** one application activation owner.

**Web implementation:** existing pageshow/visibility/online/service-worker signals.

**iOS implementation:** Capacitor App/native foreground/background signals.

**Invariant:** platform events signal the established activation owner and never independently route, render or replace subscriptions.

### appProtection

**Shared caller:** central Firebase/application bootstrap only.

**Web implementation:** Firebase App Check with reCAPTCHA Enterprise when activated.

**iOS implementation:** Firebase App Check with App Attest/DeviceCheck when activated.

**Invariant:** there is still one Firebase/app initialization authority. App Check provider selection is platform-specific; enforcement remains a backend rollout decision.

## Prohibited pattern

Do not spread code like this through feature modules:

```js
if (isIOSNative) {
  // alternate feature implementation
} else {
  // web feature implementation
}
```

Instead, feature code remains platform-neutral and delegates only the necessary capability.

## Branch rule

The adapter interface and platform-neutral web implementation are shared application contracts and should be kept synchronized between `main` and `ios`.

iOS-only Capacitor plugin/native bridge implementations remain on `ios` until/unless a platform-neutral shared change is needed.

A shared adapter-contract change discovered during iOS work must be reconciled to `main`, validated there, and then synchronized back to `ios`.

## Acceptance rule

For every adapter introduced:

1. prove the existing web implementation still passes its current tests;
2. test the iOS implementation independently;
3. run the relevant FIDUNIO feature regression through the same high-level function contract;
4. run the full baseline on the exact final branch head;
5. for shared behavior, run web <-> iOS coexistence acceptance before declaring parity.


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


## Firebase bootstrap adapter correction — FIDUNIO 1.1.59

The rejected initial 1.1.58 candidate placed native Firebase bootstrap decisions directly in the shared Firebase owner. That pattern is superseded. `firebase-platform-adapter.js` now owns platform-specific Firebase SDK selection, Auth construction, and App Check provider construction. `firebase.js` remains the single Firebase service owner but contains no native-runtime branch.

Web remains Firebase 12.18.0 with `getAuth(app)` and the existing web App Check provider. iOS is isolated behind the adapter with Firebase 12.19.0 and `initializeAuth(app,{persistence:browserLocalPersistence})`, without the browser popup/redirect resolver or web App Check provider. This adapter does not own account lifecycle, PIN, E2EE, recovery, Firestore, Functions, Storage, messaging, or UI state.

The iOS browser release gate now also imports the post-auth `app.js` graph in real WebKit. This closes the prior test gap where the suite stopped at Sign In and therefore could not detect a JavaScriptCore parser failure after recovery handed control to `startApp()`.


## FIDUNIO 1.1.59 — pre-emptive startup/auth/recovery transition hardening — 2026-10-03

This checkpoint supersedes the earlier 1.1.58 implementation and extends the 1.1.59 adapter correction under the Hermes minimum-drift rules. The user explicitly authorized pre-emptive code changes so TestFlight acceptance is not forced to discover startup, login and recovery failures one screen at a time.

Architecture: `firebase-platform-adapter.js` is the bounded owner of web-vs-native Firebase bootstrap policy. Shared `firebase.js` no longer branches on iOS. Web remains Firebase JS 12.18.0 + `getAuth(app)`; iOS uses Firebase JS 12.19.0 + `initializeAuth(app,{persistence:browserLocalPersistence})` with no popup/redirect resolver. PIN, account E2EE, recovery callables, identity/keyId, Firestore schemas and cryptographic algorithms remain shared and unchanged.

Transition hardening: `auth-ui-clean.js` now separates Firebase credential authentication from post-auth E2EE/application activation; separates successful PIN recovery from subsequent `startApp()`; separates successful invitation redemption from subsequent secure startup; and makes application startup retry-safe. `appStarted` is not set until the complete `app.js` module graph imports successfully, and a failed import clears the in-flight startup promise so Retry Opening FIDUNIO can genuinely retry. Once Firebase authentication succeeds, a later E2EE/startup failure is explicitly reported as an authenticated transition failure and is not relabeled as invalid credentials. Once recovery succeeds, a later parser/startup failure is not relabeled as failed recovery. Once a one-time invitation creates the account, a later secure-startup failure retries the authenticated transition rather than redeeming the invitation again.

IOS-AUTH-002 evidence correction: the 1.1.57 recovery button catch enclosed both `recoverAccountE2EE()` and the later `startApp()` dynamic import. Therefore the observed JavaScriptCore `Invalid escape in identifier: '\\'` message did not prove the cryptographic recovery operation itself failed; it could have been emitted by post-recovery application startup. The defects remain open until real-device proof.

Pre-upload gates now additionally require: the Firebase platform-adapter contract; no native branch/persistence policy inside shared `firebase.js`; separate retry-safe auth/recovery/enrollment/startup boundaries; Chromium and WebKit parsing of the post-auth `app.js` graph; and a WebKit P-256 private CryptoKey -> IndexedDB -> read-back -> ECDH-use round trip matching FIDUNIO local E2EE storage. The complete existing recovery/crypto/Firestore/emulator baseline remains required. No production Firebase/App Check enforcement or `main` branch change is included.

Status: IOS-AUTH-002 and IOS-AUTH-003 are OPEN / IMPLEMENTED CANDIDATE, not device-accepted. Required workflows must pass on the exact final release-marker commit before upload. Device exit criteria remain first sign-in -> missing-local recovery -> correct existing PIN -> same identity/messages -> close/restart -> retained authenticated session -> correct secure unlock/startup without credential, parser or recovery misclassification.
