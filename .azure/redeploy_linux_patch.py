import json
import subprocess
import sys
import zipfile
from pathlib import Path

sub = '144e3b53-5ded-40d5-a641-77071de18dde'
rg = 'rg-servicenow-mcp-itn-01'
app = 'app-servicenow-mcp-itn-linux-0018'
cli_py = r'C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\python.exe'
root = Path('.').resolve()

zip_path = root / '.azure' / 'linux_webapp_patch.zip'
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
    if r.stdout:
        print(r.stdout.strip())

az(['account','set','--subscription',sub])
az(['webapp','deployment','source','config-zip','-g',rg,'-n',app,'--src',str(zip_path)])
print('DEPLOYED', app)
