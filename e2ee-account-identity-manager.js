import {
  generateAccountIdentity,
  wrapPrivateKeyNormal,
  unwrapPrivateKeyNormal,
  generateRecoveryUnlockKey,
  wrapPrivateKeyRecovery,
  unwrapPrivateKeyRecovery,
  randomKeyId,
  validateSixDigitPin
} from "./e2ee-account-crypto.js";

const STATES = Object.freeze({
  EMPTY: "EMPTY",
  ENROLLING: "ENROLLING",
  LOCKED: "LOCKED",
  UNLOCKING: "UNLOCKING",
  READY: "READY",
  REWRAPPING: "REWRAPPING",
  RECOVERING: "RECOVERING",
  ERROR: "ERROR"
});

function requireFn(obj, name) {
  if (!obj || typeof obj[name] !== "function") throw new Error(`Missing identity adapter method: ${name}`);
}
function requireUid(uid) {
  const value = String(uid || "");
  if (!value) throw new Error("Authenticated UID is required.");
  return value;
}
function clonePublicJwk(jwk) {
  return { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, ext: true, key_ops: [] };
}
function privateDoc({ keyId, normalWrapper, recoveryWrapper, revision = 1 }) {
  return {
    schemaVersion: 1,
    identityVersion: 1,
    keyId,
    keyAlgorithm: "ECDH-P256",
    normalWrapper,
    recoveryWrapper,
    state: "ACTIVE",
    revision
  };
}
function publicDoc({ uid, keyId, publicJwk }) {
  return {
    uid,
    schemaVersion: 1,
    identityVersion: 1,
    keyId,
    keyAlgorithm: "ECDH-P256",
    publicJwk: clonePublicJwk(publicJwk),
    state: "ACTIVE"
  };
}

