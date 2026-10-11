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
Fixture integration: encrypted file decrypts byte-identically; failed account export preserves prior backup branch; 30-day retention passed. These are local fixtures only. Live backup and saved-file readback passed; see the verified checkpoint below.


## Live backup/readback verified — 2026-10-11

Google helper setup completed in the user's Cloud Shell (final verification passed after transient IAM retries). User configured Hermes Actions repository secret BACKUP_PASSPHRASE. Initial GitHub database backup run 38147649733 succeeded. Stronger saved-file readback run https://github.com/willyros01/hermes/actions/runs/38147705757 verified 977 Firestore documents, 5 user documents and 5 sign-in accounts. It encrypted the export, reopened/compared it, saved fidunio-2026-10-11.json.gpg on backups, cloned the actual GitHub-saved file back, decrypted it and compared byte-for-byte with the original export. READBACK PASSED is in the job log. Saved file: https://github.com/willyros01/hermes/blob/backups/fidunio-2026-10-11.json.gpg (179452 bytes at verification, blob 620d2b41a1053e5c08a35504c75562676bcf04a4). All earlier pending/prerequisite status is superseded. The saved-copy readback test is now permanent in every nightly backup. Daily schedule remains 07:00 UTC and 30-day retention; the backup reads the database and does not restore/mutate it. Plaintext and passphrase were not exposed. This proves readable encrypted backup, not a destructive live restore or atomic point-in-time export.
