#Requires -Version 5.1
<#
.SYNOPSIS
  Windows entrypoint = detect existing drives C:–M: then docker compose up.

.DESCRIPTION
  Docker cannot bind a drive letter that does not exist (compose up fails).
  This script only mounts letters that exist in C:–M:, then runs the standard:
    docker compose up -d --build
#>
$ErrorActionPreference = "Stop"
$RepoRoot = $PSScriptRoot
Set-Location $RepoRoot

$AllowedLetters = 67..77 | ForEach-Object { [char]$_ } # C..M

$drives = @(
  Get-PSDrive -PSProvider FileSystem |
    Where-Object {
      $_.Root -match '^[A-Za-z]:\\$' -and
      ($AllowedLetters -contains $_.Name.ToUpperInvariant()) -and
      (Test-Path -LiteralPath $_.Root)
    } |
    Sort-Object Name |
    ForEach-Object { $_.Name.ToUpperInvariant() }
)

if ($drives.Count -eq 0) {
  throw "No drives in range C:–M: found."
}

$userProfile = ($env:USERPROFILE -replace "\\", "/").TrimEnd("/")
$volumeLines = foreach ($letter in $drives) {
  "      - ${letter}:/:/host/$($letter.ToLowerInvariant())"
}
$mapping = ($drives | ForEach-Object { "${_}:/:/host/$($_.ToLowerInvariant())" }) -join ";"

@"
# Generated — existing drives in scope C:–M: only (missing letters break Docker bind mounts).
services:
  api:
    volumes:
$($volumeLines -join "`n")
    environment:
      - HOST_DRIVE_MAPPINGS=$mapping
      - HOST_HOME_ROOT=$userProfile
"@ | Set-Content (Join-Path $RepoRoot "compose.drives.yaml") -Encoding utf8

if (-not (Test-Path (Join-Path $RepoRoot ".env"))) {
  @"
COMPOSE_PROJECT_NAME=$(Split-Path -Leaf $RepoRoot)
API_PORT=8002
WEB_PORT=3002
HOST_HOME_ROOT=$userProfile
HOST_DRIVE_MAPPINGS=$mapping
"@ | Set-Content (Join-Path $RepoRoot ".env") -Encoding utf8
}

docker compose -f compose.yaml -f compose.drives.yaml up -d --build
exit $LASTEXITCODE
