# FIDUNIO E2EE Recovery Protocol v1

**STATUS: BINDING SECURITY DESIGN — EXACT SERVER FORMAT FROZEN SEPTEMBER 5, 2026**

FIDUNIO recovery preserves the same durable account E2EE identity. The existing six-digit FIDUNIO PIN is a real cryptographic recovery factor, not merely a UI prompt.

## 1. Core invariant

Forgotten-password recovery requires:

- authenticated Firebase account context;
- a valid App Check token when production enforcement is enabled;
- a short-lived server-owned recovery session;
- the existing six-digit FIDUNIO PIN;
- approved supplemental recovery verification;
- the unchanged authoritative keyId/revision for the account identity.

The PIN is never stored plaintext and never protects the private key by itself.

## 2. Recovery Unlock Key model

During initial account-E2EE enrollment:

1. the browser generates one random 256-bit Recovery Unlock Key (RUK);
2. the browser encrypts the same account private PKCS#8 under the RUK with AES-256-GCM;
3. the browser sends the transient RUK plus keyId and six-digit PIN to the authenticated recovery enrollment callable;
4. the recovery function protects the RUK using the server master recovery secret;
5. Firestore stores only the client recovery ciphertext plus the protected RUK fields;
6. transient plaintext RUK/private-key bytes are discarded as soon as practical.

The recovery master secret is named:

```text
FIDUNIO_RECOVERY_MASTER_V1
```

It must be 32 random bytes represented to the function as base64url without padding and stored only in Google Secret Manager. It must never be committed to GitHub, sent to the browser, or stored in Firestore.

## 3. Exact server cryptography

The implementation in `functions/recovery/e2ee-recovery-server-crypto.mjs` is authoritative for v1.

### Recovery KDF context

The exact bytes are UTF-8 of:

```js
JSON.stringify([
  "FIDUNIO-E2EE-RECOVERY-KDF",
  1,
  uid,
  keyId,
  pin
])
```

The wrapping key is:

```text
HMAC-SHA-256(key = 32-byte FIDUNIO_RECOVERY_MASTER_V1,
            data = exact KDF context above)
```

The 32-byte HMAC result is used directly as the AES-256-GCM RUK-wrapping key.

### Recovery RUK AAD

The exact AES-GCM additional authenticated data is UTF-8 of:

```js
JSON.stringify([
  "FIDUNIO-E2EE-RECOVERY-RUK",
  1,
  uid,
  keyId
])
```

### RUK wrapping

- AES-256-GCM;
- fresh random 12-byte IV for every wrap;
- 16-byte GCM authentication tag;
- plaintext is exactly the 32-byte RUK;
- stored `wrappedRecoveryKey` is base64url(no padding) of `ciphertext || tag`;
- stored `recoveryKeyIv` is base64url(no padding) of the 12-byte IV.

Exact returned server fields:

```text
recoveryAuthorityVersion: 1
recoveryKeyWrappingAlgorithm: "HMAC-SHA256+A256GCM"
recoveryKeyIv
wrappedRecoveryKey
```

Wrong PIN, UID, keyId, master secret, IV, ciphertext, tag, authority version, or wrapping algorithm fails recovery.

## 4. Exact Firestore recovery wrapper

The private identity recovery wrapper is exactly:

```text
version: 1
ciphertext                 // client: private PKCS#8 encrypted under RUK
iv                         // client AES-GCM IV
wrappedRecoveryKey         // server: RUK ciphertext || tag, base64url
wrappingAlgorithm: "AES-256-GCM"
recoveryAuthorityVersion: 1
recoveryKeyIv              // server AES-GCM IV
recoveryKeyWrappingAlgorithm: "HMAC-SHA256+A256GCM"
```

No generic `metadata` field is allowed.

## 5. Password-reset / E2EE-recovery sequence

