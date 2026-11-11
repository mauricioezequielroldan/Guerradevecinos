@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (py servidor_local.py) else (python servidor_local.py)
pause
