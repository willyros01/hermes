from pathlib import Path

def read(p): return Path(p).read_text()
def write(p,s): Path(p).write_text(s)
def rep(p,a,b):
 s=read(p)
 if a not in s: raise SystemExit(f'missing anchor in {p}: {a!r}')
 write(p,s.replace(a,b,1))
def append(p,marker,block):
 s=read(p)
 if marker not in s: write(p,s.rstrip()+"\n\n"+block.strip()+"\n")

rep('version.js','version: "0.9.6.18"','version: "0.9.6.19"')
rep('README.md','- Current checkpoint version: **0.9.6.18**','- Current checkpoint version: **0.9.6.19**')
append('README.md','### 0.9.6.19 — group receipt purge barrier','''
### 0.9.6.19 — group receipt purge barrier

Release transition: **0.9.6.18 -> 0.9.6.19**.

- Clean Rebuild Baseline Security Gate run `34055638377` passed every step, including the new group receipt purge barrier and expanded group Firestore emulator matrix.
- New encrypted group messages now begin with `receiptRevision: 0` as outer non-cryptographic purge-concurrency metadata.
- Every actual group Delivered/Read receipt mutation is serialized in the existing Firebase transaction with the parent message and atomically advances `receiptRevision` by exactly one.
- Firestore Rules permit a parent group-message update only for that exact +1 revision and only when the caller's receipt in the same atomic request has `updatedAt == request.time`. Receipt create/update likewise requires the matching parent revision barrier.
- Repeat Delivered/Read no-ops do not advance the revision. Ciphertext, epoch, sender, disappearing duration and all other message authority remain immutable.
- This closes the orphan-receipt race: a newly created or advanced receipt necessarily changes the parent message already included in the server purge basis, forcing stale purge plans to retry.
- Group physical deletion remains fail-closed pending the bounded server trace commit and local/offline anti-resurrection work.
- Repository Firestore Rules changed only; **no live Firebase deployment** occurred. `htest` remains untouched; App Check enforcement remains OFF; FCM remains deferred to 1.1.
- Overall first-rebuild estimate remains approximately 65%.
''')
append('hermes-memory.txt','0.9.6.19 GROUP RECEIPT PURGE BARRIER','''
2026-09-06 — 0.9.6.19 GROUP RECEIPT PURGE BARRIER
- Clean gate `34055638377` passed all baseline steps, including the dedicated receipt barrier and group emulator coverage.
- New e2ee:4 group messages carry outer `receiptRevision: 0`.
- Existing `firebase.js` receipt transaction now reads parent message + own receipt together and advances parent `receiptRevision` exactly once for each real Delivered/Read mutation.
- Rules couple receipt create/update to the same atomic parent +1 revision and allow no other client mutation of the group message.
- Repeat receipt no-ops do not advance the barrier. First Read remains immutable/server-backed as before.
- Because group purge basis already includes the source message update time, concurrent receipt creation/advance is now basis-visible and cannot leave an orphan receipt behind a stale source purge.
- Group source delete remains disabled pending the server trace commit and local/offline anti-resurrection.
- Version 0.9.6.18 -> 0.9.6.19. No live Firebase, htest, App Check enforcement or FCM change.
- Overall first complete rebuild remains approximately 65%.
''')
append('FIDUNIO-BUILD-CHECKLIST.md','0.9.6.19 group receipt purge barrier','''
- 2026-09-06 — 0.9.6.19 group receipt purge barrier: new group messages start `receiptRevision:0`; each real own-receipt Delivered/Read mutation atomically advances the parent revision by one and Rules require the coupled request. Concurrent receipts are therefore source-basis-visible. Gate `34055638377` green. Physical group trace commit and local/offline convergence remain unfinished; no live Firebase/htest change; overall estimate remains approximately 65%.
''')
append('DISAPPEARING-PURGE-AUTHORITY.md','## Group receipt purge barrier — 0.9.6.19','''
## Group receipt purge barrier — 0.9.6.19

Every new encrypted group source begins with outer `receiptRevision: 0`. A real Delivered or first Read receipt mutation must atomically advance that source revision by exactly one. Firestore Rules couple both sides: the source update may affect only `receiptRevision` and requires the caller's receipt `updatedAt == request.time`; the receipt create/update requires the corresponding parent revision advance.

The server purge basis already binds the source message Firestore update time. Therefore a receipt that appears or advances after planning changes the source version and causes final purge revalidation to fail/retry rather than deleting the source while leaving an orphan receipt. Repeat receipt no-ops do not manufacture revision changes.

This barrier does not grant browser delete authority. Group physical deletion remains server-only and fail-closed until the full revalidated trace commit is materialized.
''')
append('architecture-ownership.txt','GROUP RECEIPT PURGE BARRIER — 0.9.6.19','''
GROUP RECEIPT PURGE BARRIER — 0.9.6.19
- `firebase.js` remains the sole browser Firestore receipt transport owner.
- Group message `receiptRevision` is outer purge-concurrency metadata, not ciphertext or cryptographic envelope state.
- The existing receipt transaction owns both the own-receipt mutation and exact +1 parent revision in one serialized write path.
- Firestore Rules allow no unrelated parent-message mutation and require the matching receipt request-time write.
- Server purge repository remains sole physical-delete owner.
''')
append('RUNTIME-AUTHORITY-MAP.md','Group receipt purge barrier — 0.9.6.19','''
## Group receipt purge barrier — 0.9.6.19
- New e2ee:4 group source: `receiptRevision: 0`.
- `firebase.js` group receipt transaction: parent message + caller receipt -> one atomic real-state transition + exact parent revision increment.
- Firestore Rules bind the two writes and prohibit unrelated group-message mutation.
- Server purge basis already contains the source update version, so receipt changes now invalidate stale purge plans.
- Physical group delete authority remains server-only/fail-closed.
''')
append('ACCOUNT-E2EE-GROUP-MESSAGE-FORMAT.md','### Receipt purge barrier — 0.9.6.19','''
### Receipt purge barrier — 0.9.6.19
Encrypted group message documents carry outer integer `receiptRevision`, initialized to `0`. This field is not authenticated plaintext and does not alter the E2EE envelope. Each actual per-account Delivered/Read receipt transition atomically increments the parent revision exactly once. Rules allow no other parent mutation. The field exists so receipt-subcollection concurrency is visible to disappearing-source purge revalidation.
''')
append('FIRESTORE-E2EE-V1-EMULATOR-TESTS.md','## Group receipt purge barrier — 0.9.6.19','''
## Group receipt purge barrier — 0.9.6.19
The group emulator matrix now proves standalone Delivered and first-Read receipt writes are denied, while each succeeds when atomically paired with the exact next parent `receiptRevision`. Dedicated `group-receipt-purge-barrier.test.mjs` gates the central Firebase transaction and Rules anchors. Rebuild Baseline Security Gate run `34055638377` passed. Repository Rules remain undeployed to live Firebase.
''')
append('hermes-setup.txt','## 0.9.6.19 group receipt purge barrier','''
## 0.9.6.19 group receipt purge barrier
Repository group receipt writes now require an atomic parent-message `receiptRevision` advance. Do not deploy these Rules yet and do not enable disappearing/history-sharing UI. Group physical purge remains server-only and fail-closed until the complete trace commit and anti-resurrection work are repository-tested.
''')
append('CURRENT-REBUILD.md','0.9.6.19 receipt purge barrier','''
## 0.9.6.19 receipt purge barrier
Group receipt creation/advance is now purge-basis-visible through an atomic parent `receiptRevision`. Clean gate `34055638377` passed. Group physical trace deletion remains fail-closed; next work is the bounded server trace commit, then local/offline anti-resurrection. Live Firebase and htest remain untouched.
''')
print('0.9.6.19 docs reconciled')
