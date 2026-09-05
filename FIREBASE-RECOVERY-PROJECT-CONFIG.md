# FIDUNIO Firebase Recovery Project Configuration Gate

**STATUS: PREPARED — DO NOT APPLY TO LIVE PROJECT UNTIL REBUILD BRANCH IS READY FOR DEPLOYMENT**

This document is the handoff from repository-only recovery work to Firebase/Google project configuration. None of these live-project actions has been performed by the rebuild branch.

For the user's planned Gemini-assisted Google/Firebase workflow, use `GEMINI-FIREBASE-HANDOFF.md`. Gemini is an operator/navigation assistant only; ChatGPT remains the FIDUNIO architecture/security authority and releases one prompt at a time after reviewing the prior result.

## Repository prerequisites already prepared

- `functions/` is registered as Firebase Functions codebase `recovery` in `firebase.json`.
- Node.js 22 runtime is declared in `functions/package.json`.
- Firebase Functions v2 callable scaffold exists in `functions/index.mjs`.
- Firebase Admin persistence is server-only under `functions/recovery/`.
- `FIDUNIO_RECOVERY_MASTER_V1` is declared with `defineSecret()` and is bound only to enrollment/completion callables.
- App Check enforcement is enabled in callable options.
- recovery completion consumes a limited-use App Check token in the scaffold.
- completion is intentionally fail-closed until supplemental recovery verification is implemented.
- repository CI validates rules, recovery crypto/session/callable/persistence, Firebase adapter, Functions scaffold import, runtime transform anchors, and runtime authority regression rules.

## Live project actions that will require the project owner

### 1. Confirm Firebase project and billing state

Cloud Functions 2nd gen and Secret Manager require the actual Firebase/Google Cloud project to be selected. Confirm the correct FIDUNIO project before any command or console change. If required by Firebase for deployment, the project must use the appropriate billing plan.

No billing change should be made merely to test repository code.

The first Google-side action should be the **read-only inventory** in `GEMINI-FIREBASE-HANDOFF.md`; no project change is authorized during that step.

### 2. Review function region

The scaffold currently uses `us-central1`. Before production deployment, confirm the Firestore/project location and decide whether that region is appropriate. Changing region after deployment creates a new function location, so this is a pre-deployment decision.

### 3. Create the recovery master secret

Secret name:

```text
FIDUNIO_RECOVERY_MASTER_V1
```

Required value: exactly 32 cryptographically random bytes encoded base64url without padding.

The value must never be placed in GitHub, Firebase client config, Firestore, Notes, screenshots, Gemini, or ChatGPT.

The secret should be generated/entered directly in Google's protected environment only when deployment is authorized.

### 4. Enable required Google/Firebase services

Deployment may require enabling the services used by Cloud Functions 2nd gen, Cloud Build/Artifact Registry, Eventarc infrastructure, Secret Manager, and Firebase App Check. Enable only what the Firebase deployment flow actually requires for this project.

The Gemini operator must report missing services first rather than enabling them without an explicit ChatGPT-approved prompt.

### 5. IAM least privilege

Only recovery functions that bind `FIDUNIO_RECOVERY_MASTER_V1` should receive access to that secret. Do not grant browser users, normal messaging code, or unrelated service accounts access to the recovery secret.

The function service account needs only the Firestore/Admin capabilities required for:

```text
users/{uid}/e2ee/identity
recoverySessions/{sessionId}
e2eeRecoveryState/{uid}
```

The exact IAM review occurs before deployment because Firebase Admin bypasses client Firestore Security Rules.

### 6. Configure App Check for the FIDUNIO web app

Production callables are defined with App Check enforcement. Before enabling live recovery use, the FIDUNIO web/PWA client must be registered with an appropriate Firebase App Check provider and tested on the target Safari/PWA environments.

`completeE2EERecoveryV1` is designed as the highest-risk endpoint and uses limited-use/replay-protected App Check tokens in the Functions scaffold.

### 7. Implement supplemental recovery verification

This is the remaining code/security gate before RUK release is enabled.

The current `completeE2EERecoveryV1` export intentionally throws a failed-precondition response. It cannot release the RUK. Replace that fail-closed boundary only after the approved supplemental verifier is specified, implemented, and tested.

No temporary `return true`, bypass flag, test PIN, security question alone, or client-supplied authorization boolean is acceptable.

### 8. Deploy in controlled order

When all gates are satisfied, use a controlled sequence:

```text
A. verify current Firebase project
B. provision secret / IAM / App Check
C. deploy recovery functions only
D. run non-production recovery integration tests
E. deploy validated Firestore rules explicitly
F. verify live rule/function versions
G. only then wire normal FIDUNIO UI to the recovery callables
```

Do not use a blanket deployment as the first production action.

## Stop condition

Repository work may continue without the project owner until one of these becomes necessary:

- selecting/confirming the actual Firebase project;
- changing billing;
- choosing the final Cloud Functions region when project location must be confirmed;
- creating the Secret Manager value;
- changing IAM;
- registering/enforcing App Check;
- executing a live Firebase deploy.

At that point, stop and guide the project owner one console/CLI/Gemini action at a time.
