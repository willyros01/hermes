import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { createRecoveryCallableCore } from "./recovery/e2ee-recovery-callable-core.mjs";
import { createRecoveryFirestoreAdminRepositories } from "./recovery/e2ee-recovery-firestore-admin-adapter.mjs";

if (!getApps().length) initializeApp();

const RECOVERY_MASTER = defineSecret("FIDUNIO_RECOVERY_MASTER_V1");
const db = getFirestore();
const { identityRepo, sessionRepo } = createRecoveryFirestoreAdminRepositories({ db });

function decodeMasterSecret() {
  const raw = String(RECOVERY_MASTER.value() || "");
  if (!/^[A-Za-z0-9_-]+$/.test(raw)) throw new Error("Recovery master secret format is invalid.");
  const bytes = Buffer.from(raw, "base64url");
  if (bytes.length !== 32) throw new Error("Recovery master secret must decode to exactly 32 bytes.");
  return bytes;
}

// The completion endpoint remains deliberately fail-closed until the approved
// supplemental recovery verifier is implemented and reviewed. This prevents an
// accidental scaffold deployment from releasing a Recovery Unlock Key.
async function supplementalVerifier() { return false; }

const core = createRecoveryCallableCore({
  masterSecretProvider: async () => decodeMasterSecret(),
  identityRepo,
  sessionRepo,
  supplementalVerifier
});

function mapError(error) {
  const code = String(error?.code || "");
  if (code === "INVALID_INPUT") return new HttpsError("invalid-argument", "Recovery request is invalid.");
  if (code === "APP_CHECK_REQUIRED") return new HttpsError("failed-precondition", "Recovery authorization failed.");
  if (["SESSION_EXPIRED","SESSION_LOCKED","SESSION_CONSUMED","RECOVERY_STALE","RECOVERY_DENIED","ACCOUNT_HOLD","IDENTITY_MISSING"].includes(code)) {
    return new HttpsError("permission-denied", "Recovery authorization failed.");
  }
  console.error("FIDUNIO recovery callable failed", { code: code || "INTERNAL" });
  return new HttpsError("internal", "Recovery service is unavailable.");
}

async function invoke(handler, request) {
  try {
    return await handler({
      authUid: request.auth?.uid || "",
      appCheckValid: !!request.app,
      data: request.data || {}
    });
  } catch (error) {
    throw mapError(error);
  }
}

const common = Object.freeze({
  region: "us-central1",
  enforceAppCheck: true,
  timeoutSeconds: 30,
  memory: "256MiB",
  maxInstances: 10
});

export const enrollRecoveryV1 = onCall(
  { ...common, secrets: [RECOVERY_MASTER] },
  request => invoke(core.enrollRecoveryV1, request)
);

export const startE2EERecoveryV1 = onCall(
  common,
  request => invoke(core.startE2EERecoveryV1, request)
);

export const completeE2EERecoveryV1 = onCall(
  { ...common, secrets: [RECOVERY_MASTER], consumeAppCheckToken: true },
  async () => {
    throw new HttpsError(
      "failed-precondition",
      "E2EE recovery completion is not enabled until supplemental verification is configured."
    );
  }
);
