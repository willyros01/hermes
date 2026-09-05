import fs from "node:fs";

const base = fs.readFileSync("firestore.rules", "utf8");

// Once the validated E2EE v1 rules have been materialized into firestore.rules,
// the gate must test that exact production file rather than injecting a second copy.
if (base.includes("BEGIN E2EE V1 STAGED HELPERS") && base.includes("BEGIN E2EE V1 STAGED PUBLIC MATCH")) {
  exportDefault(base);
} else {
  const helpers = `
    // BEGIN E2EE V1 STAGED HELPERS — emulator candidate only
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
        && d.schemaVersion == 1 && d.identityVersion == 1
        && d.keyId is string && d.keyId.size() >= 16 && d.keyId.size() <= 128
        && d.keyAlgorithm == "ECDH-P256"
        && validNormalWrapper(d.normalWrapper) && validRecoveryWrapper(d.recoveryWrapper)
        && d.state == "ACTIVE" && d.revision == 1
        && d.createdAt == request.time && d.updatedAt == request.time;
    }
    function validPrivateIdentityNormalUpdate(d, old) {
      return d.diff(old).affectedKeys().hasOnly(["normalWrapper","revision","updatedAt"])
        && d.schemaVersion == old.schemaVersion && d.identityVersion == old.identityVersion
        && d.keyId == old.keyId && d.keyAlgorithm == old.keyAlgorithm
        && d.recoveryWrapper == old.recoveryWrapper && d.state == old.state
        && validNormalWrapper(d.normalWrapper)
        && d.revision == old.revision + 1 && d.updatedAt == request.time;
    }
    function validPublicIdentity(uid, d) {
      return d.keys().hasAll(["uid","schemaVersion","identityVersion","keyId","keyAlgorithm","publicJwk","state","createdAt","updatedAt"])
        && d.keys().hasOnly(["uid","schemaVersion","identityVersion","keyId","keyAlgorithm","publicJwk","state","createdAt","updatedAt"])
        && d.uid == uid && d.schemaVersion == 1 && d.identityVersion == 1
        && d.keyId is string && d.keyId.size() >= 16 && d.keyId.size() <= 128
        && d.keyAlgorithm == "ECDH-P256"
        && d.publicJwk is map
        && d.publicJwk.keys().hasAll(["kty","crv","x","y"])
        && d.publicJwk.keys().hasOnly(["kty","crv","x","y","ext","key_ops"])
        && d.publicJwk.kty == "EC" && d.publicJwk.crv == "P-256"
        && d.publicJwk.x is string && d.publicJwk.x.size() > 0 && d.publicJwk.x.size() <= 128
        && d.publicJwk.y is string && d.publicJwk.y.size() > 0 && d.publicJwk.y.size() <= 128
        && !("d" in d.publicJwk) && d.state == "ACTIVE";
    }
    // END E2EE V1 STAGED HELPERS
`;

  const privateMatch = `
      // BEGIN E2EE V1 STAGED PRIVATE MATCH — emulator candidate only
      match /e2ee/{docId} {
        allow get: if docId == "identity" && registered() && request.auth.uid == uid;
        allow list: if false;
        allow create: if docId == "identity" && registered() && request.auth.uid == uid && validPrivateIdentityCreate(uid, request.resource.data);
        allow update: if docId == "identity" && registered() && request.auth.uid == uid && validPrivateIdentityNormalUpdate(request.resource.data, resource.data);
        allow delete: if false;
      }
      // END E2EE V1 STAGED PRIVATE MATCH
`;

  const publicMatch = `
    // BEGIN E2EE V1 STAGED PUBLIC MATCH — emulator candidate only
    match /e2eePublicKeys/{uid} {
      allow get, list: if registered();
      allow create: if registered() && request.auth.uid == uid && validPublicIdentity(uid, request.resource.data)
        && request.resource.data.createdAt == request.time && request.resource.data.updatedAt == request.time;
      allow update, delete: if false;
    }
    // END E2EE V1 STAGED PUBLIC MATCH
`;

  const helperAnchor = "    match /system/access {";
  const deviceAnchor = "      match /devices/{deviceId} {";
  const publicAnchor = "    match /conversations/{conversationId} {";
  for (const anchor of [helperAnchor, deviceAnchor, publicAnchor]) {
    if (!base.includes(anchor)) throw new Error(`Staged rules anchor missing: ${anchor}`);
  }
  let staged = base.replace(helperAnchor, helpers + "\n" + helperAnchor);
  staged = staged.replace(deviceAnchor, privateMatch + "\n" + deviceAnchor);
  staged = staged.replace(publicAnchor, publicMatch + "\n" + publicAnchor);
  if (staged === base) throw new Error("Staged E2EE rules were not injected.");
  exportDefault(staged);
}

function exportDefault(value) {
  globalThis.__FIDUNIO_STAGED_RULES__ = value;
}

const stagedRules = globalThis.__FIDUNIO_STAGED_RULES__;
export default stagedRules;
