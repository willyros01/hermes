from pathlib import Path

def append_once(path, marker, block):
    p=Path(path); s=p.read_text()
    if marker not in s:
        p.write_text(s.rstrip()+"\n\n"+block.strip()+"\n")

p=Path('FIDUNIO-BUILD-CHECKLIST.md'); s=p.read_text()
old="| Disappearing-message policy/model | IN PROGRESS | Product semantics settled: disappearance uses a fixed duration starting from the recipient's first authoritative Read event for both direct and group messages. In groups the timer is per recipient/account, not first-reader-global. Cloud-authoritative read timestamps, final shared-source purge convergence, exact expiry metadata/rules and anti-resurrection implementation remain to be materialized and validated. |"
new="| Disappearing-message policy/model | IN PROGRESS | 0.9.6.10 materializes the pure expiry policy plus immutable server-backed first-Read authority for direct and group receipts. Each recipient/account owns an independent readAt; repeat Read cannot move it. Physical purge execution, local/offline convergence, attachments and anti-resurrection remain unfinished. |"
if old in s: s=s.replace(old,new,1)
log="- 2026-09-06 — 0.9.6.10 immutable first-Read authority: direct and group Read transitions now establish server-backed readAt exactly once through serialized firebase.js transactions and Firestore Rules; repeat Read cannot move the clock. Pure disappearing policy + emulator/source gates are in the normal security baseline. Rebuild Baseline Security Gate run 34050343201 passed on the README checkpoint. Physical purge/anti-resurrection remains IN PROGRESS. Live Firebase and htest untouched; overall estimate remains approximately 65%."
if log not in s: s=s.rstrip()+"\n"+log+"\n"
p.write_text(s)

append_once('hermes-memory.txt','2026-09-06 — 0.9.6.10 IMMUTABLE FIRST-READ AUTHORITY','''2026-09-06 — 0.9.6.10 IMMUTABLE FIRST-READ AUTHORITY
- `disappearing-content-policy.js` is the pure policy owner for recipient expiry and group shared-source purge eligibility; it owns no Firebase, storage, DOM, crypto or deletion writes.
- Direct receipt authority is now serialized in `firebase.js`: only the non-sender recipient may advance Sent -> Delivered or first Sent/Delivered -> Read; first Read writes server-backed `readAt`, and repeat Read returns the existing timestamp without moving the clock.
- Group receipt authority is per recipient UID. Delivered records contain `uid,state,updatedAt`; Read records additionally contain immutable server-backed `readAt`. One member cannot write another member's receipt or start another member's timer.
- Firestore Rules bind first `readAt` to `request.time`, deny sender-written direct receipt authority, deny repeat Read timestamp movement, and preserve ciphertext/message immutability during receipt transitions.
- `markCloudConversationRead()` now delegates through the same authoritative direct receipt transaction instead of writing state independently.
- Added `disappearing-read-authority.test.mjs`; direct and group emulator matrices now prove first-Read timestamp authority and repeat-Read denial. These gates are included in the normal Rebuild Baseline Security Gate.
- Rebuild Baseline Security Gate run `34050343201` passed on commit `2ca9c61001a4d7a3f494800256dbf26277e28106` after the 0.9.6.10 README checkpoint.
- Repository Firestore rules changed but were NOT deployed to live Firebase. htest was not touched. App Check enforcement remains OFF; FCM remains deferred to 1.1.
- This checkpoint does not physically purge content. One serialized purge/delete owner, history-grant purge, local/offline convergence, attachments and stale-device anti-resurrection remain unfinished.
- Overall first complete rebuild estimate remains approximately 65%.''')

p=Path('ACCOUNT-E2EE-DIRECT-MESSAGE-FORMAT.md'); s=p.read_text()
s=s.replace('Legacy valid plaintext, `e2ee:1` and `e2ee:2` creation remain accepted for migration compatibility. Receipt updates remain state-only.','Legacy valid plaintext, `e2ee:1` and `e2ee:2` creation remain accepted for migration compatibility. Direct receipt transitions are recipient-authoritative: Sent -> Delivered is state-only; the first Sent/Delivered -> Read transition additionally writes immutable server-backed `readAt`. Repeat Read cannot move `readAt`.',1)
p.write_text(s)
append_once('ACCOUNT-E2EE-DIRECT-MESSAGE-FORMAT.md','## Direct first-Read authority — 0.9.6.10','''## Direct first-Read authority — 0.9.6.10
For direct messages, only the non-sender recipient account may establish receipt authority. `firebase.js` serializes the transition in a Firestore transaction. `sent -> delivered` changes only state. The first `sent|delivered -> read` writes `readAt` with `serverTimestamp()`. Firestore Rules require `readAt == request.time`, preserve sender/createdAt/ciphertext and all message fields, and reject a second Read mutation that would move the first-read timestamp. Reopening a conversation is therefore a no-op for the disappearance clock. These repository rules are not automatically deployed to live Firebase.''')

