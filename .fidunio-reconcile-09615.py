from pathlib import Path

def read(path): return Path(path).read_text()
def write(path,s): Path(path).write_text(s)
def replace_once(path,old,new):
    s=read(path)
    if old not in s: raise SystemExit(f"Missing expected anchor in {path}: {old[:120]!r}")
    write(path,s.replace(old,new,1))
def append_once(path,marker,block):
    s=read(path)
    if marker not in s: write(path,s.rstrip()+"\n\n"+block.strip()+"\n")

replace_once('version.js','version: "0.9.6.14"','version: "0.9.6.15"')
replace_once('README.md','- Current checkpoint version: **0.9.6.14**','- Current checkpoint version: **0.9.6.15**')
append_once('README.md','### 0.9.6.15 — server Firestore purge repository foundation','''
### 0.9.6.15 — server Firestore purge repository foundation

Release transition: **0.9.6.14 -> 0.9.6.15**.

- Clean 0.9.6.14 Rebuild Baseline Security Gate run `34053227630` passed every step, including the serialized purge-executor gate.
- Added server-only `disappearing-purge-firestore-admin-adapter.mjs`. Firebase Admin Firestore is injected; the adapter does not initialize/import a competing Firebase SDK owner.
- Direct purge reads the authoritative direct conversation/message, derives the non-sender recipient, and binds an opaque purge basis to Firestore snapshot update times. Eligible direct source deletion is a Firestore transaction that re-reads the same authority and deletes the message only if the basis is unchanged. A stale basis fails closed; an already-absent source is idempotent success.
- Group purge reads the source message, exact source epoch membership, current group entitlement membership, and per-account receipts into one opaque update-time basis. This is sufficient for the existing pure group eligibility policy without making the adapter a second policy owner.
- Group physical deletion deliberately remains fail-closed with `GROUP_PURGE_TRACE_DELETE_NOT_READY`. The source will not be removed until history-grant copy/reference cleanup and receipt deletion can be coordinated without leaving FIDUNIO-controlled traces.
- Added `disappearing-purge-firestore-admin-adapter.test.mjs` and normal gate coverage for direct basis/read/delete/idempotency/stale rejection, group authority reads, server-only SDK ownership, and the explicit group fail-closed boundary. Rebuild Baseline Security Gate run `34053462019` passed all steps on the implementation/gate commit.
- This is repository-only. No scheduled purge Function was added or deployed, no client delete rule was opened, live Firebase and `htest` were untouched, FCM remains deferred to 1.1, and App Check enforcement remains OFF/deferred to 1.2.
- Next secure slice: materialize group history-grant trace planning/reconciliation and receipt deletion so a group source can be physically removed only after subordinate traces are safely handled; then add UID-scoped local cache/Outbox anti-resurrection convergence.
- Overall first-rebuild estimate remains approximately 65%.
''')

append_once('hermes-memory.txt','0.9.6.15 SERVER FIRESTORE PURGE REPOSITORY FOUNDATION','''
2026-09-06 — 0.9.6.15 SERVER FIRESTORE PURGE REPOSITORY FOUNDATION
- Clean 0.9.6.14 gate `34053227630` passed all steps before this slice.
- Added server-only `disappearing-purge-firestore-admin-adapter.mjs`; Admin Firestore is injected and no competing Firebase SDK initializer/import was introduced.
- Direct read authority binds conversation + message Firestore update times into an opaque basis and derives the non-sender recipient from the authoritative direct membership. Direct commit re-reads both in a Firestore transaction; unchanged basis deletes the source physically, stale basis fails closed, already-absent is idempotent success.
- Group read authority binds group/message/source-epoch/per-account receipt update times, source-epoch member UIDs and current entitlement UIDs for the existing pure group policy.
- Group physical delete is intentionally blocked with `GROUP_PURGE_TRACE_DELETE_NOT_READY` until history-grant copy/reference cleanup and receipt deletion are materialized together. Do not weaken this fail-closed boundary merely to make group purge appear complete.
- Dedicated adapter tests and normal security-gate step pass on implementation gate run `34053462019`.
- Version advanced 0.9.6.14 -> 0.9.6.15. No scheduler/deployment/client delete rules/live Firebase/htest changes.
- Next: group subordinate trace plan/reconciliation, then local cache/Outbox anti-resurrection and attachment lifecycle integration.
- Overall first complete rebuild remains approximately 65%.
''')

replace_once('FIDUNIO-BUILD-CHECKLIST.md',
'| Firestore trace-free purge | NOT DONE | At expiry, physically delete the Firestore message record and every application-owned subordinate/reference record associated only with that content. Do not leave an `expired` document or per-message tombstone. |',
'| Firestore trace-free purge | IN PROGRESS | 0.9.6.15 adds a server-only Firestore repository foundation: direct source deletion is transactional and basis-revalidated; group authoritative state/basis reads exist but group physical delete remains deliberately fail-closed until grant-copy/reference + receipt cleanup is coordinated. No tombstone/client delete rule. |')
replace_once('FIDUNIO-BUILD-CHECKLIST.md',
'| Direct disappearing text messages | NOT DONE | Purge cloud ciphertext/message doc, per-message receipts/references, local plaintext/ciphertext/cache, and any pending copy on all participating devices. |',
'| Direct disappearing text messages | IN PROGRESS | Repository server adapter can physically delete an eligible direct source with transaction/basis revalidation and idempotent absence. Scheduler/wiring plus UID-scoped local cache/Outbox convergence and multi-device validation remain required. |')
replace_once('FIDUNIO-BUILD-CHECKLIST.md',
'| Group disappearing text messages | NOT DONE | Same trace-free purge rule plus integration with group E2EE epochs, membership, and per-account receipts; no expired message record remains in Firestore. |',
'| Group disappearing text messages | IN PROGRESS | 0.9.6.15 reads authoritative source epoch membership/current entitlement/per-account receipts under an opaque Firestore basis. Physical delete is explicitly fail-closed until receipt and history-grant trace cleanup/reconciliation exists. |')
append_once('FIDUNIO-BUILD-CHECKLIST.md','0.9.6.15 server Firestore purge repository foundation','''
- 2026-09-06 — 0.9.6.15 server Firestore purge repository foundation: direct cloud-source delete transaction now has update-time basis revalidation and idempotent absence; group read authority is materialized but group deletion remains fail-closed pending subordinate grant/receipt trace cleanup. Gate `34053462019` green. No live deployment; overall estimate remains approximately 65%.
''')

