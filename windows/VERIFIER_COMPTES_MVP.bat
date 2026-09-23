@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>&1
cd /d "%~dp0.."
echo ============================================================
echo  CREDIPASS - VERIFICATION DES 10 COMPTES SUR POSTGRESQL REEL
echo ============================================================
node scripts\verify-live-demo-accounts.mjs
if errorlevel 1 (
  echo.
  echo [ERREUR] Au moins un compte ne fonctionne pas.
  echo Lancez windows\PREPARER_COMPTES_DEMO.bat puis recommencez.
  pause
  exit /b 1
)
echo.
echo [OK] Les 10 comptes fonctionnent sur le serveur actif.
pause
