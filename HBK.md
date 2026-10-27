## 2026-10-27 UTC — ARCHIVE HOUSEKEEPING COMPLETE (authoritative current state)

**GitHub cleanup completed with the owner's explicit, exact-list authorization:** 44 inactive historical branch references listed in [archive/ARCHIVE-MANIFEST.md](https://github.com/willyros01/hermes/blob/archive/ARCHIVE-MANIFEST.md) were deleted; live Hermes branches changed **53 → 9**. The nine retained branches are `main`, `ios`, `Android`, `backups`, `simulator-tests`, `simulator-evidence`, `main2`, `main-3` and `archive`. The two legacy web notice branches remain NON-RUNNABLE. Older checkpoints below saying no branch was deleted are superseded by this completed operation.

**Recovery PROVED after deletion:** The original preservation commit `0d5522aff042efabf5181a8603d4fdb81bf3f51a` has 40 parents and anchors all 44 deleted branch histories. A fresh independent clone fetching ONLY GitHub's surviving `archive` branch recovered all 44 exact historical commit tips; `git fsck --full --no-reflogs` PASS. `archive` protection rule `25931858` is ACTIVE and restricts deletion and non-fast-forward pushes without bypass actors. Existing 314 MiB private Library `hermes-git-recovery-2026-10-27.bundle` independently restores the original 52 branch refs plus 44 annotated tags. No tags are falsely claimed as remote GitHub tags.

**Search/restore route:** original name → [archive/ARCHIVE-MANIFEST.md](https://github.com/willyros01/hermes/blob/archive/ARCHIVE-MANIFEST.md) → original 40-character SHA → [archive/RECOVERY.md](https://github.com/willyros01/hermes/blob/archive/RECOVERY.md), with audit evidence in `archive/CLEANUP-AUDIT.md`. Never recreate unneeded branch clutter, rewrite archive history, or promote archived code without explicit user-approved change and release tests.

**Scope:** this housekeeping changed GitHub branch references and documentation only. No FIDUNIO web/iOS/Android application files, Firebase deployments, functions, encryption, notifications, release workflows or version numbers were changed.

---

## 2026-10-27 UTC — Repository history archive is NOT the nightly Firebase backup

The separate, one-time Git source/history archive is [archive/ARCHIVE-MANIFEST.md](https://github.com/willyros01/hermes/blob/archive/ARCHIVE-MANIFEST.md). It lists all **44 inactive branch names** and exact original tip commits. Published `archive` HEAD has 40 parents, retaining all historical tips. A 328,310,151-byte Git bundle was independently restored with all **52 heads and 44 annotated tags** and saved in the owner's private ChatGPT Library, with SHA-256 `ae72fa7dab8e6ea27f059b80d88480e0387149d979ae8587136e16761b5845e0`.

This is **not** the daily Firestore/Auth backup job and does not alter `.github/workflows/hbk.yml`, the `backups` branch, schedules, keys, or live Firebase. The old repo branches have not been deleted; no history-cleanup deletion is authorized by this note.

---

## 2026-10-15 — Backup documentation maintenance note

This is the `hermes/main` authoritative Firestore/Auth backup and branch/code variance procedure, **separate** from the one-time verified Firebase Gen2 notification-function rollback archive used for Fire ADM migration on `hermes/Android`. Do not mistake daily database backup artifacts for deployment backups of notification function revisions, and do not re-run backup, recreate secrets, change workflow schedules or alter production data merely to keep documentation current. Each backup job and code variance check must be reported independently as PASS/FAIL/UNVERIFIED from its own actual run; the present documentation edit does **not** attest that today's scheduled backup succeeded. Production web `main`, parity `main-3`, iOS `ios` and Fire `Android` remain distinct. Owner's development freeze permits documentary records, not live infrastructure changes.

---

# FIDUNIO Firebase database backup and code variance

## Correction — 2026-10-11
The user requested the Scorecard Firebase DATABASE backup model, not a repository-code backup. The earlier Git bundle job was a misunderstanding and has been removed from the daily workflow. Its already-created artifact is historical only and expires 2026-11-10; the connector does not expose artifact deletion.

## Daily database backup
Owner: .github/workflows/hbk.yml database job. Schedule: 07:00 UTC (03:00 Toronto daylight saving; 02:00 standard time), matching Scorecard.
Source project: fidunio-fef13, project number 130339622893, Firestore (default).
The Scorecard recursive reader is adapted in .github/scripts/fbk.mjs. It reads every collection, document and nested subcollection, including subcollections below missing parents, retaining Firestore typed fields and timestamps. It also lists Firebase Authentication account metadata (UID, email, provider IDs, verified/disabled flags, creation/last-login timestamps); no passwords or password hashes are copied.
This is the same iterative read model as Scorecard, not an atomic point-in-time export. Storage attachment bytes, device-local encrypted history/keys/PINs and GitHub/Apple configuration are outside this model.
The dedicated helper has only datastore.viewer and firebaseauth.viewer. GitHub OIDC trust is restricted to Hermes repository ID 1354087461 and hbk.yml on main.
Required repository secret: BACKUP_PASSPHRASE, at least 16 characters. Never put the passphrase in chat, source, logs or an artifact.
.github/scripts/fbk.sh requires the correct project, user documents and successful account export, then encrypts with GnuPG AES-256/strong key stretching, decrypts and compares byte-for-byte before saving.
Location after a SUCCESSFUL live run: https://github.com/willyros01/hermes/tree/backups
Files: fidunio-YYYY-MM-DD.json.gpg, 30 days kept on an isolated one-commit backups branch, matching Scorecard. Force-with-lease prevents overwriting an unexpected concurrent branch update.
Main, main-3 and ios are not mirrored or overwritten. No Firebase data writes, application version change or TestFlight launch.

## Initial backup/access setup
Run root fbk.txt in Google Cloud Shell. It explicitly switches/checks fidunio-fef13, checks project number and active account, reads the initial database backup using the signed-in user's Google access, prompts twice for a hidden passphrase, validates account export/user records, encrypts/reopens/compares it and saves:
$HOME/fidunio-backups/fidunio-YYYY-MM-DD.json.gpg
It then creates the read-only nightly helper and scoped OIDC trust. It snapshots relevant IAM policies/trust before setup and writes $HOME/fidunio-backups/rbk.txt to remove newly created backup-access resources/bindings. Existing provider trust that differs causes a stop for review. Existing APIs remain enabled after rollback to avoid affecting other consumers.
Set the same passphrase as the Hermes repository Actions secret BACKUP_PASSPHRASE. The GitHub connector cannot create/copy secrets or directly operate Google IAM; these steps require the user's own session. Do not claim the live initial or nightly backup exists until execution evidence is available.
Open/check the latest stored encrypted backup using ckb.txt; it prompts for the passphrase and cleans plaintext automatically.

## Code variance report
The independent variance job retains the previously requested exact main-3/ios tree comparison, full patch and 28px HTML report. Report artifacts are named hvar-RUN_ID and retained 30 days. The report runs even if database prerequisites fail.
Daily ChatGPT morning summary checks database-job success and actual backups-branch date/file evidence, then reports main-3/ios variance. A green variance job is not database backup proof.

## Validation
Syntax: shell, Node module, workflow YAML and embedded Python passed.
Fixture integration: encrypted file decrypts byte-identically; failed account export preserves prior backup branch; 30-day retention passed. These are local fixtures only. Live backup status remains pending Google access/passphrase setup and initial/nightly execution evidence.
