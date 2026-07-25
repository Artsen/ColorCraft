# Runtime configuration

## Defaults

ColorCraft reads defaults from `runtime-config.json`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `COLORCRAFT_WEB_HOST` | `127.0.0.1` | Vite bind host |
| `COLORCRAFT_WEB_PORT` | `5174` | Web port |
| `COLORCRAFT_API_HOST` | `127.0.0.1` | FastAPI bind host |
| `COLORCRAFT_API_PORT` | `4100` | API port |
| `COLORCRAFT_READINESS_TIMEOUT_SECONDS` | `30` | Launcher startup deadline in seconds |
| `COLORCRAFT_ALLOWED_ORIGINS` | Resolved web origin | Comma-separated exact CORS origins |
| `VITE_COLORCRAFT_API_URL` | Resolved API origin | API base URL that the frontend uses |
| `COLORCRAFT_ALLOW_LAN_ACCESS` | `false` | Required opt-in for non-loopback hosts and origins |

Ports must be integers from 1 through 65535. The launcher checks both configured
ports before it starts a child process.

## Change the local ports

### Purpose

Start ColorCraft when a default port is unavailable.

### Procedure

1. Open PowerShell in the repository root.
2. Set both port variables:

   ```powershell
   $env:COLORCRAFT_WEB_PORT = "5184"
   $env:COLORCRAFT_API_PORT = "4110"
   ```

3. Start the launcher:

   ```powershell
   .\backend\.venv311\Scripts\python.exe dev.py
   ```

### Result

The launcher prints the resolved web, API, health, readiness, and metadata URLs.

### Recovery

If a configured port is still unavailable, select unused port numbers and
repeat the procedure.

## Configure trusted LAN access

**Warning:** ColorCraft does not provide authentication. Complete this procedure
only on a trusted network with an appropriate firewall.

Example:

```powershell
$env:COLORCRAFT_ALLOW_LAN_ACCESS = "true"
$env:COLORCRAFT_WEB_HOST = "0.0.0.0"
$env:COLORCRAFT_API_HOST = "0.0.0.0"
$env:COLORCRAFT_ALLOWED_ORIGINS = "http://192.168.1.20:5174"
$env:VITE_COLORCRAFT_API_URL = "http://192.168.1.20:4100"
.\backend\.venv311\Scripts\python.exe dev.py
```

Replace `192.168.1.20` with the computer's address on the trusted network. CORS
origins must include the exact scheme, host, and port. Wildcard origins are
rejected.

Source-image data travels from the browser to the configured API URL. Use HTTPS
termination when the network requires transport encryption.

## Configuration behavior

- Non-loopback bind hosts require `COLORCRAFT_ALLOW_LAN_ACCESS=true`.
- Non-loopback CORS origins require `COLORCRAFT_ALLOW_LAN_ACCESS=true`.
- An origin cannot contain credentials, a path other than `/`, a query, or a
  fragment.
- The launcher does not open a browser automatically.
- `VITE_COLORCRAFT_API_URL` must be reachable from the browser.
- Environment variables override `runtime-config.json`.

Static dashboard defaults are in [`app-manifest.json`](../app-manifest.json).
Dashboard consumers must use `/metadata` when they need runtime-resolved URLs.
See [Dashboard manifest](./dashboard-manifest.md).
