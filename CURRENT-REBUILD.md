# FIDUNIO Current Rebuild — Recovery Entry Point

**Current development branch:** `fidunio-complete-rebuild`

If a ChatGPT session is interrupted or a handover is required, start here:

1. Read `hermes-memory.txt` completely, beginning with its mandatory-first-read instructions.
2. Read `FIDUNIO-BUILD-CHECKLIST.md` completely and use it as the authoritative operational completion ledger.
3. Read the architecture/security documents required by `hermes-memory.txt` before consequential code changes.
4. Perform executable development on `fidunio-complete-rebuild` until the complete candidate is security-gated and deliberately promoted.

Current product decision: disappearing direct and group messages use a fixed interval that starts from each recipient account's first authoritative Read event. Group timers are per recipient, not first-reader-global. Exact purge implementation remains in progress.

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

## 0.9.6.16 purge continuation
Group disappearing purge now has deterministic history-grant trace planning and grant/copy versions in its server read basis. Physical group deletion remains deliberately fail-closed pending a race-safe new-grant barrier and one revalidated receipt/grant/source commit. Live Firebase and htest remain untouched.

## 0.9.6.17 purge barrier
New group history-grant creation is now basis-visible to disappearing purge: the same transaction must update group `updatedAt`, and repository Rules enforce that barrier. Clean gate `34054522196` passed. Physical group deletion remains fail-closed pending one revalidated receipt/grant/source commit. No live Firebase or htest change.
