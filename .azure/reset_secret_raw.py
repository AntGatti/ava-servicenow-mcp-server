import json
import subprocess
from pathlib import Path

cli_py = r"C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\python.exe"
sub = '144e3b53-5ded-40d5-a641-77071de18dde'
rg = 'rg-servicenow-mcp-itn-01'
app = 'ca-servicenow-mcp-itn-01'

cfg = json.loads(Path('config/servicenow-instances.json').read_text(encoding='utf-8'))
inst = next((x for x in cfg['instances'] if x.get('default')), cfg['instances'][0])
expected_len = len(inst['password'])


def az(args):
    cmd = [cli_py, '-IBm', 'azure.cli'] + args
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print('FAILED:', ' '.join(cmd))
        print(r.stdout)
        print(r.stderr)
        raise SystemExit(r.returncode)
    return r.stdout.strip()

az(['account','set','--subscription', sub])
az(['containerapp','secret','set','-g',rg,'-n',app,'--secrets', f"sn-url={inst['url']}"])
az(['containerapp','secret','set','-g',rg,'-n',app,'--secrets', f"sn-user={inst['username']}"])
az(['containerapp','secret','set','-g',rg,'-n',app,'--secrets', f"sn-pass={inst['password']}"])

az(['containerapp','update','-g',rg,'-n',app,'--set-env-vars',
    'SERVICENOW_INSTANCE_URL=secretref:sn-url',
    'SERVICENOW_USERNAME=secretref:sn-user',
    'SERVICENOW_PASSWORD=secretref:sn-pass',
    'PORT=3000','SSE_KEEPALIVE_INTERVAL=15000','DEBUG=false'])

rev = az(['containerapp','revision','list','-g',rg,'-n',app,'--query','[?properties.active].name | [0]','-o','tsv'])
az(['containerapp','revision','restart','-g',rg,'-n',app,'--revision',rev])

print('EXPECTED_PASSWORD_LEN', expected_len)
print('DONE')
