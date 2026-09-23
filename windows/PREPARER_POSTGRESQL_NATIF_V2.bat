@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>&1
cd /d "%~dp0.."
echo ============================================================
echo  CREDIPASS - POSTGRESQL NATIF WINDOWS V2
echo ============================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0PREPARER_POSTGRESQL_NATIF_V2.ps1"
if errorlevel 1 (
  echo.
  echo [ERREUR] La preparation PostgreSQL native a echoue.
  pause
  exit /b 1
)
echo.
echo [OK] Preparation terminee.
pause
