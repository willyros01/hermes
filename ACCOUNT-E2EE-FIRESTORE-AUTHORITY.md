# FIDUNIO Account E2EE and Firestore Authority Architecture

**STATUS: BINDING ARCHITECTURAL DIRECTION — SEPTEMBER 5, 2026**

**MANDATORY READ before messaging, E2EE, Firestore synchronization, local-cache, device-registry, account-switching, account recovery, or push-notification work.**

This document supersedes the earlier design in which conversation continuity and E2EE identity depended on a browser/PWA installation and its local device identity.

## Core invariants

1. **Firebase Auth UID is the durable FIDUNIO user identifier.**
2. **One authenticated user account owns one durable E2EE account identity.**
3. **Firestore is the authoritative store for conversations and encrypted messages.**
4. **Local IndexedDB/storage is a rebuildable cache, not the authoritative conversation store.**
5. Loss of local storage, PWA removal/reinstallation, switching between Safari/PWA, or moving to another device must not by itself destroy access to the user's authoritative conversation history.
6. **Device ID is informational only for now.** It is not part of message ownership, encryption routing, key ownership, conversation-history authority, or normal delivery.
7. Future push notification routing should use FCM registration tokens associated with the authenticated UID.
8. **The account E2EE identity is preserved across normal password changes and successful account recovery so historical encrypted messages remain readable.**
9. **Forgotten-password recovery uses a narrowly scoped server-side recovery authority in Firebase/Google infrastructure; the recovery secret/capability must not be placed in Firestore or public client/GitHub code.**
10. **Offline behavior is local-first for usability but Firestore-authoritative for durability: cached history is readable offline, new offline sends enter a temporary Outbox/pending path, and reconnection synchronizes to/from Firestore automatically.**

## Authoritative model

```
Firebase Authentication
        |
        v
stable UID
        |
        +----> durable account E2EE identity
        |
        +----> Firestore authoritative conversations/messages
        |
        +----> optional FCM registration tokens
        |
        v
local IndexedDB/cache rebuilt from Firestore
```

The local browser/PWA installation is an endpoint and cache. It is not the owner of the user's conversation history.

## Durable E2EE identity

The Firebase UID is an identifier, not a secret, and MUST NOT by itself be used to derive an encryption private key.

The account E2EE identity must use cryptographically random key material generated once for the account using Web Crypto or an equivalently strong cryptographic source.

Conceptually Firestore may hold:

```
users/{uid}/E2EE account material
    public account E2EE key/material
    encrypted/wrapped private account E2EE key package
    wrapping metadata / salts / KDF parameters
    recovery-wrapped representation or equivalent reviewed recovery material
```

The public portion may be stored normally in Firestore. The private portion must never be stored in Firestore as plaintext.

## Password + six-digit PIN decision

The agreed normal durable-key recovery/unlock model is:

```
FIDUNIO password + existing 6-digit PIN
                |
                v
        strong local key derivation
                |
                v
        unwrap account E2EE key
                |
                v
        decrypt account history
```

Binding requirements:

- The password and PIN are required together for normal durable E2EE key recovery on a new/reinstalled local context.
- Neither the raw password nor raw PIN is stored in Firestore.
- FIDUNIO application code must not persist the user's plaintext password in IndexedDB/localStorage.
- Firebase Authentication remains responsible for the authentication password account mechanism.
- A six-digit PIN alone is not sufficient cryptographic protection for the Firestore key package and must not be used as the sole wrapping key.
- The exact KDF, salts, authenticated wrapping algorithm, parameters, versioning, and migration format must be specified and reviewed before implementation.

The existing installation-local PIN/app-lock implementation is a separate legacy/local-security mechanism. Its relationship to the new six-digit account E2EE PIN must be deliberately migrated or unified later; do not accidentally conflate the two implementations during coding.

## Password change

A normal password change must preserve the same account E2EE identity:

1. successfully unlock the current E2EE identity using the currently valid credentials;
2. change the Firebase authentication password through the approved auth lifecycle;
3. derive new wrapping protection from the new password + existing six-digit PIN;
4. re-wrap the SAME account E2EE private key;
5. atomically/version-safely replace the normal wrapped package;
6. verify the new wrapper before retiring the previous valid wrapper.

Historical messages therefore remain readable because the underlying E2EE identity does not change.

Changing the six-digit PIN follows the same principle: unlock the existing identity, re-wrap the same identity using password + new PIN, verify, then retire the previous wrapper.

## Forgotten-password / account recovery decision

**Product requirement:** a user who successfully passes FIDUNIO account recovery is deemed the legitimate account owner and should regain access to the SAME account E2EE identity and historical messages. Successful password recovery must not automatically rotate to a new E2EE identity.

The agreed user-facing recovery flow is deliberately device-independent:

