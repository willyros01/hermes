# FIDUNIO Current Rebuild — Recovery Entry Point

**Current development branch:** `fidunio-complete-rebuild`

If a ChatGPT session is interrupted or a handover is required, start here:

1. Read `hermes-memory.txt` completely, beginning with its mandatory-first-read instructions.
2. Read `FIDUNIO-BUILD-CHECKLIST.md` completely and use it as the authoritative operational completion ledger.
3. Read the architecture/security documents required by `hermes-memory.txt` before consequential code changes.
4. Perform executable development on `fidunio-complete-rebuild` until the complete candidate is security-gated and deliberately promoted.

## Main-branch recovery mirror

A curated set of recovery-critical documentation is automatically mirrored from `fidunio-complete-rebuild` to `main` by `.github/workflows/mirror-rebuild-docs-to-main.yml`.

The copies on `main` are for discovery, outage recovery, and handover. The authoritative in-progress executable source remains `fidunio-complete-rebuild` until final promotion. Do **not** infer that application code on `main` is the current rebuild.

## Mirrored documents

- `CURRENT-REBUILD.md`
- `hermes-memory.txt`
- `FIDUNIO-BUILD-CHECKLIST.md`
- `hermes-setup.txt`
- `CODING-GUIDELINES.md`
- `RUNTIME-AUTHORITY-MAP.md`
- `architecture-ownership.txt`
- `ACCOUNT-E2EE-FIRESTORE-AUTHORITY.md`
- `ACCOUNT-E2EE-DIRECT-MESSAGE-FORMAT.md`
- `ACCOUNT-E2EE-GROUP-MESSAGE-FORMAT.md`
- `E2EE-RECOVERY-PROTOCOL.md`
- `DETERMINISTIC-UI-LIFECYCLE.md`
- `BUG-LIST.md`

## Mirror rule

When any mirrored source document changes on `fidunio-complete-rebuild`, the workflow updates only these curated documentation files on `main`. It does not merge or copy unfinished application code.
