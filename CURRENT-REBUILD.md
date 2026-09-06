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

## 0.9.6.18 copy purge barrier
New group history-copy writes are now basis-visible: every genuinely new copy chunk must atomically update group `updatedAt`, and repository Rules enforce it. Clean gate `34054991773` passed. Group physical trace deletion remains the next secure slice. Live Firebase and htest remain untouched.

## 0.9.6.19 receipt purge barrier
Group receipt creation/advance is now purge-basis-visible through an atomic parent `receiptRevision`. Clean gate `34055638377` passed. Group physical trace deletion remains fail-closed; next work is the bounded server trace commit, then local/offline anti-resurrection. Live Firebase and htest remain untouched.

## 0.9.6.20 atomic group physical trace commit
The server-only repository now revalidates and atomically removes/reconciles the complete Firestore group disappearing-message trace set. Browser deletes remain closed. Next security slice is local/offline anti-resurrection convergence (cache + encrypted Outbox, then remaining attachment/notification traces). Live Firebase and htest remain untouched. Overall first rebuild remains approximately 65%.

## 0.9.6.21 local anti-resurrection decision foundation
A pure local convergence planner now requires explicit prior server-backed observation plus authoritative server absence before identifying disappearing cache/Outbox traces for removal. Cache-only absence and device time remain non-authoritative; no tombstone is created. Next work is serialized IndexedDB/application wiring and restart/reconnect proof, then remaining attachment/object-URL/notification traces. Live Firebase and htest remain untouched. Overall first rebuild remains approximately 65%.

## 0.9.6.22 local physical purge wiring
The existing application/local-persistence owner can now physically remove planned disappearing IDs from live message state, encrypted history and matching encrypted Outbox rows under one serialized active-UID guard, with no tombstone. Full security gate `34058248816` is SUCCESS, so the build earns its allocated +1.0 point and weighted completion is now 68%. Next allocated work after green validation is 0.9.6.23 authoritative direct/group projection convergence. Live Firebase and htest remain untouched.

## 0.9.6.23 authoritative projection convergence
Direct and group message projections now distinguish cache-only snapshots from server-backed authority. Server-backed rows retain explicit disappearing metadata and prior-server observation; authoritative absence invokes the existing local convergence planner and serialized physical purge before projection persistence. Cache-only emptiness cannot purge. Group snapshot metadata now reaches the app projection, and granted-history authority is refreshed from server so stale cached grant copies cannot become authoritative resurrection material. Full gate `34058866151` passed. Weighted first-rebuild completion is **69%**. Next allocated build is 0.9.6.24 restart/reconnect stale-client anti-resurrection proof. Live Firebase and htest remain untouched.
