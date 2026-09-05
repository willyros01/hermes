# FIDUNIO Account E2EE and Firestore Authority Architecture

**STATUS: BINDING ARCHITECTURAL DIRECTION — SEPTEMBER 5, 2026**

**MANDATORY READ before messaging, E2EE, Firestore synchronization, local-cache, device-registry, account-switching, or push-notification work.**

This document supersedes the earlier design in which conversation continuity and E2EE identity depended on a browser/PWA installation and its local device identity.

## Core invariants

1. **Firebase Auth UID is the durable FIDUNIO user identifier.**
2. **One authenticated user account owns one durable E2EE account identity.**
3. **Firestore is the authoritative store for conversations and encrypted messages.**
4. **Local IndexedDB/storage is a rebuildable cache, not the authoritative conversation store.**
5. **Loss of local storage, PWA removal/reinstallation, switching between Safari/PWA, or moving to another device must not by itself destroy access to the user's authoritative conversation history.**
6. **Device ID is not part of message ownership, encryption routing, key ownership, or conversation-history authority.**
7. A device ID may still be generated/collected as an informational variable for possible future use, but current messaging/E2EE behavior must not depend on it.
8. Future push notification routing should use FCM registration tokens associated with the authenticated UID. A proprietary FIDUNIO device ID is not required merely to route FCM notifications.

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

The Firebase UID is an identifier, not a secret, and MUST NOT by itself be used to deterministically derive an encryption private key.

The account E2EE identity must use cryptographically random secret/key material generated once for the account using Web Crypto or an equivalently strong cryptographic source.

Conceptually:

```
users/{uid}
    public account E2EE key/material
    encrypted/wrapped private account E2EE key package
```

The public portion may be stored normally in Firestore. The private portion must never be stored in Firestore as plaintext. It must be protected by a reviewed wrapping/unlocking design so that a newly authenticated installation can securely recover the same account E2EE identity.

The exact wrapping/recovery mechanism must be designed and reviewed before implementation. Do not improvise a scheme based only on UID, browser storage, device ID, or a weak deterministic secret.

## Firestore authority and local cache

Firestore owns the durable encrypted conversation record.

After authentication and Firestore connection:

1. determine authenticated UID;
2. recover/unlock the user's durable account E2EE identity;
3. synchronize authoritative conversation metadata and encrypted messages from Firestore;
4. rebuild/update the local inbox/message cache;
5. continue live synchronization;
6. use local Outbox only as a temporary offline queue until authoritative cloud writes succeed.

Local state may optimize startup, offline display, and responsiveness. It must be safe to discard and reconstruct.

A missing local database must be treated as a cache miss, not as loss of the user's account identity or conversation history.

## Device ID policy

For now:

- a device ID may be generated/collected and retained as an informational program variable;
- it MUST NOT select E2EE keys;
- it MUST NOT determine which historical messages a user can decrypt;
- it MUST NOT own conversation history;
- it MUST NOT be required for normal message delivery;
- it MUST NOT be used for per-device message-envelope fan-out in the new architecture.

If future requirements need explicit device management, revocation, security auditing, or endpoint labels, device ID can be reconsidered under a separate reviewed design.

## Push notification policy

When push notifications are implemented, FCM registration tokens should be associated with the authenticated UID. A user may have multiple active FCM tokens for multiple endpoints. Notification endpoint registration is separate from E2EE account identity and conversation ownership.

## Local PIN policy

The existing local PIN remains an installation-local app-lock/security feature unless explicitly redesigned later. It must not become the sole durable source of the user's permanent account E2EE identity. Losing a local PIN record/cache must not silently rotate the account's cryptographic identity.

## Superseded architecture

The following former invariant is superseded and must not guide new implementation:

```
account + browser installation
    -> unique E2EE device identity/keypair
    -> per-device encrypted message envelopes
```

The replacement invariant is:

```
ONE ACCOUNT = ONE DURABLE E2EE IDENTITY
FIRESTORE = AUTHORITATIVE ENCRYPTED CONVERSATION STORE
LOCAL STORAGE = REBUILDABLE CACHE
DEVICE ID = INFORMATIONAL ONLY FOR NOW
```

Existing per-device E2EE-v2 code and service-worker transforms are legacy implementation that must be migrated carefully. Do not delete them blindly: the runtime-consolidation rules still apply, and validated behavior must be preserved while replacing the underlying ownership model.

## Implementation order

1. Document and freeze this account-authoritative architecture before further messaging tests.
2. Complete the necessary runtime/source ownership audit before changing transformed E2EE code.
3. Design the durable account-key generation, wrapping, recovery, and rotation/revocation rules.
4. Implement account E2EE identity creation/recovery under one serialized owner.
5. Make Firestore-to-local synchronization explicitly authoritative/rebuildable.
6. Replace per-device envelope routing with account-identity encryption in a bounded migration.
7. Leave device ID informational only; remove it from E2EE/message-history dependencies.
8. Revalidate clean iPad/iPhone/Safari/PWA behavior, including reinstall/cache-loss recovery.
9. Revalidate Sent/Delivered/Read, offline Outbox/reconnect, Settings, responsive UI, and account switching.
10. Add FCM token registration later as a separate notification concern.

## Required acceptance tests

The new design is not complete until all of these pass:

- same user can read authoritative history after PWA reinstall;
- same user can read authoritative history after local cache deletion;
- same user can use Safari or installed PWA without history depending on the old installation's device ID;
- a replacement device can securely recover the same account E2EE identity after the required authentication/unlock process;
- Firestore contains ciphertext, not plaintext private keys/messages;
- deleting local cache causes reconstruction, not cryptographic identity loss;
- different authenticated UIDs cannot read each other's conversation/cache data;
- messaging receipts and offline behavior remain correct.

## Development gate

Before touching this area, read at minimum:

- `hermes-memory.txt`
- `CODING-GUIDELINES.md`
- `RUNTIME-CONSOLIDATION-PLAN.md`
- `RUNTIME-TRANSFORM-INVENTORY.md`
- `E2EE-IDENTITY-LIFECYCLE.md` (for historical context and superseded device-identity behavior)
- this file, `ACCOUNT-E2EE-FIRESTORE-AUTHORITY.md`
- `architecture-ownership.txt`
- `BUG-LIST.md`

Also inspect other supporting root documentation relevant to the change. Do not rely on memory from a previous chat/session as a substitute for reading repository documentation.
