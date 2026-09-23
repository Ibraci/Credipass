@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
echo ============================================================
echo  CREDIPASS - VERIFICATION MVP
echo ============================================================
where node >nul 2>nul || (echo [ERREUR] Node.js absent.& pause& exit /b 1)
call npm run test:all
if errorlevel 1 (echo.& echo [ECHEC] Tests MVP.& pause& exit /b 1)
echo.
echo [OK] Tests logiciels MVP PASS.
echo Le parcours MVP propre, le Copilot et les régressions critiques sont inclus dans cette vérification.
pause
