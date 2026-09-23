$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

# Console: garder des messages ASCII pour eviter les problemes d'encodage Windows.
try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

Write-Host '============================================================'
Write-Host ' CREDIPASS - PREPARATION POSTGRESQL NATIF WINDOWS V2'
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
                Sort-Object { try { [version]$_.Name } catch { [version]'0.0' } } -Descending |
                ForEach-Object { Join-Path $_.FullName 'bin\psql.exe' } |
                Where-Object { Test-Path $_ } |
                Select-Object -First 1
            if ($candidate) { return $candidate }
        }
    }
    return $null
}

function Invoke-PsqlScalar {
    param(
        [Parameter(Mandatory=$true)][string]$Sql,
        [string]$Database = 'postgres'
    )

    # -X ignore .psqlrc, -A non-aligne, -t tuples seuls, -q silencieux.
    $out = @(& $script:psql -X -h 127.0.0.1 -p 5432 -U postgres -d $Database -v ON_ERROR_STOP=1 -Atq -c $Sql)
    $exit = $LASTEXITCODE
    if ($exit -ne 0) {
        throw "Echec de la requete PostgreSQL (code $exit): $Sql"
    }
    if ($null -eq $out -or $out.Count -eq 0) { return '' }
    return (($out | ForEach-Object { [string]$_ }) -join "`n").Trim()
}

$psql = Find-Psql
if (-not $psql) {
    Write-Host ''
    Write-Host '[ERREUR] PostgreSQL/psql est introuvable.' -ForegroundColor Red
    Write-Host 'Installe PostgreSQL pour Windows, puis relance ce script.' -ForegroundColor Yellow
    exit 1
}

$pgBin = Split-Path $psql
$createdb = Join-Path $pgBin 'createdb.exe'
Write-Host "[OK] psql detecte : $psql" -ForegroundColor Green

$node = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $node) { throw 'Node.js est introuvable. Installe Node.js 20+ puis relance.' }
$nodeVersion = (& node -v)
Write-Host "[OK] Node.js : $nodeVersion" -ForegroundColor Green

Write-Host ''
$secure = Read-Host 'Mot de passe du compte PostgreSQL "postgres"' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $adminPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }

$env:PGPASSWORD = $adminPassword

try {
    $probe = Invoke-PsqlScalar -Sql 'SELECT 1;'
    if ($probe -ne '1') { throw 'Le serveur PostgreSQL ne repond pas comme attendu.' }
    Write-Host '[OK] Serveur PostgreSQL joignable.' -ForegroundColor Green

    # Mot de passe applicatif URI-safe, cree a chaque preparation.
    $appPassword = 'Cp_' + ([guid]::NewGuid().ToString('N').Substring(0,20)) + '_26'

    # EXISTS renvoie toujours t/f : aucune methode .Trim() sur $null.
    $roleExists = Invoke-PsqlScalar -Sql "SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='credipass');"
    if ($roleExists -eq 't') {
        & $psql -X -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -q -c "ALTER ROLE credipass WITH LOGIN PASSWORD '$appPassword';" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'Mise a jour du role credipass impossible.' }
        Write-Host '[OK] Role credipass mis a jour.' -ForegroundColor Green
    } else {
        & $psql -X -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -q -c "CREATE ROLE credipass LOGIN PASSWORD '$appPassword';" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'Creation du role credipass impossible.' }
        Write-Host '[OK] Role credipass cree.' -ForegroundColor Green
    }

    $dbExists = Invoke-PsqlScalar -Sql "SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname='credipass');"
    if ($dbExists -ne 't') {
        if (-not (Test-Path $createdb)) { throw 'createdb.exe introuvable.' }
        & $createdb -h 127.0.0.1 -p 5432 -U postgres -O credipass credipass
        if ($LASTEXITCODE -ne 0) { throw 'Creation de la base credipass impossible.' }
        Write-Host '[OK] Base credipass creee.' -ForegroundColor Green
    } else {
        & $psql -X -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -q -c 'ALTER DATABASE credipass OWNER TO credipass;' | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'Changement de proprietaire de la base impossible.' }
        Write-Host '[OK] Base credipass deja presente.' -ForegroundColor Green
    }

    # Autorisations utiles pour les schemas/tables crees par l'application.
    & $psql -X -h 127.0.0.1 -p 5432 -U postgres -d credipass -v ON_ERROR_STOP=1 -q -c 'ALTER SCHEMA public OWNER TO credipass; GRANT ALL ON SCHEMA public TO credipass;' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Configuration du schema public impossible.' }
    Write-Host '[OK] Droits PostgreSQL configures.' -ForegroundColor Green
}
finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

# Generer .env.local utilise par CREDIPASS.
$envText = @"
# CREDIPASS MVP FINAL - PostgreSQL natif Windows
CREDIPASS_DATABASE_URL=postgresql://credipass:$appPassword@127.0.0.1:5432/credipass
CREDIPASS_PG_SSL=disable
CREDIPASS_PG_POOL=10
CREDIPASS_HOST=127.0.0.1
"@
Set-Content -Path '.env.local' -Value $envText -Encoding UTF8
Write-Host '[OK] .env.local genere.' -ForegroundColor Green

Write-Host '[INFO] Installation des dependances Node.js...'
& npm.cmd ci --omit=dev
if ($LASTEXITCODE -ne 0) {
    Write-Host '[INFO] npm ci indisponible; tentative npm install --omit=dev...'
    & npm.cmd install --omit=dev
    if ($LASTEXITCODE -ne 0) { throw 'Installation npm impossible.' }
}

Write-Host '[INFO] Verification PostgreSQL via CREDIPASS...'
& npm.cmd run db:check
if ($LASTEXITCODE -ne 0) { throw 'Le controle CREDIPASS PostgreSQL a echoue.' }

if (Test-Path 'scripts\reset-demo-accounts.mjs') {
    Write-Host '[INFO] Preparation des comptes de demonstration...'
    & node (Join-Path $ProjectRoot 'scripts\reset-demo-accounts.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'Creation des comptes de demonstration impossible.' }
    Write-Host '[OK] 10 comptes de demonstration prets.' -ForegroundColor Green
} else {
    Write-Host '[ATTENTION] scripts\reset-demo-accounts.mjs absent : comptes non reinitialises.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host '============================================================' -ForegroundColor Green
Write-Host ' [OK] POSTGRESQL CENTRAL CREDIPASS EST PRET' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Green
Write-Host 'Base       : credipass'
Write-Host 'Utilisateur: credipass'
Write-Host 'Hote       : 127.0.0.1:5432'
Write-Host 'Terminal   : IndexedDB'
Write-Host ''
Write-Host 'Etape suivante : lancer windows\LANCER_MVP_DEMO.bat' -ForegroundColor Cyan
