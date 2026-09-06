from pathlib import Path

def append(path, marker, block):
    p=Path(path); s=p.read_text()
    if marker not in s: p.write_text(s.rstrip()+"\n\n"+block.strip()+"\n")
def replace(path,a,b):
    p=Path(path); s=p.read_text()
    if a not in s: raise SystemExit(f"missing anchor {a!r} in {path}")
    p.write_text(s.replace(a,b,1))

replace('README.md','- Current checkpoint version: **0.9.6.20**','- Current checkpoint version: **0.9.6.21**')
append('README.md','### 0.9.6.21 — local anti-resurrection decision foundation','''
### 0.9.6.21 — local anti-resurrection decision foundation

Release transition: **0.9.6.20 -> 0.9.6.21**.

- Added `disappearing-local-convergence.js` as a pure decision owner for local disappearing-message convergence after authoritative cloud absence.
- Only a message explicitly known to have been server-backed, carrying valid disappearing metadata, and absent from an authoritative server-backed snapshot can be planned for local cache/Outbox removal.
- Cache-only absence, offline cold-start incompleteness, device time, and never-server-backed queued work cannot authorize local purge.
- The planner emits physical-removal IDs only and creates no tombstone or `expired:true` record.
- Added focused tests and the planner to the normal Rebuild Baseline Security Gate.
- This checkpoint deliberately does not yet wire IndexedDB mutation into `app.js`; persistent cross-restart Outbox suppression, group projection metadata, object URLs, attachments and notification traces remain unfinished.
- No live Firebase deployment occurred. `htest` remains untouched; App Check enforcement remains OFF; FCM remains deferred to 1.1.
- Overall first-rebuild estimate remains approximately 65%.
''')
append('hermes-memory.txt','0.9.6.21 LOCAL ANTI-RESURRECTION DECISION FOUNDATION','''
2026-09-06 — 0.9.6.21 LOCAL ANTI-RESURRECTION DECISION FOUNDATION
- Added pure `disappearing-local-convergence.js`.
- Local purge planning requires valid disappearing metadata + explicit prior server-backed observation + absence from a server-backed authoritative snapshot.
- Cache-only absence and client/device clocks are never purge authority. Never-server-backed queued work remains valid pending work.
- Planner identifies matching encrypted Outbox IDs for physical removal but does not itself own IndexedDB or mutate app state.
- No local/cloud tombstones are created.
- Next slice must wire this decision through the existing UID-scoped IndexedDB/application owner, preserve metadata on direct/group projections, remove matching cache/Outbox traces before retry, and prove restart/reconnect non-resurrection.
- Version 0.9.6.20 -> 0.9.6.21. No live Firebase/htest change. Overall first rebuild remains approximately 65%.
''')
append('FIDUNIO-BUILD-CHECKLIST.md','0.9.6.21 local anti-resurrection decision foundation','''
- 2026-09-06 — 0.9.6.21 local anti-resurrection decision foundation: pure convergence planner now distinguishes authoritative server absence from cache-only/offline absence and identifies local history/Outbox IDs eligible for physical removal without tombstones. IndexedDB wiring, restart/reconnect suppression, group projection metadata, attachments/object URLs/notifications and device validation remain unfinished. No live Firebase/htest change; overall estimate remains approximately 65%.
''')
append('DISAPPEARING-PURGE-AUTHORITY.md','## Local anti-resurrection decision foundation — 0.9.6.21','''
## Local anti-resurrection decision foundation — 0.9.6.21

`disappearing-local-convergence.js` is the pure local-convergence decision owner. It cannot open IndexedDB, mutate application state, call Firebase, delete cloud data, or use a client clock as deletion authority. It receives an already-classified authoritative remote ID set from the synchronization owner.

A local row is eligible for physical local removal only when it has valid `disappearAfterSeconds`, was explicitly observed as server-backed, and is absent from the authoritative server-backed snapshot. Cache-only absence and never-server-backed queued work do not qualify. Matching encrypted Outbox IDs are returned in the plan so the one local persistence owner can remove them before retry. The planner emits no tombstone.

This is intentionally only the decision foundation. The next slice must carry server-backed/disappearing metadata through direct and group projections, perform serialized IndexedDB history/Outbox removal through the existing UID-scoped owner before reconnect retry, and prove restart/offline convergence. Object URLs, attachment traces and notification payload caches remain separate resources.
''')
append('architecture-ownership.txt','LOCAL DISAPPEARING CONVERGENCE — 0.9.6.21','''
LOCAL DISAPPEARING CONVERGENCE — 0.9.6.21
- `disappearing-local-convergence.js`: pure local purge decision owner only.
- `app.js` / existing UID-scoped local persistence path remains the IndexedDB mutation owner; the planner must not become a second storage owner.
- Server-backed absence must be supplied by the synchronization path; cache-only absence is never authority.
- No device clock or tombstone may substitute for cloud purge authority.
''')
append('RUNTIME-AUTHORITY-MAP.md','Local disappearing convergence — 0.9.6.21','''
## Local disappearing convergence — 0.9.6.21
- Pure decision: `disappearing-local-convergence.js`.
- Required evidence: valid disappearing metadata, explicit server-backed prior observation, authoritative server-backed absence.
- Outputs: message IDs and matching Outbox IDs to physically remove.
- IndexedDB/app-state mutation remains with the existing local persistence owner; wiring is the next slice.
- Cache-only/offline snapshots and client clocks cannot authorize removal.
''')
append('CURRENT-REBUILD.md','0.9.6.21 local anti-resurrection decision foundation','''
## 0.9.6.21 local anti-resurrection decision foundation
A pure local convergence planner now requires explicit prior server-backed observation plus authoritative server absence before identifying disappearing cache/Outbox traces for removal. Cache-only absence and device time remain non-authoritative; no tombstone is created. Next work is serialized IndexedDB/application wiring and restart/reconnect proof, then remaining attachment/object-URL/notification traces. Live Firebase and htest remain untouched. Overall first rebuild remains approximately 65%.
''')
print('0.9.6.21 docs reconciled')
