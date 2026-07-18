#Requires -Version 5.1
<#
.SYNOPSIS
  One-shot Windows install + start for AI Rules Manager.

.DESCRIPTION
  Paste once from README (no prior knowledge of start.ps1):

    irm https://raw.githubusercontent.com/mcandiav/ai-rules-manager/master/install.ps1 | iex

  Or from an already-cloned folder:

    .\install.ps1
#>
$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/mcandiav/ai-rules-manager.git"
$DefaultFolderName = "ai-rules-manager"

function Test-RepoRoot([string]$Path) {
  return (Test-Path -LiteralPath (Join-Path $Path "compose.yaml")) -and
    (Test-Path -LiteralPath (Join-Path $Path "start.ps1"))
}

$here = $PSScriptRoot
if (-not $here) {
  $here = (Get-Location).Path
}

$repoRoot = $null

if (Test-RepoRoot $here) {
  $repoRoot = $here
} else {
  $target = Join-Path (Get-Location).Path $DefaultFolderName
  if (-not (Test-RepoRoot $target)) {
    if (Test-Path -LiteralPath $target) {
      throw "Folder exists but is not AI Rules Manager: $target"
    }
    Write-Host "Cloning into $target ..."
    git clone $RepoUrl $target
    if ($LASTEXITCODE -ne 0) {
      throw "git clone failed with exit code $LASTEXITCODE"
    }
  }
  $repoRoot = $target
}

Write-Host "Starting from $repoRoot"
& (Join-Path $repoRoot "start.ps1")
