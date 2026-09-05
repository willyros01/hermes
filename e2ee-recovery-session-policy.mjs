export const RECOVERY_SESSION_V1 = Object.freeze({
  version: 1,
  lifetimeMs: 10 * 60 * 1000,
  maxPinFailuresPerSession: 5,
  maxAccountConsecutivePinFailures: 10,
  statuses: Object.freeze({
    PENDING: "PENDING",
    AUTHORIZED: "AUTHORIZED",
    CONSUMED: "CONSUMED",
    LOCKED: "LOCKED",
    EXPIRED: "EXPIRED"
  })
});

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}
function requireText(value, name) {
  const v = String(value ?? "");
  if (!v.length) throw fail("INVALID_INPUT", `${name} is required.`);
  return v;
}
function requireRevision(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw fail("INVALID_INPUT", "identityRevisionAtStart must be a positive integer.");
  return n;
}
function requireTime(value, name) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw fail("INVALID_INPUT", `${name} must be a valid epoch-millisecond value.`);
  return n;
}
function requireSession(session) {
  if (!session || typeof session !== "object") throw fail("INVALID_INPUT", "Recovery session is required.");
  return session;
}
function terminal(status) {
  return [RECOVERY_SESSION_V1.statuses.CONSUMED, RECOVERY_SESSION_V1.statuses.LOCKED, RECOVERY_SESSION_V1.statuses.EXPIRED].includes(status);
}

export function createRecoverySession({ sessionId, uid, keyId, identityRevisionAtStart, nowMs }) {
  const now = requireTime(nowMs, "nowMs");
  return Object.freeze({
    sessionVersion: RECOVERY_SESSION_V1.version,
    sessionId: requireText(sessionId, "sessionId"),
    uid: requireText(uid, "uid"),
    keyId: requireText(keyId, "keyId"),
    identityRevisionAtStart: requireRevision(identityRevisionAtStart),
    status: RECOVERY_SESSION_V1.statuses.PENDING,
    createdAtMs: now,
    expiresAtMs: now + RECOVERY_SESSION_V1.lifetimeMs,
    failedPinAttempts: 0,
    failedSupplementalAttempts: 0,
    authorizedAtMs: null,
    consumedAtMs: null
  });
}

export function normalizeForTime(session, nowMs) {
  const s = requireSession(session);
  const now = requireTime(nowMs, "nowMs");
  if (terminal(s.status)) return s;
  if (now >= s.expiresAtMs) return Object.freeze({ ...s, status: RECOVERY_SESSION_V1.statuses.EXPIRED });
  return s;
}

export function assertRecoveryAttemptAllowed({ session, uid, keyId, currentIdentityRevision, accountConsecutivePinFailures, nowMs }) {
  const s = normalizeForTime(session, nowMs);
  if (s.uid !== requireText(uid, "uid")) throw fail("RECOVERY_DENIED", "Recovery authorization failed.");
  if (s.keyId !== requireText(keyId, "keyId")) throw fail("RECOVERY_STALE", "Recovery session no longer matches the account identity.");
  if (s.identityRevisionAtStart !== requireRevision(currentIdentityRevision)) throw fail("RECOVERY_STALE", "Recovery session no longer matches the account identity.");
  const accountFailures = Number(accountConsecutivePinFailures ?? 0);
  if (!Number.isInteger(accountFailures) || accountFailures < 0) throw fail("INVALID_INPUT", "Account recovery failure counter is invalid.");
  if (accountFailures >= RECOVERY_SESSION_V1.maxAccountConsecutivePinFailures) throw fail("ACCOUNT_HOLD", "Recovery is temporarily unavailable.");
  if (s.status === RECOVERY_SESSION_V1.statuses.EXPIRED) throw fail("SESSION_EXPIRED", "Recovery session expired.");
  if (s.status === RECOVERY_SESSION_V1.statuses.LOCKED) throw fail("SESSION_LOCKED", "Recovery session is locked.");
  if (s.status === RECOVERY_SESSION_V1.statuses.CONSUMED) throw fail("SESSION_CONSUMED", "Recovery session has already been used.");
  if (![RECOVERY_SESSION_V1.statuses.PENDING, RECOVERY_SESSION_V1.statuses.AUTHORIZED].includes(s.status)) throw fail("RECOVERY_DENIED", "Recovery authorization failed.");
  return s;
}

export function registerFailedPinAttempt({ session, accountConsecutivePinFailures, nowMs }) {
  const s = normalizeForTime(session, nowMs);
  if (terminal(s.status)) throw fail("RECOVERY_DENIED", "Recovery session cannot accept another PIN attempt.");
  const currentAccount = Number(accountConsecutivePinFailures ?? 0);
  if (!Number.isInteger(currentAccount) || currentAccount < 0) throw fail("INVALID_INPUT", "Account recovery failure counter is invalid.");
  const failedPinAttempts = Number(s.failedPinAttempts || 0) + 1;
  const nextAccount = currentAccount + 1;
  const lockSession = failedPinAttempts >= RECOVERY_SESSION_V1.maxPinFailuresPerSession;
  const accountHold = nextAccount >= RECOVERY_SESSION_V1.maxAccountConsecutivePinFailures;
  return Object.freeze({
    session: Object.freeze({ ...s, failedPinAttempts, status: lockSession ? RECOVERY_SESSION_V1.statuses.LOCKED : s.status }),
    accountConsecutivePinFailures: nextAccount,
    sessionLocked: lockSession,
    accountHold
  });
}

export function registerFailedSupplementalAttempt({ session, nowMs }) {
  const s = normalizeForTime(session, nowMs);
  if (terminal(s.status)) throw fail("RECOVERY_DENIED", "Recovery session cannot accept another verification attempt.");
  return Object.freeze({ ...s, failedSupplementalAttempts: Number(s.failedSupplementalAttempts || 0) + 1 });
}

export function authorizeRecoverySession({ session, nowMs }) {
  const s = normalizeForTime(session, nowMs);
  if (s.status !== RECOVERY_SESSION_V1.statuses.PENDING) throw fail("RECOVERY_DENIED", "Recovery session is not pending authorization.");
  const now = requireTime(nowMs, "nowMs");
  return Object.freeze({ ...s, status: RECOVERY_SESSION_V1.statuses.AUTHORIZED, authorizedAtMs: now });
}

export function consumeRecoverySession({ session, nowMs }) {
  const s = normalizeForTime(session, nowMs);
  if (s.status !== RECOVERY_SESSION_V1.statuses.AUTHORIZED) throw fail("RECOVERY_DENIED", "Recovery session is not authorized for consumption.");
  const now = requireTime(nowMs, "nowMs");
  return Object.freeze({ ...s, status: RECOVERY_SESSION_V1.statuses.CONSUMED, consumedAtMs: now });
}

export function resetAccountRecoveryFailuresAfterSuccess() {
  return 0;
}