append_once('ACCOUNT-E2EE-GROUP-MESSAGE-FORMAT.md','### Group first-Read receipt authority — 0.9.6.10','''### Group first-Read receipt authority — 0.9.6.10
Group receipt persistence is account-specific. A Delivered receipt has exact fields `uid,state,updatedAt`. A Read receipt additionally has `readAt`; both `updatedAt` and first `readAt` are server-backed. A member may mutate only that member's own receipt. The first Delivered -> Read transition may add `readAt`; repeat Read is a no-op in the central Firebase writer and Rules reject timestamp movement. This `readAt` is the authoritative input to the disappearing-content policy for that recipient and does not start any other group member's timer.''')

p=Path('FIRESTORE-GROUP-E2EE-V1-RULES.md'); s=p.read_text()
old='Exact fields are `uid`, `state`, `updatedAt`, where `state` is `delivered` or `read`, and `updatedAt == request.time`. State may advance `delivered -> read`; it may never regress. Delete denied.'
new='Receipt schema is state-sensitive. Delivered contains exactly `uid,state,updatedAt`. Read contains exactly `uid,state,updatedAt,readAt`. On first Read, both `updatedAt == request.time` and `readAt == request.time`; `readAt` did not exist before and may never be moved. State may advance `delivered -> read`; it may never regress. Repeat Read mutations are denied. Delete remains denied pending the dedicated purge owner.'
if old in s: s=s.replace(old,new,1)
p.write_text(s)
append_once('FIRESTORE-GROUP-E2EE-V1-RULES.md','## 0.9.6.10 first-Read authority extension','''## 0.9.6.10 first-Read authority extension
The group receipt rules now establish immutable server-backed first-Read authority per recipient UID. Emulator coverage proves Read without `readAt` is denied, first Read with server timestamp succeeds, repeat Read cannot move the timestamp, another member cannot write the receipt, and outsiders remain denied. Rebuild Baseline Security Gate run `34050343201` passed with these rules. Repository validation does not deploy them to live Firebase.''')

append_once('FIRESTORE-E2EE-V1-EMULATOR-TESTS.md','## Disappearing first-Read authority extension — 0.9.6.10','''## Disappearing first-Read authority extension — 0.9.6.10
The direct-message emulator matrix now covers recipient-only receipt authority, server-backed first `readAt`, denial of Read without `readAt`, repeat-Read timestamp immutability and ciphertext-tamper denial. The group E2EE matrix independently covers per-account Delivered/Read schema, first server-backed `readAt`, repeat-Read denial, cross-member denial and outsider denial. `disappearing-read-authority.test.mjs` additionally gates the central transactional write paths and Rules anchors. Rebuild Baseline Security Gate run `34050343201` passed with both emulator matrices and the dedicated source gate. These tests use emulator/demo projects only and do not deploy repository rules to production.''')

append_once('architecture-ownership.txt','DISAPPEARING FIRST-READ AUTHORITY — 0.9.6.10','''DISAPPEARING FIRST-READ AUTHORITY — 0.9.6.10
- Policy resource owner: `disappearing-content-policy.js` decides expiry/purge eligibility only.
- Persistence/write owner: `firebase.js` serializes direct and group receipt transitions and is the only SDK owner writing server-backed `readAt`.
- Firestore Rules enforce recipient/account ownership and immutable first-Read timestamps.
- app.js and the group conversation owner may request Delivered/Read transitions but do not choose or persist authoritative timestamps.
- Future physical purge is a separate mutable resource and must have one dedicated serialized deletion owner; do not scatter deletes among UI/subscription modules.''')

append_once('RUNTIME-AUTHORITY-MAP.md','## Disappearing first-Read authority — 0.9.6.10','''## Disappearing first-Read authority — 0.9.6.10
- `disappearing-content-policy.js`: pure recipient-expiry/shared-source eligibility decisions.
- `firebase.js`: sole receipt persistence owner; direct/group first Read uses a Firestore transaction and server timestamp. Repeat Read returns the already-established authority rather than moving it.
- Firestore Rules: recipient/account authorization plus immutable `readAt == request.time` boundary.
- Existing direct app/group conversation owners request receipt state only. They do not supply a disappearance timestamp.
- Physical purge/anti-resurrection remains a separate future serialized resource owner and is not implemented by this checkpoint.''')

p=Path('hermes-setup.txt'); s=p.read_text()
if '- Group receipts are per-account UID.' in s:
    s=s.replace('- Group receipts are per-account UID.','- Group receipts are per-account UID; first Read now establishes immutable server-backed `readAt` through the central Firebase owner. Repeat Read cannot restart the timer.',1)
marker='- Offline/stale clients must not resurrect expired content.'
add='\n- Current 0.9.6.10 repository rules and runtime establish immutable server-backed first-Read authority for direct and group receipts. Those changed rules are repository-only and have NOT been deployed live. Physical purge/anti-resurrection is still unfinished.'
if add.strip() not in s: s=s.replace(marker,marker+add,1)
p.write_text(s)
