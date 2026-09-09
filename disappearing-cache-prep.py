from pathlib import Path
p=Path('service-worker.js')
s=p.read_text()
anchor='"./account-storage.js","./outbox-reconciliation-boundary.js"'
insert='"./account-storage.js","./disappearing-content-policy.js","./disappearing-compose-policy.js","./disappearing-local-storage-plan.js","./disappearing-authoritative-projection.js","./disappearing-reconnect-recovery.js","./outbox-reconciliation-boundary.js"'
if anchor not in s:
    raise AssertionError('service-worker shell anchor changed')
p.write_text(s.replace(anchor,insert,1))