```text
Forgot Password
 -> Firebase password-reset email
 -> valid Firebase reset link
 -> choose new Firebase password
 -> sign in
 -> account E2EE identity remains locked under its old normal wrapper
 -> startE2EERecoveryV1
 -> server creates short-lived recovery session bound to UID/keyId/revision
 -> enter EXISTING six-digit FIDUNIO PIN
 -> complete approved supplemental recovery verification
 -> completeE2EERecoveryV1 verifies session + UID/keyId/revision + retry policy
 -> PIN/master-derived wrapping key unwraps RUK
 -> authorized client receives RUK once
 -> client decrypts/imports SAME account private key
 -> client creates and verifies new normal wrapper using new password + existing PIN
 -> revision-checked Firestore normal-wrapper update
 -> session remains consumed
 -> history remains decryptable with same keyId/private identity
```

No recovery failure may cause automatic creation of a replacement account identity.

## 6. Recovery sessions

Server-owned paths:

```text
recoverySessions/{sessionId}
e2eeRecoveryState/{uid}
```

Session fields are non-secret and include:

```text
sessionVersion: 1
sessionId
uid
keyId
identityRevisionAtStart
status: PENDING | AUTHORIZED | CONSUMED | LOCKED | EXPIRED
createdAtMs
expiresAtMs
failedPinAttempts
failedSupplementalAttempts
authorizedAtMs
consumedAtMs
```

Account state tracks consecutive PIN failures and account hold state. Client Firestore access to these collections is denied by default.

Never store PIN, password, RUK, private key, master secret, derived recovery key, or reset-email code in a session document.

## 7. Retry/lifetime policy

- session lifetime: 10 minutes;
- maximum PIN failures per session: 5;
- after 5 PIN failures: session locks;
- maximum consecutive account-level PIN failures across sessions: 10;
- a new session does not reset the account counter;
- successful recovery resets the account PIN-failure counter;
- generic client-visible recovery failures are used to reduce oracle detail;
- infrastructure-level account/network throttling may be stricter, never weaker.

## 8. Callable boundaries

### `enrollRecoveryV1`

- authenticated caller required;
- App Check required in production;
- UID comes only from verified Auth context;
- accepts keyId, exact six-digit PIN, and transient base64url 32-byte RUK;
- has access to `FIDUNIO_RECOVERY_MASTER_V1`;
- returns only protected-RUK fields;
- cannot read ordinary messages.

### `startE2EERecoveryV1`

- authenticated caller and App Check;
- reads authoritative private identity metadata and account failure count;
- creates short-lived server-owned session;
- does not need or receive the recovery master secret;
- never releases RUK.

### `completeE2EERecoveryV1`

- authenticated caller and App Check;
- sensitive endpoint intended to consume a limited-use App Check token;
- validates session UID/keyId/revision and retry limits;
- requires approved supplemental recovery verification;
- uses the master secret only after authorization reaches the recovery-unwrapping stage;
- atomically consumes session state before returning successful recovery material as implemented by the reviewed server core;
- never acts as a general message-decryption service.

## 9. Current Cloud Functions scaffold status

The rebuild branch now contains a deployable-source layout under `functions/`, using Node.js 22, Firebase Functions v2 callables, Firebase Admin, `defineSecret("FIDUNIO_RECOVERY_MASTER_V1")`, and App Check enforcement.

The completion callable is intentionally **fail-closed** in the scaffold. It does not release a RUK until the separate supplemental recovery verifier is implemented and reviewed. This makes accidental scaffold deployment safer.

No Cloud Function, secret, IAM role, App Check setting, or production rule has been deployed by this repository change.

## 10. IAM / secret boundary

- only enrollment and completion functions bind `FIDUNIO_RECOVERY_MASTER_V1`;
- start-session does not bind the secret;
- browser code and normal messaging code receive no secret access;
- Admin SDK bypasses client Firestore Rules, so server service-account IAM is part of the security boundary;
- production deployment must use least privilege and must not grant broad project-level secret access unnecessarily.

## 11. Logging

Allowed operational logs may record coarse success/failure categories, protocol version, session status and protected identifiers where operationally necessary.

Never log request bodies containing PIN, RUK, password, private PKCS#8, recovery master secret, derived recovery key, or raw protected-key plaintext.

## 12. Validation

Repository CI tests cover server recovery crypto, session policy, callable core and Firestore Admin persistence behavior. The rebuild baseline CI additionally validates that the Cloud Functions scaffold imports successfully with its declared dependencies.

Passing repository CI does not imply production deployment or production IAM/App Check correctness; those remain explicit project-configuration steps.
