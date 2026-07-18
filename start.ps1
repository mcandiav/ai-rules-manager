#Requires -Version 5.1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
docker compose up -d --build
exit $LASTEXITCODE
