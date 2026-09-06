from pathlib import Path

def rep(path,old,new):
 p=Path(path);s=p.read_text()
 if old not in s: raise SystemExit(f'anchor missing {path}: {old[:90]}')
 p.write_text(s.replace(old,new,1))
def add(path,text):
 p=Path(path);s=p.read_text();
 if text.strip() not in s:p.write_text(s.rstrip()+"\n\n"+text.strip()+"\n")

# README release ledger and authoritative state.
rep('README.md','- Current checkpoint version: **0.9.6.27**','- Current checkpoint version: **0.9.6.30**')
rep('README.md','- Current weighted FIDUNIO 1.0 completion: **72%**','- Current weighted FIDUNIO 1.0 completion: **75%**')
add('README.md','''## 0.9.6.27 -> 0.9.6.30 combined validated pass — 2026-09-06
Reason: complete the three pre-attachment checkpoints in one controlled pass while preserving separate build ownership and exit criteria.

- **0.9.6.28:** added a permanent end-to-end disappearing-text matrix covering immutable duration policy, authoritative absence, cache-only non-authority, physical local/history/Outbox removal, and restart/reconnect anti-replay.
- **0.9.6.29:** Group Info administrators can deliberately grant retained earlier history either from the beginning or from a selected date. The UI delegates target/boundary intent through the existing bounded group app/controller/runtime owner; it does not select cached source rows or manufacture local grant state.
- **0.9.6.30:** removed the duplicate direct-message pre-projection Read mutation path so direct receipts have one deterministic subscription write path; retained foreground/pageshow subscription recovery and the existing serialized group receipt projection.
- Permanent focused gates were added to the normal Rebuild Baseline Security Gate. Full gate **34062508968** passed SUCCESS.
- No rollback or rejected 0.9.4.12-.15 code was restored. No live Firebase or `htest` deployment occurred.
- Follow-on: attachment transport/data authority begins at 0.9.7.0. Real iPhone/iPad receipt and responsive acceptance remains scheduled for the release-candidate device gate.''')

# Deterministic weighted ledger + roadmap.
p=Path('FIDUNIO-BUILD-CHECKLIST.md');s=p.read_text()
s=s.replace('- 0.9.6.28 and later allocated builds: **0.0 earned so far**.\n- **Current total: 72.0 / 100.0, reported as 72%.**\n\nThis 72.0-point ledger is authoritative until another allocated build earns points or a validated item regresses.', '- 0.9.6.28 disappearing-text security closeout is repository-validated: **+1.0 earned**.\n- 0.9.6.29 Group earlier-history admin UI is repository-validated: **+1.0 earned**.\n- 0.9.6.30 receipt/lifecycle stabilization is repository-validated: **+1.0 earned**.\n- 0.9.7.0 and later allocated builds: **0.0 earned so far**.\n- **Current total: 75.0 / 100.0, reported as 75%.**\n\nThis 75.0-point ledger is authoritative until another allocated build earns points or a validated item regresses.')
s=s.replace('| **0.9.6.28** | **CURRENT — Disappearing text end-to-end security closeout.** Reconcile direct/group text purge, receipts, history grants, local cache, Outbox, stale clients and multi-device behavior as one release checkpoint. | Complete disappearing-text repository matrix green; checklist text-message items can move to DONE except attachment-specific work. |CURRENT |','| **0.9.6.28** | **Disappearing text end-to-end security closeout.** Reconcile direct/group text purge, receipts, history grants, local cache, Outbox, stale clients and multi-device behavior as one release checkpoint. | Permanent closeout matrix plus full baseline `34062508968` SUCCESS. | REPOSITORY-VALIDATED |')
s=s.replace('| **0.9.6.29** | **Group earlier-history admin UI.** Enable Group Info date/beginning grant controls only against already-validated server-backed history source selection and grant runtime; preserve admin-only intent and from-join default. | UI integration + group history rules/runtime/projection tests green; no cache-only grant source. | PLANNED |','| **0.9.6.29** | **Group earlier-history admin UI.** Enable Group Info date/beginning grant controls only against already-validated server-backed history source selection and grant runtime; preserve admin-only intent and from-join default. | Permanent UI wiring gate + group history runtime/rules/projection gates + full baseline `34062508968` SUCCESS; no cache-only grant source. | REPOSITORY-VALIDATED |')
s=s.replace('| **0.9.6.30** | **Receipt/lifecycle stabilization before attachment phase.** Close remaining iPad/two-pane live Sent->Read refresh behavior and verify direct/group receipt projection does not regress under disappearance handling. | Repository lifecycle tests green; ready for real-device proof later in 0.9.9.x. | PLANNED |','| **0.9.6.30** | **Receipt/lifecycle stabilization before attachment phase.** Remove duplicate direct Read mutation ownership, preserve deterministic foreground/pageshow subscription recovery, and gate direct/group receipt projection before attachments. | Permanent receipt/lifecycle gate + full baseline `34062508968` SUCCESS; repository stabilization complete and real-device proof remains in 0.9.9.7. | REPOSITORY-VALIDATED |')
s=s.replace('| **0.9.7.0** | **Attachment transport/data authority.**','| **0.9.7.0** | **CURRENT — Attachment transport/data authority.**')
s=s.replace('Integrate earlier-history controls from 0.9.6.28','Integrate earlier-history controls from 0.9.6.29')
p.write_text(s)

