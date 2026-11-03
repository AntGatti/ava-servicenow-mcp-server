$ErrorActionPreference = 'Stop'

$catPath='c:\Users\ant.gatti\AppData\Roaming\Code\User\workspaceStorage\b95a6f285fe306276059a46f5ea75db6\GitHub.copilot-chat\chat-session-resources\b9d8f436-d0d9-4690-8637-8218c245c879\call_65T9RvHh4vaZUP8eZ2VFGsl5__vscode-1779180464489\content.txt'
$itemPath='c:\Users\ant.gatti\AppData\Roaming\Code\User\workspaceStorage\b95a6f285fe306276059a46f5ea75db6\GitHub.copilot-chat\chat-session-resources\b9d8f436-d0d9-4690-8637-8218c245c879\call_SItTTFQQohEHVaarogYjKDo5__vscode-1779180464490\content.txt'
$outPath='c:\Users\ant.gatti\source\repos\antoniogatti\mcp-servicenow-nodejs-main\.github\agents\knowledge\servicenow-catalogue.json'

function ParseArrayFromPrefixedText($path){
  $raw = Get-Content -Raw $path
  $idx = $raw.IndexOf('[')
  if($idx -lt 0){ throw "No JSON array found in $path" }
  $json = $raw.Substring($idx)
  return @($json | ConvertFrom-Json)
}

function GetRefValue($p){
  if($null -eq $p){ return $null }
  if($p -is [string]){ if([string]::IsNullOrWhiteSpace($p)){ return $null }; return $p }
  if($p.PSObject.Properties.Name -contains 'value'){ if([string]::IsNullOrWhiteSpace($p.value)){ return $null }; return [string]$p.value }
  if($p.PSObject.Properties.Name -contains 'sys_id'){ if([string]::IsNullOrWhiteSpace($p.sys_id)){ return $null }; return [string]$p.sys_id }
  return [string]$p
}

function CleanText([string]$v){
  if([string]::IsNullOrWhiteSpace($v)){ return '' }
  return (($v -replace '\s+',' ').Trim())
}

function GuessPurpose([string]$name,[string]$short,[string]$cat,[string]$sub){
  $ctx = ("$name $short $cat $sub").ToLowerInvariant()
  if($ctx -match 'laptop|macbook|desktop|workstation'){ return 'procure or refresh an end-user computer' }
  if($ctx -match 'iphone|ipad|pixel|galaxy|mobile|phone'){ return 'request or manage a mobile device' }
  if($ctx -match 'adapter|cable|monitor|keyboard|mouse|headset|printer|peripheral'){ return 'order accessories and peripherals' }
  if($ctx -match 'password|account|alias|access|docusign|dropbox|aws|azure'){ return 'obtain access or resolve identity needs' }
  if($ctx -match 'adobe|visio|project|software|application|vmware|intellij|snagit|sketch'){ return 'request software and application tools' }
  if($ctx -match 'incident|case|support|help|outage|defect'){ return 'get IT support for an issue or service request' }
  if($ctx -match 'server|database|vm|backup|firewall|network|dns|ip|vlan'){ return 'request infrastructure or network operations' }
  if($ctx -match 'payroll|benefit|401|tuition|leave|employee|hr|visa|credit card'){ return 'manage employee services and HR-related requests' }
  if($ctx -match 'risk|compliance|policy|governance|ai model|dataset'){ return 'submit governance, risk, or compliance requests' }
  if($ctx -match 'shipping|sharepoint|telephone|document|office|collaboration|jabber|zoom'){ return 'request workplace collaboration services' }
  return 'submit a catalog request for this service'
}

function StandardizeCategory([string]$top,[string]$sub,[string]$name,[string]$short){
  $ctx = ("$top $sub $name $short").ToLowerInvariant()

  if($ctx -match 'laptop|macbook|desktop|workstation|iphone|ipad|pixel|galaxy|monitor|keyboard|mouse|headset|printer|peripheral|adapter|cable|tablet|mobile|hardware'){
    $cat='Hardware and Devices'
    if($ctx -match 'laptop|macbook|desktop|workstation'){ $subcat='Computers' }
    elseif($ctx -match 'iphone|ipad|pixel|galaxy|mobile|tablet|phone'){ $subcat='Mobile Devices' }
    elseif($ctx -match 'printer'){ $subcat='Printers' }
    else { $subcat='Accessories and Peripherals' }
    return @($cat,$subcat)
  }

  if($ctx -match 'software|adobe|visio|project|application packaging|vmware|intellij|snagit|sketch|acrobat|access'){
    $cat='Software and Applications'
    if($ctx -match 'intellij|developer|development'){ $subcat='Developer Tools' }
    elseif($ctx -match 'adobe|visio|project|access|acrobat|snagit|sketch'){ $subcat='Productivity Software' }
    else { $subcat='Business Applications' }
    return @($cat,$subcat)
  }

  if($ctx -match 'password|account|alias|access|docusign|dropbox|aws|azure|reset portal|membership'){
    return @('Access and Identity','Account and Permission Requests')
  }

  if($ctx -match 'incident|case|support|help|outage|defect|service desk'){
    return @('IT Support and Service Desk','Incident and Case Requests')
  }

  if($ctx -match 'server|database|vm|backup|firewall|network|dns|ip|vlan|infrastructure'){
    return @('Infrastructure and Network','Platform and Network Operations')
  }

  if($ctx -match 'payroll|benefit|401|tuition|leave|employee|hr|visa|credit card|employment verification'){
    if($ctx -match 'payroll|credit card'){ return @('HR and Employee Services','Payroll and Finance') }
    if($ctx -match 'visa|travel'){ return @('HR and Employee Services','Travel and Immigration') }
    if($ctx -match 'benefit|401|tuition|leave'){ return @('HR and Employee Services','Benefits and Programs') }
    return @('HR and Employee Services','Employee Administration')
  }

  if($ctx -match 'risk|compliance|policy|governance|ai model|dataset|ai use case|ai inquiry'){
    return @('Security Risk and Compliance','Governance Requests')
  }

  if($ctx -match 'sharepoint|telephone|shipping|paper|document|office|collaboration|jabber|zoom|portal'){
    return @('Workplace and Collaboration','Office and Collaboration Services')
  }

  if($ctx -match 'business application|integration|architecture|trm'){
    return @('Business Application Management','Application Lifecycle')
  }

  return @('Other','General Requests')
}

