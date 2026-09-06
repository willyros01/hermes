# FIDUNIO Rebuild Baseline Audit

**Branch:** `fidunio-rebuild-baseline-2026-09-05`

**Purpose:** establish a clean forward-consolidation development baseline without rewriting validated behavior or deleting recovery history from `main`.

## Safety rule

This branch was created from `main` at commit `246c524abc78404d9bc744b272ce08244a35cc3f`. `main` remains rollback/reference until the rebuilt runtime and target-device validation are complete. Repository validation does not itself authorize a live Firebase deployment; every live handoff remains explicit and verified.

## Protected checkpoints

```text
checkpoint-rebuild-baseline-recovery-pass
commit e2d2e10031182781f6887b2cd1a971701aa21e3a

checkpoint-rebuild-new-message-owner
commit b4731926432af3a986af991d2f51db86acea0fd1

checkpoint-rebuild-account-e2ee-auth-binding
commit 251679cd9240e45f335536fed9bed5bc43e76157

checkpoint-rebuild-account-dm-v3-crypto-rules
commit ca9222bdb7171ae60de5b2b9c08bf5b9327f52c9
```

These remain historical rollback/comparison points. The active rebuild branch has advanced beyond them through the September 6 recovery/App Check rectification described below.

## Current authoritative foundation

### Product/runtime
- `index.html`, `version.js`, active CSS, artwork/icons and `manifest.json` remain protected runtime assets;
- `app.js` remains the structural runtime owner and still contains legacy per-device E2EE compatibility behavior pending migration;
- `bootstrap.js` remains startup sequencing only;
- **`firebase.js` is again the sole runtime Firebase SDK/service owner, including App Check;**
- the rejected second owner `firebase-app-check.js` has been deleted;
- `firebase-config.js` remains protected and must never be regenerated/replaced;
- `service-worker.js` remains temporarily because it still injects legacy per-device E2EE compatibility transforms, but its target end-state is shell/offline caching only.

### Deterministic UI/auth ownership
- `auth-ui-clean.js`, `account-guard.js`, `account-storage.js`;
- `settings-lifecycle.js` is explicitly mounted by `app.js`;
- `new-message-owner.js` owns only its assigned recipient-picker region;
- peer display names and main Sign Out are explicit `app.js` projections using central `firebase.js` APIs;
- former `profile-sync.js`, `main-screen-polish.js`, `settings-lifecycle-bridge.js`, observer-based `new-message-polish.js`, and second-owner `firebase-app-check.js` are gone;
- the runtime authority gate again permits exactly one direct Firebase SDK owner.

### Account E2EE identity/recovery foundation
- `e2ee-account-crypto.js` + browser tests;
- `e2ee-account-identity-manager.js` + browser tests;
- `e2ee-account-lifecycle.js` + CI test;
- `e2ee-account-runtime.js` auth lookup/reset binding;
- `e2ee-account-firestore-adapter.js`;
- `e2ee-account-firebase-adapter.js` + CI test;
- exact account-E2EE Firestore schema/rules and 42-case emulator matrix;
- `functions/recovery/` as sole authoritative recovery server implementation;
- Cloud Functions v2 source uses the dedicated recovery runtime service account and Secret Manager binding;
- recovery completion implements the final three-component design and no longer contains a supplemental verifier;
- recovery session verification is serialized through `PENDING -> VERIFYING` before PIN/master-secret cryptography.

### Account direct-message v3 candidate
- `e2ee-account-message-crypto.js` + tests;
- `e2ee-account-message-service.js` + fail-closed tests;
- `ACCOUNT-E2EE-DIRECT-MESSAGE-FORMAT.md`;
- exact `firestore.rules` acceptance for `e2ee:3` direct-message rows;
- `firestore-account-message-v3.rules.test.mjs` dedicated emulator matrix.

The v3 candidate uses durable account ECDH identities, HKDF-SHA-256 and AES-256-GCM. Device IDs/per-device envelopes are absent from v3 crypto. The service fails closed unless the local durable account identity is READY and the peer exact public identity is available. The Firestore rules that support v3 are live, but runtime transport has **not** been cut over to v3.

