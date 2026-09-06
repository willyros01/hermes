from pathlib import Path

def append_once(path, marker, text):
    p=Path(path); s=p.read_text()
    if marker not in s: p.write_text(s.rstrip()+"\n\n"+text.strip()+"\n")

def replace(path, old, new):
    p=Path(path); s=p.read_text()
    if old not in s: raise SystemExit(f'anchor missing in {path}: {old[:90]!r}')
    p.write_text(s.replace(old,new,1))

release='''## 0.9.6.23 — authoritative direct/group projection convergence

Runtime version advanced from **0.9.6.22** to **0.9.6.23** because the server/cache projection boundary is now wired into both direct and group message projections.

Significant changes:
- `disappearing-authoritative-projection.js` is the pure server-vs-cache projection decision owner. A cache snapshot can merge but cannot authorize purge; a server-backed snapshot marks observed rows `serverBacked:true` and can plan physical removal of previously server-backed disappearing rows that are now absent.
- `app.js` invokes the existing serialized active-UID local physical purge owner before committing an authoritative direct/group projection, including matching encrypted Outbox removal.
- Direct and group projections preserve `disappearAfterSeconds`; legitimate never-server-backed queued work survives authoritative snapshots.
- Group snapshot metadata is propagated through the existing group conversation owner. Earlier-history grant reads now require server reads so a stale cached grant copy cannot be treated as authoritative after server purge; offline/cache projections preserve the already encrypted local projection rather than gaining delete authority.
- No tombstone, `expired:true`, client-clock purge authority, competing Firebase owner, service-worker semantic owner, live Firebase deployment, or htest deployment was introduced.

Validation: full `Rebuild Baseline Security Gate` run **34058866151** completed **SUCCESS**, including the permanent `Disappearing authoritative projection convergence` step and all prior E2EE/rules/recovery/runtime gates.

Rollback/rejection status: no validated checkpoint was rejected or rolled back. The historical rejected 0.9.4.12–0.9.4.15 invite/install implementation remains excluded.

Follow-on constraint: 0.9.6.24 owns cold-start/restart/reconnect ordering proof. In particular, an authoritative server snapshot must converge/purge stale server-backed disappearing traces before any reconnect Outbox replay can recreate them. The existing reconnect retry timers are not accepted as purge authority and must not be used as a semantic rescue mechanism.
'''
append_once('README.md','## 0.9.6.23 — authoritative direct/group projection convergence',release)
append_once('hermes-memory.txt','FIDUNIO 0.9.6.23 AUTHORITATIVE PROJECTION CONVERGENCE','''FIDUNIO 0.9.6.23 AUTHORITATIVE PROJECTION CONVERGENCE (2026-09-06)
- Runtime version: 0.9.6.23.
- Full baseline security gate 34058866151: SUCCESS.
- New pure owner `disappearing-authoritative-projection.js`: cache-only snapshots can merge but never purge; server snapshots mark observed rows serverBacked and plan exact disappearing absence convergence.
- app.js direct/group projection paths call the existing serialized active-UID local physical purge owner before authoritative projection persistence. Matching encrypted Outbox/history/live state traces are physically removed; no tombstone is created.
- Group conversation owner propagates Firestore snapshot metadata and preserves `disappearAfterSeconds`. Group history-grant authority reads are server-only when recomputing projection, preventing stale cached grant copies from being accepted as authoritative after source purge; offline local history remains cache-only and non-purge-authoritative.
- Live Firebase and htest were NOT touched. FCM remains 1.1; App Check enforcement remains OFF/deferred to 1.2.
- Weighted 1.0 ledger: 69.0/100.0 = 69%.
- NEXT: 0.9.6.24 restart/reconnect stale-client anti-resurrection proof. Must prove convergence occurs before Outbox retry after cold start/reconnect and must not use client time, tombstones, reload, or retry timers as semantic authority.''')
append_once('CURRENT-REBUILD.md','## 0.9.6.23 authoritative projection convergence','''## 0.9.6.23 authoritative projection convergence
Direct and group message projections now distinguish cache-only snapshots from server-backed authority. Server-backed rows retain explicit disappearing metadata and prior-server observation; authoritative absence invokes the existing local convergence planner and serialized physical purge before projection persistence. Cache-only emptiness cannot purge. Group snapshot metadata now reaches the app projection, and granted-history authority is refreshed from server so stale cached grant copies cannot become authoritative resurrection material. Full gate `34058866151` passed. Weighted first-rebuild completion is **69%**. Next allocated build is 0.9.6.24 restart/reconnect stale-client anti-resurrection proof. Live Firebase and htest remain untouched.''')
append_once('DISAPPEARING-PURGE-AUTHORITY.md','### 0.9.6.23 authoritative projection boundary','''### 0.9.6.23 authoritative projection boundary
`disappearing-authoritative-projection.js` owns the pure decision between cache merge and server-authoritative convergence. `snapshotMeta.fromCache === true` can never authorize local purge. A server-backed snapshot marks observed remote rows `serverBacked:true`; absence of a previously server-backed disappearing row may then be handed to the existing 0.9.6.22 physical local purge owner. Direct and group app projections execute that physical purge before persisting the new authoritative projection. Group history-grant reads used to rebuild the projection are server-only, while offline encrypted local history remains non-authoritative. This closes the projection-level resurrection path but does not yet prove cold-start/reconnect ordering; that proof belongs to 0.9.6.24.''')
append_once('architecture-ownership.txt','0.9.6.23 AUTHORITATIVE PROJECTION OWNER','''0.9.6.23 AUTHORITATIVE PROJECTION OWNER
- `disappearing-authoritative-projection.js`: sole pure owner for cache-vs-server message projection convergence decisions. No Firebase, IndexedDB, clock, UI, retry or physical-delete authority.
- `firebase.js`: remains sole Firebase SDK owner and supplies snapshot metadata; group history-grant projection reads use server-only Firestore reads.
- `e2ee-account-group-conversation.js`: remains group read-side owner and propagates snapshot metadata plus immutable disappearing duration to its bounded app callback.
- `app.js`: remains sole local persistence mutation owner; it invokes the existing serialized active-UID physical purge before committing authoritative direct/group projections.
- Service worker, client wall clock and reconnect timers have no disappearing-content semantic authority.''')
append_once('RUNTIME-AUTHORITY-MAP.md','### 0.9.6.23 projection convergence authority','''### 0.9.6.23 projection convergence authority
Server/cache projection decisions are centralized in `disappearing-authoritative-projection.js`. Firestore `fromCache` metadata is carried from the central Firebase/group subscription owners to the app boundary. Cache projections merge without purge; authoritative projections mark remote rows server-backed and may request exact local physical convergence through app.js. The local mutation itself remains serialized under the existing app/IndexedDB owner. Restart/reconnect pre-flush ordering is intentionally not claimed complete until 0.9.6.24.''')

