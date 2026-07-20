$catPath='c:\Users\ant.gatti\AppData\Roaming\Code\User\workspaceStorage\b95a6f285fe306276059a46f5ea75db6\GitHub.copilot-chat\chat-session-resources\b9d8f436-d0d9-4690-8637-8218c245c879\call_65T9RvHh4vaZUP8eZ2VFGsl5__vscode-1779180464489\content.txt'
$itemPath='c:\Users\ant.gatti\AppData\Roaming\Code\User\workspaceStorage\b95a6f285fe306276059a46f5ea75db6\GitHub.copilot-chat\chat-session-resources\b9d8f436-d0d9-4690-8637-8218c245c879\call_SItTTFQQohEHVaarogYjKDo5__vscode-1779180464490\content.txt'
$outPath='c:\Users\ant.gatti\source\repos\antoniogatti\mcp-servicenow-nodejs-main\mcp_catalog_hierarchy_output.txt'
function ParseArrayFromPrefixedText($path){
  $raw = Get-Content -Raw $path
  $idx = $raw.IndexOf('[')
  if($idx -lt 0){ throw "No JSON array found in $path" }
  $json = $raw.Substring($idx)
  return @($json | ConvertFrom-Json)
}
$cats = ParseArrayFromPrefixedText $catPath
$items = ParseArrayFromPrefixedText $itemPath
$catById=@{}
foreach($c in $cats){ if(-not [string]::IsNullOrWhiteSpace($c.sys_id)){ $catById[$c.sys_id]=$c } }
function GetParentId($p){
 if($null -eq $p){ return $null }
 if($p -is [string]){ if([string]::IsNullOrWhiteSpace($p)){ return $null }; return $p }
 if($p.PSObject.Properties.Name -contains 'value'){ if([string]::IsNullOrWhiteSpace($p.value)){ return $null }; return [string]$p.value }
 if($p.PSObject.Properties.Name -contains 'sys_id'){ if([string]::IsNullOrWhiteSpace($p.sys_id)){ return $null }; return [string]$p.sys_id }
 return [string]$p
}
function GetCategoryId($p){
 if($null -eq $p){ return $null }
 if($p -is [string]){ if([string]::IsNullOrWhiteSpace($p)){ return $null }; return $p }
 if($p.PSObject.Properties.Name -contains 'value'){ if([string]::IsNullOrWhiteSpace($p.value)){ return $null }; return [string]$p.value }
 if($p.PSObject.Properties.Name -contains 'sys_id'){ if([string]::IsNullOrWhiteSpace($p.sys_id)){ return $null }; return [string]$p.sys_id }
 return [string]$p
}
function CatName($c){ if($null -ne $c.title -and -not [string]::IsNullOrWhiteSpace([string]$c.title)){ return [string]$c.title }; if($null -ne $c.name -and -not [string]::IsNullOrWhiteSpace([string]$c.name)){ return [string]$c.name }; return [string]$c.sys_id }
function ItemName($i){ if($null -ne $i.name -and -not [string]::IsNullOrWhiteSpace([string]$i.name)){ return [string]$i.name }; if($null -ne $i.short_description -and -not [string]::IsNullOrWhiteSpace([string]$i.short_description)){ return [string]$i.short_description }; return [string]$i.sys_id }
$l1=@(); $l2=@(); $orphanCats=@(); $children=@{}
foreach($c in $cats){
 $parentId = GetParentId $c.parent
 if([string]::IsNullOrWhiteSpace($parentId)){ $l1 += $c; continue }
 if(-not $catById.ContainsKey($parentId)){ $orphanCats += $c; continue }
 $parentCat = $catById[$parentId]
 $grandParentId = GetParentId $parentCat.parent
 if([string]::IsNullOrWhiteSpace($grandParentId)){
   $l2 += $c
   if(-not $children.ContainsKey($parentId)){ $children[$parentId]=@() }
   $children[$parentId]+=,$c
 } else {
   $orphanCats += $c
 }
}
$itemsByCat=@{}; $orphanItems=@()
foreach($i in $items){
 $cid = GetCategoryId $i.category
 if([string]::IsNullOrWhiteSpace($cid)){ $orphanItems += $i; continue }
 if(-not $catById.ContainsKey($cid)){ $orphanItems += $i; continue }
 if(-not $itemsByCat.ContainsKey($cid)){ $itemsByCat[$cid]=@() }
 $itemsByCat[$cid]+=,$i
}
$l1 = $l1 | Sort-Object @{Expression={ if($_.order -as [int]){[int]$_.order}else{999999} }}, @{Expression={ CatName $_ }}
foreach($k in @($children.Keys)){ $children[$k] = $children[$k] | Sort-Object @{Expression={ if($_.order -as [int]){[int]$_.order}else{999999} }}, @{Expression={ CatName $_ }} }
$orphanCats = $orphanCats | Sort-Object @{Expression={ CatName $_ }}
foreach($k in @($itemsByCat.Keys)){ $itemsByCat[$k] = $itemsByCat[$k] | Sort-Object @{Expression={ ItemName $_ }} }
$orphanItems = $orphanItems | Sort-Object @{Expression={ ItemName $_ }}
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('TOTAL COUNTS')
$lines.Add("L1 categories: $($l1.Count)")
$lines.Add("L2 categories: $($l2.Count)")
$lines.Add("Catalog items (active): $($items.Count)")
$lines.Add('')
$lines.Add('CATALOG TREE (L1 -> L2 -> Items)')
foreach($c1 in $l1){
  $c1id=$c1.sys_id
  $c1name=CatName $c1
  $c1items = if($itemsByCat.ContainsKey($c1id)){$itemsByCat[$c1id]}else{@()}
  $c1children = if($children.ContainsKey($c1id)){$children[$c1id]}else{@()}
  $subtreeItemCount = $c1items.Count
  foreach($c2 in $c1children){ if($itemsByCat.ContainsKey($c2.sys_id)){ $subtreeItemCount += $itemsByCat[$c2.sys_id].Count } }
  $lines.Add(("- L1: {0} ({1})" -f $c1name,$subtreeItemCount))
  if($c1items.Count -gt 0){
    $lines.Add(("  - Direct Items ({0})" -f $c1items.Count))
    foreach($it in $c1items){ $lines.Add(("    - {0}" -f (ItemName $it))) }
  }
  foreach($c2 in $c1children){
    $c2name=CatName $c2
    $c2items = if($itemsByCat.ContainsKey($c2.sys_id)){$itemsByCat[$c2.sys_id]}else{@()}
    $lines.Add(("  - L2: {0} ({1})" -f $c2name,$c2items.Count))
    foreach($it in $c2items){ $lines.Add(("    - {0}" -f (ItemName $it))) }
  }
}
$lines.Add('')
$lines.Add(("UNMAPPED/ORPHAN (categories: {0}, items: {1})" -f $orphanCats.Count,$orphanItems.Count))
if($orphanCats.Count -gt 0){
  $lines.Add('- Orphan Categories')
  foreach($oc in $orphanCats){
    $parentId = GetParentId $oc.parent
    if([string]::IsNullOrWhiteSpace($parentId)){ $parentId='<empty>' }
    $ocItems = if($itemsByCat.ContainsKey($oc.sys_id)){$itemsByCat[$oc.sys_id]}else{@()}
    $lines.Add(("  - {0} (parent: {1}, items: {2})" -f (CatName $oc), $parentId, $ocItems.Count))
    foreach($it in $ocItems){ $lines.Add(("    - {0}" -f (ItemName $it))) }
  }
}
if($orphanItems.Count -gt 0){
  $lines.Add('- Orphan Items (missing/invalid category)')
  foreach($oi in $orphanItems){
    $cid = GetCategoryId $oi.category
    if([string]::IsNullOrWhiteSpace($cid)){ $cid='<empty>' }
    $lines.Add(("  - {0} (category: {1})" -f (ItemName $oi), $cid))
  }
}
$lines | Set-Content -Path $outPath -Encoding UTF8
Write-Output "Wrote: $outPath"
Write-Output "Lines: $($lines.Count)"
Get-Content -Path $outPath -TotalCount 120
