from pathlib import Path

def read(path): return Path(path).read_text()
def write(path,s): Path(path).write_text(s)
def replace_once(path,old,new):
    s=read(path)
    if old not in s: raise SystemExit(f"Missing expected anchor in {path}: {old[:160]!r}")
    write(path,s.replace(old,new,1))
def append_once(path,marker,block):
    s=read(path)
    if marker not in s: write(path,s.rstrip()+"\n\n"+block.strip()+"\n")

replace_once('version.js','version: "0.9.6.16"','version: "0.9.6.17"')
replace_once('README.md','- Current checkpoint version: **0.9.6.16**','- Current checkpoint version: **0.9.6.17**')
append_once('README.md','### 0.9.6.17 — history-grant purge barrier','''
### 0.9.6.17 — history-grant purge barrier

Release transition: **0.9.6.16 -> 0.9.6.17**.

- Clean Rebuild Baseline Security Gate run `34054522196` passed every substantive step on the cleaned barrier implementation, including the group emulator matrix and dedicated history-grant purge-barrier gate.
- New earlier-history grant creation now atomically updates the authoritative group `updatedAt` in the same Firestore transaction that creates the building grant. The grant and group touch share one `serverTimestamp()` authority.
- Firestore Rules now require `historyGrantBarrier(groupId)`: a grant create is accepted only when the same write changes exactly group `updatedAt` to `request.time`. A standalone grant create is denied.
- This closes the purge-basis phantom-grant race: group purge basis already includes the group document update time, so a concurrent new history grant invalidates/retries the purge transaction rather than escaping the previously observed grant/copy trace set.
- Idempotent retry of an already-existing matching building grant does not create another barrier write.
- Added `group-history-grant-purge-barrier.test.mjs` plus emulator coverage proving missing barrier denial and atomic barrier success.
- Group physical purge remains deliberately fail-closed. The next repository slice is the one revalidated group commit that removes receipts, affected grant copies, deletes/reconciles grant metadata, and only then removes the source.
- Repository Firestore Rules changed, but **no live Firebase rules were deployed**. `htest` remains untouched; App Check enforcement remains OFF; FCM remains deferred to 1.1.
- Overall first-rebuild estimate remains approximately 65%.
''')

append_once('hermes-memory.txt','0.9.6.17 HISTORY-GRANT PURGE BARRIER','''
2026-09-06 — 0.9.6.17 HISTORY-GRANT PURGE BARRIER
- Clean gate `34054522196` passed the complete baseline including the dedicated grant-barrier and updated group emulator tests.
- `beginCloudGroupHistoryGrant` now uses one Firestore transaction and one `serverTimestamp()` to update group `updatedAt` and create a new building grant together.
- Firestore Rules require `historyGrantBarrier(groupId)`: the same request must change only group `updatedAt` and set it to `request.time`; standalone history-grant creation is denied.
- The group purge basis already includes the group document Firestore update time. Therefore a concurrent new grant is now basis-visible and cannot appear as an unobserved subordinate trace after purge planning.
- Existing matching building-grant retry remains idempotent and does not touch group authority again.
- No group source deletion is enabled yet; `GROUP_PURGE_TRACE_DELETE_NOT_READY` remains intentional until one revalidated receipt/grant/source commit is materialized.
- Version advanced 0.9.6.16 -> 0.9.6.17. Repository rules changed only; live Firebase/htest untouched; App Check OFF; FCM deferred.
- Next: atomic/revalidated group physical trace commit, then UID-scoped local cache/Outbox anti-resurrection and attachment integration.
- Overall first complete rebuild remains approximately 65%.
''')

replace_once('FIDUNIO-BUILD-CHECKLIST.md',
'Physical group delete still fails closed pending concurrent-grant basis barrier + one revalidated receipt/grant/source commit.',
'Concurrent new-grant creation is now basis-visible through the 0.9.6.17 atomic group `updatedAt` barrier. Physical group delete still fails closed pending one revalidated receipt/grant/source commit.')
append_once('FIDUNIO-BUILD-CHECKLIST.md','0.9.6.17 history-grant purge barrier','''
- 2026-09-06 — 0.9.6.17 history-grant purge barrier: new building-grant creation must atomically touch group `updatedAt`; Firestore Rules deny standalone grant creation, making concurrent new grants visible to the existing group purge basis. Gate `34054522196` green. Physical group delete/local convergence remain unfinished; no live Firebase/htest change; overall estimate remains approximately 65%.
''')

