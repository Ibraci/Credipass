@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
echo [INFO] Arret de CREDIPASS (les donnees sont conservees)...
docker compose down
if errorlevel 1 (
  echo [ERREUR] Arret impossible. Docker Desktop est-il demarre ?
  pause
  exit /b 1
)
echo [OK] CREDIPASS est arrete. Relancer : windows\DEMARRER_DOCKER.bat
pause
