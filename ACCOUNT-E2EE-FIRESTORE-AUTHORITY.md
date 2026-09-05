# FIDUNIO Account E2EE and Firestore Authority Architecture

**STATUS: BINDING ARCHITECTURAL DIRECTION — SEPTEMBER 5, 2026**

**MANDATORY READ before messaging, E2EE, Firestore synchronization, local-cache, device-registry, account-switching, account recovery, or push-notification work.**

This document supersedes the earlier design in which conversation continuity and E2EE identity depended on a browser/PWA installation and its local device identity.

## Core invariants

1. Firebase Auth UID is the durable FIDUNIO user identifier.
2. ONE ACCOUNT = ONE DURABLE E2EE IDENTITY.
3. Firestore is authoritative for encrypted conversations/messages.
4. Local IndexedDB/storage is a rebuildable cache.
5. Device ID is informational only.
6. The same account E2EE identity survives password changes and legitimate account recovery.
7. Normal durable-key unlock requires password + existing six-digit PIN together.
8. Forgotten-password recovery uses a narrowly scoped Firebase/Google server-side recovery authority.
9. Offline sends use one temporary owned Outbox; reconnect is automatic and idempotent.
10. ONE RESOURCE -> ONE OWNER -> ONE PREDEFINED AREA -> ONE SERIALIZED WRITE PATH.

## Durable account E2EE identity

The Firebase UID is an identifier, not a secret and MUST NOT derive the private key.

FIDUNIO generates one cryptographically random account key pair once. The current selected interoperable browser-native direction is Web Crypto ECDH P-256 for the account key pair. The public key may be stored/read as public account encryption material; the private key is never plaintext in Firestore.

The key algorithm and serialized format are versioned so a future reviewed migration can occur without silently replacing an account identity.

## Normal private-key wrapper — frozen v1 direction

Normal durable-key protection uses browser-native Web Crypto:

- account key: ECDH P-256, versioned;
- wrapping cipher: AES-256-GCM;
- KDF: PBKDF2-HMAC-SHA-256;
- v1 work factor: 600,000 iterations;
- random unique salt per wrapper;
- random unique GCM IV per wrapping operation;
- password + exactly six-digit FIDUNIO PIN are required together;
- password/PIN input is encoded unambiguously before KDF, never naive ambiguous string concatenation;
- wrapper records algorithm/KDF/version parameters required for future migration.

The six-digit PIN is an additional required user-held input, not sufficient cryptographic protection by itself.

Never persist plaintext password or plaintext PIN in Firestore, IndexedDB or localStorage. Firebase Authentication owns authentication-password verification. Sensitive transient inputs and derived key material should be retained only as long as required for the owned cryptographic operation.

## Firestore E2EE identity schema — v1

Target path:

```
users/{uid}/e2ee/identity
```

Conceptual v1 fields:

```
schemaVersion: 1
identityVersion: 1
keyId: random stable identifier
keyAlgorithm: "ECDH-P256"
publicKey: serialized public JWK/material

normalWrapper:
  version: 1
  ciphertext: wrapped/encrypted private-key bytes
  salt: random bytes
  iv: random GCM IV
  kdf: "PBKDF2-HMAC-SHA256"
  iterations: 600000
  wrappingAlgorithm: "AES-256-GCM"

recoveryWrapper:
  version: 1
  ciphertext: recovery-protected representation of SAME private key
  iv: random GCM IV
  recoveryAuthorityVersion: 1
  metadata: non-secret protocol/version information only

state: "ACTIVE" | reviewed transitional state
revision: monotonic integer
createdAt: server timestamp
updatedAt: server timestamp
```

Exact byte/JWK canonicalization and authenticated additional data fields are implementation details that MUST be fixed in the crypto module tests before production data is written. `uid`, `keyId`, schema/identity/wrapper versions should be cryptographically bound where practical so a wrapper cannot be transplanted silently between accounts/versions.

Firestore MUST NOT contain plaintext password, plaintext PIN, plaintext private E2EE key, derived normal wrapping key, recovery master secret or Secret Manager material.

## Ownership and Firestore security boundary

