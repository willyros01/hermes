from pathlib import Path

def read(path): return Path(path).read_text()
def write(path,s): Path(path).write_text(s)
def replace_once(path,old,new):
    s=read(path)
    if old not in s:
        raise SystemExit(f"Missing expected anchor in {path}: {old[:120]!r}")
    write(path,s.replace(old,new,1))
def append_once(path,marker,block):
    s=read(path)
    if marker not in s:
        write(path,s.rstrip()+"\n\n"+block.strip()+"\n")

append_once('hermes-memory.txt','0.9.6.14 SERIALIZED PURGE EXECUTOR AUTHORITY','''
2026-09-06 — 0.9.6.14 SERIALIZED PURGE EXECUTOR AUTHORITY
- Version advanced 0.9.6.13 -> 0.9.6.14.
- Added binding `DISAPPEARING-PURGE-AUTHORITY.md` defining one server purge owner, one revalidated trace set, one serialized commit path, no client delete rules, no per-message tombstones, and no device-clock cloud deletion authority.
- Added `disappearing-purge-executor.js` as the single serialized coordination owner. It imports the pure eligibility policy but owns no Firebase/Admin SDK, storage, UI, crypto, or physical deletes.
- The executor requires an explicit server-time provider and an opaque repository `basis`; the future mutable repository must re-read/revalidate that basis inside its transaction/precondition commit path.
- Ineligible direct/group sources never invoke the delete owner. A stale-basis commit fails closed and is not retried from stale state. One executor instance serializes direct and group attempts; cross-instance safety still belongs to the server repository transaction/precondition layer.
- Dedicated executor tests cover eligible direct commit, unread retention, group per-recipient blocking, removed-recipient handling, stale-basis failure, serialization, and explicit server-time authority; this test is now part of the normal Rebuild Baseline Security Gate.
- No Firestore/Storage delete implementation, scheduled Function, delete rule, local purge, attachment purge, live Firebase deployment, or htest deployment is introduced by this checkpoint.
- Next secure implementation boundary: dedicated server repository/adapter for authoritative state reads + revalidated physical trace deletion, then UID-scoped local cache/Outbox anti-resurrection convergence and attachment cleanup.
- Overall first complete rebuild estimate remains approximately 65%.
''')

replace_once('FIDUNIO-BUILD-CHECKLIST.md',
'| Disappearing-message policy/model | IN PROGRESS | 0.9.6.13 adds deterministic direct/group final-source purge eligibility on top of immutable first-Read and per-message duration metadata. Group eligibility uses source-epoch recipients minus sender intersected with current entitlement; removed/new-later members cannot incorrectly block retention. Physical purge execution, delete authority, local/offline convergence, attachments and anti-resurrection remain unfinished. |',
'| Disappearing-message policy/model | IN PROGRESS | 0.9.6.14 adds the serialized purge-executor coordination owner on top of 0.9.6.13 eligibility: explicit server-time provider, opaque revalidation basis, fail-closed stale commit, and one repository delete boundary. Physical Firestore/Storage deletion, repository adapter, local/offline convergence, attachments and anti-resurrection remain unfinished. |')
replace_once('FIDUNIO-BUILD-CHECKLIST.md',
'| Expiry security/rules/tests | NOT DONE | Tests must prove Firestore records are physically deleted, subordinate content/receipts are purged, local caches are cleared, and stale clients do not reintroduce expired content. |',
'| Expiry security/rules/tests | NOT DONE | 0.9.6.14 gates serialized executor eligibility/commit boundaries, stale-basis fail-closed behavior and server-time authority. Still required: emulator/server tests proving physical source/receipt/grant/attachment deletion, local cache purge, multi-device convergence and stale-client non-resurrection. |')
append_once('FIDUNIO-BUILD-CHECKLIST.md','0.9.6.14 serialized purge-executor foundation','''
- 2026-09-06 — 0.9.6.14 serialized purge-executor foundation: one coordination owner now serializes direct/group purge attempts and reaches mutation only through an injected revalidating repository boundary. Server time and opaque basis are mandatory; stale commits fail closed. Physical delete repository/scheduler/local convergence remain NOT DONE; live Firebase/htest untouched; overall estimate remains approximately 65%.
''')