export function createAccountE2EEIdentityManager({ identityStore, recoveryService, onStateChange } = {}) {
  ["readIdentity", "createIdentity", "updateNormalWrapper"].forEach(name => requireFn(identityStore, name));
  ["protectRecoveryKey"].forEach(name => requireFn(recoveryService, name));

  let state = STATES.EMPTY;
  let activeUid = null;
  let runtime = null;
  let tail = Promise.resolve();

  function publishState(next, detail = null) {
    state = next;
    onStateChange?.({ state, uid: activeUid, keyId: runtime?.keyId || null, revision: runtime?.revision || null, detail });
  }
  function serialize(operation) {
    const run = tail.then(operation, operation);
    tail = run.catch(() => {});
    return run;
  }
  function assertAccount(uid) {
    const clean = requireUid(uid);
    if (activeUid && activeUid !== clean) throw new Error("Identity manager is bound to another account. Call resetForSignOut first.");
    activeUid = clean;
    return clean;
  }
  async function load(uid) {
    return serialize(async () => {
      const clean = assertAccount(uid);
      const doc = await identityStore.readIdentity(clean);
      runtime = null;
      publishState(doc ? STATES.LOCKED : STATES.EMPTY);
      return doc;
    });
  }
  async function enroll({ uid, password, pin }) {
    return serialize(async () => {
      const clean = assertAccount(uid);
      validateSixDigitPin(pin);
      const existing = await identityStore.readIdentity(clean);
      if (existing) {
        publishState(STATES.LOCKED);
        throw new Error("Durable E2EE identity already exists; replacement is forbidden.");
      }
      publishState(STATES.ENROLLING);
      let generated = null;
      let ruk = null;
      try {
        generated = await generateAccountIdentity();
        const keyId = randomKeyId();
        const normalWrapper = await wrapPrivateKeyNormal({ privatePkcs8: generated.privatePkcs8, password, pin, uid: clean, keyId });
        ruk = generateRecoveryUnlockKey();
        const recoveryWrapperLocal = await wrapPrivateKeyRecovery({ privatePkcs8: generated.privatePkcs8, recoveryUnlockKey: ruk, uid: clean, keyId });
        const protectedRecovery = await recoveryService.protectRecoveryKey({ uid: clean, keyId, pin, recoveryUnlockKey: ruk });
        const recoveryWrapper = { ...recoveryWrapperLocal, ...protectedRecovery };
        const created = await identityStore.createIdentity({
          uid: clean,
          privateIdentity: privateDoc({ keyId, normalWrapper, recoveryWrapper }),
          publicIdentity: publicDoc({ uid: clean, keyId, publicJwk: generated.publicJwk })
        });
        runtime = { uid: clean, keyId, revision: created?.revision || 1, privateKey: generated.pair.privateKey };
        publishState(STATES.READY);
        return { keyId, revision: runtime.revision, publicJwk: generated.publicJwk };
      } catch (error) {
        runtime = null;
        publishState(STATES.ERROR, "ENROLL_FAILED");
        throw error;
      } finally {
        generated = null;
        ruk = null;
      }
    });
  }
  async function unlock({ uid, password, pin }) {
    return serialize(async () => {
      const clean = assertAccount(uid);
      validateSixDigitPin(pin);
      const doc = await identityStore.readIdentity(clean);
      if (!doc) {
        publishState(STATES.EMPTY);
        throw new Error("Durable E2EE identity does not exist.");
      }
      publishState(STATES.UNLOCKING);
      try {
        const privateKey = await unwrapPrivateKeyNormal({ wrapper: doc.normalWrapper, password, pin, uid: clean, keyId: doc.keyId });
        runtime = { uid: clean, keyId: doc.keyId, revision: doc.revision, privateKey };
        publishState(STATES.READY);
        return { keyId: doc.keyId, revision: doc.revision, privateKey };
      } catch (error) {
        runtime = null;
        publishState(STATES.LOCKED, "UNLOCK_FAILED");
        throw error;
      }
    });
  }
  async function rewrap({ uid, oldPassword, oldPin, newPassword, newPin }) {
    return serialize(async () => {
      const clean = assertAccount(uid);
      validateSixDigitPin(oldPin);
      validateSixDigitPin(newPin);
      const doc = await identityStore.readIdentity(clean);
      if (!doc) throw new Error("Durable E2EE identity does not exist.");
      publishState(STATES.REWRAPPING);
      try {
        const oldKey = await unwrapPrivateKeyNormal({ wrapper: doc.normalWrapper, password: oldPassword, pin: oldPin, uid: clean, keyId: doc.keyId, extractable: true });
        const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", oldKey));
        const candidate = await wrapPrivateKeyNormal({ privatePkcs8: pkcs8, password: newPassword, pin: newPin, uid: clean, keyId: doc.keyId });
        const verify = await unwrapPrivateKeyNormal({ wrapper: candidate, password: newPassword, pin: newPin, uid: clean, keyId: doc.keyId });
        const updated = await identityStore.updateNormalWrapper({ uid: clean, keyId: doc.keyId, expectedRevision: doc.revision, normalWrapper: candidate });
        runtime = { uid: clean, keyId: doc.keyId, revision: updated?.revision || doc.revision + 1, privateKey: verify };
        publishState(STATES.READY);
        return { keyId: doc.keyId, revision: runtime.revision };
      } catch (error) {
        runtime = null;
        publishState(STATES.LOCKED, "REWRAP_FAILED");
        throw error;
      }
    });
  }
  async function recover({ uid, recoveryUnlockKey, newPassword, pin }) {
    return serialize(async () => {
      const clean = assertAccount(uid);
      validateSixDigitPin(pin);
      const doc = await identityStore.readIdentity(clean);
      if (!doc) throw new Error("Durable E2EE identity does not exist.");
      publishState(STATES.RECOVERING);
      try {
        const recoveredKey = await unwrapPrivateKeyRecovery({ wrapper: doc.recoveryWrapper, recoveryUnlockKey, uid: clean, keyId: doc.keyId, extractable: true });
        const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", recoveredKey));
        const candidate = await wrapPrivateKeyNormal({ privatePkcs8: pkcs8, password: newPassword, pin, uid: clean, keyId: doc.keyId });
        const verify = await unwrapPrivateKeyNormal({ wrapper: candidate, password: newPassword, pin, uid: clean, keyId: doc.keyId });
        const updated = await identityStore.updateNormalWrapper({ uid: clean, keyId: doc.keyId, expectedRevision: doc.revision, normalWrapper: candidate });
        runtime = { uid: clean, keyId: doc.keyId, revision: updated?.revision || doc.revision + 1, privateKey: verify };
        publishState(STATES.READY);
        return { keyId: doc.keyId, revision: runtime.revision };
      } catch (error) {
        runtime = null;
        publishState(STATES.LOCKED, "RECOVERY_FAILED");
        throw error;
      }
    });
  }
  function getRuntimeIdentity() {
    return runtime ? { ...runtime } : null;
  }
  function getState() {
    return { state, uid: activeUid, keyId: runtime?.keyId || null, revision: runtime?.revision || null };
  }
  function resetForSignOut() {
    activeUid = null;
    runtime = null;
    publishState(STATES.EMPTY);
  }

  return Object.freeze({ load, enroll, unlock, rewrap, recover, getRuntimeIdentity, getState, resetForSignOut, STATES });
}
