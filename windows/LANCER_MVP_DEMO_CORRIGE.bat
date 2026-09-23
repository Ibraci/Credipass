@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>&1
cd /d "%~dp0.."
set "PORT=8092"
set "CREDIPASS_HOST=127.0.0.1"

echo ============================================================
echo  CREDIPASS - MVP DEMO - DEMARRAGE CORRIGE
echo  IndexedDB terminal + PostgreSQL central
echo ============================================================

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  pause
  exit /b 1
)
if not exist ".env.local" (
  echo [ERREUR] .env.local absent.
  echo Lancez windows\PREPARER_POSTGRESQL_NATIF_V2.bat.
  pause
  exit /b 1
)
if not exist "node_modules\postgres\package.json" (
  echo [INFO] Installation du pilote PostgreSQL...
  call npm install --omit=dev
  if errorlevel 1 (
    echo [ERREUR] Installation npm impossible.
    pause
    exit /b 1
  )
)

echo [INFO] Verification PostgreSQL...
node scripts\check-postgres.mjs
if errorlevel 1 (
  echo [ERREUR] PostgreSQL n'est pas joignable.
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

start "CREDIPASS MVP Server" cmd /k "cd /d ""%~dp0.."" && set ""CREDIPASS_HOST=127.0.0.1"" && set ""CREDIPASS_RESET_DEMO_PASSWORDS=1"" && node scripts\boot.mjs %PORT%"
for /L %%I in (1,1,25) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try{$r=Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:%PORT%/api/health' -TimeoutSec 1;if($r.StatusCode -eq 200){exit 0}}catch{};exit 1" >nul 2>nul
  if not errorlevel 1 goto READY
  timeout /t 1 /nobreak >nul
)

echo [ERREUR] Le serveur n'a pas repondu sur le port %PORT%.
pause
exit /b 1

:READY
echo [OK] PostgreSQL central + IndexedDB terminal.
start "" "http://localhost:%PORT%/?mvp=urgent1"
exit /b 0