append_once('DISAPPEARING-PURGE-AUTHORITY.md','## Firestore repository foundation — 0.9.6.15','''
## Firestore repository foundation — 0.9.6.15

`disappearing-purge-firestore-admin-adapter.mjs` is the first server-only repository implementation behind the serialized executor. It receives an Admin Firestore instance by dependency injection and never initializes Firebase itself.

Direct state basis includes the direct conversation and source-message Firestore update times. Direct commit runs in a Firestore transaction, re-reads those documents, rejects any basis change, validates the direct membership/sender-recipient relationship again, and physically deletes only the source message. An already absent source is idempotent success.

Group state basis includes the group document, source message, immutable source epoch document, and every current per-message receipt update time. The read returns source-epoch member UIDs, current entitlement member UIDs and receipt data to the existing pure eligibility owner. Group physical deletion is intentionally unavailable until history-grant copies/references and group receipts can be removed/reconciled without violating trace-free purge. The adapter therefore fails closed rather than deleting the group source prematurely.

This repository foundation is not a scheduler or deployed Function and does not authorize client delete rules.
''')

append_once('architecture-ownership.txt','DISAPPEARING FIRESTORE PURGE REPOSITORY — 0.9.6.15','''
DISAPPEARING FIRESTORE PURGE REPOSITORY — 0.9.6.15
- `disappearing-purge-firestore-admin-adapter.mjs`: server-only physical Firestore repository boundary; receives Admin Firestore by injection and does not initialize/import a competing Firebase SDK owner.
- Direct read/commit owns only authoritative server state + transactional source deletion under opaque update-time basis revalidation.
- Group read owns only authoritative source/group/epoch/receipt state acquisition. Group physical delete remains fail-closed until subordinate receipt/history-grant trace cleanup is complete.
- Eligibility remains exclusively in `disappearing-purge-policy.js`; orchestration remains exclusively in `disappearing-purge-executor.js`.
''')

append_once('RUNTIME-AUTHORITY-MAP.md','Disappearing Firestore purge repository — 0.9.6.15','''
## Disappearing Firestore purge repository — 0.9.6.15
- Server Firestore repository: `disappearing-purge-firestore-admin-adapter.mjs`.
- Admin Firestore is injected; the module is not a Firebase initializer and is never a browser/runtime import.
- Direct source deletion: transaction re-reads conversation/message, compares opaque update-time basis, then deletes only on unchanged authority; stale basis fails closed and absence is idempotent.
- Group read: authoritative group + source + source epoch + per-account receipts, all bound into the opaque basis supplied to the pure eligibility owner.
- Group source deletion: intentionally unavailable until history-grant/receipt subordinate trace deletion is materialized. No independent/partial group delete path is permitted.
''')

append_once('ACCOUNT-E2EE-DIRECT-MESSAGE-FORMAT.md','## Direct Firestore purge repository — 0.9.6.15','''
## Direct Firestore purge repository — 0.9.6.15
The server-only purge repository now derives direct recipient authority from the exact two-member conversation and binds conversation/message Firestore update times into the executor basis. An eligible direct purge transaction re-reads both snapshots and physically deletes the message only when that basis remains unchanged. Stale state fails closed; already-absent is idempotent. Browser delete permission, scheduler deployment, and local-cache convergence remain separate unfinished boundaries.
''')

append_once('ACCOUNT-E2EE-GROUP-MESSAGE-FORMAT.md','### Group Firestore purge repository read authority — 0.9.6.15','''
### Group Firestore purge repository read authority — 0.9.6.15
The server-only purge repository now reads the source group message, the exact source epoch record, current group membership/entitlement, and per-account receipt subcollection and binds their Firestore update times into the executor basis. Source-epoch recipients are derived from the epoch `memberKeyIds`, not from current membership. Group physical source deletion remains deliberately fail-closed until history-grant copies/references and receipt traces can be purged/reconciled safely; no partial delete path is accepted.
''')

append_once('hermes-setup.txt','## 0.9.6.15 server purge repository boundary','''
## 0.9.6.15 server purge repository boundary
Repository source now includes a server-only Firestore purge adapter and tests. Do not deploy it, create a purge scheduler, or open client delete rules yet. Direct transactional deletion is repository-proven only. Group commit intentionally fails closed until history-grant/receipt trace deletion is added. The later deployment package must preserve one purge-policy owner rather than duplicating root policy logic inside Functions.
''')

print('0.9.6.15 checkpoint reconciliation complete')
