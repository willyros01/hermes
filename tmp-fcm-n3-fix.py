from pathlib import Path
p=Path('tmp-fcm-n3-build.py')
s=p.read_text()
old='  {id:"privacy",label:"Security",icon:"🔒",subtitle:"Your FIDUNIO PIN, device unlock, and end-to-end encryption."},'
new='  {id:"privacy",label:"Security",icon:"🔒",subtitle:"Your FIDUNIO PIN, device unlock, and end-to-end encryption.",cards:["Privacy & Access"]},'
if old not in s:
    raise SystemExit('N3 privacy anchor not found')
s=s.replace(old,new,1)
p.write_text(s)
