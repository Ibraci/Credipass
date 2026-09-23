$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

Write-Host '============================================================'
Write-Host ' CREDIPASS - PREPARATION POSTGRESQL NATIF WINDOWS'
Write-Host ' IndexedDB terminal + PostgreSQL central'
Write-Host '============================================================'

function Find-Psql {
    $cmd = Get-Command psql.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $roots = @($env:ProgramW6432, $env:ProgramFiles, ${env:ProgramFiles(x86)}) |
        Where-Object { $_ } | Select-Object -Unique |
        ForEach-Object { Join-Path $_ 'PostgreSQL' }
    foreach ($root in $roots) {
        if (Test-Path $root) {
            $candidate = Get-ChildItem $root -Directory -ErrorAction SilentlyContinue |
                Sort-Object Name -Descending |
                ForEach-Object { Join-Path $_.FullName 'bin\psql.exe' } |
                Where-Object { Test-Path $_ } |
                Select-Object -First 1
            if ($candidate) { return $candidate }
        }
    }
    return $null
}

$psql = Find-Psql
if (-not $psql) {
    Write-Host ''
    Write-Host '[ERREUR] PostgreSQL/psql est introuvable.' -ForegroundColor Red
    Write-Host 'Installe PostgreSQL pour Windows, puis relance ce script.' -ForegroundColor Yellow
    Write-Host 'Pendant l installation :'
    Write-Host '  - Port : 5432'
    Write-Host '  - Superutilisateur : postgres'
    Write-Host '  - Retenir le mot de passe choisi pour postgres'
    exit 1
}

$pgBin = Split-Path $psql
$createdb = Join-Path $pgBin 'createdb.exe'
Write-Host "[OK] psql détecté : $psql" -ForegroundColor Green

# Vérifier Node.js
$node = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $node) {
    throw 'Node.js est introuvable. Installe Node.js 20+ puis relance.'
}
$nodeVersion = (& node -v)
Write-Host "[OK] Node.js : $nodeVersion" -ForegroundColor Green

# Mot de passe administrateur PostgreSQL
Write-Host ''
$secure = Read-Host 'Mot de passe du compte PostgreSQL "postgres"' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $adminPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }

$env:PGPASSWORD = $adminPassword

# Tester PostgreSQL
& $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -tAc 'SELECT 1;' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Connexion au serveur PostgreSQL impossible avec le compte postgres.' }
Write-Host '[OK] Serveur PostgreSQL joignable.' -ForegroundColor Green

# Générer un mot de passe applicatif URI-safe
$appPassword = 'Cp_' + ([guid]::NewGuid().ToString('N').Substring(0,20)) + '_26'

# Créer ou mettre à jour le rôle credipass
$roleExists = (& $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='credipass';").Trim()
if ($roleExists -eq '1') {
    & $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "ALTER ROLE credipass WITH LOGIN PASSWORD '$appPassword';" | Out-Null
    Write-Host '[OK] Rôle credipass mis à jour.' -ForegroundColor Green
} else {
    & $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE ROLE credipass LOGIN PASSWORD '$appPassword';" | Out-Null
    Write-Host '[OK] Rôle credipass créé.' -ForegroundColor Green
}

# Créer la base si nécessaire
$dbExists = (& $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='credipass';").Trim()
if ($dbExists -ne '1') {
    if (-not (Test-Path $createdb)) { throw 'createdb.exe introuvable.' }
    & $createdb -h 127.0.0.1 -p 5432 -U postgres -O credipass credipass
    if ($LASTEXITCODE -ne 0) { throw 'Création de la base credipass impossible.' }
    Write-Host '[OK] Base credipass créée.' -ForegroundColor Green
} else {
    & $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c 'ALTER DATABASE credipass OWNER TO credipass;' | Out-Null
    Write-Host '[OK] Base credipass déjà présente.' -ForegroundColor Green
}

Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

# Générer .env.local
$envText = @"
# CREDIPASS MVP FINAL — PostgreSQL natif Windows
CREDIPASS_DATABASE_URL=postgresql://credipass:$appPassword@127.0.0.1:5432/credipass
CREDIPASS_PG_SSL=disable
CREDIPASS_PG_POOL=10
CREDIPASS_HOST=127.0.0.1
"@
Set-Content -Path '.env.local' -Value $envText -Encoding UTF8
Write-Host '[OK] .env.local généré.' -ForegroundColor Green

# Installer dépendances
Write-Host '[INFO] Installation des dépendances Node.js...'
& npm.cmd ci --omit=dev
if ($LASTEXITCODE -ne 0) {
    Write-Host '[INFO] npm ci indisponible; tentative npm install --omit=dev...'
    & npm.cmd install --omit=dev
    if ($LASTEXITCODE -ne 0) { throw 'Installation npm impossible.' }
}

# Vérifier base via CREDIPASS
Write-Host '[INFO] Vérification PostgreSQL via CREDIPASS...'
& npm.cmd run db:check
if ($LASTEXITCODE -ne 0) { throw 'Le contrôle CREDIPASS PostgreSQL a échoué.' }

# Créer/réinitialiser comptes démo
if (Test-Path 'scripts\reset-demo-accounts.mjs') {
    & node (Join-Path $ProjectRoot 'scripts\reset-demo-accounts.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'Création des comptes de démonstration impossible.' }
    Write-Host '[OK] 10 comptes de démonstration prêts.' -ForegroundColor Green
}

Write-Host ''
Write-Host '============================================================' -ForegroundColor Green
Write-Host ' [OK] POSTGRESQL CENTRAL CREDIPASS EST PRÊT' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Green
Write-Host 'Base      : credipass'
Write-Host 'Utilisateur: credipass'
Write-Host 'Hôte      : 127.0.0.1:5432'
Write-Host 'Terminal  : IndexedDB'
Write-Host ''
Write-Host 'Étape suivante : lancer windows\LANCER_MVP_DEMO.bat' -ForegroundColor Cyan
