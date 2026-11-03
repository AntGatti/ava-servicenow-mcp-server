$ErrorActionPreference = 'Stop'

$path = 'c:\Users\ant.gatti\source\repos\antoniogatti\mcp-servicenow-nodejs-main\.github\agents\knowledge\servicenow-catalogue.json'
$j = Get-Content -Raw $path | ConvertFrom-Json

function IsTrueString($v){
  if($null -eq $v){ return $false }
  return ([string]$v).Trim().ToLowerInvariant() -eq 'true'
}

function IsFalseString($v){
  if($null -eq $v){ return $false }
  return ([string]$v).Trim().ToLowerInvariant() -eq 'false'
}

function IsTechnicalOrAdminItem($item){
  $name = [string]$item.itemName
  $short = [string]$item.shortDescription
  $ctx = ($name + ' ' + $short).ToLowerInvariant()

  if([string]::IsNullOrWhiteSpace($name)){ return $true }

  $patterns = @(
    '(^|\W)demo(\W|$)',
    '(^|\W)test(\W|$)',
    '(^|\W)crp(\W|$)',
    'catalog client script',
    'catalog ui policy',
    'catalog variable',
    'catalog item builder',
    'creator studio',
    'artifact processor',
    'external user mapping',
    'external sources schema',
    'flow designer',
    'instance access request',
    'new ldap server',
    'service fulfillment steps',
    'template management',
    'change agent capacity',
    'set universal capacity',
    'data discovery finding',
    'sega survey',
    'record producer builder'
  )

  foreach($p in $patterns){
    if($ctx -match $p){ return $true }
  }

  return $false
}

$items = @($j.items)
$totalBefore = $items.Count

$filtered = @(
  $items | Where-Object {
    $visible = IsTrueString $_.orderingHints.visibleStandalone
    $noCart = IsTrueString $_.orderingHints.noCart
    $isTech = IsTechnicalOrAdminItem $_

    # User-facing orderable rule:
    # - must be visible standalone
    # - must not be no_cart=true
    # - exclude technical/admin artifacts
    $visible -and (-not $noCart) -and (-not $isTech)
  }
)

# Rebuild taxonomy from filtered set
$taxo = @(
  $filtered |
  Group-Object { $_.standardizedCategory.level1 } |
  Sort-Object Name |
  ForEach-Object {
    $g1 = $_
    $level2 = @(
      $g1.Group |
      Group-Object { $_.standardizedCategory.level2 } |
      Sort-Object Name |
      ForEach-Object {
        [pscustomobject]@{
          name = $_.Name
          itemCount = $_.Count
        }
      }
    )

    [pscustomobject]@{
      level1 = $g1.Name
      description = ($j.taxonomy | Where-Object { $_.level1 -eq $g1.Name } | Select-Object -First 1).description
      itemCount = $g1.Count
      level2 = $level2
    }
  }
)

$j.generatedAt = (Get-Date).ToString('s')
$j.constraints = [pscustomobject]@{
  maxCategoryLevels = 2
  semanticDescriptionIncluded = $true
  audience = 'end-user'
  includeOnlyOrderableItems = $true
  excludedTechnicalAdminItems = $true
}
$j.stats = [pscustomobject]@{
  totalActiveItems = $filtered.Count
  totalStandardizedLevel1 = $taxo.Count
  totalStandardizedLevel2 = (($filtered | ForEach-Object { $_.standardizedCategory.level2 } | Sort-Object -Unique) | Measure-Object).Count
  filteredOutItems = $totalBefore - $filtered.Count
}
$j.taxonomy = $taxo
$j.items = @($filtered | Sort-Object itemName)

$j | ConvertTo-Json -Depth 10 | Set-Content -Path $path -Encoding UTF8

"Updated: $path"
"Before: $totalBefore"
"After: $($filtered.Count)"
"Filtered out: $($totalBefore - $filtered.Count)"
"L1 categories: $($taxo.Count)"
