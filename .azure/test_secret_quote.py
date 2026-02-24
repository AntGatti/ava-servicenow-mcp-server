import json, subprocess
from pathlib import Path
cfg = json.loads(Path('config/servicenow-instances.json').read_text(encoding='utf-8'))
inst = next((i for i in cfg['instances'] if i.get('default')), cfg['instances'][0])
az = r'C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin\az.cmd'
cmd = [az,'containerapp','secret','set','-g','rg-servicenow-mcp-itn-01','-n','ca-servicenow-mcp-itn-01','--secrets', f'"sn-pass={inst['password']}"']
r = subprocess.run(cmd, capture_output=True, text=True)
print('RC', r.returncode)
print(r.stdout)
print(r.stderr)
