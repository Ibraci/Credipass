@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
set "PORT=8092"
set "CREDIPASS_HOST=0.0.0.0"
echo ============================================================
echo  CREDIPASS R19.3.2 - MODE LAN + POSTGRESQL CENTRAL
echo ============================================================
if not exist ".env.local" (echo [ERREUR] .env.local absent.& pause& exit /b 1)
if not exist "node_modules\postgres\package.json" (echo [ERREUR] Executez d'abord npm install.& pause& exit /b 1)
node scripts\check-postgres.mjs
if errorlevel 1 (echo [ERREUR] PostgreSQL indisponible.& pause& exit /b 1)
start "CREDIPASS R19.3.2 LAN Server" cmd /k "cd /d ""%~dp0.."" && set ""CREDIPASS_HOST=0.0.0.0"" && node scripts\boot.mjs %PORT%"
for /L %%I in (1,1,25) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try{$r=Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:%PORT%/api/health' -TimeoutSec 1;if($r.StatusCode -eq 200){exit 0}}catch{};exit 1" >nul 2>nul
  if not errorlevel 1 goto READY
  timeout /t 1 /nobreak >nul
)
echo [ERREUR] Serveur LAN non disponible.& pause& exit /b 1
:READY
echo [OK] Serveur LAN disponible. PostgreSQL reste local au serveur central.
start "" "http://localhost:%PORT%/"
exit /b 0
