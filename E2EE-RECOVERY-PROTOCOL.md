# FIDUNIO E2EE Recovery Protocol v1

**STATUS: BINDING SECURITY DESIGN — SEPTEMBER 5, 2026**

This document closes an important recovery gap: the user's existing six-digit FIDUNIO PIN must be a real required recovery factor, not merely a screen prompt that the server cannot verify.

## 1. Product invariant

Forgotten-password recovery must require all of the approved recovery authorization AND the user's existing six-digit FIDUNIO PIN before the Recovery Unlock Key (RUK) can be released.

The PIN is never stored plaintext. It is also never used alone to protect the account private key.

## 2. PIN-gated RUK protection

During E2EE identity enrollment the browser already creates a random 256-bit RUK and uses it to encrypt the account private PKCS#8 bytes into the recovery wrapper.

The recovery enrollment callable receives, over authenticated TLS/callable transport:

- authenticated Firebase UID from server-verified Auth context;
- keyId and protocol versions;
- 32-byte RUK;
- six-digit FIDUNIO PIN.

The function MUST NOT trust a client-supplied UID in place of authenticated context.

The recovery service has a 256-bit random master recovery secret (`FIDUNIO_RECOVERY_MASTER_V1`) bound only to the recovery functions through Google Secret Manager/KMS/IAM.

The function derives a per-account/PIN recovery wrapping key using a reviewed server-side KDF construction that binds:

```text
protocol version + UID + keyId + six-digit PIN + server master recovery secret
```

Implementation direction for v1 server code: HMAC-SHA-256 keyed by the 256-bit server master secret over an unambiguous canonical ordered context containing protocol label/version, UID, keyId and PIN. The 256-bit HMAC output is used/imported as the AES-256-GCM RUK-wrapping key.

The function then:

1. generates a random 96-bit AES-GCM IV;
2. encrypts the 32-byte RUK using AES-256-GCM and server recovery AAD binding UID/keyId/version;
3. returns only `wrappedRecoveryKey`, IV and protocol metadata;
4. never stores/logs plaintext PIN, plaintext RUK, derived wrapping key or master recovery secret.

Firestore stores the protected RUK blob with the client-created recovery ciphertext. The plaintext PIN and RUK are discarded after enrollment.

## 3. Why this is necessary

A six-digit PIN has only about one million possible values and therefore cannot safely protect the durable E2EE identity by itself. The normal wrapper already combines password + PIN with a strong KDF.

For forgotten-password recovery, the server master secret makes the protected RUK unusable from Firestore alone, while the PIN remains a required user-held input. Strict online retry limits are mandatory because the PIN is low entropy.

If the trusted recovery service and its master secret are fully compromised, the provider-assisted recovery boundary is compromised. This is the already accepted tradeoff of history-preserving recovery without a second device or user-held recovery phrase/code.

## 4. Password reset / E2EE recovery sequence

FIDUNIO uses Firebase Authentication's password-reset email mechanism for the password account itself. The E2EE recovery operation is separate but linked deterministically.

User-facing sequence:

```text
Forgot Password
 -> request Firebase password-reset email
 -> user opens valid one-time Firebase reset link
 -> choose new Firebase password
 -> sign in with the new password
 -> FIDUNIO detects durable E2EE identity cannot be normal-unlocked with old wrapper
 -> start restricted E2EE recovery session
 -> enter EXISTING six-digit FIDUNIO PIN
 -> complete any approved supplemental recovery verification
 -> recovery function verifies authorized session + UID/keyId/revision + retry policy
 -> PIN-derived server recovery key successfully unwraps RUK
 -> client receives RUK only in the authorized recovery response
 -> client decrypts SAME account private key
 -> client creates/verifies new normal wrapper using NEW password + EXISTING PIN
 -> compare-and-update commits new normal wrapper/revision
 -> recovery session is consumed
 -> security notification/session review
 -> Firestore history decrypts with SAME identity
```

The password may therefore be changed by Firebase before the E2EE wrapper is re-wrapped. This is safe because the independent recovery wrapper remains intact until the new normal wrapper is proven and committed.

## 5. Recovery session state

Recovery session records are server-owned and MUST NOT be client-writable. Recommended server collection:

```text
recoverySessions/{randomSessionId}
```

Non-secret fields may include:

- uid
- keyId
- identityRevisionAtStart
- status: `PENDING` | `AUTHORIZED` | `CONSUMED` | `LOCKED` | `EXPIRED`
- createdAt
- expiresAt
- failedPinAttempts
- failedSupplementalAttempts
- authorizedAt
- consumedAt
- coarse abuse/risk metadata that does not contain secrets

