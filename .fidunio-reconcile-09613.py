from pathlib import Path

def append_once(path,marker,block):
    p=Path(path);s=p.read_text()
    if marker not in s:p.write_text(s.rstrip()+"\n\n"+block.strip()+"\n")

# README release ledger
p=Path('README.md');s=p.read_text();s=s.replace('Current checkpoint version: **0.9.6.12**','Current checkpoint version: **0.9.6.13**',1);p.write_text(s)
append_once('README.md','### 0.9.6.13 — deterministic purge-eligibility policy','''### 0.9.6.13 — deterministic purge-eligibility policy

Release transition: **0.9.6.12 -> 0.9.6.13**.

- Cleaned 0.9.6.12 Rebuild Baseline Security Gate run `34052064381` passed every step after the bounded group app-integration assertion was updated to recognize the new outer-duration argument.
- Added pure `disappearing-purge-policy.js`. It owns only deterministic purge eligibility and performs no Firebase, Admin SDK, local-storage, timer, UI or deletion writes.
- Direct disappearing source purge becomes eligible only after its sole recipient has an authoritative first Read and that message's immutable `disappearAfterSeconds` window has elapsed.
- Group final-source eligibility is derived from the source epoch's member set, excluding the sender, intersected with members who remain entitled now. A later-added member outside that source epoch does not become a retroactive retention blocker; a removed member no longer blocks final purge.
- Every still-entitled original recipient independently blocks final group-source purge until that recipient has Read and the recipient-specific duration window has elapsed. An unread still-entitled original recipient therefore keeps the source.
- A history grant cannot extend the lifetime of a disappearing source. Grant copies remain subordinate traces and must disappear when the source becomes purge-eligible.
- Production deletion authorization must use server-side time. A device clock is never sufficient authority for cloud purge.
- This is a decision/policy foundation only. No delete rules, scheduled server purge, local cache purge, attachment cleanup or stale-client anti-resurrection executor is enabled yet.
- Live Firebase and `htest` remain untouched; FCM remains deferred to 1.1; App Check enforcement remains OFF/deferred to 1.2.
- Overall first-rebuild estimate remains approximately 65%.''')

append_once('hermes-memory.txt','2026-09-06 — 0.9.6.13 DETERMINISTIC PURGE-ELIGIBILITY POLICY','''2026-09-06 — 0.9.6.13 DETERMINISTIC PURGE-ELIGIBILITY POLICY
- Clean 0.9.6.12 security gate run `34052064381` passed every baseline step, including the new disappearing metadata authority gate.
- Added pure `disappearing-purge-policy.js`; it does not own Firebase/Admin SDK/storage/DOM/timers/deletes. Production callers must inject server-side current time; device time cannot authorize cloud deletion.
- Direct eligibility: disappearing enabled + recipient state Read + immutable server-backed `readAt` + resolved duration elapsed.
- Group original recipients are the source epoch member UIDs minus sender. Applicable recipients are those original recipients who remain currently entitled. New members outside the source epoch do not retroactively block purge; removed members no longer block it.
- Every applicable original recipient must have an authoritative Read whose independent window has elapsed. Unread applicable recipients block final source purge.
- History-grant targets/copies do not extend source lifetime; source purge must remove subordinate grant copies/references.
- This does NOT execute deletion. Dedicated serialized server purge authority, physical Firestore/subcollection/grant/attachment deletion, local cache purge, reconnect rejection and anti-resurrection remain unfinished.
- No live Firebase/htest change. App Check enforcement OFF; FCM deferred 1.1. Overall first rebuild remains approximately 65%.''')

