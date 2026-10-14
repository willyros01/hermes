# FIDUNIO ADM notification sender — deployment gate (14 October 2026)

## Scope

Only `willyros01/hermes` branch `Android` is changed. Production `main`, `ios`, and Wire are untouched. Firebase project is `fidunio-fef13`; notification functions:
`notifyDirectMessageCreatedV1`, `notifyGroupMessageCreatedV1`.

## Verified

- GitHub-to-Secret Manager transfer run **38650650490** completed successfully and wrote both `FIDUNIO_ADM_CLIENT_ID` and `FIDUNIO_ADM_CLIENT_SECRET` secret versions without displaying values. These are *not yet mounted by the live sender*.
- Previous read-only production audit artifact **11705748426** (11 October 2026) reported `ACTIVE` revisions: direct `notifydirectmessagecreatedv1-00011-yec`, group `notifygroupmessagecreatedv1-00003-kuc`, service account `fidunio-notification@fidunio-fef13.iam.gserviceaccount.com`. This is **not** a current backup.
- Production `main` functions source and `Android` differ in **exactly four paths**: `functions/index.mjs`, `functions/notification/direct-message-notification-core.mjs`, `functions/notification/group-message-notification-core.mjs`, and new `functions/notification/adm-delivery.mjs`. No other functions files differ.
- Workflow `adm-backend-gate.yml` tests sender privacy, blocking, group/direct fan-out, FCM/APNs isolation and no ADM-to-FCM fallback.

## Required before any production deployment

1. **Fresh backup of both *deployed* function configurations and exact deployed source**; not just GitHub branch files. Upload `build/fbak.txt` to Google Cloud Shell and run `bash fbak.txt`. The script is read-only and refuses to claim success if deployed source is missing. Keep private archive and SHA-256. Do not paste credentials.
2. Check latest production state/revisions against the backup. Investigate drift; do not assume current `main` matches deployed Firebase source.
3. Confirm the two new Secret Manager versions exist and grant runtime `fidunio-notification@fidunio-fef13.iam.gserviceaccount.com` accessor on **only** these two secret resources, before deployment. Dedicated `fidunio-adm-sync` writer must **not** be reused for runtime.
4. Run **all** ADM/FCM/iOS/web regression tests and review existing deployed function options (trigger path, region, retry, service account, memory, concurrency, max instances).
5. Obtain explicit approval for the **production Firebase Cloud Functions deployment**. Use named functions only; never `firebase deploy --only functions` globally or merge branches.
6. Verify live function revisions, return paths, direct/group ADM tokens, iOS/web APNs/FCM delivery, block-user behavior, and Fire notification-to-PIN navigation on physical devices. If needed, restore the backed-up function source and config; verify both revisions and receipt again.

**Status:** Private secret transfer PASS. New live ADM sender is **NOT DEPLOYED**. Fresh backup **NOT VERIFIED**. Physical Fire ADM acceptance **NOT TESTED**.

## 14 October 2026 — new in-Firebase rollback package

Use `build/ab2614.txt` to make a **fresh verified backup INSIDE private versioned Firebase-project Cloud Storage**, rather than the older local-only `build/fbak.txt` approach. Use `build/ad2614.txt` only after checking `BACKUP PASS`, and retain `build/ar2614.txt` for restoring the archived deployed source and ADM secret-access bindings. All three scripts are committed solely to `Android`; none has been executed yet. See `docs/ADM-LIVE.md` for the exact conditions. Any prior manual deployment approval gate is satisfied by the owner’s explicit 2026-10-14 instruction to finish ADM activation with Firebase backups and rollback, but verification gates remain mandatory.

## File naming (14 October 2026)

Use **`ab2614.txt`** for backup, **`ad2614.txt`** for ADM activation, and **`ar2614.txt`** for rollback. These unique short filenames avoid the prior `fb.txt`, `fa.txt`, `fr.txt` collisions in the owner's existing Google Cloud Shell home directory. The older repository copies are superseded and must not be uploaded or executed for this rollout. Back up first and verify `BACKUP PASS` before running activation. Never overwrite an existing Cloud Shell file when uploading.
