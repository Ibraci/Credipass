@echo off
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0PREPARER_POSTGRESQL_DOCKER.ps1"
if errorlevel 1 (
  echo.
  echo [ERREUR] La preparation PostgreSQL a echoue.
  pause
  exit /b 1
)
echo.
echo [OK] PostgreSQL central est pret. Lancez maintenant windows\LANCER_CREDIPASS.bat
pause
