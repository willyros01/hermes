# FIDUNIO Account E2EE Direct-Message Format

**STATUS: ISOLATED REPOSITORY CANDIDATE — NOT YET WIRED TO RUNTIME OR LIVE FIREBASE**

This document defines the first account-authoritative replacement for the legacy per-device direct-message envelopes still injected by `service-worker.js`. It is deliberately isolated behind tests before any transport migration occurs.

## Ownership and boundary

`e2ee-account-message-crypto.js` owns only direct-message cryptographic transformation. It does not initialize Firebase, write Firestore, mutate UI/local storage, select recipients, create account identities, unlock account identities, or modify Outbox state.

The runtime account private key must come from the validated `e2ee-account-identity-manager.js` owner. Peer public key material must come from the authoritative `e2eePublicKeys/{uid}` account record through central `firebase.js` ownership.

No service-worker transform is removed by introducing this isolated module.

## Version

New account-authoritative direct messages use:

```text
e2ee: 3
kdfVersion: 1
```

Legacy `e2ee: 1` and per-device `e2ee: 2` remain migration formats and must stay readable until a deliberate compatibility retirement gate is passed.

## Key agreement

For a direct conversation between two different authenticated accounts:

1. sender/recipient use their durable account ECDH P-256 identities;
2. Web Crypto ECDH derives 256 shared-secret bits;
3. the raw shared secret is imported as HKDF key material;
4. HKDF-SHA-256 derives a non-extractable AES-256-GCM message key scoped to the direct conversation and the two durable account key identities.

Device ID is not part of key agreement, routing, AAD, or decryptability.

### Canonical account pair

The KDF uses the two `[uid,keyId]` tuples sorted by UID then keyId. This makes key derivation direction-independent while still binding the derived key to the exact durable account identities.

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

The derived key is AES-GCM 256-bit, non-extractable, with encrypt/decrypt usages.

## Message encryption

- AES-256-GCM
- fresh random 12-byte IV per message
- 128-bit authentication tag
- plaintext is exact UTF-8 message text
- serialized binary fields are base64url without padding

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

This binds ciphertext to its conversation, stable message ID, direction, and durable sender/recipient key identities. Copying ciphertext to another conversation/message/direction or substituting a key identity must fail.

## Exact isolated envelope

The crypto module returns exactly:

```text
e2ee: 3
kdfVersion: 1
senderKeyId
recipientKeyId
ciphertext
iv
```

No plaintext `text`, device ID, device envelope map, sender device public key, or recipient device list is part of this account-authoritative crypto envelope.

The eventual Firestore transport row may contain separately authorized non-cryptographic message metadata such as `senderUid`, timestamps, and receipt state, but that integration is a later bounded step and must be validated against exact Security Rules before deployment.

## Public-key validation

The peer JWK accepted by this module must contain exactly:

```text
kty
crv
x
y
```

with `kty="EC"` and `crv="P-256"`. Extra JWK fields, including `d`, `ext`, `key_ops`, `alg`, or `use`, are rejected in this format.

## Failure behavior

- malformed/mismatched structure: `FORMAT_ERROR`
- missing runtime material/context: `INVALID_INPUT`
- unavailable Web Crypto: `UNSUPPORTED_CRYPTO`
- encryption failure: `ENCRYPT_FAILED`
- authenticated decryption failure: `DECRYPT_FAILED`

A decryption failure never creates or rotates an identity.

## Migration rule

This module is not permission to delete the legacy service-worker transforms. Runtime replacement must later establish all of the following before removing per-device send/decrypt behavior:

1. authenticated account E2EE identity is `READY` with a non-extractable private key;
2. peer account public identity is loaded and validated from `e2eePublicKeys/{uid}`;
3. Firestore message rules accept the exact reviewed account-message schema without weakening legacy compatibility prematurely;
4. Outbox writes stable message IDs and retries the same logical message idempotently;
5. receive path can read `e2ee:3` while retaining explicit legacy `e2ee:1/2` migration readability;
6. Sent/Delivered/Read behavior remains unchanged;
7. iPhone/iPad/offline/account-switch/reinstall tests pass.

## Repository test gate

`e2ee-account-message-crypto.test.mjs` covers directional round trips, exact envelope shape, no plaintext, AAD context substitution, wrong account keys, ciphertext/IV tampering, keyId substitution, strict base64url, exact public JWK shape, empty payload, and Unicode payload.

No live Firebase project action is required for this isolated crypto gate.
