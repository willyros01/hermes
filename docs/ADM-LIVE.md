## 2026-10-14 23:00 EDT — Auth 401 detail confirmed from owner a4123.txt screenshot

Owner ran a read-only Cloud Shell diagnostic (`bash a4123.txt`) showing 6 entries from `claimnotificationleasev1` around **2026-10-15T02:49:21Z**. Explicit warning: `Firebase ID token has expired` (`auth/id-token-expired`), followed by `Callable request verification failed: Auth token was rejected`. A subsequent request at 02:49:21.666598Z returned HTTP 200 with log `Callable request verification passed`. Interpret this as **one expired authentication request followed by an accepted authentication check**; it does not prove an ADM token was obtained or stored, nor that the HTTP 200 was the Fire tablet's claim. The earlier owner scan at 02:54 found **ADM ROWS 0**. Therefore do not claim the missing ADM lease is now fixed or change production Firebase/auth blindly. Next targeted evidence: FIDUNIO Fire HD 8 *in-app* Settings > Notifications status, to distinguish unsupported native provider or disabled preference from failed claim. No Cloud Shell paste/large scripts requested; owner requires short TXT filenames for any future commands, ideally no additional scripts. No native/backend changes yet.

---

## 2026-10-14 22:54 EDT — Fire physical retest FAIL; HTTP 401 on notification lease claim

Owner re-ran the existing `admchk.txt` after installing Cuberoot-published signed build 38671172852. Read-only scan of 5 users found **ADM ROWS 0; ELIGIBLE ADM ROWS 0**; one old enabled owner-matched `android-native` registration remains, not known to belong to Fire. Cloud logs show `claimnotificationleasev1 REQUEST ERROR HTTP 401` at **2026-10-15T02:49:21.603608Z**, plus two matching log warnings at 02:49:21.618420Z and 02:49:21.618763Z. This proves the callable was attempted and an authentication/authorization failure was reported; it does **not** yet prove whether Firebase Auth, App Check verification, or Cloud Run invocation permissions caused the 401, nor whether A3L produced a token before claim. App Check is configured as non-enforced in Android branch `functions/index.mjs`, but actual live function configuration has not been verified.

Do **not** touch Amazon sender priority, add another push test, repeat backup, or redeploy function on this evidence. Next single read-only gate: inspect the two sanitized warning messages from the same 401 timestamp to distinguish authorization/auth-token/App Check/IAM before selecting an Android-only or Firebase-specific correction. No changes made to Firebase.

---

## 2026-10-14 ~22:47 EDT — GitHub publisher handoff fixed and deployment PASS

Owner corrected fine-grained GitHub PAT permissions: selected `willyros01/Cuberoot`, repository Actions read/write. Hermes Action `CUBEROOT_DISPATCH_TOKEN` now functional. A targeted rerun of handoff job for successful Android signed run **38671172852** produced `PASS: directly dispatched Cuberoot for signed Hermes run 38671172852`. Cuberoot workflow_dispatch run **38672732129** selected the exact existing APK, updated `downloads/fidunio-build.json` on Cuberoot/main to run **38671172852**, source SHA `dbd2542cc29912236be93f666638f756c66a0a99`, artifact **11943617517**, SHA256 `2fb869c190164683da1f949485d06c760caf5346310d002e791ea06bf94eab5f`, permanent signing SHA256 `fbff41947e477e0b4df65bd741b550d7b30d7b18636a47c10853d789c4937a1d`. Cuberoot Pages deployment run **38672756917 COMPLETED SUCCESS**. This confirms publishing automation has been restored; **device ADM registration/physical notification still UNTESTED on this build**. Owner instructed install update without uninstalling, open app with notifications enabled, background app and send direct message from second device; acceptance requires notification → tap → PIN → correct message. No Firebase changes, repeat backup, Wire or iOS changes.

---

## 2026-10-14 ~22:34 EDT — Direct publisher authorization not yet accepted

User created Hermes Actions secret `CUBEROOT_DISPATCH_TOKEN`; GitHub job environment confirms it is populated and masked. Initial handoff retry on APK run `38668803728` exposed malformed curl flags `--fail-with-body -fsSL`, fixed in `Android` workflow commit `dbd2542cc29912236be93f666638f756c66a0a99` to `--fail-with-body -sSL`, and missing-secret guard now fails explicitly. This CI workflow edit initiated signed run `38671172852`; check/native/APK compilation PASS, direct dispatch handoff failed with **HTTP 403: `Resource not accessible by personal access token`**. Therefore installed token exists but has insufficient access to `willyros01/Cuberoot` or its workflow dispatch endpoint. GitHub documentation specifies fine-grained token must include Cuberoot repository and **Actions: Read and write**. Owner must inspect/adjust personal token's selected repository and Actions permission, and if GitHub regenerates a token replace the Hermes secret. Then use rerun **ONLY** the handoff job for successful run `38671172852` (avoid extra APK build) and check a `workflow_dispatch`-event Cuberoot publisher run. Do not claim automatic publication yet. Website's last confirmed successful APK (prior source run `38668803728`) was safely published and may be manually tested separately.

