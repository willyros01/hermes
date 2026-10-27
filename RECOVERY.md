# Hermes archive recovery and historical search

## Find the original code or file

1. Open [ARCHIVE-MANIFEST.md](ARCHIVE-MANIFEST.md). Search the historical branch name.
2. Copy its complete **40-character commit SHA**.
3. Open GitHub at `https://github.com/willyros01/hermes/tree/<SHA>` to browse that exact old source tree and retrieve files. (Substitute the SHA exactly.)
4. To recover individual file bytes locally, use `git show <SHA>:relative/path/to/file`. To work on the whole snapshot locally, `git switch -c recovered/name <SHA>`.

## Recover from the preserved GitHub archive alone

```bash
git clone https://github.com/willyros01/hermes.git hermes-recovery
cd hermes-recovery
git fetch origin archive
git cat-file -t <40-character-SHA>
git switch -c recovered/old-feature <40-character-SHA>
```

Expected `git cat-file -t` output: `commit`. The same SHA is reachable from `archive` because the archive commit directly parents each distinct historical tip. Do not create an application deployment from `archive`.

## Independent off-site recovery bundle

Owner's private Library file: `hermes-git-recovery-2026-10-27.bundle`

- Size: **328,310,151 bytes** (approximately 314 MiB)
- SHA-256: `ae72fa7dab8e6ea27f059b80d88480e0387149d979ae8587136e16761b5845e0`.
- Tested restoring all **52 original heads and all 44 annotated tags** with original commit SHA equality.

After the owner downloads it:

```bash
git bundle verify hermes-git-recovery-2026-10-27.bundle
git clone --mirror hermes-git-recovery-2026-10-27.bundle hermes-restore.git
git --git-dir=hermes-restore.git show-ref
git --git-dir=hermes-restore.git rev-parse 'refs/tags/archive/checkpoint-rebuild-group-ui-pass^{}'
```

The tag dereference should resolve to the index's `3b29c1ea53b1cd45376e95def1fd8eedd7e1588b`. Tags are **included in the bundle**; they are **not claimed as separate GitHub tags**.

## Deletion control

The original branches remain in GitHub as of the archive publication step. Do not remove any of them until the owner authorizes a specific cleanup list in a new step, verifies archive reachability on GitHub, confirms the Library bundle is retrievable, and verifies `archive` protection. Do not delete active `main`, `ios`, `Android`, `backups`, `simulator-tests`, `simulator-evidence`, or notice branches `main2` and `main-3`.
