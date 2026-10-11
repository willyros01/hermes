# Hermes daily repository backup and variance report

Configured 2026-10-11. Owner: .github/workflows/hbk.yml.
Schedule: daily at 07:00 UTC, matching Scorecard's nightly schedule (03:00 Toronto during daylight saving, 02:00 during standard time). GitHub can delay scheduled runs.
Manual run: GitHub Actions > Hermes daily backup and variance > Run workflow.
The workflow also runs when its own file changes on main.

## Backup
Read-only checkout of complete fetched Git history, all branches and tags. A self-contained hbk.bundle is verified, cloned into a fresh mirror, checked with git fsck, and its refs compared with the original before upload. SHA256SUMS and refs.txt accompany it.
Download the hbk-RUN_ID artifact from the successful Actions run. Each artifact is kept 30 days. No repository branch is overwritten by the job.
Scope: tracked repository content/history. This is not a Firebase database/Storage backup, nor a backup of GitHub settings, secrets, issues, releases, or Git LFS payloads.
Recovery commands are in restore.txt inside each backup; restoration writes a new local directory and never automatically pushes over production.

## Code variance
The exact fetched main-3 and ios commit trees are compared directly, not through a merge base. meta.json records main, main-3 and ios SHAs and the run ID.
hvar.md lists every changed/added/deleted path; hvar.html presents it in large 28px high contrast text; hvar.diff contains the full binary-capable patch. Review groups distinguish shared/application candidates, native/package/build candidates, and documentation/tests/CI. Group membership does not prove a difference is harmless or intentional.
Reports also appear in the Actions run summary. This reports source variance only, not device functionality. No merging or app changes.
GitHub may disable public-repository schedules after inactivity; the daily ChatGPT check should flag missing/disabled runs instead of claiming success.

## Validation
Workflow YAML and embedded Python syntax were checked before publication. The first triggered Actions run must pass restoration, ref equality, report generation and artifact upload before operational success is recorded.


First operational verification: run https://github.com/willyros01/hermes/actions/runs/38144110555 at commit ce56516b7c03a1c6cbc58739cc64cfafce873b73 completed SUCCESS on 2026-10-11. Logs confirm a complete-history bundle containing 41 refs, fresh mirror clone, fsck and matching refs. Both report generation and artifact upload passed. Artifact hbk-38144110555 (8,597,526 bytes) expires 2026-11-10. Daily ChatGPT morning backup-status/variance summary is enabled for America/Toronto, around 08:00 starting 2026-10-12. This confirms the first run; future daily results remain subject to verification.