The authenticated client may read only its own private E2EE identity document. Public encryption material needed by legitimate correspondents should be exposed through a deliberately separate public-key publication path/rule rather than granting other users access to the private wrapper document.

Client writes to the private identity document are restricted to the owning authenticated UID and tightly validated fields/transitions. Recovery-only fields/transitions that require recovery authority are server-only.

Cloud Functions/Admin SDK operates under Google IAM and bypasses ordinary Firestore client Security Rules. Therefore the recovery function service account receives only the minimum IAM/Secret Manager permissions required for its recovery job. Firestore client rules are not treated as protection from an over-privileged server function.

Firebase App Check should be considered as an additional abuse-control layer, not a replacement for Auth, Rules, cryptography or recovery authorization.

## Deterministic identity state machine

Exactly one Account E2EE Identity Manager owns create/unlock/recovery/re-wrap.

```
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

Duplicate auth/startup callbacks join the same owned promise/queue. They never generate a second identity or independently write wrappers.

## Identity creation transaction

Creation is create-once, never repair-by-replacement:

1. authenticated UID established;
2. identity owner reads authoritative identity document;
3. if ACTIVE identity exists, creation stops and normal unlock path is used;
4. if truly absent, generate one account key pair;
5. create normal password+PIN wrapper and recovery wrapper;
6. atomically create the identity record with revision 1;
7. if another writer won the create race, discard local candidate and use authoritative identity;
8. never overwrite an existing identity merely because local state is missing/corrupt.

## Password/PIN change — atomic re-wrap

Underlying account private key and `keyId` DO NOT change.

1. unlock current valid identity;
2. construct candidate new normal wrapper in memory;
3. locally verify candidate can unwrap/import the SAME private key;
4. Firestore transaction reads current identity/revision;
5. transaction succeeds only if expected `keyId`, identity version and revision still match;
6. write new normal wrapper and increment revision atomically;
7. only after authoritative success retire transient old credentials/material;
8. concurrent stale update fails/retries from fresh authoritative state rather than overwriting newer wrapper.

For password change, Firebase Authentication password update and E2EE wrapper update cannot be assumed to be one cross-service atomic transaction. The implementation therefore needs an explicit recoverable staged flow: do not destroy the last valid E2EE wrapper before the replacement is verified and authoritative. If auth update succeeds but wrapper commit fails, the account enters a defined retry/recovery state; it must never silently create a new identity.

For PIN change, the same re-wrap/revision rule applies. History remains readable because the identity key is unchanged.

## Forgotten-password recovery authority

User-facing flow remains:

```
Forgot Password
 -> verify registered email/recovery channel
 -> enter existing six-digit PIN
 -> additional approved recovery verification
 -> server recovery authorization
 -> recover SAME account private key
 -> choose new password
 -> create/verify new normal password+PIN wrapper
 -> commit new wrapper/revision
 -> restore Firestore-authoritative history
 -> security notification/session review
