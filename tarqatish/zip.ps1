# Tarqatish ZIP: Desktop\Upakovka (Bazis).zip  (avval: node bazis/build.js)
param([string]$Chiqish = (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Upakovka (Bazis).zip'))
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$tmp = Join-Path $env:TEMP ('upak_zip_' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force (Join-Path $tmp 'Upakovka') | Out-Null
Copy-Item (Join-Path $root 'dist\Upakovka\*') (Join-Path $tmp 'Upakovka') -Force
foreach ($f in 'OQING.txt', 'ORNATISH.bat', 'ornatish.ps1') { Copy-Item (Join-Path $PSScriptRoot $f) $tmp -Force }
if (Test-Path $Chiqish) { Remove-Item $Chiqish -Force }
Compress-Archive -Path (Join-Path $tmp '*') -DestinationPath $Chiqish
Remove-Item $tmp -Recurse -Force
Write-Output "ZIP: $Chiqish"
