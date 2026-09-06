from pathlib import Path
p=Path('FIDUNIO-BUILD-CHECKLIST.md');s=p.read_text();old='| **0.9.9.0** | **CURRENT — Group Info completion.** Integrate earlier-history controls from 0.9.6.29, remove obsolete placeholders, and finish tablet landscape layout without redesigning established two-pane behavior. | Group Info functional + responsive tests green. | PLANNED |';new=old.replace('| PLANNED |','| CURRENT |');
if old not in s: raise SystemExit('0.9.9.0 state anchor missing')
p.write_text(s.replace(old,new))
