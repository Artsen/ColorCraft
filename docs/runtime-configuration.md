# Runtime configuration

ColorCraft defaults to loopback-only services:

| Variable | Default | Purpose |
| --- | --- | --- |
| `COLORCRAFT_WEB_HOST` | `127.0.0.1` | Vite bind host |
| `COLORCRAFT_WEB_PORT` | `5174` | Web port |
| `COLORCRAFT_API_HOST` | `127.0.0.1` | FastAPI bind host |
| `COLORCRAFT_API_PORT` | `4100` | API port |
| `COLORCRAFT_READINESS_TIMEOUT_SECONDS` | `30` | Launcher startup deadline |
| `COLORCRAFT_ALLOWED_ORIGINS` | resolved web origin | Comma-separated exact CORS origins |
| `VITE_API_URL` | resolved API origin | Browser-visible API base URL |
| `COLORCRAFT_ALLOW_LAN_ACCESS` | `false` | Required opt-in for non-loopback hosts/origins |
| `COLORCRAFT_NO_BROWSER` | `false` | Prevent automatic browser launch |

Example PowerShell override:

```powershell
$env:COLORCRAFT_WEB_PORT = "5184"
$env:COLORCRAFT_API_PORT = "4110"
$env:COLORCRAFT_NO_BROWSER = "true"
.\backend\.venv311\Scripts\python.exe dev.py
```

Ports must be valid and distinct. The launcher checks availability before starting either child process and reports a focused error if a port is occupied. Wildcard CORS origins are rejected.

LAN binding expands the trust boundary. Set `COLORCRAFT_ALLOW_LAN_ACCESS=true`, configure explicit hosts and origins, and use a firewall appropriate to the network. Uploaded images traverse the configured network path to the API.

Static dashboard defaults stay in [`app-manifest.json`](../app-manifest.json). Consumers that need overrides must read `/metadata`; see [Dashboard manifest](./dashboard-manifest.md).