append_once('architecture-ownership.txt','DISAPPEARING PURGE EXECUTOR AUTHORITY — 0.9.6.14','''
DISAPPEARING PURGE EXECUTOR AUTHORITY — 0.9.6.14
- Resource: final disappearing-source purge coordination, separate from pure eligibility and separate from physical Firestore/Storage mutation.
- Pure decision owner: `disappearing-purge-policy.js`.
- Serialized coordination owner: `disappearing-purge-executor.js`.
- Future mutable delete owner: one dedicated server repository/adapter only; no app.js/firebase.js/browser delete path and no client delete rules.
- Read/evaluate cycle requires authoritative server time and an opaque repository basis. Commit must re-read/revalidate that basis with transaction/precondition semantics; stale basis fails closed.
- The executor's local queue serializes one process only. Cross-instance/cloud correctness must come from the repository's transaction/precondition path.
- Physical trace deletion, scheduler, local cache/Outbox convergence and attachments remain separate unfinished resources.
''')

append_once('RUNTIME-AUTHORITY-MAP.md','Disappearing serialized purge executor — 0.9.6.14','''
## Disappearing serialized purge executor — 0.9.6.14
- `disappearing-purge-policy.js`: sole pure final-source eligibility owner.
- `disappearing-purge-executor.js`: sole serialized purge-coordination owner; no Firebase/Admin SDK, local storage, DOM, crypto or delete calls.
- Future server repository/adapter: sole physical Firestore/Storage delete owner. It must supply authoritative state + opaque basis, then re-read/revalidate that basis before commit.
- Server-side current time is required. Device/browser time cannot authorize cloud deletion.
- Ineligible sources never enter the mutable delete owner; stale basis fails closed without stale-state retry.
- No scheduled Function, client delete rule, or local anti-resurrection executor exists yet.
''')

append_once('ACCOUNT-E2EE-DIRECT-MESSAGE-FORMAT.md','Direct serialized purge coordination — 0.9.6.14','''
## Direct serialized purge coordination — 0.9.6.14
`disappearing-purge-executor.js` now consumes the direct purge eligibility decision under one serialized coordination path. The repository read supplies the authoritative direct source plus recipient UID and an opaque basis; an eligible commit must re-read/revalidate that basis server-side before physical deletion. Ineligible/unread/active-window sources do not reach the delete owner. This does not add client delete permission, a tombstone, a scheduled Function, or a deployed physical-delete implementation.
''')

append_once('ACCOUNT-E2EE-GROUP-MESSAGE-FORMAT.md','Group serialized purge coordination — 0.9.6.14','''
### Group serialized purge coordination — 0.9.6.14
`disappearing-purge-executor.js` now serializes group final-purge evaluation and delegates mutation through one future revalidating server repository boundary. The state read must provide the source message, source-epoch member set, current entitlement set, per-account receipts and opaque basis; commit must re-read/revalidate before deleting. Ineligible or stale state fails closed. History-grant copies remain subordinate traces and cannot extend source lifetime. No physical delete adapter/scheduler/client delete rule is enabled by this checkpoint.
''')

append_once('hermes-setup.txt','0.9.6.14 purge-executor repository boundary','''
## 0.9.6.14 purge-executor repository boundary
The rebuild now contains a repository-only serialized disappearing purge executor and binding `DISAPPEARING-PURGE-AUTHORITY.md`. Do not deploy a purge Function, open client delete rules, or alter live Firebase from this checkpoint. The next implementation must first add and repository-test one server repository/adapter that revalidates authoritative state/basis before physically deleting source/receipt/history-grant/attachment traces. Local cache/Outbox anti-resurrection remains a later bounded owner.
''')

print('0.9.6.14 durable documentation reconciliation complete')
