from pathlib import Path
p=Path('.github/workflows/rebuild-baseline-security.yml')
text=p.read_text()
anchor='      - {name: Message reactions policy and wiring, run: npm run test:message-reactions}\n'
insert=anchor+'      - {name: Group message Reply descriptor policy, run: npm run test:group-reply}\n'
if text.count(anchor)!=1:
    raise SystemExit(f'expected one message-reaction baseline anchor, found {text.count(anchor)}')
if 'Group message Reply descriptor policy' not in text:
    p.write_text(text.replace(anchor,insert,1))
Path('patch-group-reply-baseline.py').unlink(missing_ok=True)
Path('.github/workflows/apply-group-reply-baseline.yml').unlink(missing_ok=True)
