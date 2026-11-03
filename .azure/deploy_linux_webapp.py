import json
import subprocess
import sys
import zipfile
from pathlib import Path
from datetime import datetime

sub = '144e3b53-5ded-40d5-a641-77071de18dde'
rg = 'rg-servicenow-mcp-itn-01'
loc = 'italynorth'
plan = 'asp-servicenow-mcp-itn-linux-b1'
app = f"app-servicenow-mcp-itn-linux-{datetime.utcnow().strftime('%H%M')}"
cli_py = r'C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\python.exe'
root = Path('.').resolve()

cfg = json.loads((root / 'config' / 'servicenow-instances.json').read_text(encoding='utf-8'))
inst = next((x for x in cfg['instances'] if x.get('default')), cfg['instances'][0])

zip_path = root / '.azure' / 'linux_webapp_deploy.zip'
zip_path.parent.mkdir(parents=True, exist_ok=True)
if zip_path.exists():
    zip_path.unlink()

ignore_dirs = {'.git', '.github', '.vscode', 'coverage', 'docs', 'assets', 'node_modules', '.azure', '__pycache__'}
ignore_files_suffix = {'.log', '.tmp'}
ignore_files = {'tickets-export.json'}

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for path in root.rglob('*'):
        rel = path.relative_to(root)
        if set(rel.parts) & ignore_dirs:
            continue
        if path.is_dir():
            continue
        if path.name in ignore_files:
            continue
        if path.suffix.lower() in ignore_files_suffix:
            continue
        z.write(path, rel.as_posix())

def az(args):
    cmd = [cli_py, '-IBm', 'azure.cli'] + args
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print('FAILED:', ' '.join(cmd))
        print(r.stdout)
        print(r.stderr)
        sys.exit(r.returncode)
    return r.stdout.strip()

print('Setting subscription...')
az(['account','set','--subscription',sub])

print('Ensuring Linux plan...')
plan_exists = subprocess.run([cli_py,'-IBm','azure.cli','appservice','plan','show','-g',rg,'-n',plan], capture_output=True, text=True)
if plan_exists.returncode != 0:
    print(az(['appservice','plan','create','-g',rg,'-n',plan,'--is-linux','--sku','B1','-l',loc,'-o','json']))
else:
    print('Plan exists')

print('Creating Linux web app...')
print(az(['webapp','create','-g',rg,'-p',plan,'-n',app,'--runtime','NODE|22-lts','-o','json']))

print('Applying security + runtime config...')
az(['webapp','update','-g',rg,'-n',app,'--https-only','true'])
az(['webapp','config','set','-g',rg,'-n',app,'--ftps-state','Disabled','--min-tls-version','1.3','--startup-file','npm start'])

print('Setting app settings...')
az([
    'webapp','config','appsettings','set',
    '-g',rg,'-n',app,
    '--settings',
    'SCM_DO_BUILD_DURING_DEPLOYMENT=true',
    'ENABLE_ORYX_BUILD=true',
    'WEBSITES_PORT=8080',
    'PORT=8080',
    'SSE_KEEPALIVE_INTERVAL=15000',
    'DEBUG=false',
    f"SERVICENOW_INSTANCE_URL={inst['url']}",
    f"SERVICENOW_USERNAME={inst['username']}",
    f"SERVICENOW_PASSWORD={inst['password']}"
])

print('Deploying zip...')
print(az(['webapp','deployment','source','config-zip','-g',rg,'-n',app,'--src',str(zip_path),'-o','json']))

host = az(['webapp','show','-g',rg,'-n',app,'--query','defaultHostName','-o','tsv'])
print('WEBAPP_HOST=' + host)
print('WEBAPP_URL=https://' + host)