---

## 2026-10-14 21:54 EDT — ADM lease still absent after Fire foreground

Owner's **second** `admchk.txt` run, performed after foregrounding FIDUNIO on Fire HD 8, again scanned five users and found **zero `android-adm` leases**. One `android-native` lease remains enabled, valid and owner-matched, but tablet identity remains unverified. Matched log entry counts: direct 12, group 6, claim 43; no diagnostic errors matched and send success NOT established. The repeated test confirms no passive ADM lease creation.

Amazon's A3L manifest documentation matches `build/install-fidunio-adm.mjs`'s generated receiver and metadata. FIDUNIO's adapter tries ADM first, but on unavailable/failing detection can fall back to FCM without a clear Fire-specific error. The precise reason for no ADM registration on this Fire tablet is still unproved. Next: inspect actual in-app FIDUNIO Settings → Notifications status and installed APK/provider contract before any Android-only code changes. No Cloud/Firebase changes or further backup needed.

---

## 2026-10-14 21:46 EDT — Read-only registration diagnosis (owner Cloud Shell result)

`admchk.txt` reported a clean read-only completion against `fidunio-fef13`. Five user documents scanned. Native device rows **1**: platform `android-native`, enabled, unexpired, token-owner MATCH, eligible as native/FCM. `ADM ROWS 0`, `ELIGIBLE ADM ROWS 0`. Thus there is **no server-eligible Amazon ADM registration** among scanned users; Amazon sender priority is not a useful fix before a token exists. The audit cannot associate that native/FCM registration with a physical Fire installation, nor can it prove why ADM capability was not selected. In available matched Cloud Function logs: direct 7, group 6, claim 28 entries; no diagnostic errors matched, but send success NOT demonstrated. No tokens, credentials or message content displayed and no changes made.

Inspect installed ADM-capable APK/provider selection, registration and authenticated `android-adm` lease renewal read-only/with minimum device action. Only once a valid lease exists can a meaningful Amazon send and receipt test proceed. Preserve original backup and live deployment; no repeat backup/deploy.

---

## 2026-10-14 ~21:30 EDT — Verified execution result (supersedes prepared-state text below)

**BACKUP PASS:** Owner's Cloud Shell report verified original direct/group deployed source archives, configuration, metadata and checksums under private versioned `gs://fidunio-fef13-notify-backup-130339622893/20261015T002242Z`. Do not repeat backup/checks as a separate owner task. Keep private rollback package.

**DEPLOYMENT PASS:** Owner executed `adm33.txt`; both existing Gen2 `notifyDirectMessageCreatedV1` and `notifyGroupMessageCreatedV1` report ACTIVE in project `fidunio-fef13` / `us-central1` with `FIDUNIO_ADM_CLIENT_ID` and `FIDUNIO_ADM_CLIENT_SECRET` mounted. Original triggers and notification service account retained. This is activation, **NOT verified delivery**.

**PHYSICAL FAILURE:** Fire HD 8 direct-message test received **no notification**; device notification setting is already ON. Fire group NOT TESTED; iOS/web notification regressions NOT YET REVERIFIED. Correct follow-up is read-only inspection of authenticated `android-adm` token leases, direct-message trigger/Amazon sender logs and only then Fire native receiver/security identity. Never use normal Firebase messaging for ADM tokens. `priority:normal` differs from Wire `high` but is not a proven cause. Do not redeploy, recreate backups or rollback blindly. The rollback instructions below remain available if a cross-platform regression is established; the older 'not executed' sections are historical preparation records.

---

# FIDUNIO Amazon Device Messaging — live activation handoff (14 October 2026)

## Authorized scope

Owner authorized activation of Amazon ADM notification sending for FIDUNIO, including Firebase changes and recoverable production backups. This scope does **not** authorize modifications to any `ios` branch or TestFlight build (iOS frozen across all repositories), web `main`/`main-3` code, Wire/Balita, Firestore rules/data, Storage rules, E2EE, or an unrelated Cloud Function.

## Existing verified evidence

