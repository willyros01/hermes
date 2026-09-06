# FIDUNIO Firebase Recovery Project Configuration Gate

**STATUS: LIVE HANDOFF STARTED — BILLING/BLAZE + APP CHECK PROVIDER PREP COMPLETE; ENFORCEMENT/DEPLOYMENT NOT STARTED**

This document is the controlled handoff from repository-only account-E2EE/recovery/message preparation to Firebase/Google project configuration. The live-project boundary has now been entered in a limited way. Billing/Blaze and App Check provider preparation were completed, but no recovery secret, IAM change, Functions deployment, Firestore rules deployment, or App Check enforcement has been performed.

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

## Live Firebase state confirmed during handoff

- Firebase project: `FIDUNIO`
- Project ID: `fidunio-fef13`
- Project number: `130339622893`
- Firestore `(default)`: Native mode, `nam5 (United States)`
- Billing plan: Blaze
- Billing account linked; project budget alert configured separately by the owner
- reCAPTCHA Enterprise API enabled
- reCAPTCHA Enterprise Web key registered for `willyros01.github.io`
- Firebase App Check Web app registered with reCAPTCHA Enterprise
- App Check token TTL remains the default 1 hour
- App Check enforcement remains OFF
- Firestore App Check metrics currently show unverified live traffic because the App Check-enabled rebuild client has not been deployed to the live site
- No recovery secret has been created
- No recovery Functions have been deployed
- No production Firestore rules from this rebuild have been deployed
- No IAM recovery-secret grant has been made
- No normal FIDUNIO direct-message transport cutover to `e2ee:3` has occurred

## Process-integrity deviation discovered September 5, 2026

A process audit found that the mandatory repository-first startup rule was not followed at the start of the later App Check continuation. `hermes-memory.txt` and the mandatory architecture documents should have been reread before implementation/console guidance, but conversational carry-over was relied on instead.

Consequences identified by audit:

1. `firebase-app-check.js` was introduced as a second direct Firebase SDK owner even though the published target authority says `firebase.js` is the sole Firebase SDK/service owner.
2. `runtime-authority-gate.test.mjs` was modified to allow the second owner instead of first reconciling the implementation with the published authority map.
3. App Check initialization was placed after `initFirebase()`/first auth callback instead of being integrated into the single central Firebase initialization path before protected service use.
4. App Check provider setup advanced into part of Stage D before Stage C supplemental recovery verifier design was finalized.
5. Durable handoff documentation was not updated immediately after billing/App Check progress, leaving stale text that later caused an attempted repeat of already-completed inventory work.

This is a process/architecture deviation, not evidence of a live Firebase compromise. App Check enforcement remains off, recovery completion remains fail-closed, no secret/function/rules deployment occurred, and no transport cutover occurred.

### Required rectification before further live Firebase work

- Re-read all mandatory project authorities before every implementation continuation.
- Restore `firebase.js` as the sole runtime Firebase SDK/service owner.
- Move App Check initialization into the central Firebase initialization path and remove the extra Firebase owner.
- Restore the runtime authority gate so it enforces one Firebase SDK/service owner rather than weakening the gate for the implementation.
- Update App Check tests to enforce central initialization ordering and to distinguish repository/static integration success from live token verification.
- Re-run the full security gate after the rectification.
- Keep Firebase console work paused at the Stage C boundary until the supplemental recovery verifier is finalized/reviewed.
- Update this document, `hermes-memory.txt`, and `REBUILD-BASELINE-AUDIT.md` as each rectification step is completed.

## Why the live-project boundary is now required

The next architecture step cannot be completed safely by repository code alone:

1. normal account identity enrollment must atomically establish both normal and recovery wrappers, so the recovery enrollment callable/secret boundary must actually exist before enrollment is enabled;
2. an existing durable identity must be readable/unlockable under the exact reviewed client rules in the actual project;
3. direct-message runtime must not cut over from the last working legacy per-device compatibility path until a real authenticated account can reach account E2EE `READY` without generating a replacement identity;
4. legacy service-worker E2EE transforms therefore remain intentionally in place until the live account-E2EE boundary is proven.

Read-only inventory and billing/App Check provider preparation have already occurred. The next permitted architectural decision point is Stage C: finalize supplemental recovery verification before secret/IAM/Functions deployment.

## Live project actions that require project-owner/operator intervention

### 1. Confirm exact Firebase project and billing state — COMPLETED

