from pathlib import Path

def append_once(path, marker, block):
    p=Path(path); s=p.read_text()
    if marker not in s:
        p.write_text(s.rstrip()+"\n\n"+block.strip()+"\n")

# README release ledger
p=Path('README.md'); s=p.read_text()
s=s.replace('Current checkpoint version: **0.9.6.10**','Current checkpoint version: **0.9.6.11**',1)
append_once('README.md','### 0.9.6.11 — user-selected disappearing duration policy','''### 0.9.6.11 — user-selected disappearing duration policy

Release transition: **0.9.6.10 -> 0.9.6.11**.

- Product decision: the user chooses the disappearing duration rather than FIDUNIO forcing one universal duration.
- The pure `disappearing-content-policy.js` owner now defines one canonical per-message metadata field, `disappearAfterSeconds`, with `off` represented by absence of that field.
- A disappearing duration is normalized to an exact integer number of seconds. Current policy bounds are 1 second through 31,536,000 seconds (one year).
- UI presets or conversation defaults may be added later for convenience, but they are not authority. Each sent disappearing message must persist its resolved immutable duration so changing a later preference cannot retroactively alter an already-sent message's expiry window.
- Expiry still starts from the recipient account's immutable server-backed first `readAt` established in 0.9.6.10. In groups, each recipient has an independent first-Read clock.
- This checkpoint defines and gates duration-selection semantics only. Message-schema persistence/rules, physical purge, local/offline convergence, attachment purge, anti-resurrection, and final UI remain unfinished.
- No live Firebase deployment, no `htest` deployment, no FCM activation, and no App Check enforcement change.
- Overall first-rebuild estimate remains approximately 65%.''')

# Checklist
p=Path('FIDUNIO-BUILD-CHECKLIST.md'); s=p.read_text()
old='| Disappearing-message policy/model | IN PROGRESS | 0.9.6.10 materializes the pure expiry policy plus immutable server-backed first-Read authority for direct and group receipts. Each recipient/account owns an independent readAt; repeat Read cannot move it. Physical purge execution, local/offline convergence, attachments and anti-resurrection remain unfinished. |'
new='| Disappearing-message policy/model | IN PROGRESS | 0.9.6.11 adds the user-selected per-message duration contract on top of 0.9.6.10 immutable server-backed first-Read authority. `disappearAfterSeconds` is the resolved immutable duration for a disappearing message; absence means off. Message-schema persistence/rules, physical purge execution, local/offline convergence, attachments and anti-resurrection remain unfinished. |'
if old in s: s=s.replace(old,new,1)
log='- 2026-09-06 — 0.9.6.11 user-selected disappearing duration: user controls duration; pure policy normalizes off or an exact immutable per-message `disappearAfterSeconds` value (1..31536000 seconds). Presets/defaults may be UI convenience only and cannot retroactively alter sent-message expiry. No live Firebase or htest change; overall estimate remains approximately 65%.'
if log not in s: s=s.rstrip()+"\n"+log+"\n"
p.write_text(s)

# Durable memory
append_once('hermes-memory.txt','2026-09-06 — 0.9.6.11 USER-SELECTED DISAPPEARING DURATION','''2026-09-06 — 0.9.6.11 USER-SELECTED DISAPPEARING DURATION
- User explicitly decided that the disappearing duration is user-selected; FIDUNIO must not impose one universal duration.
- `disappearing-content-policy.js` remains the pure policy owner and now defines `DISAPPEARING_DURATION_FIELD = "disappearAfterSeconds"`.
- Off/non-disappearing is represented by no duration field. A selected duration is an exact integer number of seconds, currently bounded to 1..31536000 (one year).
- Each disappearing message must eventually persist the resolved duration immutably. UI presets or conversation defaults may assist selection, but later preference changes must not modify the duration of a message already sent.
- Expiry authority remains recipient first server-backed Read (`readAt`) from 0.9.6.10; group recipients retain independent clocks.
- 0.9.6.11 adds policy/test coverage only. Direct/group Firestore message schema persistence and rules for `disappearAfterSeconds`, purge execution, local/offline anti-resurrection, attachments, and final UI remain IN PROGRESS.
- Live Firebase and htest remain untouched. App Check enforcement remains OFF; FCM remains deferred to 1.1.
- Overall first complete rebuild estimate remains approximately 65%.''')

# Setup guide
p=Path('hermes-setup.txt'); s=p.read_text()
needle='- Disappearing messages and attachments are part of the first rebuild release.'
addition='\n- Duration is user-selected. The resolved per-message authority is `disappearAfterSeconds`; absence means disappearing is off. UI presets/defaults may be convenience only and must not retroactively change already-sent messages.'
if addition.strip() not in s: s=s.replace(needle,needle+addition,1)
p.write_text(s)
