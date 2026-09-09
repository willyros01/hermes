# FIDUNIO Firebase Recovery Project Configuration Gate

## FIDUNIO 1.1 notification configuration authority

Before any live Firebase Messaging / Web Push / VAPID / notification Cloud Function configuration or deployment, read `FCM-NOTIFICATION-ARCHITECTURE.md`. That document defines the notification architecture and the explicit Google/Firebase handoff barrier. The N1 documentation checkpoint does NOT authorize or imply any live Firebase Messaging, VAPID, Functions, Firestore-rule, or Google Cloud configuration change.

**STATUS: RECOVERY SOURCE + APP CHECK OWNERSHIP REPAIRED AND FULL SECURITY GATE GREEN; LIVE FUNCTIONS DEPLOYMENT NEXT; APP CHECK ENFORCEMENT OFF**

This document is the controlled handoff from repository account-E2EE/recovery preparation to the remaining Firebase/Google deployment step. The three-component recovery architecture is settled. Recovery source, App Check ownership, Firestore rules, Secret Manager and recovery-secret IAM preparation have been reconciled. Recovery Functions have not yet been deployed.

## Binding recovery architecture — final

FIDUNIO recovery uses exactly three authority components:

1. Firebase-authenticated FIDUNIO account/UID;
2. the user's existing exact six-digit FIDUNIO account-E2EE PIN;
3. a separate Google-hosted server-side recovery authority using Cloud Functions, least-privilege IAM and Google Secret Manager to control access to `FIDUNIO_RECOVERY_MASTER_V1`.

There is no supplemental recovery verifier, security question, extra recovery password, second PIN, test PIN or client-supplied bypass. The obsolete prototype-era supplemental verifier and its `AUTHORIZED`/supplemental-attempt state were removed on September 6, 2026.

The browser never receives the recovery master secret. Google does not hold the account private key in plaintext. The server-side master secret protects/unprotects the Recovery Unlock Key (RUK) under the frozen recovery protocol, and successful recovery restores the **same** durable account E2EE identity. Recovery failure must never silently create a replacement identity.

## Reviewed repository implementation

- `functions/` is registered as Firebase Functions codebase `recovery` in `firebase.json`.
- Node.js 22 runtime is declared in `functions/package.json`.
- Firebase Functions v2 callables are exported from `functions/index.mjs`.
- Firebase Admin persistence is server-only under `functions/recovery/`.
- `FIDUNIO_RECOVERY_MASTER_V1` is declared with `defineSecret()` and bound only to enrollment/completion callables.
- all recovery callables use the dedicated runtime service account `fidunio-recovery@fidunio-fef13.iam.gserviceaccount.com`.
- App Check enforcement is deliberately OFF in the current Functions source with `REQUIRE_APP_CHECK = false`.
- `completeE2EERecoveryV1` is wired to the reviewed three-component recovery core; the obsolete hardcoded fail-closed supplemental-verifier stub is gone.
- session completion is serialized through Firestore `PENDING -> VERIFYING` before PIN/master-secret cryptography, preventing parallel PIN guesses against the same session.
- wrong PIN returns `VERIFYING -> PENDING` or `LOCKED` while atomically updating retry counters.
- successful recovery consumes the `VERIFYING` session and resets the account PIN-failure counter before returning the RUK.
- exact account-E2EE private/public Firestore rules and account direct-message v3 acceptance gates remain green.
- `e2ee-account-message-service.js` remains fail-closed unless the durable account identity is READY and the peer exact public account identity is available.
- normal direct-message transport has **not** been cut over to `e2ee:3`.

## Security validation — September 6, 2026

Full `Rebuild Baseline Security Gate` runs completed successfully after the recovery repair and after the App Check ownership repair.

- run `34011470856` / run #304: success after serialized recovery implementation tests;
- run `34011694149` / run #316: success after restoring `firebase.js` as sole Firebase SDK/service owner and restoring the strict runtime authority gate;
- run `34011735357` / run #318: success on commit `f7d764df29fd936d2893645813257ea19deda6c1`, including the strengthened Cloud Functions scaffold guard.

The final run passed Firestore E2EE rules, account-message rules, recovery crypto/session/callable/Firestore persistence, central Firebase E2EE adapter, account lifecycle, account-message crypto/service, central App Check integration, Cloud Functions scaffold, runtime transform anchors and runtime authority.

Repository CI proves reviewed repository behavior. It does not by itself prove live runtime IAM or live client App Check traffic.

## Live Firebase/Google state

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
- **App Check enforcement remains OFF**
- recovery master secret `FIDUNIO_RECOVERY_MASTER_V1` exists; version 1 is enabled; its value has never been exposed through repository/chat output
- dedicated recovery service account exists: `fidunio-recovery@fidunio-fef13.iam.gserviceaccount.com`
- that service account has narrowly scoped Secret Accessor access on the recovery secret
- Functions region is settled as `us-central1`
- reviewed Firestore rules are live and verified
- active Firestore ruleset: `projects/fidunio-fef13/rulesets/52ea515e-359f-453f-8822-3c0f6ef2659a`
- previous ruleset: `projects/fidunio-fef13/rulesets/42640d51-c425-4615-bcdf-44d9be990c3f`
- all three Recovery Functions are deployed and verified ACTIVE
- no normal FIDUNIO direct-message transport cutover to `e2ee:3` has occurred

## App Check ownership correction — complete

The prototype-era App Check implementation created a second direct Firebase SDK owner in `firebase-app-check.js` and weakened the runtime authority gate to permit it. That architecture was rejected and has been repaired.

