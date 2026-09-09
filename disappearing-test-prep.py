from pathlib import Path
p=Path('disappearing-compose-policy.test.mjs')
s=p.read_text()
old="'Disappearing:'"
new="'Disappearing text:'"
if s.count(old)!=1:
    raise AssertionError('disappearing compose label assertion changed')
p.write_text(s.replace(old,new,1))
