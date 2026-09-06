from pathlib import Path
p=Path('README.md');s=p.read_text()
if 'Current checkpoint version: **0.9.6.10**' in s:
    s=s.replace('Current checkpoint version: **0.9.6.10**','Current checkpoint version: **0.9.6.11**',1)
marker='### 0.9.6.11 — user-selected disappearing duration policy'
if marker not in s:
    block='''### 0.9.6.11 — user-selected disappearing duration policy

Release transition: **0.9.6.10 -> 0.9.6.11**.

- Product decision: the user chooses the disappearing duration rather than FIDUNIO forcing one universal duration.
- The pure `disappearing-content-policy.js` owner defines canonical per-message metadata `disappearAfterSeconds`; absence means disappearing is off.
- A selected duration is normalized to an exact integer number of seconds, currently 1 through 31,536,000 seconds (one year).
- UI presets or conversation defaults may be added later for convenience, but each sent disappearing message must persist its resolved immutable duration so a later preference change cannot alter an already-sent message.
- Expiry still starts from the recipient account's immutable server-backed first `readAt` established in 0.9.6.10; group recipients retain independent clocks.
- 0.9.6.11 defines and gates duration-selection semantics only. Message persistence/rules, physical purge, local/offline convergence, attachment purge, anti-resurrection and final UI remain unfinished.
- No live Firebase deployment, no `htest` deployment, no FCM activation and no App Check enforcement change.
- Overall first-rebuild estimate remains approximately 65%.
'''
    s=s.rstrip()+'\n\n'+block
p.write_text(s)
