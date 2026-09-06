from pathlib import Path
files=['README.md','FIDUNIO-BUILD-CHECKLIST.md','hermes-memory.txt','CURRENT-REBUILD.md']
for f in files:
 p=Path(f);s=p.read_text()
 s=s.replace('full gate is green)','full gate is green)')
 s=s.replace('Full gate validation is pending at documentation time.','Full Rebuild Baseline Security Gate `34058248816` completed SUCCESS, including the dedicated local physical purge wiring step and all protected baseline gates.')
 s=s.replace('full gate still pending. Authoritative pre-retry invocation is owned by 0.9.6.23/0.9.6.24. | IN PROGRESS |','full gate `34058248816` SUCCESS. Authoritative pre-retry invocation is owned by 0.9.6.23/0.9.6.24. | REPOSITORY-VALIDATED |')
 s=s.replace('Build points remain **unearned** until the complete Rebuild Baseline Security Gate is green; weighted completion therefore remains **67.0/100.0** at this checkpoint.','Full Rebuild Baseline Security Gate `34058248816` is green, so this allocated build earns **+1.0 point**; weighted completion is now **68.0/100.0**.')
 s=s.replace('0.9.6.22 weighted point remains unearned, so authoritative completion remains 67% until green.','Full gate `34058248816` is SUCCESS; 0.9.6.22 earns its allocated +1.0 point and authoritative completion is now 68%.')
 s=s.replace('The full security gate is pending at this documentation checkpoint, so its weighted point is not yet earned and completion remains 67%.','Full security gate `34058248816` is SUCCESS, so the build earns its allocated +1.0 point and weighted completion is now 68%.')
 s=s.replace('0.9.6.22 and later allocated builds: **0.0 earned so far**.','0.9.6.22 is repository-validated: **+1.0 earned**.\n- 0.9.6.23 and later allocated builds: **0.0 earned so far**.')
 s=s.replace('Current total: 67.0 / 100.0 = 67%.','Current total: 68.0 / 100.0 = 68%.')
 s=s.replace('This 67% is the authoritative 1.0 completion figure until another allocated build earns points or a validated item regresses.','This 68% is the authoritative 1.0 completion figure until another allocated build earns points or a validated item regresses.')
 s=s.replace('Current weighted FIDUNIO 1.0 completion: **67%** (0.9.6.22 points remain unearned until its full gate is green)','Current weighted FIDUNIO 1.0 completion: **68%**')
 p.write_text(s)
print('0.9.6.22 validated; ledger 68%')
