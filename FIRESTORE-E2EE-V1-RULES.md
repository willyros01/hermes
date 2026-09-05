# FIDUNIO Firestore E2EE v1 Rules — Bounded Integration Specification

**STATUS: REPOSITORY RULE SOURCE VALIDATED IN LOCAL EMULATOR; NOT CLAIMED DEPLOYED TO LIVE FIREBASE**

This specification defines the account-E2EE paths added without replacing unrelated invitation/user/conversation/group rules. The repository `firestore.rules` source has passed the local Emulator gate; live Firebase deployment is a separate later action.

## Paths

Private account identity:

```text
users/{uid}/e2ee/identity
```

Public correspondent key:

```text
e2eePublicKeys/{uid}
```

Server-owned recovery state (Admin/Cloud Functions only; no client rule match):

```text
recoverySessions/{sessionId}
e2eeRecoveryState/{uid}
```

Unmatched recovery collections remain client-denied by default. Admin SDK access bypasses client Security Rules and must be controlled with IAM.

## Binding helper rules

The current validated repository rule source uses the following account-E2EE constraints.

```text
function validNormalWrapper(w) {
  return w is map
    && w.keys().hasAll(["version","ciphertext","salt","iv","kdf","iterations","wrappingAlgorithm"])
    && w.keys().hasOnly(["version","ciphertext","salt","iv","kdf","iterations","wrappingAlgorithm"])
    && w.version == 1
    && w.ciphertext is string && w.ciphertext.size() > 0 && w.ciphertext.size() <= 4096
    && w.salt is string && w.salt.size() > 0 && w.salt.size() <= 128
    && w.iv is string && w.iv.size() > 0 && w.iv.size() <= 128
    && w.kdf == "PBKDF2-HMAC-SHA256"
    && w.iterations == 600000
    && w.wrappingAlgorithm == "AES-256-GCM";
}

function validRecoveryWrapper(w) {
  return w is map
    && w.keys().hasAll([
      "version","ciphertext","iv","wrappedRecoveryKey","wrappingAlgorithm",
      "recoveryAuthorityVersion","recoveryKeyIv","recoveryKeyWrappingAlgorithm"
    ])
    && w.keys().hasOnly([
      "version","ciphertext","iv","wrappedRecoveryKey","wrappingAlgorithm",
      "recoveryAuthorityVersion","recoveryKeyIv","recoveryKeyWrappingAlgorithm","metadata"
    ])
    && w.version == 1
    && w.ciphertext is string && w.ciphertext.size() > 0 && w.ciphertext.size() <= 4096
    && w.iv is string && w.iv.size() > 0 && w.iv.size() <= 128
    && w.wrappedRecoveryKey is string && w.wrappedRecoveryKey.size() > 0 && w.wrappedRecoveryKey.size() <= 8192
    && w.recoveryKeyIv is string && w.recoveryKeyIv.size() > 0 && w.recoveryKeyIv.size() <= 128
    && w.wrappingAlgorithm == "AES-256-GCM"
    && w.recoveryKeyWrappingAlgorithm == "HMAC-SHA256+A256GCM"
    && w.recoveryAuthorityVersion == 1
    && (!("metadata" in w) || w.metadata is map);
}

function validPrivateIdentityCreate(uid, d) {
  return d.keys().hasAll(["schemaVersion","identityVersion","keyId","keyAlgorithm","normalWrapper","recoveryWrapper","state","revision","createdAt","updatedAt"])
    && d.keys().hasOnly(["schemaVersion","identityVersion","keyId","keyAlgorithm","normalWrapper","recoveryWrapper","state","revision","createdAt","updatedAt"])
    && d.schemaVersion == 1
    && d.identityVersion == 1
    && d.keyId is string && d.keyId.size() >= 16 && d.keyId.size() <= 128
    && d.keyAlgorithm == "ECDH-P256"
    && validNormalWrapper(d.normalWrapper)
    && validRecoveryWrapper(d.recoveryWrapper)
    && d.state == "ACTIVE"
    && d.revision == 1
    && d.createdAt == request.time
    && d.updatedAt == request.time;
}

function validPrivateIdentityNormalUpdate(d, old) {
  return d.diff(old).affectedKeys().hasOnly(["normalWrapper","revision","updatedAt"])
    && d.schemaVersion == old.schemaVersion
    && d.identityVersion == old.identityVersion
    && d.keyId == old.keyId
    && d.keyAlgorithm == old.keyAlgorithm
    && d.recoveryWrapper == old.recoveryWrapper
    && d.state == old.state
    && validNormalWrapper(d.normalWrapper)
    && d.revision == old.revision + 1
    && d.updatedAt == request.time;
}

function validPublicIdentity(uid, d) {
  return d.keys().hasAll(["uid","schemaVersion","identityVersion","keyId","keyAlgorithm","publicJwk","state","createdAt","updatedAt"])
    && d.keys().hasOnly(["uid","schemaVersion","identityVersion","keyId","keyAlgorithm","publicJwk","state","createdAt","updatedAt"])
    && d.uid == uid
    && d.schemaVersion == 1
    && d.identityVersion == 1
    && d.keyId is string && d.keyId.size() >= 16 && d.keyId.size() <= 128
    && d.keyAlgorithm == "ECDH-P256"
    && d.publicJwk is map
    && d.publicJwk.keys().hasAll(["kty","crv","x","y"])
    && d.publicJwk.keys().hasOnly(["kty","crv","x","y","ext","key_ops"])
    && d.publicJwk.kty == "EC"
    && d.publicJwk.crv == "P-256"
    && d.publicJwk.x is string && d.publicJwk.x.size() > 0 && d.publicJwk.x.size() <= 128
    && d.publicJwk.y is string && d.publicJwk.y.size() > 0 && d.publicJwk.y.size() <= 128
    && !("d" in d.publicJwk)
    && d.state == "ACTIVE";
}
```