Do not store PIN, RUK, password, private key, derived recovery key or email reset code in this record.

## 6. v1 retry / lifetime policy

Because a six-digit PIN is low entropy, use a deliberately strict policy:

- recovery session lifetime: 10 minutes once PIN-entry authorization begins;
- maximum PIN failures in one recovery session: 5;
- after 5 PIN failures: session becomes `LOCKED` and cannot be revived;
- account-level recovery PIN failures: maximum 10 consecutive failures across sessions before a security hold requiring a fresh email recovery cycle and delayed retry;
- starting a new session does NOT reset the account-level failure count;
- successful legitimate recovery resets the consecutive recovery-PIN failure counter;
- recovery endpoint also applies per-account and per-network abuse throttling; exact infrastructure quotas may be tightened without weakening these limits;
- generic failure wording to reduce account enumeration and PIN oracle detail.

These limits are intentionally below NIST's upper bounds for short activation secrets and are consistent with treating recovery endpoints as high-risk authentication surfaces.

## 7. Callable function boundaries

Separate narrow functions/capabilities rather than one all-powerful endpoint:

### `enrollRecoveryV1`

Purpose: protect a newly generated RUK during initial identity enrollment.

Requirements:
- authenticated user required;
- App Check required when production enforcement is enabled;
- consumes/validates UID from Auth context;
- accepts keyId/version/RUK/PIN only for own account;
- may access recovery master secret;
- returns protected RUK blob/metadata;
- cannot read ordinary messages.

### `startE2EERecoveryV1`

Purpose: create restricted short-lived recovery session after the user has completed the required Firebase/email recovery stage and is authenticated again.

Requirements:
- authenticated user required;
- App Check;
- reads own identity metadata only;
- creates server-owned session;
- no RUK release.

### `completeE2EERecoveryV1`

Purpose: verify authorized recovery session, PIN and supplemental policy; unwrap/release RUK once.

Requirements:
- authenticated user and App Check;
- strict session/account retry counters;
- session UID must equal Auth UID;
- session keyId/revision must still match authoritative identity;
- accesses recovery master secret;
- successful release atomically consumes session before/with response semantics as safely implementable;
- no plaintext secrets in logs;
- returns RUK only to the authorized client response;
- cannot be used as normal message-decryption service.

## 8. App Check

Recovery callables should use Firebase App Check. For low-volume security-critical completion operations, App Check limited-use/replay protection should be evaluated/enabled where supported. App Check is abuse defense, not proof of account ownership and not a substitute for Auth/PIN/recovery authorization.

## 9. IAM / secret boundary

- `FIDUNIO_RECOVERY_MASTER_V1` exists only in Google Secret Manager/KMS boundary.
- Only enrollment/completion recovery functions that actually need it receive secret access.
- `startE2EERecoveryV1` does not need master-secret access.
- Normal messaging functions/code have no recovery-secret permission.
- Browser/GitHub/Firestore never receive the master secret.
- Admin SDK/server libraries bypass client Firestore Rules; IAM and narrow code capability are therefore mandatory.

## 10. Deterministic failure behavior

- Wrong PIN -> increment counters, generic recovery failure, no RUK.
- Expired session -> `EXPIRED`, no RUK.
- Too many attempts -> `LOCKED`, no RUK.
- keyId/revision changed since session start -> abort session and restart from authoritative identity state; no RUK.
- function/network failure before RUK release -> existing recovery wrapper remains valid; retry only under same still-valid session policy.
- RUK successfully recovered but client new-wrapper commit fails -> do NOT rotate identity or delete recovery wrapper. Client enters explicit retry/recovery state.
- successful normal-wrapper commit -> consume recovery session, security notification, session review/invalidation policy.

## 11. Security notification

Successful forgotten-password/E2EE recovery produces a notification to the registered recovery email/channel stating that account recovery occurred. Notification contains no PIN, password, RUK, private key or cryptographic secret.

## 12. Logging

Allowed audit examples:

- recovery enrollment success/failure category;
- recovery session created;
- recovery attempt failed/succeeded;
- session locked/expired/consumed;
- uid represented only where operationally required and protected by normal Firebase/Google logging access controls;
- keyId/revision/protocol version where useful.

Never log request bodies containing password, PIN, RUK, private PKCS#8, wrapped-key plaintext, master secret or derived AES key.
