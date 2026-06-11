# Refresh PATH so node/npm work in terminals opened before Node was installed.
# Use npm.cmd to avoid PowerShell execution policy blocking npm.ps1.
$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
Set-Location $PSScriptRoot
& npm.cmd run build
