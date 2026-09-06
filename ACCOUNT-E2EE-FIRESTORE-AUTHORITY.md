# FIDUNIO Account E2EE and Firestore Authority Architecture

**STATUS: BINDING ARCHITECTURE — UPDATED SEPTEMBER 6, 2026**

**MANDATORY READ before messaging, E2EE, Firestore synchronization, local cache, account switching, recovery, device registry, or push-notification work.**

This architecture supersedes the historical installation/device-owned E2EE model.

## Core invariants

1. Firebase Auth UID is the durable FIDUNIO account identifier.
2. **ONE ACCOUNT = ONE DURABLE E2EE IDENTITY.**
3. Firestore is authoritative for durable encrypted conversations/messages.
4. Local IndexedDB/storage is a UID-scoped rebuildable cache plus temporary Outbox.
5. Device ID may be collected but is informational only.
6. Password change and legitimate account recovery preserve the same E2EE keyId/private identity.
7. Normal durable-key unlock requires password + the exact existing six-digit FIDUNIO PIN.
8. Forgotten-password recovery uses exactly the authenticated account, six-digit account-E2EE PIN, and narrowly scoped Firebase/Google server recovery authority.
9. No failed unlock/recovery path may silently generate a replacement identity.
10. `ONE RESOURCE -> ONE OWNER -> ONE PREDEFINED AREA -> ONE SERIALIZED WRITE PATH`.

## Durable account identity

FIDUNIO generates one random ECDH P-256 account key pair. UID is never used as private-key material. The private PKCS#8 exists plaintext only transiently during controlled wrapping/import operations. Ordinary runtime uses a non-extractable private CryptoKey.

The stable `keyId` is generated independently and remains unchanged across normal unlock, password/PIN rewrap, reinstall recovery, and provider-assisted recovery.

## Exact Firestore split

Private identity:

```text
users/{uid}/e2ee/identity
```

Public correspondent key:

```text
e2eePublicKeys/{uid}
```

Server-only recovery state:

```text
recoverySessions/{sessionId}
e2eeRecoveryState/{uid}
```

### Exact private identity v1

```text
schemaVersion: 1
identityVersion: 1
keyId
keyAlgorithm: "ECDH-P256"
normalWrapper
recoveryWrapper
state: "ACTIVE"
revision
createdAt
updatedAt
```

No additional top-level field is allowed by the validated client rules.

### Exact normal wrapper v1

```text
version: 1
ciphertext
salt
iv
kdf: "PBKDF2-HMAC-SHA256"
iterations: 600000
wrappingAlgorithm: "AES-256-GCM"
```

### Exact recovery wrapper v1

```text
version: 1
ciphertext
iv
wrappedRecoveryKey
wrappingAlgorithm: "AES-256-GCM"
recoveryAuthorityVersion: 1
recoveryKeyIv
recoveryKeyWrappingAlgorithm: "HMAC-SHA256+A256GCM"
```

There is no generic recovery `metadata` field.

### Exact public identity v1

```text
uid
schemaVersion: 1
identityVersion: 1
keyId
keyAlgorithm: "ECDH-P256"
publicJwk
state: "ACTIVE"
createdAt
updatedAt
```

The exact public JWK fields are only:

```text
kty: "EC"
crv: "P-256"
x
y
```

No private `d`, `ext`, `key_ops`, `alg`, `use`, or other JWK property is allowed.

Firestore must never contain plaintext password, plaintext PIN, plaintext private key, plaintext RUK, derived normal/recovery wrapping key, or the recovery master secret.

## Normal wrapper cryptography

The browser crypto format is frozen by `E2EE-V1-CRYPTO-FORMAT.md` and browser tests:

- PBKDF2-HMAC-SHA-256;
- 600,000 iterations;
- random 16-byte salt;
- AES-256-GCM;
- random 12-byte IV;
- exact password string + exact six ASCII digit PIN in canonical JSON KDF context;
- exact versioned AES-GCM AAD;
- base64url without padding for serialized binary material.

Password/PIN rewrap decrypts/imports the same identity, creates and locally verifies a new normal wrapper, then performs a revision-checked Firestore update. It does not change public key, keyId, recovery wrapper, or identity version.

## Recovery escrow construction

Recovery uses a random 256-bit per-account Recovery Unlock Key (RUK):

