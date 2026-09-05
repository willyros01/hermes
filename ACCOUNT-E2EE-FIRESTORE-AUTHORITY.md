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

Firebase UID is an identifier, not a secret and MUST NOT derive the private key. FIDUNIO generates one cryptographically random account key pair once. v1 uses browser-native Web Crypto ECDH P-256. The key algorithm and serialized format are versioned so future migration never silently replaces an account identity.

## Frozen v1 cryptography

- Account key: ECDH P-256, versioned.
- Normal wrapper: AES-256-GCM.
- KDF: PBKDF2-HMAC-SHA-256, 600,000 iterations.
- Random unique salt per normal wrapper.
- Random unique 96-bit GCM IV per encryption/wrapping operation.
- Password + exactly six-digit FIDUNIO PIN required together and encoded unambiguously before KDF.
- Never persist plaintext password/PIN or derived normal wrapping key.
- AES-GCM authenticated context binds at minimum schema version, identity version, UID, stable keyId and wrapper purpose/version using one canonical encoding fixed by crypto tests.

## Firestore split — public vs private

Private identity record:

```
users/{uid}/e2ee/identity
```

Only the authenticated owner may read the private identity record through client Firestore access. It contains version/state metadata and encrypted wrappers, never plaintext private key.

Public correspondent lookup record:

```
e2eePublicKeys/{uid}
```

Conceptual public fields:

```
uid
schemaVersion: 1
identityVersion: 1
keyId
keyAlgorithm: "ECDH-P256"
publicJwk
state: "ACTIVE"
updatedAt
```

This public record contains no private wrapper, recovery material, password/PIN material, salts or secret data. Authenticated registered FIDUNIO users may read active public records for encryption. Only the owning UID may request normal publication/change through the approved identity-owner path; deletion is not a normal client operation. `uid`, `keyId`, algorithm/version and public key must correspond to the private identity.

Private conceptual fields:

```
schemaVersion: 1
identityVersion: 1
keyId
keyAlgorithm: "ECDH-P256"

normalWrapper:
  version: 1
  ciphertext
  salt
  iv
  kdf: "PBKDF2-HMAC-SHA256"
  iterations: 600000
  wrappingAlgorithm: "AES-256-GCM"

recoveryWrapper:
  version: 1
  ciphertext
  iv
  wrappedRecoveryKey
  recoveryAuthorityVersion: 1
  metadata: non-secret protocol/version information only

state: "ACTIVE" | reviewed transitional state
revision: monotonic integer
createdAt
updatedAt
```

Firestore MUST NOT contain plaintext password, plaintext PIN, plaintext private E2EE key, derived normal wrapping key, plaintext per-user recovery key, recovery master KEK or Secret Manager material.

## Recovery escrow construction — frozen architectural direction

The recovery service should not receive the account private key during normal enrollment. Instead use a random per-user recovery key (RUK):

1. Client generates a cryptographically random 256-bit RUK.
2. Client encrypts the SAME account private key under RUK using AES-256-GCM, producing `recoveryWrapper.ciphertext` + unique IV and authenticated context.
3. Client sends the RUK, UID/keyId/version context and authenticated enrollment request to the narrowly scoped recovery function over the protected callable/API path.
4. Recovery function wraps/protects the RUK under the server recovery KEK/capability held through Google Secret Manager/KMS boundary.
5. Firestore stores only `wrappedRecoveryKey` plus the recovery ciphertext/metadata. Plain RUK is not stored.
6. Client erases/discards transient RUK after authoritative enrollment succeeds.

Forgotten-password recovery:

1. user passes the approved recovery authorization flow;
2. recovery function verifies the short-lived authorized recovery session and UID/keyId/revision context;
3. function unwraps the per-user RUK using the protected server recovery capability;
4. only after authorization, the RUK is released through the protected recovery transaction to the authenticated recovery client (or an equivalently reviewed protocol);
5. client uses RUK to decrypt/import the SAME account private key;
6. client creates and locally verifies a new normal password+PIN wrapper;
7. compare-and-update commits the new normal wrapper/revision without changing keyId/private key;
8. transient RUK/private-key export bytes are discarded as soon as practical.

Security consequence remains explicit: the recovery authority can authorize release of the per-user recovery capability, so it remains part of the security boundary. However, the server does not need to receive/store ordinary message plaintext or the account private key during normal enrollment.

Security questions, if used, are supplemental authorization evidence only and never derive RUK/KEK.

## Firestore Security Rules direction

The existing production `firestore.rules` contains legacy per-device E2EE permissions and does not yet implement this target schema. Do not blindly replace the full ruleset because invitations, roles, conversations, groups and receipts depend on it.

Target additions must be bounded and emulator-tested:

- `users/{uid}/e2ee/identity`: client `get` only for authenticated owning UID; no list/cross-user read.
- private identity client create/update only through explicitly validated normal identity lifecycle fields; recovery-authority-only mutations must not be writable by browser client.
- private identity client delete denied.
- `e2eePublicKeys/{uid}`: registered authenticated users may read; owner-only controlled create/update; delete denied.
- public document must contain only approved public fields and matching `uid`.
- updates use `diff().affectedKeys().hasOnly(...)`/equivalent allowlists so future fields are denied by default.
- stable `keyId`/identity version cannot be silently changed by an ordinary wrapper re-wrap.
- revision transitions must be monotonic and expected-state checked in application transaction logic; rules add structural constraints where practical.
- recovery server/Admin SDK is protected by IAM because server libraries bypass Firestore client Rules.
- callable recovery endpoint should use Firebase Auth context and App Check as abuse defense where supported; App Check supplements, never replaces recovery authorization.