```

The recovery capability is implemented by a narrowly scoped Cloud Functions/Google serverless component and Google Secret Manager (or equivalently reviewed Google-managed secret facility). The protected recovery capability is never put in browser code, Firestore, GitHub or logs.

Security questions, if used, are supplemental authorization evidence only and never derive the recovery key.

The recovery service is explicitly part of the security boundary. This is the accepted tradeoff required to preserve history after forgotten password without mandatory second-device/recovery-code recovery.

Recovery function requirements:
- verify authenticated/authorized recovery transaction, not merely a client-supplied UID;
- short-lived, single-use recovery challenge/session;
- strict attempt/rate limits, especially around the six-digit PIN;
- generic responses where appropriate to reduce account enumeration;
- minimum IAM permissions;
- Secret Manager access only for required recovery function;
- no secret/private-key material in logs;
- deterministic success/failure states;
- audit non-secret security events;
- notify registered channel after successful recovery;
- review/invalidate prior sessions according to final auth policy.

## Recovery rollback invariant

**Never remove the last usable recovery path before the replacement wrapper is proven valid. Never respond to a failed re-wrap/recovery by generating a new account identity.**

Every mutation carries `keyId` + `revision`. Stale/concurrent mutations cannot silently overwrite newer state. Firestore transactions are used for compare-and-update operations that depend on current authoritative state. Transaction callbacks may be retried by Firestore, so they MUST NOT mutate UI/application state or generate new cryptographic identities as side effects. Cryptographic candidate generation occurs outside the retriable transaction; the transaction only validates expected state and commits already-prepared versioned data.

## Firestore authority, local cache and offline behavior

Firestore owns the durable encrypted conversation record.

```
ONLINE: Firestore authoritative; local cache synchronized.
OFFLINE READ: show cached messages.
OFFLINE SEND: encrypted message -> owned local Outbox -> Pending.
RECONNECT: serialized retry -> Firestore -> receive missed changes -> reconcile cache.
```

Message IDs are stable/idempotent so reconnect/retry cannot turn one user send into multiple authoritative messages. Missing local DB is a cache miss, not lost history. Cache is UID-isolated. Firestore SDK persistence may assist but must not become a competing Outbox owner.

Firestore transactions themselves are not relied on while offline; offline message queuing/retry remains the explicit FIDUNIO Outbox responsibility.

## Device ID and FCM

Device ID may be collected as informational data only. It does not own keys, history, decryptability or delivery. Future FCM registration tokens are associated with UID and are separate from E2EE identity.

## Superseded architecture

Superseded:

```
account + browser installation -> per-device E2EE identity -> per-device envelopes
```

Target:

```
ONE ACCOUNT = ONE DURABLE E2EE IDENTITY
FIRESTORE = AUTHORITATIVE ENCRYPTED HISTORY
LOCAL = REBUILDABLE CACHE
OUTBOX = TEMPORARY OFFLINE SEND QUEUE
DEVICE ID = INFORMATIONAL ONLY
NORMAL UNLOCK = PASSWORD + SIX-DIGIT PIN
FORGOTTEN PASSWORD = VERIFIED SERVER-ASSISTED RECOVERY OF SAME IDENTITY
```

Legacy per-device E2EE/service-worker transforms remain migration material and must not be blindly deleted.

## Remaining design/implementation gates

Before production E2EE migration writes real identity data:

1. freeze exact serialized private/public key format and AES-GCM authenticated-data encoding;
2. implement crypto known-answer/round-trip/failure tests across target Safari/PWA/Fire browsers;
3. finalize public-key publication document/rules separately from private wrapper;
4. write/test Firestore Security Rules with Emulator/Rules tests;
5. implement recovery Cloud Function, IAM and Secret Manager policy and test abuse/failure paths;
6. specify exact recovery challenge lifecycle/rate limits/session invalidation;
7. implement Account E2EE Identity Manager as sole owner;
8. implement authoritative Firestore-to-cache synchronization and owned Outbox protocol;
9. migrate legacy per-device envelopes in bounded steps;
10. validate protected UI/runtime baselines after each bounded change.

## Required acceptance tests

- reinstall/cache deletion/replacement context recovers same identity/history;
- Safari/PWA converge on same account identity;
- password+six-digit PIN required for normal durable unlock;
- wrong password/PIN cannot unlock;
- password change preserves identity/history;
- PIN change preserves identity/history;
- legitimate forgotten-password recovery restores same identity/history;
- failed/partial re-wrap cannot strand account or silently rotate identity;
- concurrent identity mutation cannot overwrite newer revision;
- Firestore has ciphertext, never plaintext private keys/messages/password/PIN;
- other authenticated UID cannot read private wrapper;
- public-key lookup does not expose private wrapper;
- recovery secret unavailable to browser/Firestore/GitHub/logs;
- offline reads work from cache;
- offline sends remain Pending until authoritative write;
- reconnect automatically synchronizes and does not duplicate messages;
- receipts remain correct;
- account switching never exposes another UID's cache.

## Development gate

Before touching implementation, read at minimum:
- `hermes-memory.txt`
- `CODING-GUIDELINES.md`
- `DETERMINISTIC-UI-LIFECYCLE.md`
- `RUNTIME-CONSOLIDATION-PLAN.md`
- `RUNTIME-TRANSFORM-INVENTORY.md`
- `E2EE-IDENTITY-LIFECYCLE.md` for historical context
- this file
- `architecture-ownership.txt`
- `BUG-LIST.md`

Do not rely on conversational memory as a substitute for repository documentation.
