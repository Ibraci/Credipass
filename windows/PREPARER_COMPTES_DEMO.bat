@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
echo ============================================================
echo  CREDIPASS - PREPARATION DES 10 COMPTES DE DEMONSTRATION
echo ============================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  pause
  exit /b 1
)
if not exist ".env.local" (
  echo [ERREUR] .env.local absent. Preparez PostgreSQL d'abord.
  pause
  exit /b 1
)
node scripts\check-postgres.mjs
if errorlevel 1 (
  echo [ERREUR] PostgreSQL n'est pas joignable.
  pause
  exit /b 1
)
node scripts\reset-demo-accounts.mjs
if errorlevel 1 (
  echo [ERREUR] La creation des comptes a echoue.
  pause
  exit /b 1
)
echo.
echo [OK] Les 10 comptes de demonstration sont prets.
echo Consultez docs\COMPTES_DEMONSTRATION.md pour les identifiants.
pause
