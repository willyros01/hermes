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

A prepared Cloud Shell script, `fb.txt`, independently reads both live functions `notifyDirectMessageCreatedV1` and `notifyGroupMessageCreatedV1` from Firebase project `fidunio-fef13` / project number `130339622893`, region `us-central1`; fails if either is not ACTIVE, has unexpected runtime/trigger/identity, contains an ADM secret mount already, or has no retrievable deployed source.

It saves original `gcloud functions describe` JSON, both actual deployed source archives, pre-change ADM Secret Manager IAM metadata (no secret values), and checksums. It creates or validates a **private, public-access-prevention-enforced, uniform-access, versioned bucket** `gs://fidunio-fef13-notify-backup-130339622893`, uploads all backups, copies both source and config archives back and checks byte equality, then writes a private `latest.txt` marker. No production function, rules or data writes occur during backup.

Do not claim backup complete until Cloud Shell prints `BACKUP PASS` and identifies the full backup prefix. The credentials writer's GitHub OIDC identity cannot perform this backup and must **not** be broadened.

## Activation gate

Prepared `fa.txt` requires the actual GCS backup and SHA-256 verification, confirms neither original live revision changed, fetches exact Android source commit `e0bf291c8d5e6a3a234bca73b6935bb46e1cabce`, compares the source against baseline, and runs all notification unit tests. Only after these checks does it grant `fidunio-notification@fidunio-fef13.iam.gserviceaccount.com` Secret Manager accessor on **exactly two** ADM secrets. It then deploys only the above two existing Gen2 Firestore functions, preserving original triggers and service account with added ADM secrets. A failed check stops without proceeding further; a failed partial deployment requires rollback before release.

**Do not deploy** by a global `firebase deploy --only functions` or from `main`/`ios` checkout.

## Rollback gate

Prepared `fr.txt` reads `latest.txt` in the same private Firebase bucket, checks all SHA-256 digests, compares live identities and event filters to baseline, and uses the archived **pre-ADM source** to restore each function with only its ADM secret mounts removed. It verifies ACTIVE state, trigger, runtime, service account and absence of ADM mounts. After both functions restore it removes the new runtime accessor bindings; the private backup bucket and secret versions remain preserved. This operation needs an authorized Cloud Shell session.

The scripts are conversation attachments; they are not yet committed into repository source or executed. **No backup, deployment, or physical-device PASS may be claimed yet.**

## Post-deployment device acceptance

1. On Fire HD 8, enable notifications, receive direct and group notifications while backgrounded and cold, tap through existing PIN to the correct exact message. Verify foreground receipt; inspect ADM registration and server send logs without logging tokens.
2. On iPhone/iPad, verify working FCM/APNs and notification-to-unlock behavior **without any iOS source/build change**.
3. On web, verify direct/group data-only notifications, blocked-user suppression and exact routing.
4. Inspect Cloud Functions active revisions and errors for both functions. If regression appears, immediately use the rollback procedure and retest both existing web/iOS paths.

**As of this handoff:** scripts prepared and syntax checked locally; Firebase backup not run; production ADM activation not run.
