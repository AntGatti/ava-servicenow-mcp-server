$ErrorActionPreference = 'Stop'

$rg = 'rg-servicenow-mcp-itn-01'
$app = 'app-servicenow-mcp-itn-linux-0018'

# Read password from .env without logging sensitive values
$kv = @{}
Get-Content .env | ForEach-Object {
  $t = $_.Trim()
  if ($t -and -not $t.StartsWith('#') -and $t.Contains('=')) {
    $i = $t.IndexOf('=')
    $k = $t.Substring(0, $i).Trim()
    $v = $t.Substring($i + 1).Trim()
    if (($v.StartsWith('"') -and $v.EndsWith('"')) -or ($v.StartsWith("'") -and $v.EndsWith("'"))) {
      $v = $v.Substring(1, $v.Length - 2)
    }
    $kv[$k] = $v
  }
}

$envPass = $kv['SERVICENOW_PASSWORD']
if (-not $envPass) {
  throw 'SERVICENOW_PASSWORD missing in .env'
}

$configPath = 'config/servicenow-instances.json'
$config = Get-Content $configPath -Raw | ConvertFrom-Json
if (-not $config.instances -or $config.instances.Count -eq 0) {
  throw 'No instances found in config/servicenow-instances.json'
}

$config.instances[0].password = $envPass
$config | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding utf8

# Sanity check the updated config credentials against ServiceNow
$inst = $config.instances[0]
$basic = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("$($inst.username):$($inst.password)"))
$headers = @{ Authorization = "Basic $basic"; Accept = 'application/json' }
$probe = Invoke-WebRequest -Uri "$($inst.url)/api/now/table/incident?sysparm_limit=1" -Headers $headers -Method GET -TimeoutSec 30
Write-Output ("CONFIG_CREDENTIAL_CHECK status={0}" -f $probe.StatusCode)

# Build deployment ZIP
$zip = 'deploy-mcp.zip'
if (Test-Path $zip) { Remove-Item $zip -Force }
$exclude = @('.git', 'node_modules', 'coverage', '.vscode', 'setup', 'tests')
$items = Get-ChildItem -Force | Where-Object { $exclude -notcontains $_.Name } | Select-Object -ExpandProperty FullName
Compress-Archive -Path $items -DestinationPath $zip -Force

# Deploy app package (zip deploy triggers app restart automatically)
az webapp deployment source config-zip -g $rg -n $app --src $zip --output none

# Give platform a short stabilization window before health checks
Start-Sleep -Seconds 20

# Verify health
$health = Invoke-WebRequest -Uri "https://$app.azurewebsites.net/health" -TimeoutSec 60
Write-Output ("DEPLOY_HEALTH status={0}" -f $health.StatusCode)
