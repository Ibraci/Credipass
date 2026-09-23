$ErrorActionPreference='Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

if(-not (Get-Command docker -ErrorAction SilentlyContinue)){throw 'Docker Desktop est requis pour cette méthode. Sinon, installez PostgreSQL nativement et configurez .env.local.'}
if(-not (Get-Command node -ErrorAction SilentlyContinue)){throw 'Node.js 20+ est requis.'}
if(-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)){throw 'npm est requis.'}

$pgEnv=Join-Path $ProjectRoot '.env.postgres.local'
$appEnv=Join-Path $ProjectRoot '.env.local'
if(-not (Test-Path $pgEnv)){
  $chars=('abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789').ToCharArray()
  $password=-join (1..32 | ForEach-Object { $chars | Get-Random })
  $utf8NoBom=New-Object System.Text.UTF8Encoding($false)
  $pgContent=@"
POSTGRES_DB=credipass
POSTGRES_USER=credipass
POSTGRES_PASSWORD=$password
POSTGRES_PORT=5432
"@
  $appContent=@"
CREDIPASS_DATABASE_URL=postgresql://credipass:$password@127.0.0.1:5432/credipass
CREDIPASS_PG_SSL=disable
CREDIPASS_PG_POOL=10
CREDIPASS_HOST=127.0.0.1
"@
  [IO.File]::WriteAllText($pgEnv,$pgContent,$utf8NoBom)
  [IO.File]::WriteAllText($appEnv,$appContent,$utf8NoBom)
  Write-Host '[OK] Configuration locale PostgreSQL créée (.env.local + .env.postgres.local).' -ForegroundColor Green
}else{
  Write-Host '[INFO] Configuration PostgreSQL existante conservée.' -ForegroundColor Yellow
}

Write-Host '[INFO] Installation du pilote PostgreSQL Node.js...' -ForegroundColor Cyan
& npm.cmd ci --omit=dev
if($LASTEXITCODE -ne 0){throw 'npm install a échoué.'}

Write-Host '[INFO] Démarrage PostgreSQL...' -ForegroundColor Cyan
& docker compose --env-file .env.postgres.local -f docker-compose.postgresql.yml up -d
if($LASTEXITCODE -ne 0){throw 'docker compose a échoué.'}

for($i=0;$i -lt 30;$i++){
  try{
    & node (Join-Path $ProjectRoot 'scripts\check-postgres.mjs')
    if($LASTEXITCODE -eq 0){Write-Host '[OK] PostgreSQL central CREDIPASS est prêt.' -ForegroundColor Green; Write-Host '[INFO] Création/réinitialisation des comptes de démonstration...' -ForegroundColor Cyan; & node (Join-Path $ProjectRoot 'scripts\reset-demo-accounts.mjs'); if($LASTEXITCODE -ne 0){throw 'Préparation des comptes de démonstration échouée.'}; Write-Host '[OK] 10 comptes de démonstration prêts.' -ForegroundColor Green; exit 0}
  }catch{}
  Start-Sleep -Seconds 2
}
throw 'PostgreSQL n''est pas devenu disponible. Vérifiez Docker Desktop et les journaux du conteneur.'
