@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
echo ============================================================
echo  CREDIPASS - POSTGRESQL NATIF WINDOWS
echo ============================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0PREPARER_POSTGRESQL_NATIF.ps1"
if errorlevel 1 (
  echo.
  echo [ERREUR] La preparation PostgreSQL native a echoue.
  pause
  exit /b 1
)
echo.
echo [OK] Preparation terminee.
pause
