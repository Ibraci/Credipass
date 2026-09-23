@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
set "PORT=8092"
set "CREDIPASS_HOST=127.0.0.1"

echo ============================================================
echo  CREDIPASS R19.3.2 - INDEXEDDB + POSTGRESQL CENTRAL
echo ============================================================

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable. Installez Node.js 20 ou plus recent.
  pause
  exit /b 1
)
node -e "process.exit(Number(process.versions.node.split('.')[0])>=20?0:1)"
if errorlevel 1 (
  echo [ERREUR] CREDIPASS requiert Node.js 20 ou plus recent.
  node -v
  pause
  exit /b 1
)

if not exist ".env.local" (
  echo [ERREUR] Le fichier .env.local est absent.
  echo Copiez .env.example vers .env.local puis configurez CREDIPASS_DATABASE_URL.
  pause
  exit /b 1
)

if not exist "node_modules\postgres\package.json" (
  echo [ERREUR] Le pilote PostgreSQL n'est pas installe.
  echo Executez une fois : npm ci --omit=dev
  pause
  exit /b 1
)

echo [INFO] Verification PostgreSQL...
node scripts\check-postgres.mjs
if errorlevel 1 (
  echo.
  echo [ERREUR] PostgreSQL n'est pas joignable. Verifiez .env.local et le service PostgreSQL.
  pause
  exit /b 1
)

echo [INFO] Reinitialisation des 10 comptes de demonstration...
node scripts\reset-demo-accounts.mjs
if errorlevel 1 (
  echo [ERREUR] Impossible de preparer les comptes de demonstration.
  pause
  exit /b 1
)
echo [OK] 10 comptes de demonstration prets.

powershell -NoProfile -ExecutionPolicy Bypass -Command "try{$r=Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:%PORT%/api/health' -TimeoutSec 1;if($r.StatusCode -eq 200){exit 0}}catch{};exit 1" >nul 2>nul
if not errorlevel 1 goto READY

start "CREDIPASS R19.3.2 Server" cmd /k "cd /d ""%~dp0.."" && set ""CREDIPASS_HOST=127.0.0.1"" && set ""CREDIPASS_RESET_DEMO_PASSWORDS=1"" && node scripts\boot.mjs %PORT%"
for /L %%I in (1,1,25) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try{$r=Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:%PORT%/api/health' -TimeoutSec 1;if($r.StatusCode -eq 200){exit 0}}catch{};exit 1" >nul 2>nul
  if not errorlevel 1 goto READY
  timeout /t 1 /nobreak >nul
)

echo [ERREUR] Le serveur CREDIPASS n'a pas repondu sur le port %PORT%.
echo Consultez la fenetre CREDIPASS R19.3.2 Server.
pause
exit /b 1

:READY
echo [OK] CREDIPASS : IndexedDB terminaux + PostgreSQL central.
start "" "http://localhost:%PORT%/"
exit /b 0