## Confirmed cleanup/materialization complete

Removed from this rebuild branch after replacement/dependency audit:
- baseline cleanup/reset pages/scripts;
- E2EE diagnostics;
- obsolete one-shot cleanup workflow;
- superseded `auth-ui.js`, `admin-ui.js`, `invite-modal.js`, `settings-polish.js`;
- observer-based `new-message-polish.js`;
- historical `test-0.9.0/`;
- temporary `profile-sync.js`, `main-screen-polish.js`, `settings-lifecycle-bridge.js` after behavior was materialized;
- completed one-shot account-E2EE auth materializer workflow/script;
- rejected `firebase-app-check.js` second Firebase owner;
- prototype supplemental recovery verifier/state and hardcoded completion block.

All historical files remain recoverable through Git history/main; none should be resurrected as target architecture.

## Legacy material intentionally retained

Do not delete yet:
- old per-installation E2EE compatibility code still present in `app.js`/`firebase.js`;
- service-worker E2EE v2 helper/receive/trust/outbox fan-out transforms;
- legacy `/users/{uid}/devices/{deviceId}` rules/data compatibility;
- legacy `e2ee:1` and `e2ee:2` message readability.

These remain because normal runtime has not yet proven the full live account-E2EE/recovery path. They are migration compatibility, not target ownership.

## Security-gate history and current validation

The rebuild branch uses `.github/workflows/rebuild-baseline-security.yml` with read-only repository permission and no Firebase deployment step.

The earlier `action_required` run `33981660852` at `ee27f32a46ef4a058a2c1e430f4a3c108e31f260` had zero jobs because a one-shot materializer committed as `github-actions[bot]`; it was not a failed security test.

The expanded gate executes:
- exact Firestore account-E2EE emulator matrix;
- dedicated account direct-message v3 rules matrix;
- recovery server crypto/session/callable/persistence tests;
- central Firebase E2EE adapter test;
- account E2EE auth lifecycle test;
- account direct-message crypto/service tests;
- central App Check integration test;
- Cloud Functions recovery scaffold guard/import;
- runtime transform anchor gate;
- runtime authority gate.

Important validated runs after the September 6 repair:
- run `34011470856` / #304: success after recovery implementation/concurrency tests;
- run `34011694149` / #316: success after restoring sole Firebase ownership and the strict authority gate;
- run `34011735357` / #318: success after strengthening the Functions scaffold guard;
- run `34011930160` / #324: success after final durable recovery/App Check documentation reconciliation at branch head `a98b3c6c0bacf3eec0c1b2ac4474042aa3bb1a21`.

The original v3 rules test also found and closed the mixed-format plaintext/E2EE loophole in commit `7eb1d22fe1c3323ca613ff986812be5dc02d7b21`.

## Process-integrity audit — September 5 deviation, September 6 rectification

The mandatory repository-first read was skipped during a later September 5 App Check continuation. That process failure contributed to:

1. `firebase-app-check.js` becoming a second direct Firebase SDK owner;
2. the runtime authority gate being weakened to allow the second owner;
3. App Check initialization being placed outside the central Firebase lifecycle;
4. the already-decided three-component recovery design not being persisted promptly;
5. stale handoff documentation causing attempted repeated work;
6. a temporary bad `auth-ui-clean.js` edit that was later removed;
7. prototype supplemental-verifier recovery state surviving after the final architecture no longer included a fourth factor.

### September 6 rectification completed

