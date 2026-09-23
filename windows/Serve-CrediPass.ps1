param([ValidateRange(1024,65535)][int]$Port=8092,[switch]$Lan)
$ErrorActionPreference='Stop'
$Root=Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root
if(-not (Get-Command node -ErrorAction SilentlyContinue)){throw 'Node.js 20+ est requis.'}
if(-not (Test-Path '.env.local')){throw 'Copiez .env.example vers .env.local et configurez CREDIPASS_DATABASE_URL.'}
if(-not (Test-Path 'node_modules/postgres/package.json')){throw 'Exécutez npm install pour installer le pilote PostgreSQL.'}
& node scripts/check-postgres.mjs
if($LASTEXITCODE -ne 0){throw 'PostgreSQL central indisponible.'}
$env:CREDIPASS_HOST=if($Lan){'0.0.0.0'}else{'127.0.0.1'}
Write-Host "CREDIPASS R19.3.2 — IndexedDB terminaux + PostgreSQL central — port $Port" -ForegroundColor Green
& node scripts/boot.mjs $Port
