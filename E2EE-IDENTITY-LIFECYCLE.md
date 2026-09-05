# FIDUNIO Stable E2EE Device Identity Lifecycle

**STATUS: PERMANENT ARCHITECTURAL INVARIANT — MANDATORY READ FOR E2EE, AUTH, STORAGE, ACCOUNT-SWITCHING, OR DEVICE-REGISTRY WORK**

## Core invariant

A FIDUNIO account on one browser installation owns one stable E2EE device identity.

```
FIDUNIO account + browser installation
              -> one stable device ID
              -> one stable ECDH private/public keypair
              -> reused across app updates, refreshes, logout/login, reconnects,
                 service-worker updates, and normal account switching
```

An application update MUST NOT rotate, replace, regenerate, recover-overwrite, or silently substitute an existing E2EE device identity.

A new device identity may be created only when BOTH the device identity record and device keypair are genuinely absent for that authenticated account on that installation, or after an explicit user-approved cryptographic reset/revocation operation.

If only one half of the pair exists (device ID without keypair, or keypair without device ID), normal startup must fail safely for E2EE and require an explicit repair/reset path. It must never silently generate the missing half in a way that changes the cryptographic identity behind an existing device ID.

## Ownership

- Resource owner: the E2EE identity lifecycle in the authoritative application runtime.
- Local records: `fidunio-local/meta/e2ee-device-keypair-v1` and `fidunio-local/meta/e2ee-device-identity-v1`, scoped to the authenticated UID through the account-storage owner.
- Cloud registry: `users/{uid}/devices/{deviceId}`.
- Lifecycle trigger: only after authentication determines UID and account-local storage has activated that UID.
- Serialized write path: one in-process identity initialization promise/mutex; one publication promise/mutex. No concurrent key/device generation or duplicate publication race.

## Cloud registration invariant

Publishing an existing device is idempotent. The same `deviceId` updates the same Firestore document (for example `lastSeenAt`) and MUST NOT create a replacement device record merely because the app version changed or the page restarted.

Multiple active device records are allowed only when they represent genuinely different installations/devices for the same account. Historical test/stale device records must not remain active indefinitely because E2EE-v2 fan-out encrypts a message envelope for every active registered device.

Stale device cleanup is an explicit maintenance/reset operation. Normal startup never guesses that another registered device is stale and never revokes another installation automatically.

## Safari tab vs installed Home Screen PWA — September 5, 2026

On iOS/iPadOS, the same physical device may legitimately host more than one FIDUNIO browser installation context. A normal Safari tab and an installed Home Screen PWA can have separate local storage/security state and must therefore be treated as separate installations for local PIN and E2EE identity purposes.

Consequences:

- Safari FIDUNIO and Home Screen FIDUNIO may each have their own local PIN state.
- Safari FIDUNIO and Home Screen FIDUNIO may each have their own E2EE device ID/keypair.
- Seeing two device registrations for one physical iPad is legitimate only if both Safari and the installed PWA are intentionally used as separate FIDUNIO installations.
- For controlled multi-device testing, use the installed Home Screen PWA as the authoritative iPad/iPhone messaging installation and use Safari only for diagnostics/admin/maintenance unless a separate Safari installation is intentionally under test.
- Do not diagnose every additional cloud device record as identity churn until the browser-installation context is known.

This distinction explains why the iPad Safari copy had no local PIN while the installed Home Screen PWA still required its PIN: local security is installation-scoped rather than account-cloud-scoped.

## Race-condition precedent discovered September 4, 2026

The 0.9.5.6 audit found a concrete identity race in `app.js`:

- `initializeFirebaseLayer()` can request `publishMyE2EEKey()` from both the auth-state callback and again after `initFirebase()` resolves.
- `publishMyE2EEKey()` calls `getOrCreateDeviceIdentity()`.
- `getOrCreateDeviceKeyPair()` and `getOrCreateDeviceIdentity()` previously had no shared initialization mutex.
- Two concurrent first-start calls could both observe missing local records and independently create different keys/device IDs before either write completed.

This race can create orphaned historical device IDs and explains why test messages accumulated envelopes for many device identities.

The permanent repair is to serialize keypair creation, device-ID creation, and cloud publication. Duplicate callers must join the same promise rather than generate independently.

## Historical test data policy

The current historical E2EE-v1/v2 messages and old account vaults are development/test data and do not need cryptographic recovery.

After stable identity lifecycle code is validated:

1. perform one deliberate test-data reset;
2. deactivate/remove stale cloud device registrations in a controlled way;
3. clear obsolete local account vault/history/Outbox test data as explicitly intended;
4. allow each account/device installation to create exactly one fresh stable identity;
5. send new baseline messages;
6. verify the device IDs remain unchanged across refresh, close/reopen, logout/login, app-version updates, and reconnects;
7. verify old baseline messages remain decryptable and Sent/Delivered/Read behavior remains correct.

Do not reset first and fix identity generation later. The lifecycle repair must precede cleanup, or the defect can recreate itself immediately.

## Protected behavior

This invariant must be implemented without redesigning validated direct-message transport, E2EE-v2 envelope format, receipt logic, Outbox/offline behavior, Settings lifecycle, PIN/local unlock, responsive UI, or the ongoing runtime-consolidation plan.
