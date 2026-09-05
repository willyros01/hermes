# FIDUNIO Account E2EE Direct-Message Format

**STATUS: VALIDATED REPOSITORY PRE-HANDOFF CANDIDATE — NOT YET WIRED TO NORMAL RUNTIME OR DEPLOYED TO LIVE FIREBASE**

This document defines the account-authoritative replacement for the legacy per-device direct-message envelopes still injected by `service-worker.js`. Crypto, repository Firestore rules and a fail-closed service layer are validated before any transport migration occurs.

## Ownership and boundary

- `e2ee-account-message-crypto.js` owns only direct-message cryptographic transformation.
- `e2ee-account-message-service.js` owns only fail-closed resolution of READY local account identity + peer authoritative public account identity into crypto calls.
- `e2ee-account-identity-manager.js` remains sole owner of the durable local runtime private identity.
- peer public key material comes from authoritative `e2eePublicKeys/{uid}` through central `firebase.js` ownership.
- `firestore.rules` is the exact repository rule candidate; passing emulator tests does not deploy it.

These modules do not initialize Firebase independently, create identities, unlock identities, mutate UI/local storage, choose recipients, own Outbox, or silently fall back to per-device E2EE.

No service-worker transform is removed by this isolated candidate.

## Version

New account-authoritative direct messages use:

```text
e2ee: 3
kdfVersion: 1
```

Legacy `e2ee:1` and per-device `e2ee:2` remain explicit migration formats and must stay readable until a deliberate compatibility retirement gate passes.

## Key agreement

For a direct conversation between two different authenticated accounts:

1. sender/recipient use their durable account ECDH P-256 identities;
2. Web Crypto ECDH derives 256 shared-secret bits;
3. the shared secret is imported as HKDF key material;
4. HKDF-SHA-256 derives a non-extractable AES-256-GCM message key scoped to the conversation and exact durable account key identities.

Device ID is not part of key agreement, routing, AAD or decryptability.

### Canonical account pair

The KDF uses the two `[uid,keyId]` tuples sorted by UID then keyId. This makes derivation direction-independent while binding the key to the exact durable identities.

### HKDF salt

Exact salt bytes are SHA-256 of UTF-8:

```js
JSON.stringify([
  "FIDUNIO-DM-HKDF-SALT",
  1,
  conversationId,
  sortedAccountPair
])
```

### HKDF info

Exact info bytes are UTF-8:

```js
JSON.stringify([
  "FIDUNIO-DM-HKDF-INFO",
  1,
  conversationId
])
```

Derived key: AES-GCM 256-bit, non-extractable, encrypt/decrypt usages.

## Message encryption

- AES-256-GCM;
- fresh random 12-byte IV per message;
- 128-bit authentication tag;
- plaintext is exact UTF-8 message text;
- serialized binary fields are base64url without padding.

### Exact authenticated additional data

AAD is UTF-8 of:

```js
JSON.stringify([
  "FIDUNIO-DM-MESSAGE",
  3,
  conversationId,
  messageId,
  senderUid,
  recipientUid,
  senderKeyId,
  recipientKeyId
])
```

This binds ciphertext to its conversation, stable message ID, direction and exact durable sender/recipient key identities. Copying ciphertext to another context or substituting a key identity fails authentication/format validation.

## Exact crypto envelope

The crypto module returns exactly:

```text
e2ee: 3
kdfVersion: 1
senderKeyId
recipientKeyId
ciphertext
iv
```

No plaintext `text`, device ID, device envelope map, sender device public key or recipient device list is part of the account-authoritative crypto envelope.

## Exact repository Firestore v3 row

The validated repository rule candidate accepts v3 direct-message creation only when the row contains exactly:

```text
senderUid
senderName
timeLabel
state
createdAt
text
e2ee
kdfVersion
senderKeyId
recipientKeyId
ciphertext
iv
```

