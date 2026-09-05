# FIDUNIO Firestore E2EE v1 Rules — Bounded Integration Specification

**STATUS: READY FOR EMULATOR VALIDATION; DO NOT DEPLOY BLINDLY**

This specification defines the new account-E2EE paths without replacing unrelated existing invitation/user/conversation/group rules.

## New paths

Private:

```text
users/{uid}/e2ee/identity
```

Public:

```text
e2eePublicKeys/{uid}
```

## Intended rule helpers

The following helpers are designed to be added inside the existing `/databases/{database}/documents` scope:

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
    && w.keys().hasAll(["version","ciphertext","iv","wrappedRecoveryKey","wrappingAlgorithm","recoveryAuthorityVersion"])
    && w.keys().hasOnly(["version","ciphertext","iv","wrappedRecoveryKey","wrappingAlgorithm","recoveryAuthorityVersion","metadata"])
    && w.version == 1
    && w.ciphertext is string && w.ciphertext.size() > 0 && w.ciphertext.size() <= 4096
    && w.iv is string && w.iv.size() > 0 && w.iv.size() <= 128
    && w.wrappedRecoveryKey is string && w.wrappedRecoveryKey.size() > 0 && w.wrappedRecoveryKey.size() <= 8192
    && w.wrappingAlgorithm == "AES-256-GCM"
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
    && d.publicJwk.kty == "EC"
    && d.publicJwk.crv == "P-256"
    && d.publicJwk.x is string && d.publicJwk.x.size() > 0 && d.publicJwk.x.size() <= 128
    && d.publicJwk.y is string && d.publicJwk.y.size() > 0 && d.publicJwk.y.size() <= 128
    && !("d" in d.publicJwk)
    && d.state == "ACTIVE";
}
```

## Intended bounded match additions

Inside the existing `match /users/{uid}` block:

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

At top document scope alongside other top-level collections:

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

### Why public client update is denied in v1

Ordinary password/PIN re-wrap does not change the account public key, so no public-key update is required. Denying client update prevents a compromised ordinary client path from silently replacing an established public identity. A future reviewed identity migration/key rotation must use an explicit migration protocol rather than relaxing this rule casually.

### Recovery server behavior

The Cloud Function/Admin SDK bypasses these client Security Rules and therefore is governed by IAM. Recovery server changes must still preserve stable `keyId` and must not casually rewrite the public key. Recovery IAM is intentionally separate from client rule authorization.

## Emulator test matrix — mandatory before merging these snippets into deployed rules

1. unauthenticated get private identity -> DENY.
2. authenticated owner get own private identity -> ALLOW.
3. authenticated other UID get private identity -> DENY.
4. owner list private `/e2ee` subcollection -> DENY.
5. owner create valid identity revision 1 -> ALLOW.
6. other UID create identity under owner -> DENY.
7. owner create with plaintext-like unexpected field -> DENY by field allowlist.
8. owner create with wrong algorithm/KDF/iterations -> DENY.
9. owner normal re-wrap changing only normalWrapper + revision + updatedAt -> ALLOW.
10. owner normal re-wrap revision not exactly old+1 -> DENY.
11. owner update changing keyId -> DENY.
12. owner update changing recoveryWrapper -> DENY.
13. owner update changing state -> DENY.
14. owner delete private identity -> DENY.
15. registered user get public key -> ALLOW.
16. registered user list public keys -> ALLOW only as deliberately accepted for correspondent lookup.
17. unauthenticated public-key read -> DENY.
18. owner create valid public record -> ALLOW.
19. other UID create public record for owner -> DENY.
20. public JWK containing private `d` -> DENY.
21. public record with unexpected field -> DENY.
22. client update established public key -> DENY.
23. client delete public key -> DENY.
24. existing invitations/users/conversations/groups/receipts regression tests -> unchanged PASS.

## Important deployment rule

Do not replace `firestore.rules` wholesale with the snippets in this document. Merge only the bounded helper/match additions into the existing rules after Emulator tests pass. Existing legacy `/users/{uid}/devices/{deviceId}` rules remain until the account-E2EE messaging migration is complete and validated.
