# Hermes historical branch housekeeping — COMPLETED 2026-10-27 UTC

## Authorized scope and outcome

Owner specifically approved deleting the exact **44 inactive branch names** in [ARCHIVE-MANIFEST.md](ARCHIVE-MANIFEST.md) at preservation commit `0d5522aff042efabf5181a8603d4fdb81bf3f51a`, preserving these **nine** branches: `main`, `ios`, `Android`, `backups`, `simulator-tests`, `simulator-evidence`, `main2`, `main-3`, `archive`.

- Initial GitHub branch inventory: **53** branches.
- Owner-approved historical branch references deleted: **44 / 44** (GitHub branch UI confirmation and fresh GitHub API inventory).
- Final live GitHub branch inventory: **9** branches, exactly the nine retained names above.
- The original 44 names were deleted as branch REFERENCES, not as file content or commits; this index preserves each complete tip SHA.
- At deletion time, the GitHub archive preservation commit had **40 parents**: then-production `main` plus **39 unique historical tip SHAs** representing all 44 deleted names.
- The exact `archive` ruleset `25931858`, **Protect Hermes archive history**, remained **active**, target `refs/heads/archive`, with **deletion prohibited**, **force/non-fast-forward pushes prohibited**, and **no bypass actors**.

## Actual post-deletion recovery test — PASS

A new isolated Git repository was cloned from GitHub fetching **only the retained `archive` branch**, after the original 44 branches were deleted.

- **44/44** deleted historic tip commits exist in that freshly downloaded Git object database.
- **44/44** are ancestors of the retained `archive` branch.
- `git fsck --full --no-reflogs`: **PASS**, no missing/corrupt reachable object detected.

This proves the remote retained archive itself still contains the historical commit graph; it does not depend on the old branch names being live.

## Independent owner-held recovery copy

The separate private ChatGPT Library file `hermes-git-recovery-2026-10-27.bundle` has **328,310,151 bytes**, SHA-256:

`ae72fa7dab8e6ea27f059b80d88480e0387149d979ae8587136e16761b5845e0`

Previously test-cloned with all **52 original branch references** and **44 annotated `archive/<old-branch>` tags** at exact original SHA. Tags remain contained in this private bundle; GitHub archiving uses the protected multi-parent commit instead of claiming remote tags were published.

## Active code and change boundaries

No production application source, iOS/Android package code, Firebase rules/data, signing secrets, or GitHub workflows were changed by branch deletion. The archived branch is deliberately non-runnable. Native releases are still sourced from `ios` and capital-`Android`; sole production web from `main`. Historical `main2`/`main-3` are notice-only.

**Future searching:** [ARCHIVE-MANIFEST.md](ARCHIVE-MANIFEST.md) → old branch name → original commit SHA → [RECOVERY.md](RECOVERY.md). Never delete or rewrite the preservation commit or its `archive` ancestry.
