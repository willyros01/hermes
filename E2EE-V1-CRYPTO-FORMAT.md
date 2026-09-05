# FIDUNIO E2EE v1 Cryptographic Wire Format

**STATUS: BINDING IMPLEMENTATION SPECIFICATION — SEPTEMBER 5, 2026**

This file fixes the exact v1 byte/serialization rules required before durable account E2EE identity data is written. It complements `ACCOUNT-E2EE-FIRESTORE-AUTHORITY.md`.

## 1. Account key pair

- Algorithm: Web Crypto `ECDH`.
- Named curve: `P-256`.
- One random key pair per FIDUNIO account identity.
- Stable random `keyId` is generated independently from the key pair and remains unchanged for the life of that identity.
- Public key Firestore format: JWK object exported by Web Crypto.
- Private key wrapper plaintext format: DER PKCS#8 bytes exported by Web Crypto.
- Private PKCS#8 bytes exist only transiently while creating/re-wrapping/recovering an identity and are never persisted plaintext.
- After unwrap/recovery, import the private key as a non-extractable runtime `CryptoKey` whenever no re-wrap operation requires export.

Using PKCS#8 bytes for the private wrapper avoids dependence on JSON/JWK property ordering for encrypted private-key plaintext.

## 2. Binary field encoding in Firestore

All binary wrapper fields are encoded as **base64url without padding**.

This applies to:

- normal wrapper ciphertext;
- normal wrapper salt;
- normal wrapper IV;
- recovery wrapper ciphertext;
- recovery wrapper IV;
- server-protected/wrapped recovery-key blob when represented as binary text.

Decoder MUST reject malformed base64url rather than silently repairing arbitrary input.

## 3. Normal password + PIN KDF input

Password and PIN MUST NOT be concatenated naively.

The exact UTF-8 KDF input bytes are:

```text
UTF8(JSON.stringify(["FIDUNIO-E2EE-KDF",1,password,pin]))
```

Requirements:

- `password` is the exact password string supplied by the user to this operation; no case folding or trimming.
- `pin` is exactly six ASCII digits (`000000` through `999999`); leading zeroes are significant.
- No Unicode normalization is silently applied in v1. Password bytes are the UTF-8 representation of the JavaScript string entered by the user.
- KDF: PBKDF2-HMAC-SHA-256.
- Iterations: 600000.
- Salt: 16 cryptographically random bytes per normal wrapper.
- Derived key: 256-bit AES-GCM key, non-extractable.

## 4. AES-GCM parameters

For every wrapper encryption:

- Algorithm: AES-256-GCM.
- IV: 12 cryptographically random bytes (96 bits).
- Authentication tag: 128 bits.
- IV MUST be unique for each encryption performed with a given AES key.

## 5. Canonical authenticated additional data (AAD)

AAD is an ordered JSON array, not a JavaScript object, so property-order canonicalization is unnecessary.

### Normal wrapper AAD

Exact bytes:

```text
UTF8(JSON.stringify([
  "FIDUNIO-E2EE-WRAP",
  1,
  "normal",
  uid,
  keyId,
  schemaVersion,
  identityVersion,
  wrapperVersion
]))
```

For v1 the three version values are all `1`.

### Recovery wrapper AAD

Exact bytes:

```text
UTF8(JSON.stringify([
  "FIDUNIO-E2EE-WRAP",
  1,
  "recovery",
  uid,
  keyId,
  schemaVersion,
  identityVersion,
  wrapperVersion
]))
```

The same exact AAD bytes used to encrypt MUST be supplied to decrypt. A different UID, keyId, wrapper purpose or version must fail AES-GCM authentication.

## 6. Normal wrapper operation

Creation/re-wrap:

1. Validate authenticated UID, stable keyId, password and six-digit PIN.
2. Obtain transient PKCS#8 bytes of the SAME account ECDH private key.
3. Generate new 16-byte salt and 12-byte IV.
4. Build exact KDF input and derive AES-256-GCM key with PBKDF2-SHA-256/600000.
5. Build exact normal AAD.
6. AES-GCM encrypt PKCS#8 bytes.
7. Base64url-encode ciphertext, salt and IV.
8. Locally decrypt/import candidate and verify it corresponds to the expected public identity before authoritative commit.
9. Discard transient password/PIN-derived key references and plaintext PKCS#8 bytes as soon as practical.

Unlock:

1. Decode stored salt/IV/ciphertext strictly.
2. Recreate exact KDF input from supplied password + six-digit PIN.
3. Recreate exact normal AAD from authoritative UID/keyId/version metadata.
4. Derive AES key and decrypt.
5. Import decrypted PKCS#8 as ECDH P-256 private key.
6. Failure is `UNLOCK_FAILED`; do not distinguish wrong password from wrong PIN or tampered ciphertext to the ordinary UI.
7. Never generate a replacement identity because unwrap failed.

## 7. Recovery wrapper operation

Enrollment:

1. Generate 32 cryptographically random bytes as per-user Recovery Unlock Key (`RUK`).
2. Import RUK as AES-256-GCM key.
3. Generate independent 12-byte recovery IV.
4. Encrypt the SAME transient PKCS#8 private-key bytes using recovery AAD.
5. Send RUK only to the authenticated recovery-enrollment server function over the protected request path with UID/keyId/version context.
6. Server protects/wraps RUK under the approved Google Secret Manager/KMS recovery boundary and returns only the protected RUK blob/metadata.
7. Persist recovery ciphertext/IV/protected-RUK metadata, never plaintext RUK.
8. Discard client plaintext RUK after authoritative identity enrollment succeeds.

Recovery:

1. Server releases plaintext RUK only after the approved short-lived recovery authorization succeeds.
2. Client recreates recovery AAD from authoritative metadata.
3. Client decrypts recovery ciphertext and imports SAME ECDH private key.
4. Client creates and verifies a new normal password+PIN wrapper.
5. Authoritative compare-and-update preserves keyId and increments revision.
6. Client discards transient RUK/private PKCS#8 bytes as soon as practical.

## 8. Public JWK requirements

The public record at `e2eePublicKeys/{uid}` contains the Web Crypto-exported public JWK. Before use, client code MUST validate at minimum:

- `kty == "EC"`;
- `crv == "P-256"`;
- `x` and `y` are non-empty strings;
- no private `d` member is present;
- record `uid`, `keyId`, `schemaVersion`, `identityVersion`, `keyAlgorithm` and `state` have expected values.

The public record is not an authorization source; it is encryption material for already-authorized FIDUNIO communication.

## 9. Error contract

Crypto module errors are normalized to deterministic categories:

- `INVALID_INPUT`
- `UNSUPPORTED_CRYPTO`
- `UNLOCK_FAILED`
- `IDENTITY_MISMATCH`
- `FORMAT_ERROR`

Ordinary UI must not reveal whether a failed normal unlock was specifically password, PIN, ciphertext or authentication-tag failure.

## 10. Mandatory crypto tests

Before production identity data is created, tests must cover:

1. create -> normal wrap -> normal unwrap round trip;
2. public JWK import and ECDH compatibility;
3. wrong password fails;
4. wrong PIN fails;
5. tampered ciphertext fails;
6. tampered IV fails;
7. tampered salt fails;
8. changed UID in AAD fails;
9. changed keyId in AAD fails;
10. normal/recovery purpose substitution fails;
11. recovery wrap -> RUK unwrap round trip returns same private identity;
12. malformed base64url is rejected;
13. six-digit PIN preserves leading zeroes;
14. password/PIN re-wrap keeps same keyId/public identity;
15. target Safari/PWA and Fire browser Web Crypto paths pass.

## 11. Ownership

The crypto primitive module performs cryptographic transformations only. It does not initialize Firebase, mutate Firestore, change UI, choose account state, or generate a replacement identity after failure.

The future Account E2EE Identity Manager is the sole lifecycle owner and serialized writer that invokes these primitives.