1. browser encrypts the same private PKCS#8 under RUK with AES-256-GCM;
2. authenticated recovery enrollment sends transient RUK + keyId + PIN to the server callable;
3. server derives a RUK-wrapping key from the 32-byte Secret Manager master secret with HMAC-SHA-256 over the exact canonical UID/keyId/PIN context;
4. server encrypts the RUK with AES-256-GCM and its own fresh 12-byte IV;
5. Firestore stores only the client recovery ciphertext and explicit protected-RUK fields;
6. browser/server discard transient plaintext RUK/derived-key material as soon as practical.

The exact server KDF context, AAD, serialized fields and limits are binding in `E2EE-RECOVERY-PROTOCOL.md` and `functions/recovery/e2ee-recovery-server-crypto.mjs`.

## Recovery session boundary

Forgotten-password recovery is not ordinary unlock. It uses a 10-minute server-owned session bound to UID, keyId and identity revision. The existing six-digit PIN is cryptographically required. Five PIN failures lock a session; ten consecutive account-level failures cause an account recovery hold. A new session does not reset the account counter.

There is **no supplemental recovery verifier or fourth factor**. App Check is an abuse-defense layer, not a substitute for Auth/PIN/server recovery authority, and its enforcement remains OFF during current staging.

Recovery completion follows one serialized server path:

```text
PENDING
 -> VERIFYING        // Firestore transaction reserves the one active PIN attempt
 -> PENDING          // wrong PIN below session limit
 -> LOCKED           // wrong PIN at session limit
 -> CONSUMED         // correct PIN; account failure counter reset
```

The `PENDING -> VERIFYING` transition occurs before PIN/master-secret cryptography so concurrent completion calls cannot perform parallel online PIN guesses against the same recovery session. A stranded `VERIFYING` session fails closed.

## Firestore Security Rules status

Repository `firestore.rules` contains the exact account-E2EE client rules and passes the Firebase Local Emulator Suite security gate. The account identity matrix remains 42 assertions, including rejection of generic recovery metadata and JWK `ext`/`key_ops`.

The reviewed rules were deployed to the live Firebase project on September 6, 2026 and verified. Active ruleset:

```text
projects/fidunio-fef13/rulesets/52ea515e-359f-453f-8822-3c0f6ef2659a
```

Repository validation and live deployment remain distinct concepts: future rule changes still require explicit review/test/pin/deploy/verify rather than assuming CI changes production.

Client permissions are intentionally narrow:

- private identity: owner get, exact create, exact normal-wrapper revision update; no list/delete/cross-account access;
- public key: registered-user get/list, owner create, no ordinary update/delete;
- server recovery collections: no browser-client allow rule;
- legacy device rules remain temporarily for migration compatibility.

Admin SDK bypasses client rules; recovery server safety therefore depends on dedicated runtime IAM, narrow functions, retry/session policy, secret binding, and reviewed server code. App Check becomes an additional callable abuse-defense only after its legitimate client traffic is proven and enforcement is deliberately enabled.

## Sole account-E2EE owner

`e2ee-account-identity-manager.js` is the account identity state-machine owner. The target lifecycle is:

```text
SIGNED_OUT
 -> AUTHENTICATED
 -> IDENTITY_LOOKUP
      -> CREATE_REQUIRED
      -> NORMAL_UNLOCK_REQUIRED
      -> RECOVERY_AUTHORIZATION_REQUIRED
 -> CRYPTO_OPERATION
 -> E2EE_READY
 -> FIRESTORE_SYNC
 -> MESSAGING_READY
```

Duplicate lifecycle triggers join the serialized owner path. Sign-out invalidates in-flight manager operations so stale work cannot repopulate runtime identity.

## Firebase runtime authority

`firebase.js` is the sole runtime Firebase SDK/service owner, including App Check. The rejected prototype-era `firebase-app-check.js` second owner was removed on September 6, 2026. Central initialization now establishes the one Firebase app, App Check, Auth and Firestore under one lifecycle, and the runtime authority gate enforces this single-owner rule.

App Check enforcement remains OFF until legitimate Safari/iPhone/iPad/Home Screen PWA traffic is proven with the repaired client.

## Identity creation

