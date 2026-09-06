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

replace_once('version.js','version: "0.9.6.17"','version: "0.9.6.18"')
replace_once('README.md','- Current checkpoint version: **0.9.6.17**','- Current checkpoint version: **0.9.6.18**')
append_once('README.md','### 0.9.6.18 — history-copy purge barrier','''
### 0.9.6.18 — history-copy purge barrier

Release transition: **0.9.6.17 -> 0.9.6.18**.

- Clean Rebuild Baseline Security Gate run `34054991773` passed every substantive step after the history-copy barrier materialization and temporary-workflow cleanup.
- `writeCloudGroupHistoryGrantCopies` now uses one `serverTimestamp()` for each non-empty new-copy chunk and atomically updates parent-group `updatedAt` in the same Firestore batch as those new copy documents.
- Firestore Rules require the existing `historyGrantBarrier(groupId)` for history-grant copy creation. A standalone history-copy write is denied; a valid copy write must be accompanied by the exact parent-group `updatedAt == request.time` touch.
- This closes the remaining purge-basis phantom-copy race for building grants. The group purge basis already includes the group document update time, so any newly written grant copy invalidates/retries a concurrent purge before final deletion.
- Idempotent retry that finds every requested copy already present performs no group touch and no duplicate write.
- Added `group-history-copy-purge-barrier.test.mjs` plus group emulator tests proving standalone copy denial and atomic barrier success.
- Group physical deletion remains fail-closed. With new-grant and new-copy creation now basis-visible, the next secure repository slice is the bounded revalidated group trace commit: receipts + affected grant copies + grant metadata reconciliation/deletion + final source delete.
- Repository Firestore Rules changed only; **no live Firebase rule deployment** occurred. `htest` remains untouched; App Check enforcement remains OFF; FCM remains deferred to 1.1.
- Overall first-rebuild estimate remains approximately 65%.
''')

append_once('hermes-memory.txt','0.9.6.18 HISTORY-COPY PURGE BARRIER','''
2026-09-06 — 0.9.6.18 HISTORY-COPY PURGE BARRIER
- Clean gate `34054991773` passed all baseline steps, including new grant-copy barrier coverage.
- `writeCloudGroupHistoryGrantCopies` now shares one server timestamp across all genuinely new copies in a chunk and the parent group's `updatedAt`, committed in one Firestore batch.
- Firestore Rules reuse `historyGrantBarrier(groupId)` for copy creation; standalone copy writes are denied.
- New copy creation is now basis-visible because group purge state already binds the group document update time. Together with 0.9.6.17 new-grant barrier, neither a new grant nor a new copy can appear after planning without invalidating the purge basis.
- Existing-copy retries remain idempotent: when no new copy is written, no group barrier touch is generated.
- Group source delete remains disabled pending one revalidated trace commit; do not bypass `GROUP_PURGE_TRACE_DELETE_NOT_READY` yet.
- Version advanced 0.9.6.17 -> 0.9.6.18. No live Firebase/htest/App Check/FCM change.
- Next: bounded atomic/revalidated receipt/grant/source deletion, followed by local cache/Outbox anti-resurrection and attachments.
- Overall first complete rebuild remains approximately 65%.
''')

append_once('FIDUNIO-BUILD-CHECKLIST.md','0.9.6.18 history-copy purge barrier','''
- 2026-09-06 — 0.9.6.18 history-copy purge barrier: genuinely new group history-copy chunks must atomically touch parent-group `updatedAt`; Rules deny standalone copy creation. Together with 0.9.6.17 grant creation barrier, all new grant/copy subordinate writes are basis-visible. Gate `34054991773` green. Physical group trace commit/local convergence remain unfinished; no live Firebase/htest change; overall estimate remains approximately 65%.
''')