$cats = ParseArrayFromPrefixedText $catPath
$items = ParseArrayFromPrefixedText $itemPath

$catById = @{}
foreach($c in $cats){ if(-not [string]::IsNullOrWhiteSpace($c.sys_id)){ $catById[$c.sys_id] = $c } }

$enriched = @()
foreach($i in $items){
  $name = CleanText([string]$i.name)
  $short = CleanText([string]$i.short_description)
  $categoryId = GetRefValue $i.category

  $top='Unmapped'; $sub='General'; $path=@()
  if(-not [string]::IsNullOrWhiteSpace($categoryId) -and $catById.ContainsKey($categoryId)){
    $leaf = $catById[$categoryId]
    $leafName = CleanText([string]($(if([string]::IsNullOrWhiteSpace($leaf.title)){ $leaf.name } else { $leaf.title })))
    $parentId = GetRefValue $leaf.parent
    if([string]::IsNullOrWhiteSpace($parentId)){
      $top = $leafName; $sub = 'General'; $path = @($leafName)
    } elseif($catById.ContainsKey($parentId)){
      $parent = $catById[$parentId]
      $parentName = CleanText([string]($(if([string]::IsNullOrWhiteSpace($parent.title)){ $parent.name } else { $parent.title })))
      $top = $parentName; $sub = $leafName; $path = @($parentName,$leafName)
    } else {
      $top = 'Unmapped'; $sub = $leafName; $path = @($leafName)
    }
  }

  $std = StandardizeCategory $top $sub $name $short
  $stdCat = $std[0]; $stdSub = $std[1]

  $semantic = "Order '$name' to " + (GuessPurpose $name $short $stdCat $stdSub) + "."
  if(-not [string]::IsNullOrWhiteSpace($short)){ $semantic += " Details: $short" }

  $enriched += [pscustomobject]@{
    itemSysId = [string]$i.sys_id
    itemName = $name
    shortDescription = $short
    semanticDescription = $semantic
    originalCategory = [pscustomobject]@{
      categorySysId = $categoryId
      path = @($path)
      topLevel = $top
      secondLevel = $sub
    }
    standardizedCategory = [pscustomobject]@{
      level1 = $stdCat
      level2 = $stdSub
    }
    orderingHints = [pscustomobject]@{
      visibleStandalone = [string]$i.visible_standalone
      noCart = [string]$i.no_cart
      price = [string]$i.price
      deliveryTime = [string]$i.delivery_time
      requestMethod = if([string]::IsNullOrWhiteSpace([string]$i.request_method)){'standard'} else {[string]$i.request_method}
    }
  }
}

$taxo = @(
  $enriched |
  Group-Object { $_.standardizedCategory.level1 } |
  Sort-Object Name |
  ForEach-Object {
    $g1 = $_
    $subGroups = @(
      $g1.Group | Group-Object { $_.standardizedCategory.level2 } | Sort-Object Name | ForEach-Object {
        [pscustomobject]@{ name = $_.Name; itemCount = $_.Count }
      }
    )

    $desc = switch ($g1.Name) {
      'Hardware and Devices' { 'Physical devices, endpoints, and accessories for users.' }
      'Software and Applications' { 'Software licenses, tools, and packaged applications.' }
      'Access and Identity' { 'Account provisioning, access control, and identity tasks.' }
      'IT Support and Service Desk' { 'Issue reporting, support cases, and troubleshooting requests.' }
      'Infrastructure and Network' { 'Server, database, backup, and network operational requests.' }
      'HR and Employee Services' { 'Benefits, payroll, HR administration, and employee lifecycle services.' }
      'Security Risk and Compliance' { 'Governance, risk, compliance, and policy-related requests.' }
      'Workplace and Collaboration' { 'Office services and collaboration platform requests.' }
      'Business Application Management' { 'Business app lifecycle and integration management.' }
      default { 'General or uncategorized service requests.' }
    }

    [pscustomobject]@{ level1 = $g1.Name; description = $desc; itemCount = $g1.Count; level2 = $subGroups }
  }
)

$output = [pscustomobject]@{
  generatedAt = (Get-Date).ToString('s')
  source = [pscustomobject]@{ instance = 'accenture'; tableCategories = 'sc_category'; tableItems = 'sc_cat_item'; filter = 'active=true' }
  constraints = [pscustomobject]@{ maxCategoryLevels = 2; semanticDescriptionIncluded = $true }
  stats = [pscustomobject]@{
    totalActiveItems = $enriched.Count
    totalStandardizedLevel1 = $taxo.Count
    totalStandardizedLevel2 = (($enriched | Select-Object -ExpandProperty standardizedCategory | Select-Object -ExpandProperty level2 | Sort-Object -Unique) | Measure-Object).Count
  }
  taxonomy = $taxo
  items = @($enriched | Sort-Object itemName)
}

$output | ConvertTo-Json -Depth 10 | Set-Content -Path $outPath -Encoding UTF8
Write-Output "Regenerated: $outPath"
