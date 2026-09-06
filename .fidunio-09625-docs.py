from pathlib import Path

GATE='34060082292'
HEAD='cb05fadc749fd42cdbbccc64fc3bb1972b854d41'

# Checklist: materialized/green implementation but build remains incomplete because
# the post-commit/pre-observation crash window cannot be distinguished without
# durable anti-replay state. No 0.5 point is awarded.
p=Path('FIDUNIO-BUILD-CHECKLIST.md'); s=p.read_text()
s=s.replace('| **0.9.6.25** | **CURRENT — Restart/reconnect stale-client anti-resurrection proof.** Persisted history + encrypted Outbox survive ordinary offline restart, but an already-authoritatively-purged disappearing ID is removed before reconnect flush/projection. Prove stale cache cannot re-upload or re-project expired material. | Cold-start, offline->online, stale snapshot and duplicate retry tests green; no `location.reload()`/timer rescue. | CURRENT |',
'''| **0.9.6.25** | **Restart/reconnect stale-client anti-resurrection proof.** Cloud/group Outbox replay now performs explicit Firestore server reads first. Server-present IDs are treated as accepted and their stale Outbox row is removed; prior-server-backed disappearing IDs that are authoritatively absent are physically purged before retry; only never-server-backed absent work may replay. **Unresolved:** a crash after Firestore accepts a send but before local/server-observation state is durably recorded is indistinguishable after later server purge from truly never-sent work without some durable anti-replay authority. | Planner/integration gate plus full baseline `34060082292` SUCCESS for the implemented replay barrier. Build exit remains incomplete until the post-commit/pre-observation crash window is resolved without violating trace-free purge/no-tombstone requirements. | IN PROGRESS |''')
# Keep weighted ledger unchanged and make the unearned point explicit.
s=s.replace('- 0.9.6.25 and later allocated builds: **0.0 earned so far**.', '- 0.9.6.25 is materialized and its full repository gate is green, but its crash-window exit criterion is unresolved: **0.0 / 0.5 earned**.\n- 0.9.6.26 and later allocated builds: **0.0 earned so far**.')
marker='### 0.9.6.25 restart/reconnect anti-resurrection status'
if marker not in s:
    s=s.rstrip()+'''\n\n### 0.9.6.25 restart/reconnect anti-resurrection status\nBuild 0.9.6.25 is **IN PROGRESS**, not repository-validated for product-point purposes. The implemented reconnect barrier has a green full baseline gate (`34060082292`) and blocks blind cloud/group Outbox replay until explicit server reads complete. It safely handles server-present accepted rows, prior-server-backed disappearing rows that are now authoritatively absent, legitimate never-server-backed queued work, and unexpected ordinary server-backed absence. The remaining exact crash window is: Firestore accepts a send, the browser/device crashes before either Outbox deletion or durable `serverBacked:true` observation, the message later disappears from the server, and the sender restarts with a stale Outbox row plus `serverBacked:false`. Current trace-free/no-tombstone rules provide no durable fact that distinguishes that state from truly never-sent work. No 0.9.6.25 point is earned until this conflict is resolved. Weighted completion therefore remains **69.5/100, reported as 70%**.\n'''
p.write_text(s)

# Shared durable note.
note='''\n\n### 0.9.6.25 restart/reconnect replay barrier — IN PROGRESS\nRuntime version is now **0.9.6.25**. `disappearing-reconnect-recovery.js` is the pure restart/reconnect Outbox decision owner. `firebase.js` remains the sole client Firebase owner and now exposes explicit server-only direct/group source-ID probes; `app.js` remains the sole local mutation/controller owner and serializes reconnect reconciliation before any cloud/group Outbox replay. Server-present Outbox IDs are treated as already accepted, prior-server-backed disappearing IDs that are authoritatively absent are physically purged before retry, and only never-server-backed absent work may replay. Cache-only absence and client time remain non-authoritative; no tombstone is created. Full baseline security gate **34060082292** passed on head `cb05fadc749fd42cdbbccc64fc3bb1972b854d41`.\n\nThe build is deliberately **not** marked repository-validated for the 1.0 ledger because one exact crash/idempotency boundary remains unresolved: if Firestore accepts a send and the browser crashes before the Outbox is deleted or any durable `serverBacked:true` observation is recorded, then the source later expires and is physically purged before that device returns, restart state is indistinguishable from genuinely never-sent queued work. A per-message tombstone/accepted-ID registry would violate the current trace-free rule; delaying purge until sender acknowledgement can violate disappearance semantics; a durable per-device/replay-channel high-water mark may solve replay but would intentionally retain non-content anti-replay state caused by expired traffic and therefore needs an explicit architecture/privacy decision before adoption. The contract records `postCommitPreObservationCrashGapClosed:false`. No live Firebase or `htest` change was made. The allocated 0.5 point remains unearned, so weighted completion stays **69.5/100 (70% normal status)**. Do not begin 0.9.6.26 until this boundary is resolved.\n'''
for name in ['README.md','hermes-memory.txt','CURRENT-REBUILD.md','DISAPPEARING-PURGE-AUTHORITY.md']:
    q=Path(name); t=q.read_text()
    if '### 0.9.6.25 restart/reconnect replay barrier — IN PROGRESS' not in t:
        t=t.rstrip()+note+'\n'
    q.write_text(t)

# README version-session rule: explicit old -> new/reason/validation/follow-on constraint.
p=Path('README.md'); s=p.read_text()
rv='''\n### Version checkpoint 0.9.6.24 -> 0.9.6.25\nReason: materialize the allocated restart/reconnect anti-resurrection barrier. Significant change: cloud/group encrypted Outbox replay is now preceded by explicit Firestore server-authority reads and a serialized app-owned reconciliation step. Validation: full `Rebuild Baseline Security Gate` run `34060082292` succeeded. This is **not** a rollback or rejected build, but the build remains IN PROGRESS because the post-commit/pre-observation crash window still requires an architecture decision. Follow-on constraint: do not advance to 0.9.6.26 and do not touch live Firebase/`htest` until that boundary is resolved.\n'''
if '### Version checkpoint 0.9.6.24 -> 0.9.6.25' not in s:s=s.rstrip()+rv+'\n'
p.write_text(s)

# Ownership docs.
for name in ['architecture-ownership.txt','RUNTIME-AUTHORITY-MAP.md']:
    p=Path(name); s=p.read_text(); mark='0.9.6.25 RECONNECT / REPLAY OWNERSHIP'
    if mark not in s:
        s=s.rstrip()+'''\n\n0.9.6.25 RECONNECT / REPLAY OWNERSHIP\n- `disappearing-reconnect-recovery.js`: pure restart/reconnect Outbox decision owner only. It has no Firebase SDK, IndexedDB, clock authority, crypto mutation, or physical delete capability.\n- `firebase.js`: sole client Firebase owner for explicit direct/group server source-ID probes used by reconnect reconciliation. These probes use server reads and do not mutate Firebase.\n- `app.js`: sole serialized reconnect orchestration and local mutation owner; it invokes server probes, applies the pure plan, physically removes local/Outbox traces through the established local owner, and gates replay.\n- The service worker remains transport/cache only and owns no disappearing/replay semantics.\n- The unresolved post-commit/pre-observation crash gap must not be solved by adding a second Firebase/local-storage owner, a per-message tombstone, client-clock authority, or scattered delete paths.\n'''
        p.write_text(s+'\n')

print('0.9.6.25 docs reconciled; build remains IN PROGRESS at 69.5/100')
