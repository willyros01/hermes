from pathlib import Path

def read(path): return Path(path).read_text()
def write(path,s): Path(path).write_text(s)
def replace_once(path,old,new):
    s=read(path)
    if old not in s: raise SystemExit(f"Missing expected anchor in {path}: {old[:140]!r}")
    write(path,s.replace(old,new,1))
def append_once(path,marker,block):
    s=read(path)
    if marker not in s: write(path,s.rstrip()+"\n\n"+block.strip()+"\n")

replace_once('version.js','version: "0.9.6.15"','version: "0.9.6.16"')
replace_once('README.md','- Current checkpoint version: **0.9.6.15**','- Current checkpoint version: **0.9.6.16**')
append_once('README.md','### 0.9.6.16 — group history-grant purge trace planning','''
### 0.9.6.16 — group history-grant purge trace planning

Release transition: **0.9.6.15 -> 0.9.6.16**.

- Clean 0.9.6.15 Rebuild Baseline Security Gate run `34053702432` passed every step before this slice.
- Added pure `disappearing-group-grant-trace-plan.js`. It owns only deterministic reconciliation of group earlier-history grant metadata/copies when one disappearing source is removed; it has no Firebase/Admin SDK, storage, UI, timer, crypto or delete ownership.
- A matching grant copy is planned for deletion. If it was the grant's only copy, the grant metadata is planned for deletion. If retained copies remain, the plan recomputes `totalCopies`, `firstSharedMessageId`, and `firstSharedAt` from the earliest still-retained source rather than leaving stale grant metadata.
- The planner fails closed when grant metadata and actual copy count disagree, a copy belongs to another group/grant, or duplicate source copies exist. A partially written/building grant therefore blocks final source purge until its trace set becomes internally consistent or is handled by a later cleanup owner.
- `disappearing-purge-firestore-admin-adapter.mjs` now reads history-grant metadata and copies as part of authoritative group purge state, includes their Firestore update times in the opaque purge basis, and returns the pure grant trace plan to the serialized executor path.
- Group source deletion remains deliberately fail-closed. This checkpoint does not yet perform receipt/grant/source mutation because a race-safe grant-creation barrier and one transaction/precondition commit path must exist first.
- Added dedicated planner tests plus repository integration tests. Rebuild Baseline Security Gate run `34054137154` passed all steps including the new group grant trace plan and Firestore purge repository gates.
- No live Firebase rules/functions/deletes, no `htest` deployment, no client delete permission, no App Check enforcement change, and no FCM activation.
- Next secure slice: bind new history-grant creation to the group authority update-time so concurrent grant creation invalidates a purge basis, then materialize one revalidated group commit that deletes receipts, source grant copies/reconciles grant metadata, and finally deletes the source without partial trace loss.
- Overall first-rebuild estimate remains approximately 65%.
''')

append_once('hermes-memory.txt','0.9.6.16 GROUP HISTORY-GRANT PURGE TRACE PLANNING','''
2026-09-06 — 0.9.6.16 GROUP HISTORY-GRANT PURGE TRACE PLANNING
- Clean 0.9.6.15 gate `34053702432` passed before this slice.
- Added pure `disappearing-group-grant-trace-plan.js`: for a disappearing group source it deterministically plans matching grant-copy deletion, whole-grant deletion when no copies remain, or metadata reconciliation (`totalCopies`, earliest retained `firstSharedMessageId`/`firstSharedAt`) when other retained copies remain.
- Planner fails closed on metadata/copy count mismatch, cross-group/cross-grant copy authority, duplicate source copies, or invalid source times. Incomplete building grants therefore cannot be ignored during purge.
- Server Firestore purge repository now includes history-grant docs + copies in authoritative group read state and in the opaque update-time purge basis; the existing pure purge eligibility owner remains unchanged.
- Group physical delete intentionally remains `GROUP_PURGE_TRACE_DELETE_NOT_READY`. Do not bypass this until concurrent grant creation is made basis-visible and the final one-path receipt/grant/source commit is validated.
- Dedicated planner/repository tests are permanent security-gate steps. Gate `34054137154` passed all substantive steps.
- Version advanced 0.9.6.15 -> 0.9.6.16. No live Firebase/htest/App Check/FCM change.
- Next: history-grant creation barrier through group authority update-time, then atomic/revalidated group trace commit, followed by UID-scoped local cache/Outbox anti-resurrection.
- Overall first complete rebuild remains approximately 65%.
''')

replace_once('FIDUNIO-BUILD-CHECKLIST.md',
'| Group disappearing text messages | IN PROGRESS | 0.9.6.15 reads authoritative source epoch membership/current entitlement/per-account receipts under an opaque Firestore basis. Physical delete is explicitly fail-closed until receipt and history-grant trace cleanup/reconciliation exists. |',
'| Group disappearing text messages | IN PROGRESS | 0.9.6.16 adds deterministic history-grant trace planning and binds grant metadata/copy update times into the authoritative group purge basis. Whole-grant delete vs retained-copy metadata reconciliation is now defined and gated. Physical group delete still fails closed pending concurrent-grant basis barrier + one revalidated receipt/grant/source commit. |')
replace_once('FIDUNIO-BUILD-CHECKLIST.md',
'| Expiry security/rules/tests | NOT DONE | 0.9.6.14 gates serialized executor eligibility/commit boundaries, stale-basis fail-closed behavior and server-time authority. Still required: emulator/server tests proving physical source/receipt/grant/attachment deletion, local cache purge, multi-device convergence and stale-client non-resurrection. |',
'| Expiry security/rules/tests | NOT DONE | 0.9.6.16 additionally gates group history-grant trace reconciliation and inclusion of grant/copy versions in the opaque purge basis. Still required: race-safe grant-creation barrier, physical group receipt/grant/source deletion tests, local cache purge, multi-device convergence, attachment cleanup and stale-client non-resurrection. |')
append_once('FIDUNIO-BUILD-CHECKLIST.md','0.9.6.16 group history-grant purge trace planning','''
- 2026-09-06 — 0.9.6.16 group history-grant purge trace planning: pure reconciliation now defines exact subordinate grant-copy/grant-metadata handling and the server group purge read basis includes grant/copy Firestore versions. Inconsistent/building trace sets fail closed. Gate `34054137154` green. Physical group commit/local convergence remain unfinished; live Firebase/htest untouched; overall estimate remains approximately 65%.
''')

