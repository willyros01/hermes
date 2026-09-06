from pathlib import Path

files=['README.md','hermes-memory.txt','FIDUNIO-BUILD-CHECKLIST.md','CURRENT-REBUILD.md','DISAPPEARING-PURGE-AUTHORITY.md']
for name in files:
    p=Path(name); s=p.read_text()
    s=s.replace('34058866151','34059145963')
    p.write_text(s)

note='''\n\n### 0.9.6.23 final grant-source authority strengthening\nFinal review caught and closed a subtle group-history resurrection boundary: a grant-only projected copy is not proof that its original source message still exists. `e2ee-account-group-history-projection.js` now marks ordinary retained source rows `authoritativeSource:true` and grant-only rows `authoritativeSource:false`; `disappearing-authoritative-projection.js` excludes grant-only rows from authoritative source-presence IDs and suppresses a grant-only row when authoritative source absence plans that disappearing ID for purge. The permanent projection and group-conversation gates cover this distinction. Full baseline security gate `34059145963` passed on the strengthened implementation. Live Firebase and `htest` were not touched.\n'''
for name in ['README.md','hermes-memory.txt','CURRENT-REBUILD.md','DISAPPEARING-PURGE-AUTHORITY.md']:
    p=Path(name); s=p.read_text()
    marker='### 0.9.6.23 final grant-source authority strengthening'
    if marker not in s:p.write_text(s.rstrip()+note+'\n')
print('0.9.6.23 final docs reconciled')