```
Forgot Password
      |
      v
Verify registered recovery channel / email
      |
      v
Enter existing 6-digit FIDUNIO PIN
      |
      v
Additional recovery verification
      |
      v
Choose new password
      |
      v
Recover SAME E2EE identity
      |
      v
Re-wrap it for new password + PIN
      |
      v
Restore authoritative message history
```

### Recovery hardening rules

- Do NOT require another FIDUNIO device, QR transfer, proprietary device ID, or device-to-device approval as part of the normal recovery architecture.
- Recovery challenges/tokens must be cryptographically random where applicable, short-lived, single-use, and rate-limited.
- Recovery attempts, PIN attempts, and challenge attempts must be throttled; repeated failures must not allow unlimited guessing.
- Recovery responses should avoid unnecessary account-enumeration leakage.
- Successful account recovery must generate a security notification to the user's registered notification channel(s).
- Existing sessions should be invalidated or explicitly reviewed according to the final auth implementation after successful high-risk recovery.
- Suspicious/high-risk recovery may be subject to an explicit hold or enhanced verification; any such policy must be deterministic and documented rather than ad hoc.
- Security questions, if retained for usability, are supplemental evidence only. They are NOT the cryptographic recovery secret and must not be the sole proof that releases message history.
- Recovery verification must be strong enough to justify release/re-wrapping of the durable E2EE identity.

## Server-side recovery authority decision

The forgotten-password recovery capability MUST NOT be implemented entirely by public browser code plus Firestore if doing so would place both the encrypted recovery package and everything required to open it in the same client/database trust boundary.

FIDUNIO will use a **small, narrowly scoped server-side recovery component hosted in Firebase/Google infrastructure**, with Cloud Functions for Firebase / Google Cloud serverless infrastructure as the intended implementation direction and Google Secret Manager (or equivalently reviewed Google-managed secret facility) for the sensitive recovery secret/capability.

Conceptually:

```
FIDUNIO PWA
    |
    +---- Firestore
    |       encrypted messages
    |       public E2EE material
    |       encrypted/wrapped private-key packages
    |
    +---- FIDUNIO Recovery Function
              |
              +---- protected recovery capability in Secret Manager
```

Binding constraints:

- This is a serverless managed component; FIDUNIO does not need to operate a general-purpose physical/virtual server for recovery.
- The recovery function has one narrow authority: participate in an already-authorized account-recovery operation for the SAME account E2EE identity.
- It must not become the normal messaging path.
- It must not store ordinary message plaintext.
- It must not store the user's plaintext Firebase password or plaintext six-digit PIN.
- It must not expose the protected recovery secret to browser JavaScript, Firestore documents, GitHub source, logs, or normal administrators.
- Access to the recovery secret must be scoped only to the function(s) that require it.
- No administrator gets a simple plaintext-key bypass.
- Exact recovery cryptographic construction, authorization protocol, IAM permissions, audit events, throttling and failure behavior must still be specified before deployment.

This design intentionally accepts that the FIDUNIO recovery authority is part of the security boundary for preserving history after a forgotten password. That tradeoff is explicit and is required by the product decision that a legitimately recovered account regains historical messages without a second-device/recovery-code requirement.

## Recovery cryptographic requirement

Normal password+PIN wrapping alone cannot recover the old key when the old password has been forgotten. Therefore FIDUNIO needs the separate controlled recovery capability above to recover/re-wrap the SAME account E2EE identity only after the recovery procedure has been successfully authorized.

Identity verification and cryptographic key recovery must be connected by an explicit controlled mechanism. Merely resetting Firebase password does not mathematically recreate the old E2EE key.

## Firestore authority, local cache and offline behavior

Firestore owns the durable encrypted conversation record. Local storage exists for responsiveness and offline operation, not as the permanent authority.

### Simple offline contract

```
ONLINE
Firestore = authoritative/master record
Local cache = synchronized working copy

OFFLINE READ
Display already cached conversations/messages

OFFLINE SEND
Create encrypted pending message
        -> local Outbox / pending queue
        -> show deterministic Pending/Waiting state

RECONNECTED
Send queued work to Firestore
        +
receive authoritative changes missed while offline
        -> reconcile/update local cache
        -> resume normal live synchronization
```

Binding requirements:

- Offline reading uses locally cached data already available to the installation.
- Offline sending must never pretend a message reached Firestore. Until confirmed by the authoritative write path it remains pending/queued.
- The local Outbox is temporary and must survive the offline period sufficiently to retry when connectivity returns.
- Reconnection automatically resumes synchronization; ordinary users should not need a manual sync procedure.
- Firestore remains the final durable authority after synchronization.
- Duplicate reconnect/startup callbacks must join the same owned/serialized send/sync path and must not create duplicate messages.
- Message IDs/idempotency must permit safe retry so a reconnect cannot turn one user send into multiple authoritative messages.
- A missing/deleted local database is a cache miss, not loss of account identity or conversation history. Once authenticated/E2EE-ready and online, the cache is reconstructed from Firestore.
- Cached/offline content must remain UID-isolated so switching accounts cannot display another account's local history.
- Firestore SDK offline persistence may be used where appropriate, but FIDUNIO's explicit ownership/status semantics remain authoritative for UI state and Outbox behavior; do not create two competing Outbox owners.

