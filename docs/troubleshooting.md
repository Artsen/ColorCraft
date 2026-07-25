# Troubleshooting

## Pillow installation fails

**Problem:** pip cannot build the pinned Pillow release.

**Cause:** The selected Python release does not have a compatible wheel.

**Recovery:**

1. Install Python 3.11.
2. Create a new environment:

   ```powershell
   py -3.11 -m venv backend\.venv311
   ```

3. Install the development requirements:

   ```powershell
   .\backend\.venv311\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
   ```

If Windows cannot copy `venvlauncher.exe`, close processes that use the target
environment. Create the environment with a new directory name if necessary.

## pnpm reports `packages field missing or empty`

**Problem:** pnpm cannot find the workspace package.

**Cause:** The command ran outside `frontend`, or it did not use the pinned pnpm
version.

**Recovery:**

```powershell
cd frontend
corepack pnpm@9.15.9 install
```

`frontend/pnpm-workspace.yaml` permits the required esbuild installation script.
Do not approve unrelated package build scripts.

## A port is unavailable

**Problem:** The launcher reports that the web or API address is unavailable.

**Cause:** Another process uses the configured port.

**Recovery:** Stop the other process, or set `COLORCRAFT_WEB_PORT` and
`COLORCRAFT_API_PORT` to unused ports. See
[Runtime configuration](./runtime-configuration.md).

## The API does not become ready

**Problem:** The launcher reaches the readiness timeout.

**Recovery:**

1. Read the first API error in the terminal.
2. Open the printed `/health` URL.
3. Open the printed `/ready` URL.
4. Verify that the backend virtual environment contains the required packages.
5. Restart the launcher.

## The frontend cannot reach the API

**Problem:** ColorCraft displays an API connection error.

**Recovery:**

1. Verify that `/ready` returns HTTP 200.
2. Verify the printed API URL.
3. If you configured a browser-visible API URL, verify
   `VITE_COLORCRAFT_API_URL`.
4. Verify that `COLORCRAFT_ALLOWED_ORIGINS` contains the exact web origin.
5. Restart both services after you change environment variables.

## A LAN origin is rejected

**Problem:** Startup or CORS validation rejects a non-loopback host.

**Recovery:** Set `COLORCRAFT_ALLOW_LAN_ACCESS=true`. Configure explicit bind
hosts, an exact CORS origin, and a browser-reachable
`VITE_COLORCRAFT_API_URL`.

**Warning:** Do not expose ColorCraft to an untrusted network.

## A source image is rejected

Check the API error code:

- `upload_too_large`: Select a source image that is 10 MB or smaller.
- `image_dimensions_too_large`: Reduce the decoded image below 40 million
  pixels.
- `invalid_file_type`: Select a JPG, PNG, or WebP source image.
- `image_decode_error`: Select a valid, decodable source image.
- `no_visible_pixels`: Select an image that contains visible pixels.

The current Create UI states a 15 MB limit, but the API enforces 10 MB. Use
10 MB as the effective limit.

## Color extraction returns fewer colors than requested

**Cause:** The processing sample contains fewer unique colors than the requested
cluster count.

**Result:** This behavior is expected. Use the returned palette or select
another source image.

## Review shows stale analysis

**Problem:** A palette color changed after analysis.

**Recovery:** Select **Refresh analysis**. ColorCraft does not present the old
analysis as current.

## Clipboard copy fails

**Problem:** The browser denies clipboard access.

**Recovery:** Select **Select preview**, and then copy the selected export text
manually.

## Download creation fails

**Problem:** The browser cannot create the exported file.

**Recovery:** Select **Copy**. If copy also fails, select **Select preview** and
copy the text manually.

## Saved palettes are missing

**Cause:** Saved palettes are scoped to a browser profile and exact web origin.
Private browsing, a different port, or cleared site data can show an empty
Palette Library.

**Recovery:** Return to the original browser profile and origin. ColorCraft does
not have cloud recovery.

## Browser history does not restore a palette

**Cause:** The URL stores only the application view and Review tab. It does not
store palette data.

**Recovery:** Open the saved palette from **Library**. Unsaved palette state
cannot be recovered after a new session.

## Playwright cannot find Chromium

```powershell
cd frontend
corepack pnpm@9.15.9 exec playwright install chromium
```

## Analysis or suggestions return HTTP 422

Send `{ "colors": [...] }`, not a bare array. Verify that HEX, RGB, and HSL
describe the same colors. Read `error.details`, or open `/docs` for the current
OpenAPI contract.
