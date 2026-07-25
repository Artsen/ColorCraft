# Getting started

## Requirements

- Python 3.11 (recommended; pinned Pillow wheels are not available for every newer Python release)
- Node.js 20 or newer
- Corepack
- Git

## Windows

From the repository root:

```powershell
py -3.11 -m venv backend\.venv311
.\backend\.venv311\Scripts\python.exe -m pip install --upgrade pip
.\backend\.venv311\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
cd frontend
corepack pnpm@9.15.9 install
cd ..
.\backend\.venv311\Scripts\python.exe dev.py
```

The launcher supervises the FastAPI and Vite processes, waits for readiness, prints every URL, and shuts both down when you press `Ctrl+C`.

## macOS and Linux

```bash
python3.11 -m venv backend/.venv
backend/.venv/bin/python -m pip install --upgrade pip
backend/.venv/bin/python -m pip install -r backend/requirements-dev.txt
cd frontend
corepack pnpm@9.15.9 install
cd ..
backend/.venv/bin/python dev.py
```

If the browser does not open, visit `http://127.0.0.1:5174`. The API docs are at `http://127.0.0.1:4100/docs`.

## Production build

```powershell
cd frontend
corepack pnpm@9.15.9 build
```

The output is written to `frontend/dist`. This repository's launcher is a development workflow; choose a production web server and API process manager for deployment.

For configuration overrides, see [Runtime configuration](./runtime-configuration.md). For setup errors, see [Troubleshooting](./troubleshooting.md).
