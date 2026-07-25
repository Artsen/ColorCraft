# Troubleshooting

## Pillow fails to install on Python 3.13

The pinned Pillow version may not provide a compatible wheel. Install Python 3.11 and create the environment explicitly:

```powershell
py -3.11 -m venv backend\.venv311
.\backend\.venv311\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
```

If virtual-environment creation reports that `venvlauncher.exe` cannot be copied, close processes using that environment, choose a new directory name, and verify the Python installation outside the Microsoft Store alias.

## pnpm reports “packages field missing or empty”

Run pnpm inside `frontend`, not the repository root:

```powershell
cd frontend
corepack pnpm@9.15.9 install
```

The repository pins pnpm 9 for reproducibility. If pnpm blocks an `esbuild` lifecycle script, use the pinned version and the checked-in lockfile rather than approving an unrelated global pnpm policy.

## A port is already in use

ColorCraft defaults to 5174/4100. Stop the conflicting process or set `COLORCRAFT_WEB_PORT` and `COLORCRAFT_API_PORT`; see [Runtime configuration](./runtime-configuration.md). The launcher prints which address is occupied.

## The frontend cannot reach the API

Check `/ready`, confirm the printed API URL, and ensure `VITE_API_URL` matches the browser-reachable address. Custom web origins must appear exactly in `COLORCRAFT_ALLOWED_ORIGINS`.

## Saved palettes disappeared

Palettes are scoped to the exact browser profile and origin. Changing the web port, using private browsing, or clearing site data creates an empty Library. ColorCraft has no cloud recovery.

## Playwright cannot find Chromium

```powershell
cd frontend
corepack pnpm@9.15.9 exec playwright install chromium
```

## A 422 response appears for analysis or suggestions

Send `{ "colors": [...] }`, not a bare array, and include consistent HEX, RGB, and HSL values. Read the structured `error.details` entries or use `/docs`.