1. authenticated UID is established;
2. authoritative private/public state is checked;
3. existing or partial durable state prevents silent replacement;
4. if truly absent, generate one account key pair, stable keyId, normal wrapper, random RUK and recovery ciphertext;
5. recovery service protects the RUK;
6. private + public documents are atomically established at revision 1;
7. a race winner becomes authoritative; losing candidate material is discarded.

No crypto generation occurs inside a retriable Firestore transaction callback.

## Firestore authority and offline behavior

Firestore owns durable encrypted history. Local cache is disposable/rebuildable. Outbox owns pending offline sends only.

```text
Firestore = durable encrypted authority
Local cache = UID-scoped offline copy
Outbox = temporary pending-send authority
```

On reconnect, stable message IDs and serialized retry prevent duplicate delivery. Missing local storage is a cache miss, not history loss or identity loss. Firestore SDK persistence may assist but may not become a competing Outbox owner.

## Device ID and push

Device ID is informational only and must not determine E2EE key ownership, message ownership, decryptability, or ordinary delivery. Future FCM registration tokens are UID-associated notification endpoints and remain separate from E2EE identity.

## Runtime migration constraint

The current user-facing runtime still contains legacy per-device envelope behavior and service-worker source transforms. Those remain migration material only. They must be replaced in bounded, validated increments before deletion so validated receipts, offline behavior, group safety gates and responsive UI are not lost.

## Validated gates completed

- browser E2EE crypto tests passed on iPad Safari;
- account identity manager browser gate passed 24/24 on iPad Safari;
- Firestore account-E2EE emulator gate passed exact 42-assertion matrix;
- recovery server crypto/session/callable/persistence CI passes;
- recovery completion source implements the final three-component architecture with serialized `VERIFYING` reservation;
- central Firebase E2EE adapter CI passes;
- App Check central-owner integration and runtime authority gates pass;
- full `Rebuild Baseline Security Gate` run #318 (`34011735357`) passed on commit `f7d764df29fd936d2893645813257ea19deda6c1` after the final strengthened Functions scaffold guard.

## Remaining pre-production gates

1. keep the rebuild branch security gate green after each consequential recovery/runtime change;
2. verify the dedicated recovery runtime service account has only the minimum required Firestore data-access IAM;
3. deploy and verify only the reviewed Recovery Functions to `us-central1` using the dedicated recovery service account and existing Secret Manager secret;
4. keep App Check enforcement OFF during controlled recovery/client validation;
5. prove recovery restores the same durable identity without replacement;
6. wire the validated account E2EE manager into the normal auth/PIN lifecycle;
7. build Firestore-authoritative account-key messaging/cache/Outbox;
8. retire legacy per-device envelope ownership and service-worker source transforms only after replacement passes;
9. revalidate iPhone/iPad/PWA/offline/account-switch/reinstall/recovery behavior;
10. only after legitimate App Check traffic is proven should enforcement be considered.

## Recovery rollback invariant

**Never remove the last usable recovery path before its replacement is proven. Never respond to failed unlock, rewrap, cache loss, or recovery by generating a new account identity.**

## Runtime implementation checkpoint — September 6, 2026

The rebuild branch now wires account-authoritative enrollment/unlock/recovery and e2ee:3 direct-message send/receive. The raw runtime is authoritative and the service worker no longer performs semantic source transforms. All repository security gates are green. Live cutover remains blocked until the first real authenticated account proves READY, stable-keyId recovery, history preservation, and two-device messaging/Outbox behavior.

## 0.9.7.0–0.9.7.4 attachment send checkpoint — repository validated

Builds 0.9.7.0 through 0.9.7.4 establish one attachment send owner and wire photo, file, audio and video selection/capture through bounded local AES-256-GCM chunk encryption, encrypted Outbox staging, ciphertext-only Firebase Storage upload through `firebase.js`, and the existing direct/group E2EE message commit path. Attachment keys travel only inside E2EE message ciphertext. Size limits are photo 12 MiB, file 20 MiB, audio 25 MiB, video 50 MiB. Storage client delete is denied; disappearing attachment deletion remains reserved for the purge owner in 0.9.7.8. Full Rebuild Baseline Security Gate `34063327957` SUCCESS. No live Firebase or htest deployment occurred. Runtime version is 0.9.7.4. Next build is 0.9.7.5 receive/decrypt/display/play.