add('hermes-memory.txt','''## 0.9.6.28-0.9.6.30 combined validated pass — 2026-09-06
Runtime is 0.9.6.30. Builds 0.9.6.28, 0.9.6.29 and 0.9.6.30 are separately REPOSITORY-VALIDATED by full Rebuild Baseline Security Gate 34062508968 SUCCESS. 0.9.6.28 closes the repository disappearing-text matrix; 0.9.6.29 wires admin-only beginning/date earlier-history intent through the existing server-backed grant runtime; 0.9.6.30 removes the duplicate direct Read mutation path and gates foreground/two-pane receipt lifecycle anchors. Weighted first-rebuild completion is 75.0/100.0 = 75%. Next allocated build is 0.9.7.0 attachment transport/data authority. Real-device receipt proof remains later acceptance work. Live Firebase and htest were not touched.''')
add('CURRENT-REBUILD.md','''## 0.9.6.28-0.9.6.30 combined repository checkpoint
The three pre-attachment builds are repository-validated by full gate `34062508968` SUCCESS. Disappearing text has a permanent end-to-end closeout matrix; Group Info now delegates admin beginning/date earlier-history grants to the validated server-backed grant runtime; direct Read receipt mutation has one deterministic subscription path with foreground/pageshow recovery retained. Runtime is 0.9.6.30 and weighted completion is 75%. Next work is 0.9.7.0 attachment transport/data authority. Real-device receipt proof remains in the release-candidate acceptance phase. Live Firebase and htest remain untouched.''')
add('DISAPPEARING-PURGE-AUTHORITY.md','''## 0.9.6.28 text closeout checkpoint
The repository text-only disappearance chain is now covered by one permanent matrix from immutable duration selection through authoritative server absence, local/history/Outbox physical convergence and reconnect anti-replay. Cache-only absence remains non-authoritative, client clocks remain non-authoritative, and no tombstone/accepted-ID registry is introduced. Gate: `34062508968` SUCCESS. Attachment-specific traces remain intentionally owned by the 0.9.7.x phase.''')
add('ACCOUNT-E2EE-GROUP-MESSAGE-FORMAT.md','''## 0.9.6.29 Group Info history-grant intent
Group Info now exposes admin-only `beginning` and selected-date history-grant intent. `app.js` supplies only target UID plus boundary to `grantGroupHistoryForApp`; source selection remains inside the serialized group runtime and `readRetainedGroupMessages` server authority. The UI does not use cache-only rows as grant source and does not fabricate local history-access state. Gate: `34062508968` SUCCESS.''')
add('DETERMINISTIC-UI-LIFECYCLE.md','''## 0.9.6.30 receipt/lifecycle stabilization
Direct-message Read updates now have one deterministic subscription mutation path after authoritative projection/persistence; the earlier duplicate pre-projection mutation was removed. Foreground `visibilitychange` and `pageshow` continue to re-establish the active cloud subscription deliberately, without MutationObserver, reload, orientation timer, or render-triggered listener churn. Group receipt projection remains serialized in the group conversation owner. Repository gate `34062508968` is green; final iPad/iPhone behavior remains a real-device acceptance item.''')
add('RUNTIME-AUTHORITY-MAP.md','''## 0.9.6.29-0.9.6.30 authority reconciliation
Group earlier-history UI is intent-only: app -> bounded group integration -> controller serialization -> group runtime -> central Firebase transport. Source selection never moves into the DOM/app shell. Direct Read receipt mutation is single-path inside the active direct subscription; group receipt subscription/projection remains owned by `e2ee-account-group-conversation.js`. No new Firebase, IndexedDB, crypto, or receipt owner was introduced.''')
add('architecture-ownership.txt','''0.9.6.29-0.9.6.30: Group Info history controls are intent-only and delegate through the existing group integration/controller/runtime chain; app.js does not select grant source messages. Direct Read mutation was reduced to one subscription path; group receipt ownership remains in e2ee-account-group-conversation.js. Full gate 34062508968 SUCCESS.''')
add('BUG-LIST.md','''### iPad/two-pane Sent -> Read repository stabilization — 0.9.6.30
- The duplicate direct-message pre-projection Read mutation path was removed; the active direct subscription now owns one deterministic Read write/projection path.
- Foreground visibility/pageshow recovery remains explicit and group receipt updates remain serialized by the group conversation owner.
- Permanent lifecycle gate and full baseline `34062508968` pass.
- Status: **repository stabilization complete; real iPad/iPhone acceptance remains scheduled for 0.9.9.7 and is not claimed from repository tests alone.**''')
