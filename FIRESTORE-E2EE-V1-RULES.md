# FIDUNIO Firestore E2EE v1 Rules — Exact Validated Schema

**STATUS: REPOSITORY RULE SOURCE VALIDATED IN LOCAL EMULATOR; NOT DEPLOYED TO LIVE FIREBASE**

This document records the exact account-E2EE schema currently implemented in repository `firestore.rules`. It does not authorize deployment by itself.

## Paths

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

The recovery collections have no client allow rule and therefore remain denied to browser clients. Firebase Admin/Cloud Functions access is controlled by IAM because Admin SDK bypasses client Security Rules.

## Exact private identity shape

```text
schemaVersion: 1
identityVersion: 1
keyId: string, 16..128 characters
keyAlgorithm: "ECDH-P256"
normalWrapper: exact Normal Wrapper below
recoveryWrapper: exact Recovery Wrapper below
state: "ACTIVE"
revision: 1 on create, then exact +1 normal rewraps
createdAt: request.time on create
updatedAt: request.time on create/update
```

No additional top-level field is permitted.

### Exact Normal Wrapper

Exactly these fields are permitted:

```text
version: 1
ciphertext: non-empty string, <=4096
salt: non-empty string, <=128
iv: non-empty string, <=128
kdf: "PBKDF2-HMAC-SHA256"
iterations: 600000
wrappingAlgorithm: "AES-256-GCM"
```

### Exact Recovery Wrapper

Exactly these fields are permitted:

```text
version: 1
ciphertext: non-empty string, <=4096
iv: non-empty string, <=128
wrappedRecoveryKey: non-empty string, <=8192
wrappingAlgorithm: "AES-256-GCM"
recoveryAuthorityVersion: 1
recoveryKeyIv: non-empty string, <=128
recoveryKeyWrappingAlgorithm: "HMAC-SHA256+A256GCM"
```

**Generic `metadata` is not permitted.** Recovery protocol data is represented only by the explicit versioned fields above.

## Exact public identity shape

Exactly these fields are permitted:

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

The public JWK is exactly:

```json
{
  "kty": "EC",
  "crv": "P-256",
  "x": "...",
  "y": "..."
}
```

No `d`, `ext`, `key_ops`, `alg`, `use`, or other JWK field is allowed.

## Client permissions

For `users/{uid}/e2ee/identity`:

- authenticated, registered owner: `get` allowed;
- collection `list`: denied;
- create: owner only and only exact valid v1 shape;
- update: owner only, and only `normalWrapper`, `revision`, `updatedAt` may change;
- update must preserve schemaVersion, identityVersion, keyId, keyAlgorithm, recoveryWrapper, state;
- revision must equal previous revision + 1;
- delete: denied.

For `e2eePublicKeys/{uid}`:

- registered authenticated users: `get` and `list` allowed;
- create: owning UID only and exact valid v1 shape;
- update/delete: denied.

Public-key rotation is therefore not an ordinary client operation in v1.

## Recovery-server boundary

The client-created recovery ciphertext uses `recoveryWrapper.ciphertext` and `recoveryWrapper.iv`. The server separately protects the random 256-bit Recovery Unlock Key using:

```text
recoveryAuthorityVersion: 1
recoveryKeyWrappingAlgorithm: "HMAC-SHA256+A256GCM"
recoveryKeyIv
wrappedRecoveryKey
```

Firestore never stores plaintext PIN, plaintext RUK, private PKCS#8, password, derived recovery AES key, or recovery master secret.

## Validation status

The current emulator gate contains **42 assertions**. It covers the original private/public/atomic/regression matrix plus two exact-schema regressions:

1. generic recovery `metadata` is rejected;
2. public JWK `ext`/`key_ops` are rejected.

Latest validated `main` rules run before rebuild branching: GitHub Actions run `33974521992`, successful. The rebuild branch additionally runs the same rules gate as part of `Rebuild Baseline Security Gate`.

Passing CI proves repository rule behavior under the Firebase Local Emulator Suite. It does **not** mean the rules were deployed to the live Firebase project.

## Legacy rule status

Legacy `/users/{uid}/devices/{deviceId}` permissions and legacy message envelope support remain temporarily because the current runtime still contains migration-era per-device behavior. They may be removed only after the rebuilt account-authoritative messaging path replaces them and passes device validation.

## 0.9.8.0–0.9.8.5 invitation/install checkpoint — repository validated

Runtime 0.9.8.5 completes the invitation/join/install phase. `invitation-owner.js` is the sole serialized invitation mutation coordinator while `firebase.js` remains the sole Firebase repository/SDK owner. Pure `invitation-policy.js` enforces single-use lifecycle, issuer roles and target roles. Auth and Settings request invitation work through that owner. Firestore emulator coverage proves anonymous validation of a known token, unauthorized issuance/revocation denial, owner issuance/revocation, atomic accepted-invitation + active-profile enrollment, and second-redemption denial. Joined active profiles flow into existing direct/group discovery without device binding.

`install-guidance.js` owns only an optional predefined Settings Install panel. It never mutates invitation, account, messaging or service-worker state and never uses automatic install prompting. iOS uses Safari Share -> Add to Home Screen; Android/Fire and desktop use browser-provided install/add/shortcut commands when available. The rejected 0.9.4.12–0.9.4.15 invite/install logic was not restored or adapted. Protected iPhone Back/wrap, Settings deterministic ownership and two-pane architecture remain gated. Full Rebuild Baseline Security Gate `34065528714` SUCCESS. No live Firebase or htest deployment occurred. Next allocated build: 0.9.9.0 Group Info completion.