Current authority:

- `firebase.js` is the sole runtime Firebase SDK/service owner, including App Check;
- `firebase.js` initializes the single Firebase app, then App Check, then Auth/Firestore services;
- `auth-ui-clean.js` no longer creates a second App Check lifecycle;
- `firebase-app-check.js` has been deleted;
- `firebase-app-check.test.mjs` enforces central initialization order;
- `runtime-authority-gate.test.mjs` again allows exactly one Firebase SDK owner.

The repaired code is repository-validated, but App Check enforcement remains OFF until legitimate Safari/iPhone/iPad/Home Screen PWA traffic is observed successfully after deployment of the repaired client.

## Recovery session concurrency correction — complete

Review of the prototype completion flow found a security race: multiple completion calls could potentially reach PIN cryptography before failure counters were serialized. The corrected server path atomically reserves a session `PENDING -> VERIFYING` in Firestore **before** PIN/master-secret cryptography. Only the reserved verifier may subsequently record failure or consume the session.

This follows the project rule: one recovery session -> one serialized verification path. A session stranded in `VERIFYING` fails closed rather than reopening silently.

## Remaining live deployment preflight

Only one live Recovery Functions deployment remains before controlled recovery testing. Before that deployment, the deployment script must verify rather than assume the runtime IAM boundary.

The dedicated recovery service account is confirmed to have Secret Accessor on `FIDUNIO_RECOVERY_MASTER_V1`. Its Firestore runtime permission has **not yet been independently proven in the durable handoff record**. The deployment script must therefore:

1. verify the active project is exactly `fidunio-fef13`;
2. pin and verify the exact reviewed repository commit/source;
3. verify the dedicated recovery service account exists;
4. verify the secret exists and an enabled version is present without printing the secret value;
5. verify the secret-level Secret Accessor binding;
6. verify the recovery runtime service account has the minimum Firestore data-access IAM needed by the Admin SDK; if missing, add only the reviewed minimum role rather than falling back to a broad default runtime identity;
7. deploy only the `recovery` Functions codebase to `us-central1`;
8. verify deployed function names, region, runtime service account, App Check enforcement state and secret bindings;
9. leave App Check enforcement OFF.

Do not broaden project IAM merely to make deployment succeed.

## Controlled handoff order — current

```text
A. read-only project inventory                                      COMPLETE
B. project/billing/Firestore location                               COMPLETE
C. three-component recovery architecture                            COMPLETE / FINAL
D. recovery secret + dedicated recovery service account             COMPLETE
E. recovery secret-level IAM                                        COMPLETE
F. exact reviewed Firestore rules deploy/verification                COMPLETE
G. central Firebase/App Check ownership repair + full CI             COMPLETE
H. recovery implementation reconciliation + concurrency fix + CI      COMPLETE
I. final runtime-IAM preflight + Recovery Functions deploy            NEXT
J. verify deployed Functions/secret/runtime-SA/App Check state         WITH DEPLOYMENT
K. controlled recovery testing                                        AFTER DEPLOYMENT
L. deploy repaired client and observe legitimate App Check traffic     BEFORE ENFORCEMENT
M. enable App Check enforcement only after verified traffic            CONDITIONAL / LATER
N. prove account identity lifecycle without replacement                BEFORE v3 CUTOVER
O. wire normal six-digit account-E2EE enrollment/unlock                AFTER RECOVERY PROOF
P. cut over send/receive/Outbox to v3 and retire legacy transforms     LAST
```

## Explicit non-actions

Until their later gates are satisfied:

- do not enable App Check enforcement;
- do not introduce a supplemental recovery verifier or fourth recovery factor;
- do not switch normal FIDUNIO transport to v3;
- do not remove remaining legacy per-device service-worker transforms;
- do not expose `FIDUNIO_RECOVERY_MASTER_V1` outside Google's protected server environment;
- do not substitute the broad default Functions runtime identity for the dedicated recovery service account.

## Current handoff condition

Recovery architecture, source repair, App Check ownership repair, Firestore rules and supporting secret infrastructure are complete. The next owner/operator action is a **single controlled Recovery Functions deployment with runtime-IAM preflight and post-deploy verification**. App Check enforcement remains off.

Do not let the console operator improvise architecture/security changes.

## Live Recovery Functions verification — September 6, 2026

The deployment handoff is COMPLETE. enrollRecoveryV1, startE2EERecoveryV1 and completeE2EERecoveryV1 are ACTIVE in us-central1 under the dedicated recovery service account. Enrollment/completion have the recovery-secret binding; start does not. Artifact Registry cleanup is configured for images older than one day. App Check enforcement remains OFF. No further planned Firebase/Google Console setup remains before later conditional App Check enforcement.

## FIDUNIO 1.1.6 notification routing checkpoint — 2026-09-09

- N4 real-device acceptance passed: a backgrounded iPhone received the generic `FIDUNIO — New message` notification after the live Eventarc/Cloud Run invocation permission was corrected.
- Live N4 trigger: `notifyDirectMessageCreatedV1`; Eventarc trigger region is `nam5`; the trigger service account has `roles/run.invoker` only on the N4 Cloud Run service.
- N5 candidate adds deterministic notification-tap routing. The service worker may focus/open FIDUNIO and pass only opaque direct-message routing intent. `app.js` remains the route/message owner and resolves the conversation through existing Firestore/E2EE state.
- Notification metadata never creates a message row, decrypts content, or writes receipts. Cold-open routing waits behind the normal local PIN/auth gates.
- Device acceptance still required for N5 warm-open and cold-open taps before N5 is closed.

