param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('patch', 'minor', 'major')]
  [string]$Type,

  [Parameter(Mandatory = $true)]
  [string]$Description
)

$packageJsonPath = Join-Path $PSScriptRoot "package.json"
$package = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
$currentVersion = $package.version
$parts = $currentVersion.Split('.')
$major = [int]$parts[0]
$minor = [int]$parts[1]
$patch = [int]$parts[2]

switch ($Type) {
  "patch" { $patch++; break }
  "minor" { $minor++; $patch = 0; break }
  "major" { $major++; $minor = 0; $patch = 0; break }
}

$newVersion = "$major.$minor.$patch"
Write-Host "Bumping version: $currentVersion -> $newVersion ($Type)" -ForegroundColor Cyan
Write-Host "Descricao: $Description" -ForegroundColor DarkGray

$package.version = $newVersion
$package | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath -Encoding UTF8

Write-Host "package.json atualizado para v$newVersion" -ForegroundColor Green
Write-Host "Proximo passo: git checkout staging && git merge develop -m 'merge: develop -> staging - $Description'" -ForegroundColor Yellow
