import { randomBytes } from "node:crypto";
import { protectRecoveryUnlockKey, recoverRecoveryUnlockKey } from "./e2ee-recovery-server-crypto.mjs";
import {
  RECOVERY_SESSION_V1,
  createRecoverySession,
  assertRecoveryAttemptAllowed,
  beginRecoveryPinAttempt,
  registerFailedPinAttempt,
  consumeRecoverySession,
  resetAccountRecoveryFailuresAfterSuccess
} from "./e2ee-recovery-session-policy.mjs";

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
function requireCaller({ authUid, appCheckValid }, { requireAppCheck }) {
  const uid = requireText(authUid, "authUid");
  if (requireAppCheck && appCheckValid !== true) throw fail("APP_CHECK_REQUIRED", "Recovery authorization failed.");
  return uid;
}
function decodeRuk(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) throw fail("INVALID_INPUT", "Recovery key is invalid.");
  const b = Buffer.from(value, "base64url");
  if (b.length !== 32) throw fail("INVALID_INPUT", "Recovery key is invalid.");
  return b;
}
function encodeRuk(value) { return Buffer.from(value).toString("base64url"); }
function requireRepo(repo, names, label) {
  for (const name of names) if (!repo || typeof repo[name] !== "function") throw new Error(`Missing ${label} method: ${name}`);
}
async function ownedMasterSecret(masterSecretProvider) {
  const supplied = await masterSecretProvider();
  return Buffer.from(supplied ?? []);
}

export function createRecoveryCallableCore({
  masterSecretProvider,
  identityRepo,
  sessionRepo,
  requireAppCheck = true,
  now = () => Date.now(),
  newSessionId = () => randomBytes(24).toString("base64url")
} = {}) {
  if (typeof masterSecretProvider !== "function") throw new Error("masterSecretProvider is required.");
  if (typeof requireAppCheck !== "boolean") throw new Error("requireAppCheck must be boolean.");
  requireRepo(identityRepo, ["readIdentity"], "identityRepo");
  requireRepo(sessionRepo, ["createSession","readSession","readAccountFailureCount","beginPinAttempt","saveFailedPinAttempt","consumeSession"], "sessionRepo");

  async function enrollRecoveryV1({ authUid, appCheckValid, data }) {
    const uid = requireCaller({ authUid, appCheckValid }, { requireAppCheck });
    const keyId = requireText(data?.keyId, "keyId");
    const pin = requirePin(data?.pin);
    const ruk = decodeRuk(data?.recoveryUnlockKey);
    const masterSecret = await ownedMasterSecret(masterSecretProvider);
    try {
      return protectRecoveryUnlockKey({ masterSecret, uid, keyId, pin, recoveryUnlockKey: ruk });
    } finally {
      ruk.fill(0);
      masterSecret.fill(0);
    }
  }

  async function startE2EERecoveryV1({ authUid, appCheckValid }) {
    const uid = requireCaller({ authUid, appCheckValid }, { requireAppCheck });
    const [identity, accountFailures] = await Promise.all([
      identityRepo.readIdentity(uid),
      sessionRepo.readAccountFailureCount(uid)
    ]);
    if (!identity?.keyId || !Number.isInteger(identity?.revision)) throw fail("IDENTITY_MISSING", "Recovery is unavailable for this account.");
    if (Number(accountFailures || 0) >= RECOVERY_SESSION_V1.maxAccountConsecutivePinFailures) throw fail("ACCOUNT_HOLD", "Recovery is temporarily unavailable.");
    const session = createRecoverySession({
      sessionId: newSessionId(),
      uid,
      keyId: identity.keyId,
      identityRevisionAtStart: identity.revision,
      nowMs: now()
    });
    await sessionRepo.createSession(session);
    return { sessionId: session.sessionId, expiresAtMs: session.expiresAtMs, status: session.status };
  }

  async function completeE2EERecoveryV1({ authUid, appCheckValid, data }) {
    const uid = requireCaller({ authUid, appCheckValid }, { requireAppCheck });
    const sessionId = requireText(data?.sessionId, "sessionId");
    const pin = requirePin(data?.pin);
    const [sessionRead, identity, accountFailures] = await Promise.all([
      sessionRepo.readSession(sessionId),
      identityRepo.readIdentity(uid),
      sessionRepo.readAccountFailureCount(uid)
    ]);
    if (!sessionRead || !identity?.keyId || !Number.isInteger(identity?.revision)) throw fail("RECOVERY_DENIED", "Recovery authorization failed.");
    const pending = assertRecoveryAttemptAllowed({
      session: sessionRead,
      uid,
      keyId: identity.keyId,
      currentIdentityRevision: identity.revision,
      accountConsecutivePinFailures: accountFailures,
      nowMs: now()
    });

    // Firestore serializes the transition PENDING -> VERIFYING before any PIN
    // cryptography runs. Concurrent completion calls cannot perform parallel PIN
    // guesses against the same recovery session.
    const verifyingCandidate = beginRecoveryPinAttempt({ session: pending, nowMs: now() });
    const verifying = await sessionRepo.beginPinAttempt(verifyingCandidate);

    let ruk;
    const masterSecret = await ownedMasterSecret(masterSecretProvider);
    try {
      ruk = recoverRecoveryUnlockKey({
        masterSecret,
        uid,
        keyId: identity.keyId,
        pin,
        protectedRecoveryKey: identity.recoveryWrapper
      });
    } catch (cause) {
      const failed = registerFailedPinAttempt({ session: verifying, accountConsecutivePinFailures: accountFailures, nowMs: now() });
      await sessionRepo.saveFailedPinAttempt({
        session: failed.session,
        accountConsecutivePinFailures: failed.accountConsecutivePinFailures,
        accountHold: failed.accountHold
      });
      throw fail("RECOVERY_DENIED", "Recovery authorization failed.", cause);
    } finally {
      masterSecret.fill(0);
    }

    const consumed = consumeRecoverySession({ session: verifying, nowMs: now() });
    await sessionRepo.consumeSession({
      session: consumed,
      accountConsecutivePinFailures: resetAccountRecoveryFailuresAfterSuccess()
    });
    const encoded = encodeRuk(ruk);
    ruk.fill(0);
    return { recoveryUnlockKey: encoded, keyId: identity.keyId, identityRevision: identity.revision };
  }

  return Object.freeze({ enrollRecoveryV1, startE2EERecoveryV1, completeE2EERecoveryV1 });
}
