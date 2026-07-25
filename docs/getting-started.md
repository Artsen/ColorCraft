# Getting started

## Requirements

- Python 3.11
- Node.js 20 or newer
- Corepack
- Git

Python 3.11 is the supported setup version. The pinned Pillow release does not
provide a wheel for every newer Python release.

## Install ColorCraft on Windows

### Purpose

Install the backend and frontend dependencies.

### Procedure

1. Open PowerShell in the repository root.
2. Create the backend virtual environment:

   ```powershell
   py -3.11 -m venv backend\.venv311
   ```

3. Upgrade pip:

   ```powershell
   .\backend\.venv311\Scripts\python.exe -m pip install --upgrade pip
   ```

4. Install the backend development dependencies:

   ```powershell
   .\backend\.venv311\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
   ```

5. Install the frontend dependencies:

   ```powershell
   cd frontend
   corepack pnpm@9.15.9 install
   cd ..
   ```

### Result

The repository contains a local backend virtual environment and the frontend
packages.

## Install ColorCraft on macOS or Linux

1. Open a terminal in the repository root.
2. Run:

   ```bash
   python3.11 -m venv backend/.venv
   backend/.venv/bin/python -m pip install --upgrade pip
   backend/.venv/bin/python -m pip install -r backend/requirements-dev.txt
   cd frontend
   corepack pnpm@9.15.9 install
   cd ..
   ```

## Start ColorCraft in one terminal

### Before you start

Install both dependency sets. Stop any process that uses port 5174 or 4100.

### Procedure

1. Open a terminal in the repository root.
2. On Windows, run:

   ```powershell
   .\backend\.venv311\Scripts\python.exe dev.py
   ```

3. On macOS or Linux, run:

   ```bash
   backend/.venv/bin/python dev.py
   ```

4. Wait for `ColorCraft is ready`.
5. Open `http://127.0.0.1:5174` in a browser.

### Result

The web application listens on `http://127.0.0.1:5174`. The API listens on
`http://127.0.0.1:4100`. The launcher also prints health, readiness, and metadata
URLs.

### Recovery

If startup reports a port conflict, stop the process that uses the reported
port or configure a different port. If the launcher cannot find a virtual
environment, repeat the installation procedure with Python 3.11.

## Start the services manually

Use two terminals when you must inspect each process separately.

1. Start the API from the `backend` directory:

   ```powershell
   cd backend
   .\.venv311\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 4100
   ```

2. Start Vite from the `frontend` directory:

   ```powershell
   cd frontend
   corepack pnpm@9.15.9 dev --host 127.0.0.1 --port 5174
   ```

3. Open `http://127.0.0.1:5174`.

## Stop ColorCraft

1. Select the terminal that runs the launcher.
2. Press `Ctrl+C`.
3. If Windows asks `Terminate batch job (Y/N)?`, enter `Y`.

The launcher stops both child services.

## Configure trusted LAN access

The default configuration accepts loopback traffic only. Trusted LAN access
requires `COLORCRAFT_ALLOW_LAN_ACCESS=true`, non-loopback bind hosts, and exact
CORS origins.

**Warning:** ColorCraft does not provide authentication. LAN access exposes the
API and source-image traffic to the configured network path. Do not expose the
development services to an untrusted network.

See [Runtime configuration](./runtime-configuration.md) for the exact variables.
See [Troubleshooting](./troubleshooting.md) for installation and startup
recovery.
