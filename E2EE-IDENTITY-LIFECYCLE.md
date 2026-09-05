# FIDUNIO E2EE Identity Lifecycle — Historical Device Model and Supersession Notice

**STATUS: HISTORICAL/TRANSITION REFERENCE — DEVICE-BASED E2EE INVARIANT SUPERSEDED SEPTEMBER 5, 2026**

## Mandatory supersession notice

The earlier rule in this document — one E2EE identity/keypair per authenticated account + browser installation — is **no longer the target FIDUNIO architecture**.

The binding replacement is documented in `ACCOUNT-E2EE-FIRESTORE-AUTHORITY.md`:

```
ONE ACCOUNT = ONE DURABLE E2EE IDENTITY
FIRESTORE = AUTHORITATIVE ENCRYPTED CONVERSATION STORE
LOCAL STORAGE = REBUILDABLE CACHE
DEVICE ID = INFORMATIONAL ONLY FOR NOW
```

Do not implement new messaging/E2EE work using the old per-device identity/envelope model. This file is retained because it records important race conditions, cleanup history, and existing legacy code that must be migrated safely rather than deleted blindly.

## Former device-based invariant — historical only

The previous architecture assigned one stable E2EE device identity to each account/browser installation:

```
FIDUNIO account + browser installation
              -> one stable device ID
              -> one stable ECDH private/public keypair
```

That model exposed a major durability gap: Safari and an installed Home Screen PWA can have separate local storage, and removing/reinstalling an installation or losing local storage can remove the private cryptographic material required to read cloud history. Firestore could still contain the encrypted conversation while the user could no longer decrypt it from a different installation.

This is why the device-based identity model was superseded.

## New device-ID policy

Device ID may still be generated/collected as an informational variable for possible future endpoint management, diagnostics, revocation, or auditing. For now it must not be authoritative for:

- E2EE key ownership;
- encryption routing;
- message ownership;
- historical decryptability;
- conversation continuity;
- normal message delivery.

Future push notifications should use FCM registration tokens associated with the authenticated UID rather than requiring FIDUNIO device ID as the notification address.

## Safari tab vs installed Home Screen PWA — retained finding

On iOS/iPadOS, a normal Safari context and an installed Home Screen PWA may have separate local storage/security state. This remains an important local-cache/PIN fact even though it no longer justifies separate durable E2EE identities.

Consequences under the new architecture:

- Safari and Home Screen PWA may still have separate installation-local PIN/cache state.
- Neither local context should own the user's durable conversation history.
- Loss of either local context should result in cache reconstruction after authentication/recovery, not permanent loss of conversation access.
- A device ID may differ between contexts but must not control decryptability.

## Race-condition precedent discovered September 4, 2026

The 0.9.5.6 audit found a concrete identity race in the legacy implementation:

- `initializeFirebaseLayer()` could request `publishMyE2EEKey()` from both the auth-state callback and again after `initFirebase()` resolved.
- `publishMyE2EEKey()` called `getOrCreateDeviceIdentity()`.
- `getOrCreateDeviceKeyPair()` and `getOrCreateDeviceIdentity()` previously had no shared initialization mutex.
- Two concurrent first-start calls could both observe missing local records and independently create different keys/device IDs before either write completed.

0.9.5.7 serialized legacy keypair/device-ID creation and cloud publication. That repair remains useful historical evidence for the general coding rule that cryptographic identity creation/recovery must have one owner and one serialized write path.

## Legacy implementation ownership

Existing code may still contain:

- local `e2ee-device-keypair-v1` / `e2ee-device-identity-v1` records;
- `users/{uid}/devices/{deviceId}` registrations;
- per-device E2EE-v2 envelopes;
- service-worker source transforms that inject per-device E2EE behavior.

These are migration concerns, not the target architecture. Follow `RUNTIME-CONSOLIDATION-PLAN.md` and `RUNTIME-TRANSFORM-INVENTORY.md`; do not remove legacy behavior until the replacement account-authoritative path exists and is validated.

## Historical validation/reset context

0.9.5.7 successfully stabilized the old per-installation identity during testing. Historical test E2EE data and stale device registrations were subsequently treated as disposable test data during cleanup. This validation proved the race repair but does not make the old ownership model the desired production architecture.

## Protected behavior during migration

Changing identity ownership must not casually regress validated user behavior: direct messaging, Sent/Delivered/Read, offline Outbox/reconnect, Settings lifecycle, PIN/local unlock, responsive iPhone/iPad UI, Back behavior, and account isolation all require revalidation.

For current architecture, always read `ACCOUNT-E2EE-FIRESTORE-AUTHORITY.md` first.
