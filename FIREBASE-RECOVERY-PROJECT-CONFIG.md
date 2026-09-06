# FIDUNIO Firebase Recovery Project Configuration Gate

**STATUS: LIVE HANDOFF STARTED — THREE-COMPONENT RECOVERY ARCHITECTURE CONFIRMED; BILLING/BLAZE + APP CHECK PROVIDER PREP COMPLETE; ENFORCEMENT/RECOVERY DEPLOYMENT NOT STARTED**

This document is the controlled handoff from repository-only account-E2EE/recovery/message preparation to Firebase/Google project configuration. Billing/Blaze and App Check provider preparation are complete. No recovery secret, recovery IAM grant, recovery Functions deployment, production Firestore rules deployment, or App Check enforcement has been performed.

## Binding recovery architecture — confirmed

The recovery architecture is **not unresolved**. The owner previously selected a separated three-component design:

1. Firebase-authenticated FIDUNIO account/UID;
2. the user's existing exact six-digit FIDUNIO account-E2EE PIN;
3. a separate Google-hosted server-side recovery authority using Cloud Functions, least-privilege IAM and Google Secret Manager to control access to `FIDUNIO_RECOVERY_MASTER_V1`.

The browser never receives the recovery master secret. Google does not hold the account private key in plaintext. The server-side master secret protects/unprotects the Recovery Unlock Key (RUK) under the frozen recovery protocol, and successful recovery restores the **same** durable account E2EE identity. Recovery failure must never silently create a replacement identity.

The current `completeE2EERecoveryV1` scaffold may remain fail-closed until the approved server-side authority is fully represented by reviewed code/configuration and tests. That is an **implementation/configuration gate**, not an unresolved choice of supplemental recovery architecture.

The design rationale is consistent with current NIST SP 800-63B guidance that application-specific recovery methods be risk-analyzed and documented, and with NIST cloud/sync-recovery guidance favoring encrypted key material, controlled cloud access and a user-controlled secret not known to the cloud recovery provider. This is design guidance, not a claim that FIDUNIO is NIST-certified or assigned a formal NIST assurance level.

## Repository prerequisites already prepared and validated

- `functions/` is registered as Firebase Functions codebase `recovery` in `firebase.json`.
- Node.js 22 runtime is declared in `functions/package.json`.
- Firebase Functions v2 callable scaffold exists in `functions/index.mjs`.
- Firebase Admin persistence is server-only under `functions/recovery/`.
- `FIDUNIO_RECOVERY_MASTER_V1` is declared with `defineSecret()` and bound only to enrollment/completion callables.
- App Check enforcement is declared in callable options; completion is marked for limited-use token consumption.
- recovery completion remains fail-closed until the confirmed three-component authority is fully implemented/reviewed.
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

## Process-integrity corrections — September 5, 2026

Two documentation/process failures are now explicitly recorded:

1. The mandatory repository-first startup rule was not followed during the later App Check continuation. This contributed to a second Firebase SDK owner, a weakened authority gate, startup-order risk and stale handoff state.
2. The owner had already selected the three-component recovery architecture and instructed that it be recorded, but the durable recovery documents were not updated. Later work therefore incorrectly treated the supplemental recovery architecture as an unresolved Stage C design choice.

Neither failure is evidence of a live Firebase compromise. App Check enforcement remains off; recovery completion remains fail-closed; no recovery secret/IAM/Functions/rules deployment or v3 transport cutover has occurred.

### Required repository rectification still outstanding

- Restore `firebase.js` as the sole runtime Firebase SDK/service owner.
- Move App Check initialization into the central Firebase initialization path and remove the extra Firebase owner.
- Restore the runtime authority gate so it enforces one Firebase SDK/service owner.
- Update App Check tests to enforce central initialization ordering and distinguish repository/static integration success from live token verification.
- Re-run the full security gate after rectification.
- Update durable documentation after each repair milestone.

These App Check/client repairs remain mandatory before live App Check enforcement. They do not reopen the confirmed recovery architecture.

## Console-first dormant provisioning decision

The owner has elected to finish as much Google/Firebase console configuration as can safely remain dormant before the code repair. This is permitted provided that:

- App Check enforcement remains OFF;
- no recovery endpoint is made capable of releasing recovery material until the reviewed server authority is complete;
- no bypass, client-supplied authorization boolean, test PIN or weak security-question substitute is introduced;
- normal message transport is not cut over to v3;
- the remaining legacy compatibility transforms are not removed prematurely.

Accordingly, dormant infrastructure such as the recovery Secret Manager secret, narrowly scoped IAM and required Functions resources may be prepared before the client App Check repair, while active enforcement/cutover waits for reviewed code and live verification.

