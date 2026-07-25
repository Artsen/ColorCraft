@echo off
setlocal
set "COLORCRAFT_ROOT=%~dp0"

if exist "%COLORCRAFT_ROOT%backend\.venv311\Scripts\python.exe" (
    "%COLORCRAFT_ROOT%backend\.venv311\Scripts\python.exe" "%COLORCRAFT_ROOT%dev.py"
    exit /b %errorlevel%
)

if exist "%COLORCRAFT_ROOT%backend\.venv\Scripts\python.exe" (
    "%COLORCRAFT_ROOT%backend\.venv\Scripts\python.exe" "%COLORCRAFT_ROOT%dev.py"
    exit /b %errorlevel%
)

if exist "%COLORCRAFT_ROOT%backend\venv\Scripts\python.exe" (
    "%COLORCRAFT_ROOT%backend\venv\Scripts\python.exe" "%COLORCRAFT_ROOT%dev.py"
    exit /b %errorlevel%
)

echo ColorCraft could not find a backend virtual environment.
echo Create one with Python 3.11, install backend\requirements.txt, and try again.
exit /b 1
