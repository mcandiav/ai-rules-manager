#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$RepoUrl = "https://github.com/mcandiav/ai-rules-manager.git"
$here = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
if (-not (Test-Path (Join-Path $here "compose.yaml"))) {
  $target = Join-Path (Get-Location).Path "ai-rules-manager"
  if (-not (Test-Path $target)) { git clone $RepoUrl $target; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
  $here = $target
}
& (Join-Path $here "start.ps1")
exit $LASTEXITCODE