- `hermes/Android` started from exact `ios` commit `0e222ef9a358133274bdec48f7a6ed3fab104bd2`. That `ios` head was unchanged at latest audit.
- Only four existing/new *runtime* Firebase function files differ in `Android` from `main`: `functions/index.mjs`, `functions/notification/direct-message-notification-core.mjs`, `functions/notification/group-message-notification-core.mjs`, new `functions/notification/adm-delivery.mjs`. No other `functions/` runtime files differ. The `adm-compat.test.mjs` file is testing only.
- Both private sender credentials were added to Firebase Secret Manager through successful GitHub Actions run `38650650490`. The writer identity `fidunio-adm-sync` does not have Cloud Functions deployment rights.
- Existing notification regression workflow run `38651372635` completed SUCCESS. This proves only mock/contract tests, not physical Amazon delivery.
- Existing shared production notification sender is not yet updated for ADM. Live revision and source must be freshly read; a prior October 11 audit is insufficient.

## Production backup gate

A prepared Cloud Shell script, `ab2614.txt`, independently reads both live functions `notifyDirectMessageCreatedV1` and `notifyGroupMessageCreatedV1` from Firebase project `fidunio-fef13` / project number `130339622893`, region `us-central1`; fails if either is not ACTIVE, has unexpected runtime/trigger/identity, contains an ADM secret mount already, or has no retrievable deployed source.

It saves original `gcloud functions describe` JSON, both actual deployed source archives, pre-change ADM Secret Manager IAM metadata (no secret values), and checksums. It creates or validates a **private, public-access-prevention-enforced, uniform-access, versioned bucket** `gs://fidunio-fef13-notify-backup-130339622893`, uploads all backups, copies both source and config archives back and checks byte equality, then writes a private `latest.txt` marker. No production function, rules or data writes occur during backup.

Do not claim backup complete until Cloud Shell prints `BACKUP PASS` and identifies the full backup prefix. The credentials writer's GitHub OIDC identity cannot perform this backup and must **not** be broadened.

## Activation gate

Prepared `ad2614.txt` requires the actual GCS backup and SHA-256 verification, confirms neither original live revision changed, fetches exact Android source commit `e0bf291c8d5e6a3a234bca73b6935bb46e1cabce`, compares the source against baseline, and runs all notification unit tests. Only after these checks does it grant `fidunio-notification@fidunio-fef13.iam.gserviceaccount.com` Secret Manager accessor on **exactly two** ADM secrets. It then deploys only the above two existing Gen2 Firestore functions, preserving original triggers and service account with added ADM secrets. A failed check stops without proceeding further; a failed partial deployment requires rollback before release.

**Do not deploy** by a global `firebase deploy --only functions` or from `main`/`ios` checkout.

## Rollback gate

Prepared `ar2614.txt` reads `latest.txt` in the same private Firebase bucket, checks all SHA-256 digests, compares live identities and event filters to baseline, and uses the archived **pre-ADM source** to restore each function with only its ADM secret mounts removed. It verifies ACTIVE state, trigger, runtime, service account and absence of ADM mounts. After both functions restore it removes the new runtime accessor bindings; the private backup bucket and secret versions remain preserved. This operation needs an authorized Cloud Shell session.

The scripts are installed and source-verified in the Hermes `Android` branch at `build/ab2614.txt` (backup), `build/ad2614.txt` (activation) and `build/ar2614.txt` (rollback). Their Bash and embedded Python syntax were checked offline, but they have **not** been executed in Firebase. **No backup, deployment, or physical-device PASS may be claimed yet.**

## Post-deployment device acceptance

1. On Fire HD 8, enable notifications, receive direct and group notifications while backgrounded and cold, tap through existing PIN to the correct exact message. Verify foreground receipt; inspect ADM registration and server send logs without logging tokens.
2. On iPhone/iPad, verify working FCM/APNs and notification-to-unlock behavior **without any iOS source/build change**.
3. On web, verify direct/group data-only notifications, blocked-user suppression and exact routing.
4. Inspect Cloud Functions active revisions and errors for both functions. If regression appears, immediately use the rollback procedure and retest both existing web/iOS paths.

**As of this handoff:** scripts prepared and syntax checked locally; Firebase backup not run; production ADM activation not run.

## File naming (14 October 2026)

Use **`ab2614.txt`** for backup, **`ad2614.txt`** for ADM activation, and **`ar2614.txt`** for rollback. These unique short filenames avoid the prior `fb.txt`, `fa.txt`, `fr.txt` collisions in the owner's existing Google Cloud Shell home directory. The older repository copies are superseded and must not be uploaded or executed for this rollout. Back up first and verify `BACKUP PASS` before running activation. Never overwrite an existing Cloud Shell file when uploading.
