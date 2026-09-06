import json
from pathlib import Path
p=Path('package.json');data=json.loads(p.read_text())
data['scripts']['test:disappearing-multi-device-convergence']='node disappearing-multi-device-convergence.test.mjs'
data['scripts']['test:disappearing-compose-policy']='node disappearing-compose-policy.test.mjs'
p.write_text(json.dumps(data,separators=(',',':'))+'\n')
