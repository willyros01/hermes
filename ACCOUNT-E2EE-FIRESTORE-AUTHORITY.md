# FIDUNIO Account E2EE and Firestore Authority Architecture

**STATUS: BINDING ARCHITECTURE — UPDATED SEPTEMBER 5, 2026**

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
8. Forgotten-password recovery uses the narrowly scoped Firebase/Google recovery authority.
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

The server completion path additionally requires approved supplemental recovery verification. App Check is an abuse-defense layer, not a substitute for Auth/PIN/recovery authorization.

The current Cloud Functions scaffold deliberately leaves completion fail-closed until that supplemental verifier is implemented and reviewed.

## Firestore Security Rules status

Repository `firestore.rules` now contains the exact account-E2EE client rules and has passed the Firebase Local Emulator Suite security gate. The current matrix is 42 assertions, including rejection of generic recovery metadata and JWK `ext`/`key_ops`.

This repository validation does **not** mean the rules are deployed to the live Firebase project.

Client permissions are intentionally narrow:

- private identity: owner get, exact create, exact normal-wrapper revision update; no list/delete/cross-account access;
- public key: registered-user get/list, owner create, no ordinary update/delete;
- server recovery collections: no browser-client allow rule;
- legacy device rules remain temporarily for migration compatibility.

Admin SDK bypasses client rules; recovery server safety therefore depends on IAM, narrow functions, App Check, retry policy, secret binding, and reviewed server code.

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
- central Firebase E2EE adapter CI passes;
- rebuild branch security gate re-runs all of the above server/rules tests.

## Remaining pre-production gates

1. keep the rebuild branch security gate green after every recovery/scaffold change;
2. implement and review the supplemental recovery verifier;
3. configure Firebase Cloud Functions, Secret Manager, App Check and least-privilege IAM;
4. explicitly deploy/verify Firestore rules and recovery functions only after project configuration is approved;
5. wire the validated account E2EE manager into the normal auth/PIN lifecycle;
6. build Firestore-authoritative account-key messaging/cache/Outbox;
7. retire legacy per-device envelope ownership and service-worker source transforms;
8. revalidate iPhone/iPad/PWA/offline/account-switch/reinstall/recovery behavior.

## Recovery rollback invariant

**Never remove the last usable recovery path before its replacement is proven. Never respond to failed unlock, rewrap, cache loss, or recovery by generating a new account identity.**
