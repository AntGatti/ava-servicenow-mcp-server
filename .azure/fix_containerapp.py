import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

cfg = json.loads(Path('config/servicenow-instances.json').read_text(encoding='utf-8'))
inst = next((i for i in cfg['instances'] if i.get('default')), cfg['instances'][0])
sub = '144e3b53-5ded-40d5-a641-77071de18dde'
rg = 'rg-servicenow-mcp-itn-01'
app = 'ca-servicenow-mcp-itn-01'
az = r'C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin\az.cmd'

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print('CMD FAILED:', ' '.join(cmd))
        print(r.stdout)
        print(r.stderr)
        sys.exit(r.returncode)
    return r.stdout.strip()

run([az,'account','set','--subscription',sub])
run([az,'containerapp','secret','set','-g',rg,'-n',app,'--secrets',f"sn-url={inst['url']}"])
run([az,'containerapp','secret','set','-g',rg,'-n',app,'--secrets',f"sn-user={inst['username']}"])
run([az,'containerapp','secret','set','-g',rg,'-n',app,'--secrets',f"sn-pass={inst['password']}"])
print('Secrets updated')

run([az,'containerapp','update','-g',rg,'-n',app,'--set-env-vars','SERVICENOW_INSTANCE_URL=secretref:sn-url','SERVICENOW_USERNAME=secretref:sn-user','SERVICENOW_PASSWORD=secretref:sn-pass','PORT=3000','SSE_KEEPALIVE_INTERVAL=15000','DEBUG=false'])
print('Env vars updated')

secrets = run([az,'containerapp','secret','list','-g',rg,'-n',app,'-o','table'])
print(secrets)

fqdn = run([az,'containerapp','show','-g',rg,'-n',app,'--query','properties.configuration.ingress.fqdn','-o','tsv'])
url = f'https://{fqdn}/health'
print('Health URL:', url)

ok = False
for i in range(1, 19):
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            body = resp.read().decode('utf-8', 'ignore')
            print('HEALTH_STATUS', resp.status)
            print('HEALTH_BODY', body)
            if resp.status == 200:
                ok = True
                break
    except Exception as e:
        print(f'Attempt {i} failed: {e}')
        time.sleep(5)

if not ok:
    print('Health still failing; logs tail follows')
    logs = run([az,'containerapp','logs','show','-g',rg,'-n',app,'--tail','40'])
    print(logs)
    sys.exit(1)
