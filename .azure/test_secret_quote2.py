import json, subprocess
from pathlib import Path
cfg = json.loads(Path('config/servicenow-instances.json').read_text(encoding='utf-8'))
inst = next((i for i in cfg['instances'] if i.get('default')), cfg['instances'][0])
az = r'C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin\az.cmd'
arg = 'sn-pass="' + inst['password'] + '"'
cmd = [az,'containerapp','secret','set','-g','rg-servicenow-mcp-itn-01','-n','ca-servicenow-mcp-itn-01','--secrets', arg]
r = subprocess.run(cmd, capture_output=True, text=True)
print('ARG', arg[:40] + '...')
print('RC', r.returncode)
print(r.stdout)
print(r.stderr)