append_once('DISAPPEARING-PURGE-AUTHORITY.md','## History-copy creation purge barrier — 0.9.6.18','''
## History-copy creation purge barrier — 0.9.6.18

Every genuinely new history-grant copy chunk now updates the parent group `updatedAt` in the same Firestore batch and uses the same server timestamp for the new copy `createdAt` values. Firestore Rules require `historyGrantBarrier(groupId)` for copy creation, so an administrator cannot append a copy without a basis-visible group authority change.

This complements the 0.9.6.17 new-grant barrier. While a grant is `building`, any additional copy creation changes group update-time; activation changes the grant document itself, whose update time is already present in the purge basis. Thus the observed grant/copy trace set can no longer gain a permitted browser-written subordinate document without changing a basis-visible resource.

The group source still must not be deleted until the server repository revalidates and commits all receipt/grant/source traces together.
''')

append_once('architecture-ownership.txt','GROUP HISTORY-COPY PURGE BARRIER — 0.9.6.18','''
GROUP HISTORY-COPY PURGE BARRIER — 0.9.6.18
- `firebase.js` remains the only browser Firestore transport owner for history-copy writes.
- A non-empty new-copy chunk and parent group `updatedAt` are one batch and one server timestamp authority.
- Firestore Rules require the same group barrier for each copy create.
- Existing-copy idempotent retry writes nothing and does not manufacture a barrier update.
- Server group purge repository remains the sole physical-delete owner; no delete capability moved to the browser.
''')

append_once('RUNTIME-AUTHORITY-MAP.md','Group history-copy purge barrier — 0.9.6.18','''
## Group history-copy purge barrier — 0.9.6.18
- `firebase.js` history-copy chunk transport updates parent-group `updatedAt` in the same batch as every genuinely new copy chunk.
- Firestore Rules deny copy create unless `historyGrantBarrier(groupId)` is satisfied.
- Group update-time is already part of the server purge basis, so new grant-copy writes are now purge-conflict/basis-visible.
- No physical delete authority moved to the client; group purge commit remains server-only and currently fail-closed.
''')

append_once('ACCOUNT-E2EE-GROUP-MESSAGE-FORMAT.md','### History-copy purge barrier — 0.9.6.18','''
### History-copy purge barrier — 0.9.6.18
While an earlier-history grant is building, each chunk that creates one or more new message-granular copies must atomically update the parent group `updatedAt` using the same server timestamp. Repository Rules enforce this barrier. The barrier does not grant history or extend disappearing lifetime; it exists solely so concurrent subordinate-copy creation invalidates the group purge basis before source deletion can commit.
''')

append_once('FIRESTORE-E2EE-V1-EMULATOR-TESTS.md','## Group history-copy purge barrier — 0.9.6.18','''
## Group history-copy purge barrier — 0.9.6.18
The group emulator matrix now denies an administrator's standalone history-grant copy creation and accepts the same copy only when the request also updates parent-group `updatedAt` to server request time. Dedicated `group-history-copy-purge-barrier.test.mjs` gates the central `firebase.js` batch and Rules anchor. Rebuild Baseline Security Gate run `34054991773` passed. These repository Rules are not deployed to live Firebase by this checkpoint.
''')

append_once('hermes-setup.txt','## 0.9.6.18 history-copy purge barrier','''
## 0.9.6.18 history-copy purge barrier
Repository history-copy creation now requires an atomic parent-group `updatedAt` barrier. Do not deploy these rule changes yet and do not enable disappearing/history-sharing UI. Group physical purge remains server-only and fail-closed until its complete trace commit is repository-tested.
''')

append_once('CURRENT-REBUILD.md','0.9.6.18 copy purge barrier','''
## 0.9.6.18 copy purge barrier
New group history-copy writes are now basis-visible: every genuinely new copy chunk must atomically update group `updatedAt`, and repository Rules enforce it. Clean gate `34054991773` passed. Group physical trace deletion remains the next secure slice. Live Firebase and htest remain untouched.
''')

print('0.9.6.18 durable documentation reconciliation complete')
