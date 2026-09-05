import { createHmac, createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "node:crypto";

const PROTOCOL_VERSION = 1;
const MASTER_BYTES = 32;
const RUK_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const te = new TextEncoder();

function fail(code, message, cause) {
  const error = new Error(message);
  error.code = code;
  if (cause) error.cause = cause;
  return error;
}

function requireText(value, name) {
  const v = String(value ?? "");
  if (!v.length) throw fail("INVALID_INPUT", `${name} is required.`);
  return v;
}

function requirePin(pin) {
  const v = String(pin ?? "");
  if (!/^\d{6}$/.test(v)) throw fail("INVALID_INPUT", "PIN must be exactly six digits.");
  return v;
}

function requireBytes(value, expectedLength, name) {
  const b = Buffer.isBuffer(value) ? Buffer.from(value) : Buffer.from(value ?? []);
  if (b.length !== expectedLength) throw fail("INVALID_INPUT", `${name} must be ${expectedLength} bytes.`);
  return b;
}

function b64url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

function unb64url(value, name) {
  if (typeof value !== "string" || !value.length || !/^[A-Za-z0-9_-]+$/.test(value)) throw fail("FORMAT_ERROR", `${name} is invalid.`);
  try { return Buffer.from(value, "base64url"); }
  catch (cause) { throw fail("FORMAT_ERROR", `${name} is invalid.`, cause); }
}

export function recoveryKdfContext({ uid, keyId, pin }) {
  return Buffer.from(JSON.stringify([
    "FIDUNIO-E2EE-RECOVERY-KDF",
    PROTOCOL_VERSION,
    requireText(uid, "uid"),
    requireText(keyId, "keyId"),
    requirePin(pin)
  ]), "utf8");
}

export function recoveryAad({ uid, keyId }) {
  return Buffer.from(JSON.stringify([
    "FIDUNIO-E2EE-RECOVERY-RUK",
    PROTOCOL_VERSION,
    requireText(uid, "uid"),
    requireText(keyId, "keyId")
  ]), "utf8");
}

export function deriveRecoveryWrappingKey({ masterSecret, uid, keyId, pin }) {
  const master = requireBytes(masterSecret, MASTER_BYTES, "masterSecret");
  return createHmac("sha256", master).update(recoveryKdfContext({ uid, keyId, pin })).digest();
}

export function protectRecoveryUnlockKey({ masterSecret, uid, keyId, pin, recoveryUnlockKey }) {
  const ruk = requireBytes(recoveryUnlockKey, RUK_BYTES, "recoveryUnlockKey");
  const key = deriveRecoveryWrappingKey({ masterSecret, uid, keyId, pin });
  const iv = randomBytes(IV_BYTES);
  const aad = recoveryAad({ uid, keyId });
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(ruk), cipher.final()]);
  const tag = cipher.getAuthTag();
  key.fill(0);
  return Object.freeze({
    recoveryAuthorityVersion: PROTOCOL_VERSION,
    recoveryKeyWrappingAlgorithm: "HMAC-SHA256+A256GCM",
    recoveryKeyIv: b64url(iv),
    wrappedRecoveryKey: b64url(Buffer.concat([ciphertext, tag]))
  });
}

export function recoverRecoveryUnlockKey({ masterSecret, uid, keyId, pin, protectedRecoveryKey }) {
  if (!protectedRecoveryKey || protectedRecoveryKey.recoveryAuthorityVersion !== PROTOCOL_VERSION || protectedRecoveryKey.recoveryKeyWrappingAlgorithm !== "HMAC-SHA256+A256GCM") {
    throw fail("FORMAT_ERROR", "Unsupported recovery-key protection format.");
  }
  const packed = unb64url(protectedRecoveryKey.wrappedRecoveryKey, "wrappedRecoveryKey");
  const iv = unb64url(protectedRecoveryKey.recoveryKeyIv, "recoveryKeyIv");
  if (iv.length !== IV_BYTES || packed.length !== RUK_BYTES + TAG_BYTES) throw fail("FORMAT_ERROR", "Recovery-key protection length is invalid.");
  const ciphertext = packed.subarray(0, RUK_BYTES);
  const tag = packed.subarray(RUK_BYTES);
  const key = deriveRecoveryWrappingKey({ masterSecret, uid, keyId, pin });
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv, { authTagLength: TAG_BYTES });
    decipher.setAAD(recoveryAad({ uid, keyId }));
    decipher.setAuthTag(tag);
    const ruk = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    if (ruk.length !== RUK_BYTES) throw fail("RECOVERY_FAILED", "Recovery authorization failed.");
    return ruk;
  } catch (cause) {
    throw fail("RECOVERY_FAILED", "Recovery authorization failed.", cause);
  } finally {
    key.fill(0);
  }
}

export function sameSecret(a, b) {
  const x = Buffer.from(a ?? []), y = Buffer.from(b ?? []);
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

export const RECOVERY_SERVER_V1 = Object.freeze({
  protocolVersion: PROTOCOL_VERSION,
  masterSecretBytes: MASTER_BYTES,
  recoveryUnlockKeyBytes: RUK_BYTES,
  ivBytes: IV_BYTES,
  tagBytes: TAG_BYTES,
  kdf: "HMAC-SHA256",
  wrappingAlgorithm: "AES-256-GCM"
});
