# Hermes/FIDUNIO historical archive

**NON-RUNNABLE, RETENTION-ONLY BRANCH.** This `archive` branch deliberately has NO `index.html`, application source, service worker, signing, Firebase configuration, or GitHub Actions workflow in its HEAD working tree.

- Start with [ARCHIVE-MANIFEST.md](ARCHIVE-MANIFEST.md): all 44 historical branch names, their exact SHA targets, and eight retained branch names.
- Use [RECOVERY.md](RECOVERY.md) for restoring a branch or one file.
- This branch's tip has `main` and 39 distinct historical commit parents. Git will continue retaining the historical objects as long as `archive` exists.
- Original branches have **not** been deleted. Deletion later requires fresh verification and separate owner approval.
- A separate verified Git bundle exists in the owner's private ChatGPT Library, including 52 branch refs and 44 annotated archive tags.

The production web app remains [GitHub Pages for FIDUNIO](https://willyros01.github.io/hermes/), built ONLY from `main`. Native releases remain `ios` and `Android`.

**Warning:** Creating a new commit at archive HEAD without keeping the 40 historical parent links can make history unreachable after old branches are removed. Do not rewrite or force-push this branch. Maintain a protected immutable reference.
