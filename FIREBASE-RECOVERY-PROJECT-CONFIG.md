# FIDUNIO Firebase Recovery Project Configuration Gate

**STATUS: REPOSITORY PRE-HANDOFF READY — LIVE PROJECT STILL UNTOUCHED**

This document is the controlled handoff from repository-only account-E2EE/recovery/message preparation to Firebase/Google project configuration. None of the live-project actions below has been performed by the rebuild branch.

For the user's planned Gemini-assisted Google/Firebase workflow, use `GEMINI-FIREBASE-HANDOFF.md`. Gemini is an operator/navigation assistant only; ChatGPT remains the FIDUNIO architecture/security authority and releases one prompt at a time after reviewing the prior result.

## Repository prerequisites already prepared and validated

- `functions/` is registered as Firebase Functions codebase `recovery` in `firebase.json`.
- Node.js 22 runtime is declared in `functions/package.json`.
- Firebase Functions v2 callable scaffold exists in `functions/index.mjs`.
- Firebase Admin persistence is server-only under `functions/recovery/`.
- `FIDUNIO_RECOVERY_MASTER_V1` is declared with `defineSecret()` and bound only to enrollment/completion callables.
- App Check enforcement is declared in callable options; completion is marked for limited-use token consumption.
- recovery completion remains intentionally fail-closed until supplemental recovery verification is implemented/reviewed.
- exact account-E2EE private/public Firestore rules pass the original 42-assertion emulator gate.
- account direct-message `e2ee:3` crypto is validated in isolation.
- exact repository Firestore acceptance for v3 account messages passes a dedicated emulator-only matrix while preserving legacy plaintext/e2ee:1/e2ee:2 migration compatibility.
- `e2ee-account-message-service.js` fails closed unless the local durable account identity is READY and the peer exact public account identity is available.
- the full expanded `Rebuild Baseline Security Gate` passed at `ca9222bdb7171ae60de5b2b9c08bf5b9327f52c9`.
- protected checkpoint: `checkpoint-rebuild-account-dm-v3-crypto-rules`.

Repository validation does **not** imply any live Firebase rule/function configuration has changed.

## Why the live-project boundary is now required

The next architecture step cannot be completed safely by repository code alone:

1. normal account identity enrollment must atomically establish both normal and recovery wrappers, so the recovery enrollment callable/secret boundary must actually exist before enrollment is enabled;
2. an existing durable identity must be readable/unlockable under the exact reviewed client rules in the actual project;
3. direct-message runtime must not cut over from the last working legacy per-device compatibility path until a real authenticated account can reach account E2EE `READY` without generating a replacement identity;
4. legacy service-worker E2EE transforms therefore remain intentionally in place until the live account-E2EE boundary is proven.

The first Google-side action is **read-only inventory only**. No deploy/change is implied by reaching this boundary.

## Live project actions that require project-owner/operator intervention

### 1. Confirm exact Firebase project and billing state — READ ONLY FIRST

Confirm the correct FIDUNIO Firebase/Google Cloud project before any command or console change. Report exact project ID, billing plan, Firestore location, Web App registration, current Functions/Secret Manager/App Check state and any existing related resources.

The first operator action must be Prompt 1 in `GEMINI-FIREBASE-HANDOFF.md`. It makes no changes.

### 2. Review final function region

The scaffold currently uses `us-central1`. Before first deployment, compare this with the actual Firestore/project location and choose deliberately. Changing a function region later creates a different deployed location.

### 3. Confirm billing/API readiness without enabling anything automatically

Cloud Functions 2nd gen / Secret Manager and their build/runtime dependencies may require billing and APIs. Inventory/report first. Missing services must be listed and approved individually before enabling.

No billing change should be made merely to run repository tests.

### 4. Create recovery master secret only when explicitly authorized

Secret name:

```text
FIDUNIO_RECOVERY_MASTER_V1
```

Required value: exactly 32 cryptographically random bytes encoded base64url without padding.

The value must never be placed in GitHub, Firebase client config, Firestore, Notes, screenshots, Gemini or ChatGPT. Generate/enter it only in Google's protected environment during the approved secret-provisioning step.

### 5. IAM least privilege

Only recovery functions that bind `FIDUNIO_RECOVERY_MASTER_V1` receive access to that secret. Never grant browser users, normal messaging code or unrelated service accounts secret access.

Recovery server data scope is limited to what the reviewed implementation requires, including:

```text
users/{uid}/e2ee/identity
recoverySessions/{sessionId}
e2eeRecoveryState/{uid}
```

Firebase Admin bypasses client Security Rules, so service-account/IAM review is a real security boundary.

### 6. Configure/test App Check for FIDUNIO Web/PWA

Production callables are declared with App Check enforcement. Verify the actual FIDUNIO Web App registration/provider and target Safari/Home Screen PWA compatibility before recovery is enabled.

`completeE2EERecoveryV1` is the highest-risk endpoint and is designed for limited-use/replay-protected App Check token consumption.

### 7. Supplemental recovery verification remains intentionally unresolved/fail-closed

The current `completeE2EERecoveryV1` export intentionally refuses RUK release until an approved supplemental recovery verifier is specified, implemented and tested.

No temporary `return true`, bypass flag, test PIN, client-supplied boolean or weak security-question-only substitute is acceptable.

This decision may be completed after read-only project inventory because available Google/Firebase account-verification capabilities can affect the best implementation. Until then, completion stays fail-closed.

### 8. Controlled deployment/rehearsal order

No blanket deployment should be the first production action. The intended staged sequence is:

```text
A. read-only project inventory
B. confirm exact project ID / Firestore location / final region / billing and API readiness
C. finalize supplemental recovery verifier design and repository tests
D. provision recovery secret + least-privilege IAM + App Check
E. deploy recovery functions only while completion remains verified fail-closed if supplemental verification is not yet enabled
F. verify function names/regions/App Check/secret bindings
G. deploy the exact validated Firestore rules explicitly
H. verify live account-E2EE private/public permissions and v3 message-rule behavior with controlled test accounts/data
I. prove existing/empty account identity lifecycle without replacement
J. wire normal six-digit account-E2EE enrollment/unlock in rebuild runtime
K. only then cut over direct send/receive/Outbox to v3 and retire matching legacy transforms after device validation
```

Whether step E is useful before supplemental verifier completion will be decided after the read-only inventory; no deployment is pre-authorized here.

## Explicit non-actions to preserve

Until the project-owner handoff begins:
- do not deploy `firestore.rules`;
- do not deploy Functions;
- do not create/update `FIDUNIO_RECOVERY_MASTER_V1`;
- do not change IAM;
- do not enable/enforce App Check;
- do not enable APIs;
- do not change billing;
- do not switch normal FIDUNIO transport to v3;
- do not remove the remaining legacy per-device service-worker transforms.

## Stop condition reached

Repository work has now reached the first genuine project-owner dependency: identifying the actual live Firebase/Google project state. The next permitted handoff action is the **read-only Prompt 1 inventory** in `GEMINI-FIREBASE-HANDOFF.md` when the user is ready.

After each Google/Firebase operator step, return the result to ChatGPT before advancing. Do not let the console operator improvise architecture/security changes.