append_once('DISAPPEARING-PURGE-AUTHORITY.md','## Group history-grant trace planning — 0.9.6.16','''
## Group history-grant trace planning — 0.9.6.16

`disappearing-group-grant-trace-plan.js` is the pure subordinate-history reconciliation owner. For one disappearing group source it receives complete grant metadata + copy rows and produces only a deterministic plan:

- delete every grant copy whose `sourceMessageId` equals the disappearing source;
- delete a grant document when that was its last copy;
- otherwise recompute `totalCopies` and the earliest retained `firstSharedMessageId` / `firstSharedAt` so grant metadata does not retain a stale reference to the purged source.

The planner fails closed if metadata `totalCopies` does not equal the observed copy count, if copy authority does not match its group/grant, if duplicate source copies exist, or if source times are invalid. A partially constructed grant cannot be silently ignored.

The server Firestore repository now reads grant metadata and copy subcollections during group purge state acquisition and includes every observed grant/copy update time in the opaque basis. Physical group deletion remains disabled until new grant creation is guaranteed to mutate a basis-visible authority and the final commit can re-read/reconcile receipts, grants/copies and source under one serialized path.
''')

append_once('architecture-ownership.txt','DISAPPEARING GROUP GRANT TRACE PLANNER — 0.9.6.16','''
DISAPPEARING GROUP GRANT TRACE PLANNER — 0.9.6.16
- `disappearing-group-grant-trace-plan.js`: pure subordinate history-grant reconciliation owner only.
- Inputs: complete grant metadata/copy rows for one group plus disappearing `sourceMessageId`.
- Outputs: copies to delete, grants to delete, and grants to update with recomputed count/earliest retained source.
- It owns no Firebase/Admin SDK, Firestore write, crypto, UI, cache, timer or scheduler.
- `disappearing-purge-firestore-admin-adapter.mjs` remains server read/write repository owner and now includes grant/copy update times in group purge basis.
- Group physical commit remains fail-closed until concurrent grant creation changes a basis-visible authority and all receipt/grant/source writes can be revalidated together.
''')

append_once('RUNTIME-AUTHORITY-MAP.md','Disappearing group grant trace planning — 0.9.6.16','''
## Disappearing group grant trace planning — 0.9.6.16
- `disappearing-group-grant-trace-plan.js`: pure plan only; no mutable authority.
- Group purge repository read now enumerates group history grants + grant copy subcollections, validates them through the pure planner, and incorporates their Firestore update times into the opaque purge basis.
- Incomplete/inconsistent grant construction fails closed rather than allowing source deletion to bypass subordinate traces.
- Group commit remains intentionally disabled pending a basis-visible concurrent-grant barrier and final receipt/grant/source transaction/precondition implementation.
''')

append_once('ACCOUNT-E2EE-GROUP-MESSAGE-FORMAT.md','### Disappearing source history-grant reconciliation — 0.9.6.16','''
### Disappearing source history-grant reconciliation — 0.9.6.16
When a disappearing source becomes final-purge eligible, every earlier-history grant copy for that exact `sourceMessageId` is subordinate and must be removed. The pure reconciliation plan now distinguishes two cases: delete the whole grant when no retained copies remain, or preserve the grant while recomputing `totalCopies` and its earliest retained `firstSharedMessageId`/`firstSharedAt`. Inconsistent or partially built grants fail closed and block final source deletion. The server purge basis includes grant/copy Firestore versions, but physical group commit remains unavailable until concurrent grant creation is made basis-visible and the full trace commit is atomic/revalidated.
''')

append_once('hermes-setup.txt','## 0.9.6.16 group grant purge-trace boundary','''
## 0.9.6.16 group grant purge-trace boundary
The repository now has deterministic group history-grant trace planning and group purge reads include grant/copy Firestore versions. Do not deploy a purge Function, open client delete rules, or enable disappearing/history-sharing UI from this checkpoint. Group commit still intentionally fails closed. The next repository change must first make new grant creation mutate a basis-visible group authority, then test one revalidated receipt/grant/source commit before any live Firebase handoff.
''')

append_once('CURRENT-REBUILD.md','0.9.6.16 purge continuation','''
## 0.9.6.16 purge continuation
Group disappearing purge now has deterministic history-grant trace planning and grant/copy versions in its server read basis. Physical group deletion remains deliberately fail-closed pending a race-safe new-grant barrier and one revalidated receipt/grant/source commit. Live Firebase and htest remain untouched.
''')

print('0.9.6.16 durable documentation reconciliation complete')