Requirements include:
- direct conversation with exactly two members;
- authenticated sender is a member and equals `senderUid`;
- both account public identities exist;
- sender/recipient keyIds equal the authoritative `e2eePublicKeys/{uid}.keyId` records;
- `state == "sent"`;
- `createdAt == request.time`;
- `text == ""`;
- `e2ee == 3`, `kdfVersion == 1`;
- ciphertext and IV use the expected base64url-only shape;
- no per-device envelope fields or unexpected fields.

The older plaintext branch now explicitly requires no `e2ee` field. This was added after the dedicated rules matrix found that a mixed E2EE + non-empty plaintext row could otherwise be accepted by the legacy plaintext OR-clause.

Legacy valid plaintext, `e2ee:1` and `e2ee:2` creation remain accepted for migration compatibility. Receipt updates remain state-only.

## Public-key validation

The peer JWK accepted by v3 crypto/service must contain exactly:

```text
kty
crv
x
y
```

with `kty="EC"`, `crv="P-256"`. Extra fields including `d`, `ext`, `key_ops`, `alg` or `use` are rejected.

The service also requires peer record metadata:
- matching UID;
- schemaVersion 1;
- identityVersion 1;
- keyAlgorithm `ECDH-P256`;
- state `ACTIVE`;
- valid stable keyId.

## Fail-closed service behavior

`e2ee-account-message-service.js` refuses operation unless:
- local runtime identity exists for the exact authenticated UID;
- it contains the durable account keyId and non-extractable runtime private key;
- peer authoritative account public identity is available and exact.

Important service errors:
- `ACCOUNT_E2EE_NOT_READY` — local durable account identity not unlocked/ready;
- `PEER_IDENTITY_UNAVAILABLE` — peer authoritative account identity could not be obtained;
- `PEER_IDENTITY_INVALID` — peer account identity metadata/JWK invalid;
- `UNSUPPORTED_MESSAGE_FORMAT` — incoming row is not v3.

There is no automatic device-key fallback and no identity generation on any failure.

Crypto-layer errors remain deterministic (`INVALID_INPUT`, `FORMAT_ERROR`, `UNSUPPORTED_CRYPTO`, `ENCRYPT_FAILED`, `DECRYPT_FAILED`).

## Validation state

The rebuild security gate includes:
- `e2ee-account-message-crypto.test.mjs` — directional round trips, exact shape/no plaintext, AAD substitutions, wrong keys, ciphertext/IV tamper, keyId substitution, strict base64url/JWK, empty/Unicode payloads;
- `firestore-account-message-v3.rules.test.mjs` — valid bidirectional rows, nonmember/spoof/key mismatch/missing public identity/plaintext/device-field/unexpected-field/KDF/ciphertext/IV/timestamp rejection, receipt update constraints and legacy compatibility;
- `e2ee-account-message-service.test.mjs` — READY operation and fail-closed local/peer identity behavior.

The complete expanded gate passed at commit:

```text
ca9222bdb7171ae60de5b2b9c08bf5b9327f52c9
```

Protected checkpoint:

```text
checkpoint-rebuild-account-dm-v3-crypto-rules
```

## Migration rule / live-project boundary

This candidate is **not** permission to delete legacy service-worker transforms or switch normal runtime transport.

Before runtime replacement/removal:
1. the reviewed account-E2EE Firestore rules/recovery boundary must be deployed and verified in the actual Firebase project under explicit handoff;
2. a real authenticated account must safely reach identity READY using the same durable keyId, with no silent replacement;
3. normal six-digit account-E2EE PIN enrollment/unlock must be explicitly wired;
4. Outbox must preserve stable message IDs/idempotent retry;
5. receive path must support v3 while retaining explicit `e2ee:1/2` readability;
6. Sent/Delivered/Read behavior must remain unchanged;
7. iPhone/iPad/PWA/offline/account-switch/reinstall tests must pass.

No live Firebase project action has been performed by this repository candidate.
