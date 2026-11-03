param(
  [string]$OutputDir = "dist/skill-packages"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$agents = @(
  "aria-orchestrator",
  "aria-knowledge",
  "aria-incident",
  "aria-request",
  "aria-escalation",
  "shared"
)

function Convert-ToCompliantSkillName {
  param([string]$Name)

  if ([string]::IsNullOrWhiteSpace($Name)) {
    return "skill-name"
  }

  $candidate = $Name.ToLowerInvariant()
  $candidate = [Regex]::Replace($candidate, "[^a-z0-9]+", "-")
  $candidate = [Regex]::Replace($candidate, "-+", "-")
  $candidate = $candidate.Trim("-")

  if ([string]::IsNullOrWhiteSpace($candidate)) {
    return "skill-name"
  }

  return $candidate
}

function Test-SkillNameCompliant {
  param([string]$Name)

  return $Name -match "^[a-z0-9]+(?:-[a-z0-9]+)*$"
}

function Get-FrontMatterName {
  param([string]$Path)

  $content = Get-Content -Path $Path -Raw
  $match = [Regex]::Match($content, "(?ms)^---\s*\r?\n(.*?)\r?\n---")
  if (-not $match.Success) {
    return $null
  }

  $frontMatter = $match.Groups[1].Value
  $nameLine = [Regex]::Match($frontMatter, "(?im)^name\s*:\s*(.+?)\s*$")
  if (-not $nameLine.Success) {
    return $null
  }

  return $nameLine.Groups[1].Value.Trim("`"", "'", " ")
}

function Resolve-ManifestPath {
  param([string]$SkillsPath)

  $candidates = @(
    (Join-Path $SkillsPath "SKILL.md"),
    (Join-Path $SkillsPath "skills.md")
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  return $null
}

function Test-SkillNames {
  param(
    [string]$Agent,
    [string]$AgentPath,
    [System.Collections.Generic.List[object]]$Violations
  )

  $skillsPath = Join-Path $AgentPath "skills"
  $manifestPath = Resolve-ManifestPath -SkillsPath $skillsPath

  if ([string]::IsNullOrWhiteSpace($manifestPath)) {
    $Violations.Add([PSCustomObject]@{
      Agent = $Agent
      File = Join-Path $skillsPath "<manifest not found>"
      CurrentName = "<missing manifest>"
      SuggestedName = "SKILL.md"
      Reason = "missing_manifest"
    }) | Out-Null
    return
  }

  $manifestName = Get-FrontMatterName -Path $manifestPath
  if ([string]::IsNullOrWhiteSpace($manifestName)) {
    $Violations.Add([PSCustomObject]@{
      Agent = $Agent
      File = $manifestPath
      CurrentName = "<missing frontmatter name>"
      SuggestedName = "$Agent-skills-manifest"
      Reason = "missing_name"
    }) | Out-Null
  }
  elseif (-not (Test-SkillNameCompliant -Name $manifestName)) {
    $Violations.Add([PSCustomObject]@{
      Agent = $Agent
      File = $manifestPath
      CurrentName = $manifestName
      SuggestedName = (Convert-ToCompliantSkillName -Name $manifestName)
      Reason = "invalid_format"
    }) | Out-Null
  }

  $skillFiles = Get-ChildItem -Path $skillsPath -Recurse -Filter "SKILL.md" -File
  foreach ($skillFile in $skillFiles) {
    $skillName = Get-FrontMatterName -Path $skillFile.FullName
    if ([string]::IsNullOrWhiteSpace($skillName)) {
      $Violations.Add([PSCustomObject]@{
        Agent = $Agent
        File = $skillFile.FullName
        CurrentName = "<missing frontmatter name>"
        SuggestedName = (Convert-ToCompliantSkillName -Name $skillFile.Directory.Name)
        Reason = "missing_name"
      }) | Out-Null
      continue
    }

    if (-not (Test-SkillNameCompliant -Name $skillName)) {
      $Violations.Add([PSCustomObject]@{
        Agent = $Agent
        File = $skillFile.FullName
        CurrentName = $skillName
        SuggestedName = (Convert-ToCompliantSkillName -Name $skillName)
        Reason = "invalid_format"
      }) | Out-Null
    }
  }
}

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

$timestamp = (Get-Date).ToString("yyyyMMdd-HHmm")

$violations = New-Object 'System.Collections.Generic.List[object]'

foreach ($agent in $agents) {
  $agentPath = Join-Path $root "agent/$agent"
  $skillsPath = Join-Path $agentPath "skills"
  $manifestPath = Resolve-ManifestPath -SkillsPath $skillsPath

  if ([string]::IsNullOrWhiteSpace($manifestPath)) {
    throw "Missing required skills manifest in: $skillsPath (expected SKILL.md or skills.md)"
  }

  Test-SkillNames -Agent $agent -AgentPath $agentPath -Violations $violations
}

if ($violations.Count -gt 0) {
  $errorLines = @(
    "Skill name validation failed.",
    "Names must be lowercase with '-' separators and match: ^[a-z0-9]+(?:-[a-z0-9]+)*$",
    "",
    "Non-compliant entries:"
  )

  foreach ($v in $violations) {
    $relativePath = Resolve-Path -Path $v.File -Relative
    $errorLines += "- Agent: $($v.Agent)"
    $errorLines += "  File: $relativePath"
    $errorLines += "  Current: $($v.CurrentName)"
    $errorLines += "  Suggested: $($v.SuggestedName)"
  }

  throw ($errorLines -join [Environment]::NewLine)
}

foreach ($agent in $agents) {
  $agentPath = Join-Path $root "agent/$agent"
  $skillsPath = Join-Path $agentPath "skills"
  $manifestPath = Resolve-ManifestPath -SkillsPath $skillsPath

  $zipPath = Join-Path $root "$OutputDir/$agent-skill-package-$timestamp.zip"
  if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
  }

  $stagePath = Join-Path $env:TEMP ("skillpkg-" + $agent + "-" + [Guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $stagePath -Force | Out-Null
  Copy-Item -Path $manifestPath -Destination (Join-Path $stagePath "SKILL.md") -Force

  $skillDirectories = Get-ChildItem -Path $skillsPath -Directory
  foreach ($dir in $skillDirectories) {
    Copy-Item -Path $dir.FullName -Destination $stagePath -Recurse -Force
  }

  Compress-Archive -Path "$stagePath/*" -DestinationPath $zipPath -Force
  Remove-Item -Path $stagePath -Recurse -Force

  Write-Output "Created $zipPath"
}
