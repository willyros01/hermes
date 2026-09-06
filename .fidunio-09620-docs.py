from pathlib import Path

def append(path, marker, block):
    p=Path(path); s=p.read_text()
    if marker not in s: p.write_text(s.rstrip()+"\n\n"+block.strip()+"\n")
def replace(path,a,b):
    p=Path(path); s=p.read_text()
    if a not in s: raise SystemExit(f"missing anchor {a!r} in {path}")
    p.write_text(s.replace(a,b,1))

replace('README.md','- Current checkpoint version: **0.9.6.19**','- Current checkpoint version: **0.9.6.20**')
append('README.md','### 0.9.6.20 — atomic group physical trace commit','''
### 0.9.6.20 — atomic group physical trace commit

Release transition: **0.9.6.19 -> 0.9.6.20**.

- The server-only disappearing purge Firestore repository now materializes the previously fail-closed group commit path.
- Final group purge re-reads group, source message, source epoch, all message receipts, all history-grant metadata and all grant copies inside one Firestore transaction, recomputes the complete trace plan, and rejects any stale basis before writes.
- An eligible commit physically deletes every observed message receipt, every subordinate history-grant copy for the source, any grant made empty by that removal, reconciles retained grant metadata, then deletes the shared encrypted source in the same atomic commit.
- The existing 0.9.6.17-.19 grant/copy/receipt barriers make permitted concurrent browser writes basis-visible; a concurrent change therefore aborts/retries rather than creating an orphan trace.
- Browser/client delete authority remains closed. No tombstone or `expired:true` record was introduced.
- This checkpoint does not add a scheduler and does not yet complete local IndexedDB/Outbox/object-URL/notification anti-resurrection convergence or attachment purge.
- No live Firebase deployment occurred. `htest` remains untouched; App Check enforcement remains OFF; FCM remains deferred to 1.1.
- Overall first-rebuild estimate remains approximately 65%.
''')
append('hermes-memory.txt','0.9.6.20 ATOMIC GROUP PHYSICAL TRACE COMMIT','''
2026-09-06 — 0.9.6.20 ATOMIC GROUP PHYSICAL TRACE COMMIT
- `disappearing-purge-firestore-admin-adapter.mjs` now owns the complete server-only group Firestore trace commit.
- The commit transaction re-reads group/source/epoch/receipts/all grants/all grant copies, verifies the exact opaque basis, recomputes the pure grant trace plan, then performs all writes atomically.
- It deletes all source receipts, source-linked grant copies, empty grants and the source; retained grants are reconciled to the remaining count and earliest retained source.
- Any stale receipt/grant/copy/group/source/epoch basis fails closed before mutation. Already-absent source is idempotent success.
- Browser delete Rules remain closed; no tombstone, scheduler, live Firebase or htest change.
- Local/offline anti-resurrection, attachment traces and user-facing disappearing controls remain unfinished.
- Version 0.9.6.19 -> 0.9.6.20. Overall first rebuild remains approximately 65%.
''')
append('FIDUNIO-BUILD-CHECKLIST.md','0.9.6.20 atomic group physical trace commit','''
- 2026-09-06 — 0.9.6.20 atomic group physical trace commit: server repository now revalidates the complete group source/epoch/receipt/grant/copy basis and atomically deletes/reconciles every Firestore trace before deleting the source. Client delete authority remains closed. Local/offline anti-resurrection, attachments and final UI/device validation remain unfinished; no live Firebase/htest change; overall estimate remains approximately 65%.
''')
append('DISAPPEARING-PURGE-AUTHORITY.md','## Atomic group physical trace commit — 0.9.6.20','''
## Atomic group physical trace commit — 0.9.6.20

`commitGroupPurge` is now materialized in the single server-only Firestore repository. It performs all authoritative reads before writes in one Firestore transaction: group, disappearing source, source epoch, complete receipt query, complete history-grant query and every grant-copy query. It reconstructs the exact opaque basis and fails with `STALE_PURGE_BASIS` before mutation if any basis-visible authority changed.

After basis equality, the transaction recomputes the pure history-grant trace plan from the re-read rows. It deletes all source message receipts, deletes every history-grant copy whose `sourceMessageId` matches the source, deletes grants made empty, updates retained grants to the remaining `totalCopies` and earliest retained `firstSharedMessageId`/`firstSharedAt`, and finally deletes the shared encrypted source. These mutations commit atomically.

The 0.9.6.17 grant-creation barrier, 0.9.6.18 copy-creation barrier and 0.9.6.19 receipt revision barrier ensure every permitted concurrent browser addition/advance changes a basis-visible resource. Thus a trace cannot be appended behind the transaction's observed set without invalidating the transaction/precondition. Browser delete Rules remain closed.

This makes the Firestore group physical trace commit repository-ready, not product-complete. Local cache/Outbox/object-URL/notification convergence, attachment transport traces, scheduler/discovery and real device validation remain separate required slices.
''')
append('architecture-ownership.txt','GROUP PHYSICAL TRACE COMMIT — 0.9.6.20','''
GROUP PHYSICAL TRACE COMMIT — 0.9.6.20
- `disappearing-purge-firestore-admin-adapter.mjs` is the sole server Firestore physical-delete owner for direct and group disappearing sources.
- Group commit revalidates one complete basis and mutates receipts, grant copies, grant metadata and source in one transaction.
- Pure grant reconciliation remains owned by `disappearing-group-grant-trace-plan.js`; the repository only executes its revalidated plan.
- Browser delete authority remains prohibited.
''')
append('RUNTIME-AUTHORITY-MAP.md','Group physical trace commit — 0.9.6.20','''
## Group physical trace commit — 0.9.6.20
- Server purge repository: sole Firestore delete owner.
- One transaction re-reads group/source/epoch/receipts/grants/copies, checks opaque basis, recomputes grant trace plan, then atomically deletes/reconciles subordinate traces and source.
- 0.9.6.17-.19 concurrency barriers make browser grant/copy/receipt mutations basis-visible.
- Local/offline convergence remains a separate UID-scoped resource and is not owned by this server transaction.
''')
append('hermes-setup.txt','## 0.9.6.20 group physical trace commit','''
## 0.9.6.20 group physical trace commit
The repository now contains the server-only atomic group Firestore trace commit, but it is not deployed. Do not open browser delete Rules or deploy a scheduler yet. Complete local/offline anti-resurrection and remaining trace owners first, then perform controlled Firebase handoff and device validation.
''')
append('CURRENT-REBUILD.md','0.9.6.20 atomic group physical trace commit','''
## 0.9.6.20 atomic group physical trace commit
The server-only repository now revalidates and atomically removes/reconciles the complete Firestore group disappearing-message trace set. Browser deletes remain closed. Next security slice is local/offline anti-resurrection convergence (cache + encrypted Outbox, then remaining attachment/notification traces). Live Firebase and htest remain untouched. Overall first rebuild remains approximately 65%.
''')
print('0.9.6.20 docs reconciled')
