@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
echo ============================================================
echo  CREDIPASS - MVP DEMO FINAL
echo  Parcours: dossier -> score -> copilote -> decision humaine
echo ============================================================
if not exist ".env.local" (
  echo [ERREUR] .env.local absent.
  echo Lancez windows\PREPARER_POSTGRESQL_NATIF_V2.bat (ou Docker) avant la premiere demo.
  pause
  exit /b 1
)
call "%~dp0LANCER_MVP_DEMO_CORRIGE.bat"