The correct project and billing state have been confirmed as recorded above. Do not repeat this inventory unless a later inconsistency requires it.

### 2. Review final function region

The scaffold currently uses `us-central1`. Before first deployment, compare this with the actual Firestore/project location and choose deliberately. Changing a function region later creates a different deployed location.

### 3. Confirm billing/API readiness — PARTIALLY COMPLETED

Blaze is active. Do not automatically enable additional APIs in a batch. Any still-missing Cloud Functions 2nd gen / Secret Manager / build/runtime dependency must be listed and approved deliberately before enabling.

### 4. Create recovery master secret only when explicitly authorized — NOT STARTED

Secret name:

```text
FIDUNIO_RECOVERY_MASTER_V1
```

Required value: exactly 32 cryptographically random bytes encoded base64url without padding.

The value must never be placed in GitHub, Firebase client config, Firestore, Notes, screenshots, Gemini or ChatGPT. Generate/enter it only in Google's protected environment during the approved secret-provisioning step.

### 5. IAM least privilege — NOT STARTED

Only recovery functions that bind `FIDUNIO_RECOVERY_MASTER_V1` receive access to that secret. Never grant browser users, normal messaging code or unrelated service accounts secret access.

Recovery server data scope is limited to what the reviewed implementation requires, including:

```text
users/{uid}/e2ee/identity
recoverySessions/{sessionId}
e2eeRecoveryState/{uid}
```

Firebase Admin bypasses client Security Rules, so service-account/IAM review is a real security boundary.

### 6. Configure/test App Check for FIDUNIO Web/PWA — PROVIDER REGISTERED, CLIENT/LIVE PROOF PENDING

The FIDUNIO Web App is registered with reCAPTCHA Enterprise. Production callables are declared with App Check enforcement, but enforcement remains OFF.

The repository App Check client integration must first be rectified to follow the single-owner Firebase architecture, deployed to the actual live client only after review, then verified on Safari/Home Screen PWA traffic before enforcement is considered.

`completeE2EERecoveryV1` is the highest-risk endpoint and is designed for limited-use/replay-protected App Check token consumption.

### 7. Supplemental recovery verification remains intentionally unresolved/fail-closed — CURRENT BLOCKER

The current `completeE2EERecoveryV1` export intentionally refuses RUK release until an approved supplemental recovery verifier is specified, implemented and tested.

No temporary `return true`, bypass flag, test PIN, client-supplied boolean or weak security-question-only substitute is acceptable.

Until this design is completed and reviewed, recovery completion stays fail-closed and the handoff must not progress to recovery secret/IAM/Functions deployment.

### 8. Controlled deployment/rehearsal order

No blanket deployment should be the first production action. The intended staged sequence remains:

```text
A. read-only project inventory                                      COMPLETE
B. confirm exact project ID / Firestore location / region / billing COMPLETE except final function-region decision and any remaining API readiness
C. finalize supplemental recovery verifier design and repository tests CURRENT BLOCKER
D. provision recovery secret + least-privilege IAM + App Check       PARTIAL ONLY: provider registration complete; secret/IAM not started
E. deploy recovery functions only after explicit review              NOT STARTED
F. verify function names/regions/App Check/secret bindings           NOT STARTED
G. deploy the exact validated Firestore rules explicitly             NOT STARTED
H. verify live account-E2EE private/public permissions and v3 message-rule behavior with controlled test accounts/data
I. prove existing/empty account identity lifecycle without replacement
J. wire normal six-digit account-E2EE enrollment/unlock in rebuild runtime
K. only then cut over direct send/receive/Outbox to v3 and retire matching legacy transforms after device validation
```

## Explicit non-actions to preserve from this point

Until the Stage C verifier and repository App Check rectification are complete:
- do not deploy `firestore.rules`;
- do not deploy Functions;
- do not create/update `FIDUNIO_RECOVERY_MASTER_V1`;
- do not change recovery IAM;
- do not enable App Check enforcement;
- do not enable additional APIs without an explicit reviewed reason;
- do not switch normal FIDUNIO transport to v3;
- do not remove the remaining legacy per-device service-worker transforms.

## Current stop condition

Console work is paused deliberately. The next work is repository-side process rectification plus Stage C supplemental recovery verifier design/review. After each repair step, update the durable documentation before proceeding.

Do not let the console operator improvise architecture/security changes.