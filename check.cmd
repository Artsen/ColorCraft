@echo off
setlocal
set "COLORCRAFT_ROOT=%~dp0"

if exist "%COLORCRAFT_ROOT%backend\.venv311\Scripts\python.exe" (
    "%COLORCRAFT_ROOT%backend\.venv311\Scripts\python.exe" "%COLORCRAFT_ROOT%check.py" %*
    exit /b %errorlevel%
)

if exist "%COLORCRAFT_ROOT%backend\.venv\Scripts\python.exe" (
    "%COLORCRAFT_ROOT%backend\.venv\Scripts\python.exe" "%COLORCRAFT_ROOT%check.py" %*
    exit /b %errorlevel%
)

echo ColorCraft could not find a backend development environment.
echo Create one and install backend\requirements-dev.txt, then try again.
exit /b 1