append_once('DISAPPEARING-PURGE-AUTHORITY.md','## History-grant creation purge barrier — 0.9.6.17','''
## History-grant creation purge barrier — 0.9.6.17

A new group history grant must now mutate a basis-visible group authority in the same transaction that creates its metadata. `beginCloudGroupHistoryGrant` uses one server timestamp to update `groups/{groupId}.updatedAt` and create `historyGrants/{grantId}`. Firestore Rules enforce the same-request barrier through `historyGrantBarrier(groupId)`, which permits only an `updatedAt` change and requires that timestamp to equal `request.time`.

Because the group purge basis includes the group document Firestore update time, a concurrent new grant now invalidates/retries an in-flight purge transaction instead of becoming a phantom subordinate trace outside the observed grant set. Existing matching building-grant retry is idempotent and does not manufacture a new barrier event.

This closes the prerequisite race only. The group physical-delete commit remains fail-closed until receipts, grant copies, grant metadata reconciliation and source deletion are performed under one revalidated path.
''')

append_once('architecture-ownership.txt','GROUP HISTORY-GRANT PURGE BARRIER — 0.9.6.17','''
GROUP HISTORY-GRANT PURGE BARRIER — 0.9.6.17
- New history-grant creation remains owned by `firebase.js` browser Firestore transport.
- Resource coupling required for purge safety: a genuinely new grant atomically touches only group `updatedAt` plus the new grant document.
- Firestore Rules enforce the same-request barrier; callers cannot create a grant without a basis-visible group authority change.
- Group purge repository continues to own server read/delete authority and includes group update-time in its opaque basis.
- No second purge/grant owner is introduced.
''')

append_once('RUNTIME-AUTHORITY-MAP.md','Group history-grant purge barrier — 0.9.6.17','''
## Group history-grant purge barrier — 0.9.6.17
- `firebase.js` history-grant create transaction now updates group `updatedAt` and creates the grant with one server timestamp.
- Firestore Rules require `historyGrantBarrier(groupId)` and reject grant creation lacking that exact group touch.
- The server purge repository already includes group update-time in the opaque basis, making new-grant creation conflict/basis-visible.
- Physical group trace deletion remains exclusively server-side and not yet enabled.
''')

append_once('ACCOUNT-E2EE-GROUP-MESSAGE-FORMAT.md','### History-grant purge barrier — 0.9.6.17','''
### History-grant purge barrier — 0.9.6.17
Creating a genuinely new earlier-history grant now atomically updates the group `updatedAt` with the same server timestamp used for the building grant's `createdAt`. Repository Firestore Rules require that barrier and deny standalone grant creation. This is a purge-safety synchronization marker, not a new history-lifetime authority: grant targets still cannot extend a disappearing source lifetime. It exists so concurrent grant creation invalidates the group purge basis before any source deletion can commit.
''')

append_once('FIRESTORE-E2EE-V1-EMULATOR-TESTS.md','## Group history-grant purge barrier — 0.9.6.17','''
## Group history-grant purge barrier — 0.9.6.17
The group E2EE emulator matrix now proves that an administrator cannot create a history grant as an isolated document write. Valid creation must atomically update only the parent group `updatedAt` to server request time and create the building grant in the same request. The dedicated `group-history-grant-purge-barrier.test.mjs` also gates the central `firebase.js` transaction and Rules anchor. Rebuild Baseline Security Gate run `34054522196` passed. Repository validation does not deploy these changed rules to live Firebase.
''')

append_once('hermes-setup.txt','## 0.9.6.17 history-grant purge barrier','''
## 0.9.6.17 history-grant purge barrier
Repository Firestore Rules now require every new group earlier-history grant to atomically touch parent-group `updatedAt`. Do not deploy these rule changes yet. Group physical purge is still disabled until the receipt/grant/source transaction is repository-tested. Live Firebase and htest remain untouched.
''')

append_once('CURRENT-REBUILD.md','0.9.6.17 purge barrier','''
## 0.9.6.17 purge barrier
New group history-grant creation is now basis-visible to disappearing purge: the same transaction must update group `updatedAt`, and repository Rules enforce that barrier. Clean gate `34054522196` passed. Physical group deletion remains fail-closed pending one revalidated receipt/grant/source commit. No live Firebase or htest change.
''')

print('0.9.6.17 durable documentation reconciliation complete')
