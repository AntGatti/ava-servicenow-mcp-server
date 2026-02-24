import json
import os
import subprocess
import sys
import time
import urllib.request
import zipfile
from pathlib import Path

AZ = r"C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"
SUB = "144e3b53-5ded-40d5-a641-77071de18dde"
RG = "rg-servicenow-mcp-itn-01"
LOC = "italynorth"
PLAN = "asp-servicenow-mcp-itn-free-01"
APP = "app-servicenow-mcp-itn-4851"
ROOT = Path.cwd()
ZIP_PATH = ROOT / ".azure" / "webapp-deploy.zip"

EXCLUDE_PARTS = {".git", "node_modules", "coverage", ".vscode", "__pycache__"}
EXCLUDE_FILES = {
    str((ROOT / "config" / "servicenow-instances.json").as_posix()),
    str((ROOT / ".azure" / "webapp-deploy.zip").as_posix()),
}


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("FAILED:", " ".join(cmd))
        print(r.stdout)
        print(r.stderr)
        sys.exit(r.returncode)
    return r.stdout.strip()

print("Setting subscription...")
run([AZ, "account", "set", "--subscription", SUB])

cfg = json.loads((ROOT / "config" / "servicenow-instances.json").read_text(encoding="utf-8"))
inst = next((x for x in cfg["instances"] if x.get("default")), cfg["instances"][0])

print("Ensuring Free plan exists...")
check_plan = subprocess.run([AZ, "appservice", "plan", "show", "-g", RG, "-n", PLAN, "--query", "name", "-o", "tsv"], capture_output=True, text=True)
if check_plan.returncode != 0:
    run([AZ, "appservice", "plan", "create", "-g", RG, "-n", PLAN, "--sku", "F1", "-l", LOC])

print("Ensuring web app exists...")
check_app = subprocess.run([AZ, "webapp", "show", "-g", RG, "-n", APP, "--query", "name", "-o", "tsv"], capture_output=True, text=True)
if check_app.returncode != 0:
    run([AZ, "webapp", "create", "-g", RG, "-p", PLAN, "-n", APP])

print("Applying security settings (HTTPS only, FTP disabled, TLS 1.3)...")
run([AZ, "webapp", "update", "-g", RG, "-n", APP, "--https-only", "true"])
run([AZ, "webapp", "config", "set", "-g", RG, "-n", APP, "--ftps-state", "Disabled", "--min-tls-version", "1.3"])

print("Applying app settings safely...")
run([
    AZ, "webapp", "config", "appsettings", "set", "-g", RG, "-n", APP,
    "--settings",
    f"SERVICENOW_INSTANCE_URL={inst['url']}",
    f"SERVICENOW_USERNAME={inst['username']}",
    f"SERVICENOW_PASSWORD={inst['password']}",
    "SSE_KEEPALIVE_INTERVAL=15000",
    "DEBUG=false",
    "WEBSITE_NODE_DEFAULT_VERSION=~22",
])

print("Creating deploy zip...")
ZIP_PATH.parent.mkdir(parents=True, exist_ok=True)
if ZIP_PATH.exists():
    ZIP_PATH.unlink()

with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
    for path in ROOT.rglob("*"):
        if path.is_dir():
            continue
        p = path.as_posix()
        rel = path.relative_to(ROOT).as_posix()
        if any(part in EXCLUDE_PARTS for part in path.parts):
            continue
        if p in EXCLUDE_FILES:
            continue
        zf.write(path, rel)

print("Deploying zip package...")
run([AZ, "webapp", "deployment", "source", "config-zip", "-g", RG, "-n", APP, "--src", str(ZIP_PATH)])

host = run([AZ, "webapp", "show", "-g", RG, "-n", APP, "--query", "defaultHostName", "-o", "tsv"])
sec = run([AZ, "webapp", "config", "show", "-g", RG, "-n", APP, "--query", "{ftpsState:ftpsState,minTlsVersion:minTlsVersion}", "-o", "json"])
https_only = run([AZ, "webapp", "show", "-g", RG, "-n", APP, "--query", "httpsOnly", "-o", "tsv"])
print("HOST=", host)
print("HTTPS_ONLY=", https_only)
print("SECURITY=", sec)

health_url = f"https://{host}/health"
print("Checking health:", health_url)
for _ in range(24):
    try:
        with urllib.request.urlopen(health_url, timeout=12) as resp:
            body = resp.read().decode("utf-8", errors="ignore")
            print("HEALTH_STATUS=", resp.status)
            print("HEALTH_BODY=", body)
            break
    except Exception:
        time.sleep(5)
else:
    print("HEALTH_FAILED")

print("MCP_URL=", f"https://{host}/mcp")
