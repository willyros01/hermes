// FIDUNIO E2EE recovery v1 server persistence adapter.
// Server-only: Firebase Admin/Cloud Functions. Client code must never import this module.

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
function requireInt(value, name, min = 0) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min) throw fail("INVALID_INPUT", `${name} is invalid.`);
  return n;
}
function dataOf(snap) { return snap?.exists ? snap.data() : null; }
function assertStableSession(old, next) {
  if (!old) throw fail("SESSION_MISSING", "Recovery session does not exist.");
  for (const key of ["sessionVersion","sessionId","uid","keyId","identityRevisionAtStart","createdAtMs","expiresAtMs"]) {
    if (old[key] !== next[key]) throw fail("SESSION_CONFLICT", `Recovery session ${key} changed.`);
  }
}

export function createRecoveryFirestoreAdminRepositories({ db } = {}) {
  if (!db || typeof db.doc !== "function" || typeof db.runTransaction !== "function") throw new Error("Admin Firestore database is required.");
  const identityRef = uid => db.doc(`users/${uid}/e2ee/identity`);
  const sessionRef = sessionId => db.doc(`recoverySessions/${sessionId}`);
  const accountRef = uid => db.doc(`e2eeRecoveryState/${uid}`);

  const identityRepo = Object.freeze({
    async readIdentity(uid) {
      const snap = await identityRef(requireText(uid, "uid")).get();
      return dataOf(snap);
    }
  });

  const sessionRepo = Object.freeze({
    async createSession(session) {
      requireText(session?.sessionId, "sessionId");
      requireText(session?.uid, "uid");
      requireText(session?.keyId, "keyId");
      requireInt(session?.identityRevisionAtStart, "identityRevisionAtStart", 1);
      return db.runTransaction(async tx => {
        const ref = sessionRef(session.sessionId);
        const snap = await tx.get(ref);
        if (snap.exists) throw fail("SESSION_EXISTS", "Recovery session already exists.");
        tx.set(ref, { ...session });
        return { sessionId: session.sessionId };
      });
    },
    async readSession(sessionId) {
      const snap = await sessionRef(requireText(sessionId, "sessionId")).get();
      return dataOf(snap);
    },
    async readAccountFailureCount(uid) {
      const snap = await accountRef(requireText(uid, "uid")).get();
      const data = dataOf(snap);
      return data ? requireInt(data.consecutivePinFailures ?? 0, "consecutivePinFailures") : 0;
    },
    async saveFailedPinAttempt({ session, accountConsecutivePinFailures, accountHold }) {
      const nextSessionFailures = requireInt(session?.failedPinAttempts, "failedPinAttempts", 1);
      const nextAccountFailures = requireInt(accountConsecutivePinFailures, "accountConsecutivePinFailures", 1);
      const uid = requireText(session?.uid, "uid");
      return db.runTransaction(async tx => {
        const sRef = sessionRef(requireText(session.sessionId, "sessionId"));
        const aRef = accountRef(uid);
        const [sSnap, aSnap] = await Promise.all([tx.get(sRef), tx.get(aRef)]);
        const oldSession = dataOf(sSnap);
        assertStableSession(oldSession, session);
        if (requireInt(oldSession.failedPinAttempts ?? 0, "stored failedPinAttempts") + 1 !== nextSessionFailures) throw fail("SESSION_CONFLICT", "Recovery PIN failure counter raced.");
        if (["CONSUMED","EXPIRED","LOCKED"].includes(oldSession.status)) throw fail("SESSION_CONFLICT", "Terminal recovery session cannot record another PIN attempt.");
        const oldAccountFailures = dataOf(aSnap)?.consecutivePinFailures ?? 0;
        if (requireInt(oldAccountFailures, "stored consecutivePinFailures") + 1 !== nextAccountFailures) throw fail("ACCOUNT_CONFLICT", "Account recovery failure counter raced.");
        tx.update(sRef, { status: session.status, failedPinAttempts: nextSessionFailures });
        tx.set(aRef, { uid, consecutivePinFailures: nextAccountFailures, hold: accountHold === true }, { merge: true });
        return { failedPinAttempts: nextSessionFailures, accountConsecutivePinFailures: nextAccountFailures };
      });
    },
    async saveFailedSupplementalAttempt(session) {
      const next = requireInt(session?.failedSupplementalAttempts, "failedSupplementalAttempts", 1);
      return db.runTransaction(async tx => {
        const ref = sessionRef(requireText(session?.sessionId, "sessionId"));
        const snap = await tx.get(ref);
        const old = dataOf(snap);
        assertStableSession(old, session);
        if (["CONSUMED","EXPIRED","LOCKED"].includes(old.status)) throw fail("SESSION_CONFLICT", "Terminal recovery session cannot record another verification attempt.");
        if (requireInt(old.failedSupplementalAttempts ?? 0, "stored failedSupplementalAttempts") + 1 !== next) throw fail("SESSION_CONFLICT", "Supplemental recovery counter raced.");
        tx.update(ref, { failedSupplementalAttempts: next });
        return { failedSupplementalAttempts: next };
      });
    },
    async saveAuthorizedSession(session) {
      if (session?.status !== "AUTHORIZED") throw fail("INVALID_INPUT", "Authorized session state is required.");
      return db.runTransaction(async tx => {
        const ref = sessionRef(requireText(session?.sessionId, "sessionId"));
        const snap = await tx.get(ref);
        const old = dataOf(snap);
        assertStableSession(old, session);
        if (old.status !== "PENDING") throw fail("SESSION_CONFLICT", "Only a pending recovery session may be authorized.");
        tx.update(ref, { status: "AUTHORIZED", authorizedAtMs: session.authorizedAtMs, failedSupplementalAttempts: session.failedSupplementalAttempts });
        return { status: "AUTHORIZED" };
      });
    },
    async consumeSession({ session, accountConsecutivePinFailures }) {
      if (session?.status !== "CONSUMED") throw fail("INVALID_INPUT", "Consumed session state is required.");
      if (requireInt(accountConsecutivePinFailures, "accountConsecutivePinFailures") !== 0) throw fail("INVALID_INPUT", "Successful recovery must reset account PIN failures to zero.");
      const uid = requireText(session?.uid, "uid");
      return db.runTransaction(async tx => {
        const sRef = sessionRef(requireText(session?.sessionId, "sessionId"));
        const aRef = accountRef(uid);
        const sSnap = await tx.get(sRef);
        const old = dataOf(sSnap);
        assertStableSession(old, session);
        if (old.status !== "AUTHORIZED") throw fail("SESSION_CONFLICT", "Only an authorized recovery session may be consumed.");
        tx.update(sRef, { status: "CONSUMED", consumedAtMs: session.consumedAtMs });
        tx.set(aRef, { uid, consecutivePinFailures: 0, hold: false }, { merge: true });
        return { status: "CONSUMED", accountConsecutivePinFailures: 0 };
      });
    }
  });

  return Object.freeze({ identityRepo, sessionRepo });
}

export const RECOVERY_FIRESTORE_V1 = Object.freeze({
  sessionCollection: "recoverySessions",
  accountStateCollection: "e2eeRecoveryState",
  privateIdentityPath: "users/{uid}/e2ee/identity",
  clientWritable: false
});