Before deployment, exact rules are tested in Firestore Emulator for owner/non-owner/unauthenticated/admin/recovery cases. Current legacy `devices` rules remain until migration proves they can be removed.

## Deterministic identity owner and state machine

Exactly one Account E2EE Identity Manager owns create/unlock/recovery/re-wrap/publication.

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

1. authenticated UID established;
2. owner reads authoritative private identity;
3. if ACTIVE identity exists, creation stops and unlock path is used;
4. if truly absent, generate account key pair, normal wrapper and recovery RUK/wrapper candidate;
5. recovery function protects RUK;
6. atomically create private identity + corresponding public publication with revision 1 using validated prepared data;
7. if another writer won race, discard local candidate and use authoritative identity;
8. never overwrite existing identity because local state is missing/corrupt.

No cryptographic generation occurs inside a retriable Firestore transaction callback.

## Password/PIN change — atomic re-wrap

Underlying private key and keyId DO NOT change. Generate and locally verify candidate wrapper first. Firestore compare-and-update checks expected keyId/identity version/revision, then writes new normal wrapper and increments revision. Concurrent stale mutation cannot overwrite newer wrapper.

Firebase Authentication password update and Firestore wrapper update are not cross-service atomic. Use explicit recoverable staged state; never destroy last valid E2EE/recovery path. Failure enters deterministic retry/recovery, never silent identity replacement.

## Recovery rollback invariant

**Never remove the last usable recovery path before replacement is proven valid. Never respond to failed re-wrap/recovery by generating a new account identity.**

Every mutation carries keyId + revision. Transaction callbacks may retry and MUST NOT mutate UI or generate cryptographic identities as side effects.

## Offline contract

Firestore owns durable encrypted history. Local cache is rebuildable. One owned local Outbox holds encrypted pending sends. Offline reads show cached messages. Offline sends remain Pending. Reconnect serially retries stable/idempotent message IDs, writes Firestore, receives missed changes, reconciles cache and resumes live sync. Missing local DB is a cache miss, not history loss. UID isolation prevents cross-account cache leakage.

Firestore SDK persistence may assist but cannot become a second Outbox owner. Firestore transactions are not relied on while offline.

## Device ID and FCM

Device ID may be collected as informational data only. It does not own keys, history, decryptability or delivery. Future FCM registration tokens associate with UID and remain separate from E2EE identity.

## Superseded architecture

Superseded: account + browser installation -> per-device E2EE identity -> per-device envelopes.

Target: ONE ACCOUNT = ONE DURABLE E2EE IDENTITY; FIRESTORE = AUTHORITATIVE ENCRYPTED HISTORY; LOCAL = REBUILDABLE CACHE; OUTBOX = TEMPORARY OFFLINE QUEUE; DEVICE ID = INFORMATIONAL; NORMAL UNLOCK = PASSWORD + SIX-DIGIT PIN; FORGOTTEN PASSWORD = VERIFIED SERVER-ASSISTED RECOVERY OF SAME IDENTITY.

Legacy per-device E2EE/service-worker transforms remain migration material and must not be blindly deleted.

## Remaining gates before production identity writes

1. Freeze exact canonical JWK/private-key serialization and AES-GCM AAD byte encoding.
2. Implement crypto round-trip/tamper/wrong-password/wrong-PIN/cross-account-transplant tests across target browsers.
3. Draft bounded Firestore Rules additions and Emulator tests; do not disturb unrelated validated rules.
4. Specify recovery callable challenge/session lifecycle, exact rate limits, IAM/Secret Manager/KMS implementation and notification/session policy.
5. Implement sole Account E2EE Identity Manager.
6. Implement Firestore-authoritative sync/UID cache/owned Outbox.
7. Migrate legacy per-device envelopes in bounded steps.
8. Revalidate protected UI/runtime baselines after every bounded change.

## Required acceptance tests

- reinstall/cache deletion/replacement context recovers same identity/history;
- Safari/PWA converge on same account identity;
- password+six-digit PIN required for normal durable unlock;
- wrong password/PIN/tampered wrapper/cross-account transplant cannot unlock;
- password/PIN change preserves identity/history;
- legitimate forgotten-password recovery restores same identity/history;
- recovery function never needs ordinary message plaintext;
- failed/partial re-wrap cannot strand account or rotate identity;
- concurrent mutation cannot overwrite newer revision;
- Firestore has no plaintext private key/password/PIN/RUK/KEK;
- other UID cannot read private wrapper;
- public-key lookup exposes only public material;
- recovery secret unavailable to browser/Firestore/GitHub/logs;
- offline reads work; offline sends remain Pending until authoritative write; reconnect does not duplicate;
- receipts remain correct; account switching never exposes another UID cache.

## Development gate

Before implementation read: `hermes-memory.txt`, `CODING-GUIDELINES.md`, this file, `DETERMINISTIC-UI-LIFECYCLE.md`, `RUNTIME-CONSOLIDATION-PLAN.md`, `RUNTIME-TRANSFORM-INVENTORY.md`, `E2EE-IDENTITY-LIFECYCLE.md`, `architecture-ownership.txt`, `BUG-LIST.md`.

Do not rely on conversational memory as substitute for repository documentation.
