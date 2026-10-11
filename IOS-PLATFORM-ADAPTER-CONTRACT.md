## 2026-10-11 — Mandatory ios/main-3 functional equivalence

**Functional equivalence dictates the code written on `main-3`. Identical source code is not the acceptance criterion.**

After the user-confirmed completion of the current sync, every change on `ios` must be assessed and implemented on `main-3` in the same work item so both versions deliver equivalent functionality. This includes features, fixes, security/privacy behavior, state transitions, error handling and lifecycle behavior. Do not defer the web implementation until a later bulk sync.

Use the existing abstraction/platform-adapter layer: preserve shared feature owners and contracts, and implement browser and native capabilities behind their bounded adapters. The implementation on `main-3` is selected by the required functional outcome, not by copying the iOS patch. Different code or platform presentation is acceptable when it delivers the same operation, result and security guarantees. Do not scatter platform conditionals or create duplicate feature/state/Firebase/E2EE owners.

Native packaging/signing/plugin mechanics may remain iOS-specific, but “native-only” is not an exemption for user-facing behavior. Record the corresponding web behavior or a reasoned no-functional-impact assessment. An unavailable browser capability is an explicit unresolved parity gap; it is not proof of equivalence.

For every iOS change:
- Record the required behavior and the corresponding `main-3` implementation/adapter boundary.
- Preserve one-resource/one-owner serialization, deterministic lifecycle results, large fonts and high contrast.
- Validate the changed functionality and neighboring regressions on both exact branch revisions, including relevant offline/failure/security paths.
- Record branch commits, tests and remaining device checks in the applicable checklist and cumulative `hermes-memory.txt`.
- Do not close the change or claim functional equivalence from source presence, a matching diff, or a green build alone. Device-dependent claims require applicable real-device evidence.

`main` remains the protected production web/shared-backend authority. This rule does not authorize blind merges, production promotion, live Firebase changes or a new release. It supersedes older workflow wording that allowed iOS behavior changes to accumulate before web reconciliation.

**Checkpoint:** the user reported the sync complete on 2026-10-11. Independent functional-equivalence audit remains pending; this documentation update does not certify parity.

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