## Live project actions requiring owner/operator intervention

### 1. Project and billing state — COMPLETED

The correct project and billing state are confirmed above. Do not repeat broad inventory unless a specific inconsistency requires it.

### 2. Final function region — TO CONFIRM BEFORE FIRST DEPLOYMENT

The scaffold currently uses `us-central1`. Compare deliberately with the actual Firestore/project location before first deployment. Changing function region later creates a different deployed location.

### 3. Billing/API readiness — PARTIALLY COMPLETED

Blaze is active. Do not enable unrelated APIs in a batch. Enable only dependencies specifically required by the reviewed Functions v2 / Secret Manager deployment path.

### 4. Recovery master secret — READY FOR CONTROLLED DORMANT PROVISIONING

Secret name:

```text
FIDUNIO_RECOVERY_MASTER_V1
```

Required value: exactly 32 cryptographically random bytes encoded base64url without padding.

The value must never be placed in GitHub, Firebase client config, Firestore, Notes, screenshots, Gemini or ChatGPT. Generate/enter it only inside Google's protected environment during the approved provisioning step and avoid echoing it into terminal output or shell history where practical.

### 5. IAM least privilege — READY FOR CONTROLLED DORMANT PROVISIONING

Only recovery functions that bind `FIDUNIO_RECOVERY_MASTER_V1` receive access to that secret. Never grant browser users, normal messaging code or unrelated service accounts secret access.

Recovery server data scope is limited to the reviewed implementation, including:

```text
users/{uid}/e2ee/identity
recoverySessions/{sessionId}
e2eeRecoveryState/{uid}
```

Firebase Admin bypasses client Security Rules, so service-account/IAM review is a real security boundary.

### 6. App Check — PROVIDER REGISTERED; ENFORCEMENT OFF

The FIDUNIO Web App is registered with reCAPTCHA Enterprise. The repository App Check client integration must be rectified to the single-owner Firebase architecture, deployed, and verified on real Safari/Home Screen PWA traffic before enforcement is enabled.

`completeE2EERecoveryV1` is the highest-risk endpoint and is designed for limited-use/replay-protected App Check token consumption.

### 7. Three-component recovery authority — ARCHITECTURE DECIDED; IMPLEMENTATION/CONFIGURATION GATE REMAINS

Do not describe Stage C as an unresolved selection of a supplemental verifier. The selected supplemental authority is the separate Google-hosted server-side recovery component described above.

Before RUK release is enabled, verify that the deployed implementation preserves the frozen boundaries: authenticated UID, App Check, short-lived server session, exact six-digit E2EE PIN, unchanged keyId/revision, Secret Manager-held server master secret, least-privilege IAM, retry/lock policy, one-time/consumed session behavior, and no plaintext private-key/master-secret storage or logging.

### 8. Controlled handoff order — corrected

```text
A. read-only project inventory                                      COMPLETE
B. confirm project ID / Firestore location / billing                COMPLETE except final function-region decision
C. three-component recovery architecture                            COMPLETE / CONFIRMED
D. dormant recovery secret + least-privilege IAM/resources          READY; App Check provider already registered
E. rectify central Firebase/App Check client ownership + rerun CI    REQUIRED before live client enforcement
F. deploy/rehearse recovery functions fail-closed                    AFTER explicit review
G. verify function names/regions/App Check/secret bindings           AFTER deployment
H. deploy exact validated Firestore rules explicitly                 AFTER explicit review
I. verify live account-E2EE permissions and controlled recovery      BEFORE enabling RUK release/cutover
J. deploy repaired App Check client and observe verified traffic     BEFORE enforcement
K. enable App Check enforcement only after verified traffic          NOT YET
L. prove account identity lifecycle without replacement              BEFORE v3 cutover
M. wire normal six-digit account-E2EE enrollment/unlock              AFTER recovery boundary proven
N. cut over send/receive/Outbox to v3 and retire legacy transforms   LAST
```

## Explicit non-actions

Until their respective review gates are satisfied:

- do not enable App Check enforcement;
- do not make `completeE2EERecoveryV1` release a RUK through an unreviewed/bypass path;
- do not deploy production Firestore rules without explicit review;
- do not switch normal FIDUNIO transport to v3;
- do not remove remaining legacy per-device service-worker transforms;
- do not expose `FIDUNIO_RECOVERY_MASTER_V1` outside Google's protected server environment.

## Current handoff condition

The recovery architecture itself is settled. Console work may proceed with controlled dormant provisioning. Active recovery release, App Check enforcement and runtime transport cutover remain gated on reviewed implementation and live verification.

Do not let the console operator improvise architecture/security changes.
