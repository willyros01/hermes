from pathlib import Path

def rep(path,a,b):
 p=Path(path);s=p.read_text();
 if a in s:p.write_text(s.replace(a,b,1))
def add(path,marker,text):
 p=Path(path);s=p.read_text();
 if marker not in s:p.write_text(s.rstrip()+"\n\n"+text.strip()+"\n")
rep('README.md','Current checkpoint version: **0.9.6.21**','Current checkpoint version: **0.9.6.22**')
rep('README.md','Current first-rebuild completion estimate: **approximately 65%**','Current weighted FIDUNIO 1.0 completion: **67%** (0.9.6.22 points remain unearned until its full gate is green)')
add('README.md','### 0.9.6.22 — UID-scoped local physical purge wiring','''### 0.9.6.22 — UID-scoped local physical purge wiring
Release transition: **0.9.6.21 -> 0.9.6.22**. `app.js`, the existing owner of live application state, encrypted Outbox and encrypted history cache, now has one serialized UID-guarded local purge path. The path physically removes planned message IDs from in-memory message state, encrypted history records and matching Outbox records, then persists the cleaned state. Restored queued messages retain `disappearAfterSeconds` and are explicitly `serverBacked:false`; no tombstone/`expired:true` record is created. A pure local-storage plan and focused gate test were added. Authoritative snapshot invocation remains allocated to 0.9.6.23, so this build does not let cache-only absence trigger purge. Full gate validation is pending at documentation time. No live Firebase or htest change.''')
rep('FIDUNIO-BUILD-CHECKLIST.md','| **0.9.6.22** | **UID-scoped IndexedDB + encrypted Outbox physical purge wiring.** Preserve `disappearAfterSeconds` and prior-server-observation metadata in local records; route all local purge mutations through the existing serialized local-storage/application owner; delete matching history rows and Outbox rows before any retry; no second IndexedDB owner. | Focused local-storage tests prove exact-row deletion, unrelated rows retained, no tombstone, account isolation, and no retry after purge; full gate green. | CURRENT |','| **0.9.6.22** | **UID-scoped IndexedDB + encrypted Outbox physical purge wiring.** Preserve `disappearAfterSeconds` and prior-server-observation metadata in local records; route all local purge mutations through the existing serialized local-storage/application owner; delete matching history rows and Outbox rows before any retry; no second IndexedDB owner. | Focused local-storage test is wired for exact removal/unrelated retention/no tombstone/UID guard; full gate still pending. Authoritative pre-retry invocation is owned by 0.9.6.23/0.9.6.24. | IN PROGRESS |')
add('FIDUNIO-BUILD-CHECKLIST.md','0.9.6.22 materialization note','''### 0.9.6.22 materialization note
The existing `app.js` local persistence owner now contains the serialized UID-guarded physical purge mutation for message state, encrypted history and matching encrypted Outbox rows. `disappearing-local-storage-plan.js` is pure planning only and does not open IndexedDB. Build points remain **unearned** until the complete Rebuild Baseline Security Gate is green; weighted completion therefore remains **67.0/100.0** at this checkpoint. Next allocated build after validation is 0.9.6.23 authoritative direct/group projection convergence.''')
add('hermes-memory.txt','0.9.6.22 UID-SCOPED LOCAL PHYSICAL PURGE WIRING','''2026-09-06 — 0.9.6.22 UID-SCOPED LOCAL PHYSICAL PURGE WIRING
- Existing `app.js` remains the local state/history/Outbox mutation owner; no second IndexedDB owner was introduced.
- Added serialized `purgeLocalDisappearingMessageTraces(uid,messageIds)` with active Firebase UID guard.
- Planned IDs are physically omitted from in-memory messages and decrypted/re-encrypted history, matching encrypted Outbox rows are deleted, and cleaned app state is persisted.
- Restored queued messages retain `disappearAfterSeconds` and are explicitly never-server-backed (`serverBacked:false`).
- Added pure `disappearing-local-storage-plan.js` + focused test and normal gate step.
- 0.9.6.23 must supply authoritative direct/group server-backed observation/absence; this build does not authorize cache-only purge.
- Version advanced 0.9.6.21 -> 0.9.6.22. Full gate pending at documentation time; 0.9.6.22 weighted point remains unearned, so authoritative completion remains 67% until green. No live Firebase/htest change.''')
add('DISAPPEARING-PURGE-AUTHORITY.md','## UID-scoped local physical purge wiring — 0.9.6.22','''## UID-scoped local physical purge wiring — 0.9.6.22
`app.js` already owns the live `fidunio-local` application state, encrypted `history` cache and encrypted `outbox`; it therefore owns physical local message purge rather than introducing a competing storage module. The purge is serialized on one local-purge queue and requires the active authenticated UID. It decrypts history outside a Safari-sensitive read/write transaction, computes exact removals with the pure storage planner, re-encrypts cleaned history, deletes matching Outbox keys in one write transaction, and persists cleaned app state. No tombstone is written. Authority for deciding which IDs qualify remains `disappearing-local-convergence.js`; authoritative snapshot wiring is intentionally deferred to 0.9.6.23.''')
add('architecture-ownership.txt','LOCAL PHYSICAL PURGE — 0.9.6.22','''LOCAL PHYSICAL PURGE — 0.9.6.22
- `app.js` remains sole live application-state / encrypted history / encrypted Outbox mutation owner and now owns physical disappearing-message removal for those resources.
- `disappearing-local-storage-plan.js` is pure planning only; it cannot open IndexedDB or call Firebase.
- local purge is serialized and active-UID guarded; no tombstone and no second storage owner.
- authoritative absence classification remains with the 0.9.6.21 convergence policy and is wired in 0.9.6.23.''')
add('RUNTIME-AUTHORITY-MAP.md','Local physical purge wiring — 0.9.6.22','''## Local physical purge wiring — 0.9.6.22
- Mutable owner: existing `app.js` local persistence path.
- Resources: in-memory `state.messages`, encrypted `history`, encrypted `outbox`, encrypted persisted app-state.
- Serialization: dedicated local purge promise queue; active Firebase UID must match requested UID.
- Pure helper: `disappearing-local-storage-plan.js` computes exact removals only.
- 0.9.6.23 remains responsible for invoking this only from authoritative direct/group server-backed convergence.''')
add('CURRENT-REBUILD.md','## 0.9.6.22 local physical purge wiring','''## 0.9.6.22 local physical purge wiring
The existing application/local-persistence owner can now physically remove planned disappearing IDs from live message state, encrypted history and matching encrypted Outbox rows under one serialized active-UID guard, with no tombstone. The full security gate is pending at this documentation checkpoint, so its weighted point is not yet earned and completion remains 67%. Next allocated work after green validation is 0.9.6.23 authoritative direct/group projection convergence. Live Firebase and htest remain untouched.''')
print('0.9.6.22 docs reconciled as IN PROGRESS')
