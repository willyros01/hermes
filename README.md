# Hermes/FIDUNIO historical archive

**NON-RUNNABLE, RETENTION-ONLY BRANCH.** This `archive` branch deliberately has NO `index.html`, application source, service worker, signing, Firebase configuration, or GitHub Actions workflow in its HEAD working tree.

- Start with [ARCHIVE-MANIFEST.md](ARCHIVE-MANIFEST.md): all 44 historical branch names, their exact SHA targets, and eight retained branch names.
- Use [RECOVERY.md](RECOVERY.md) for restoring a branch or one file.
- The preserved archive commit `0d5522aff042efabf5181a8603d4fdb81bf3f51a` has production `main` and 39 distinct historical commit parents. All 44 deleted historical branch histories remain reachable through this commit and its descendants as long as `archive` exists.
- Exactly **44 inactive original branch refs were deleted** with explicit owner approval; the nine kept branches are `main`, `ios`, `Android`, `backups`, `simulator-tests`, `simulator-evidence`, `main2`, `main-3` and `archive`.
- The clean GitHub recovery clone and all 44 commits passed verification after deletion; see [CLEANUP-AUDIT.md](CLEANUP-AUDIT.md).
- A separate verified Git bundle exists in the owner's private ChatGPT Library, including 52 branch refs and 44 annotated archive tags.

The production web app remains [GitHub Pages for FIDUNIO](https://willyros01.github.io/hermes/), built ONLY from `main`. Native releases remain `ios` and `Android`.

**Warning:** The 40-parent preservation commit MUST remain in `archive` ancestry. Normal fast-forward documentation commits retain it; history rewrites, forced updates and deletion are prohibited by the active exact-branch GitHub ruleset. Do not merge runnable application code into `archive`.
