@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo ============================================================
echo  CREDIPASS - DEMARRAGE AVEC DOCKER DESKTOP
echo ============================================================

where docker >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Docker est introuvable. Installez Docker Desktop, puis recommencez.
  pause
  exit /b 1
)
docker info >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Docker Desktop n'est pas demarre. Lancez Docker Desktop, attendez qu'il soit pret, puis recommencez.
  pause
  exit /b 1
)

rem Premier lancement : cree .env a partir du modele, avec un mot de passe PostgreSQL aleatoire propre a ce PC.
if not exist ".env" (
  echo [INFO] Creation du fichier .env avec un mot de passe PostgreSQL aleatoire...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$b=New-Object byte[] 24; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); $pw=-join ($b | ForEach-Object { $_.ToString('x2') }); $lines=(Get-Content -Encoding UTF8 '.env.docker.example') -replace '^POSTGRES_PASSWORD=$', ('POSTGRES_PASSWORD=' + $pw); [IO.File]::WriteAllLines((Join-Path (Get-Location) '.env'), [string[]]$lines, (New-Object Text.UTF8Encoding $false))"
  if errorlevel 1 (
    echo [ERREUR] Impossible de creer .env. Copiez .env.docker.example en .env et renseignez POSTGRES_PASSWORD.
    pause
    exit /b 1
  )
)
findstr /r /c:"^POSTGRES_PASSWORD=..*" .env >nul
if errorlevel 1 (
  echo [ERREUR] POSTGRES_PASSWORD est vide dans .env. Renseignez un mot de passe puis recommencez.
  pause
  exit /b 1
)

echo [INFO] Construction et demarrage de la base et de l'application...
docker compose up -d --build
if errorlevel 1 (
  echo [ERREUR] Le demarrage a echoue. Si le port 8092 est deja pris, changez CREDIPASS_PORT dans .env.
  pause
  exit /b 1
)

echo [INFO] Attente de l'application...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$port=((Get-Content -Encoding UTF8 '.env') | Where-Object { $_ -match '^CREDIPASS_PORT=' } | ForEach-Object { $_.Split('=')[1] }); if(-not $port){$port='8092'}; for($i=0;$i -lt 60;$i++){ try { $r=Invoke-RestMethod ('http://127.0.0.1:' + $port + '/api/health'); if($r.database.connected){ Start-Process ('http://127.0.0.1:' + $port); exit 0 } } catch {}; Start-Sleep -Seconds 2 }; exit 1"
if errorlevel 1 (
  echo [ATTENTION] L'application ne repond pas encore. Consultez les journaux avec : docker compose logs app
  pause
  exit /b 1
)

echo.
echo [OK] CREDIPASS est demarre et s'ouvre dans le navigateur.
echo      Comptes de demonstration : docs\COMPTES_DEMONSTRATION.md
echo      Pour arreter : windows\ARRETER_DOCKER.bat
pause