After authentication and E2EE authorization:

1. determine authenticated UID;
2. recover/unlock the user's durable account E2EE identity;
3. synchronize authoritative conversation metadata and encrypted messages from Firestore;
4. rebuild/update the local inbox/message cache;
5. continue live synchronization;
6. use local Outbox only as a temporary offline queue until authoritative cloud writes succeed.

## Device ID policy

A device ID may be generated/collected as an informational variable, but it MUST NOT select E2EE keys, determine decryptability, own history, be required for normal message delivery, or be used for per-device message-envelope fan-out in the target architecture.

## Push notification policy

Future FCM registration tokens should be associated with authenticated UID. Notification endpoint registration is separate from E2EE identity and conversation ownership.

## Deterministic E2EE owner

There must be exactly one Account E2EE Identity Manager / owner with one serialized mutation path.

Conceptual lifecycle:

```
SIGNED_OUT
  -> AUTHENTICATED
  -> IDENTITY_LOOKUP
       -> CREATE (only if account truly has no identity)
       -> NORMAL_UNLOCK_REQUIRED
       -> RECOVERY_AUTHORIZATION_REQUIRED
  -> UNWRAPPING / RECOVERY
  -> E2EE_READY
  -> FIRESTORE_SYNC
  -> MESSAGING_READY
```

Duplicate auth callbacks or concurrent startup events must join/queue behind the same owned operation. They must never create competing account identities. Failure must return to a defined state; it must not trigger silent identity replacement.

## Superseded architecture

The following former invariant is superseded:

```
account + browser installation
    -> unique E2EE device identity/keypair
    -> per-device encrypted message envelopes
```

Replacement invariant:

```
ONE ACCOUNT = ONE DURABLE E2EE IDENTITY
FIRESTORE = AUTHORITATIVE ENCRYPTED CONVERSATION STORE
LOCAL STORAGE = REBUILDABLE CACHE
OUTBOX = TEMPORARY OFFLINE SEND QUEUE
DEVICE ID = INFORMATIONAL ONLY
NORMAL KEY RECOVERY = PASSWORD + 6-DIGIT PIN TOGETHER
FORGOTTEN-PASSWORD RECOVERY = VERIFIED RECOVERY + SERVER-SIDE RECOVERY AUTHORITY
SUCCESSFUL ACCOUNT RECOVERY = SAME E2EE IDENTITY + HISTORY
```

Existing per-device E2EE-v2 code and service-worker transforms are legacy migration material and must not be deleted blindly.

## Next security-design gate before application code

Before implementing the new account E2EE architecture, specify and review:

1. exact E2EE key algorithm/key format;
2. exact password+PIN KDF construction and parameters;
3. exact authenticated key-wrapping/encryption construction;
4. exact Firestore document/schema and version fields;
5. exact server-side recovery-wrapper/recovery-authority protocol and Secret Manager/IAM boundary;
6. recovery token/channel and throttling policy;
7. password/PIN change atomic re-wrap transaction;
8. failure/rollback behavior so a partial update cannot strand the account;
9. Firestore security rules for reading/writing E2EE packages;
10. audit/security-notification events without storing sensitive plaintext;
11. exact Firestore/local-cache/Outbox ownership and idempotent reconnect protocol.

Do not begin the E2EE migration until these are sufficiently defined to avoid improvising cryptographic behavior in application code.

## Required acceptance tests

The new design is not complete until:

- same user can read authoritative history after PWA reinstall;
- same user can read authoritative history after local cache deletion;
- Safari/PWA do not depend on old installation device ID;
- replacement context can securely recover the same account E2EE identity using password + six-digit PIN;
- a legitimately completed forgotten-password recovery can restore the same E2EE identity and history;
- password change preserves history;
- PIN change preserves history;
- wrong password or wrong PIN cannot unlock the durable key;
- recovery attempts are throttled and security-notified as designed;
- Firestore contains ciphertext, not plaintext private keys/messages;
- deleting local cache causes reconstruction rather than cryptographic identity loss;
- different authenticated UIDs cannot read each other's account/cache data;
- cached messages are readable offline;
- offline sends remain visibly pending until authoritative cloud acceptance;
- reconnect retries do not duplicate messages;
- reconnection automatically synchronizes queued sends and missed authoritative changes;
- receipts and offline behavior remain correct.

## Development gate

Before touching this area, read at minimum:

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