## Binding matches

Inside `match /users/{uid}`:

```text
match /e2ee/{docId} {
  allow get: if docId == "identity" && registered() && request.auth.uid == uid;
  allow list: if false;
  allow create: if docId == "identity"
    && registered()
    && request.auth.uid == uid
    && validPrivateIdentityCreate(uid, request.resource.data);
  allow update: if docId == "identity"
    && registered()
    && request.auth.uid == uid
    && validPrivateIdentityNormalUpdate(request.resource.data, resource.data);
  allow delete: if false;
}
```

Top-level public key path:

```text
match /e2eePublicKeys/{uid} {
  allow get, list: if registered();
  allow create: if registered()
    && request.auth.uid == uid
    && validPublicIdentity(uid, request.resource.data)
    && request.resource.data.createdAt == request.time
    && request.resource.data.updatedAt == request.time;
  allow update, delete: if false;
}
```

## Why public client update is denied in v1

Ordinary password/PIN re-wrap does not change the durable account public key. Denying public-key update prevents a compromised ordinary client from silently replacing an established public identity. Rotation/migration requires a separate reviewed protocol.

## Recovery server behavior

`recoveryKeyIv` and `recoveryKeyWrappingAlgorithm` are required because the server protects the random 256-bit RUK independently from the client recovery ciphertext. The current v1 server construction is `HMAC-SHA256+A256GCM`, binding master secret + UID + keyId + six-digit PIN. Firestore never stores plaintext PIN, RUK, private key, derived recovery key, or recovery master secret.

Cloud Functions/Admin SDK bypasses these client rules. Recovery server code therefore uses separate server-only `recoverySessions` and `e2eeRecoveryState` collections governed by IAM and narrow function capabilities.

## Validation status

The staged account-E2EE rules passed 40/40 Local Emulator assertions covering private/public access, field allowlists, algorithms, revision discipline, immutable recovery wrapper, atomic private+public creation, no partial residue, and regressions for invitations/profiles/direct conversations/messages/legacy devices/groups.

After materialization into repository `firestore.rules`, the exact repository source was re-tested. The later recovery RUK metadata correction was also tested through the same 40-assertion gate before being materialized.

**Important:** repository-source validation is not the same as deploying rules to the live Firebase project. Do not claim live deployment until an explicit Firebase deploy succeeds.

Existing legacy `/users/{uid}/devices/{deviceId}` rules remain until the account-E2EE messaging migration is complete and validated.