p=Path('FIDUNIO-BUILD-CHECKLIST.md');s=p.read_text()
old='| Disappearing-message policy/model | IN PROGRESS | 0.9.6.12 persists the resolved user-selected `disappearAfterSeconds` as bounded immutable outer metadata for current direct/group sends and carries it through encrypted Outbox retry without changing crypto-envelope formats. Physical purge execution, deletion authority, local/offline convergence, attachments and anti-resurrection remain unfinished. |'
new='| Disappearing-message policy/model | IN PROGRESS | 0.9.6.13 adds deterministic direct/group final-source purge eligibility on top of immutable first-Read and per-message duration metadata. Group eligibility uses source-epoch recipients minus sender intersected with current entitlement; removed/new-later members cannot incorrectly block retention. Physical purge execution, delete authority, local/offline convergence, attachments and anti-resurrection remain unfinished. |'
if old in s:s=s.replace(old,new,1)
log='- 2026-09-06 — 0.9.6.13 purge-decision foundation: pure direct/group eligibility owner added and gated; clean 0.9.6.12 gate `34052064381` green. No deletion path or delete rules enabled; live Firebase/htest untouched; overall estimate remains approximately 65%.'
if log not in s:s=s.rstrip()+"\n"+log+"\n"
p.write_text(s)

append_once('architecture-ownership.txt','DISAPPEARING PURGE DECISION AUTHORITY — 0.9.6.13','''DISAPPEARING PURGE DECISION AUTHORITY — 0.9.6.13
- `disappearing-purge-policy.js` is the pure eligibility owner. It decides whether a source is eligible for final purge but performs no deletion and imports no Firebase/Admin/local-storage/UI owner.
- Production purge evaluation must supply server-side time; device clocks cannot authorize cloud deletion.
- Direct source eligibility is recipient first-Read + immutable duration elapsed.
- Group source eligibility uses the source epoch recipient set, excluding sender, intersected with current entitlement. New members outside that epoch are not retroactive recipients; removed members no longer block source deletion.
- Physical deletion is a separate mutable resource. It still requires one dedicated serialized server purge owner using bounded repository APIs; do not scatter deletes through app.js, subscription callbacks or group crypto modules.''')
append_once('RUNTIME-AUTHORITY-MAP.md','## Disappearing purge-decision authority — 0.9.6.13','''## Disappearing purge-decision authority — 0.9.6.13
- `disappearing-purge-policy.js`: pure final-source eligibility only.
- Direct input authority: immutable message `readAt` plus immutable outer duration.
- Group input authority: source epoch membership, sender UID, current entitlement membership, per-account immutable Read receipts, immutable outer duration, and server-side current time.
- History grants do not become source-lifetime authority and cannot resurrect or extend a disappearing source.
- No deletion executor exists at this checkpoint. Final purge must be implemented by one serialized server-side owner and must also coordinate receipts, grant copies/metadata, attachments and local anti-resurrection.''')
append_once('ACCOUNT-E2EE-DIRECT-MESSAGE-FORMAT.md','## Direct purge eligibility — 0.9.6.13','''## Direct purge eligibility — 0.9.6.13
For a disappearing direct message, the shared source is final-purge eligible only when the non-sender recipient has the immutable authoritative first `readAt` and `serverNow >= readAt + disappearAfterSeconds`. The pure purge policy computes that decision; a device clock cannot authorize cloud deletion. This checkpoint does not open delete rules or execute deletion.''')
append_once('ACCOUNT-E2EE-GROUP-MESSAGE-FORMAT.md','### Final source purge eligibility — 0.9.6.13','''### Final source purge eligibility — 0.9.6.13
For one `e2ee:4` source message, the original recipient set is derived from that message's key-epoch membership, excluding the sender. Final purge considers only original recipients who remain currently entitled. A later-added member outside that epoch is not a retroactive source recipient and a removed member no longer blocks final deletion. Every still-entitled original recipient independently blocks purge until first Read plus `disappearAfterSeconds` has elapsed. History-grant copies never extend source lifetime and must be removed when their source is purged. Server-side time is required for production deletion authority.''')
append_once('group-data-model.txt','DISAPPEARING SOURCE RECIPIENT AUTHORITY — 0.9.6.13','''DISAPPEARING SOURCE RECIPIENT AUTHORITY — 0.9.6.13
For a disappearing group source, retention recipients come from the source message's `keyEpoch` record, not from the current group list alone. Start with that epoch's member UIDs, remove `senderUid`, then intersect with accounts that remain currently entitled. This prevents later joiners from becoming retroactive purge blockers while allowing removal/deactivation to end future entitlement. Explicit earlier-history grants remain subordinate copies and do not extend source retention.''')

print('0.9.6.13 durable docs reconciled')