replace('FIDUNIO-BUILD-CHECKLIST.md','- 0.9.6.23 and later allocated builds: **0.0 earned so far**.\n- **Current total: 68.0 / 100.0 = 68%.**\n\nThis 68% is the authoritative 1.0 completion figure until another allocated build earns points or a validated item regresses.','- 0.9.6.23 is repository-validated: **+1.0 earned**.\n- 0.9.6.24 and later allocated builds: **0.0 earned so far**.\n- **Current total: 69.0 / 100.0 = 69%.**\n\nThis 69% is the authoritative 1.0 completion figure until another allocated build earns points or a validated item regresses.')
replace('FIDUNIO-BUILD-CHECKLIST.md','| **0.9.6.23** | **Authoritative direct/group projection convergence.** Direct and group server-backed snapshots must mark observed remote messages as server-backed; server-backed absence invokes the 0.9.6.21 planner; cache-only snapshots may merge but never purge; group granted-history projection cannot resurrect a purged source. | Direct/group projection tests cover server-present, authoritative-absent, cache-only-empty, granted-history copy, and pending-local cases; full gate green. | PLANNED |','| **0.9.6.23** | **Authoritative direct/group projection convergence.** Direct and group server-backed snapshots mark observed remote messages as server-backed; server-backed absence invokes the 0.9.6.21 planner and 0.9.6.22 physical purge owner; cache-only snapshots merge but never purge; group granted-history authority refreshes from server so stale cached copies cannot become authoritative resurrection material. | Pure projection tests cover server-present, authoritative-absent, cache-only-empty and pending-local cases; group owner gate covers metadata/duration propagation; full gate `34058866151` SUCCESS. | REPOSITORY-VALIDATED |')
replace('FIDUNIO-BUILD-CHECKLIST.md','| **0.9.6.24** | **Restart/reconnect stale-client anti-resurrection proof.**','| **0.9.6.24** | **Restart/reconnect stale-client anti-resurrection proof.**')
print('0.9.6.23 docs reconciled; weighted ledger 69%')