- mandatory repo documents were reread before consequential repair work;
- `firebase.js` restored as sole runtime Firebase SDK/service owner, including App Check;
- App Check now initializes after the one Firebase app and before Auth/Firestore service exposure;
- `auth-ui-clean.js` no longer owns an App Check lifecycle;
- `firebase-app-check.js` deleted;
- strict runtime authority gate restored;
- App Check tests enforce central ownership/order;
- supplemental recovery verifier, supplemental counter/state and `AUTHORIZED` status removed;
- `completeE2EERecoveryV1` wired to the final three-component recovery core;
- review found a parallel PIN-guess race and fixed it with transactional `PENDING -> VERIFYING` reservation before cryptography;
- recovery persistence tests now enforce one serialized verification path;
- Functions source explicitly keeps App Check enforcement OFF during staging;
- Functions source uses `fidunio-recovery@fidunio-fef13.iam.gserviceaccount.com` as runtime identity;
- Functions scaffold gate now rejects supplemental-verifier regression, missing dedicated SA, accidental staging enforcement, or unwired completion;
- full security runs #316, #318 and final documentation run #324 are green.

No live compromise was identified. App Check enforcement remained OFF throughout. No Recovery Function has been deployed yet.

## Live Firebase boundary — actual state September 6

Confirmed live state:
- Firebase project `FIDUNIO`, project ID `fidunio-fef13`, project number `130339622893`;
- Firestore `(default)` in `nam5`, Native mode;
- Blaze billing active;
- reCAPTCHA Enterprise API/key and Firebase App Check Web registration complete;
- App Check enforcement OFF;
- recovery secret `FIDUNIO_RECOVERY_MASTER_V1` exists with enabled version 1; value never exposed;
- dedicated recovery service account exists: `fidunio-recovery@fidunio-fef13.iam.gserviceaccount.com`;
- secret-level Secret Accessor grant is complete;
- Functions region settled to `us-central1`;
- reviewed Firestore rules are live and verified;
- active ruleset `projects/fidunio-fef13/rulesets/52ea515e-359f-453f-8822-3c0f6ef2659a`;
- no Recovery Functions deployed yet;
- no normal v3 transport cutover.

The only unresolved deployment prerequisite is verification of the dedicated recovery runtime service account's minimum Firestore data-access IAM. The controlled deployment script must verify this and add only the predefined minimum data role if absent. It must never fall back to a broad default runtime identity.

## Ordered continuation

1. **COMPLETE:** repo-first recovery/App Check rectification and full CI.
2. **COMPLETE:** Secret Manager, dedicated recovery SA, secret-level IAM, region decision and live Firestore rules.
3. **NEXT:** run one controlled Recovery Functions deployment script pinned to the final green commit. The script must preflight project/source/secret/runtime IAM, deploy only codebase `recovery`, and verify function names/region/runtime SA/secret bindings. App Check enforcement stays OFF.
4. Controlled recovery testing must prove the same durable identity/keyId/history is restored without replacement.
5. Deploy/verify the repaired client and observe legitimate App Check traffic before any enforcement decision.
6. Wire normal six-digit account-E2EE PIN enrollment/unlock only after recovery is proven.
7. Wire `e2ee:3` direct send/receive/Outbox while retaining explicit `e2ee:1/2` readability and receipts.
8. Remove only matching per-device service-worker transforms after replacement behavior is proven.
9. Reduce service worker to cache/offline duties only.
10. Finish Firestore-authoritative encrypted history + UID-scoped rebuildable cache + serialized Outbox.
11. Revalidate iPhone/iPad/PWA receipts, offline reconnect, Settings, account switching, reinstall/recovery and local PIN behavior.
12. Only then decide whether to merge/advance `main`.

## Non-negotiable rollback points

- `checkpoint-rebuild-baseline-recovery-pass` -> `e2d2e10031182781f6887b2cd1a971701aa21e3a`
- `checkpoint-rebuild-new-message-owner` -> `b4731926432af3a986af991d2f51db86acea0fd1`
- `checkpoint-rebuild-account-e2ee-auth-binding` -> `251679cd9240e45f335536fed9bed5bc43e76157`
- `checkpoint-rebuild-account-dm-v3-crypto-rules` -> `ca9222bdb7171ae60de5b2b9c08bf5b9327f52c9`
- rebuild origin on `main` -> `246c524abc78404d9bc744b272ce08244a35cc3f`
- historical stable 0.9.4.11, Settings 0.9.5.1, receipts 0.9.5.4, identity-race stabilization 0.9.5.7.

No destructive reset of `main` is required to rebuild FIDUNIO safely.
