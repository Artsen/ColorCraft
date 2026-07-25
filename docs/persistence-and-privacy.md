# Persistence and privacy

ColorCraft is local-first, not account-backed. There is no synchronization service or server-side palette database.

## What is stored

The `colorcraft` IndexedDB database contains `palettes` records with:

- schema version, ID, name, and created/updated timestamps
- manual or image source type and an optional source filename
- 1–10 normalized colors with optional population and pixel-count metadata
- semantic contrast-role assignments

Schema version 1 is validated with Zod whenever records are read. Legacy records with no version or version 0 are migrated in memory and become version 1 when next saved. Corrupt records and unknown future versions are skipped so one bad record cannot prevent the Library from opening.

LocalStorage contains only the theme preference. Uploaded image bytes, object URLs, analysis responses, and suggestions are not written to LocalStorage or IndexedDB.

## Image processing

An uploaded file is previewed in browser memory and sent to the configured FastAPI service. The service reads it for that request and does not write it to disk or a database. If LAN access is enabled, image traffic crosses that network path; use a trusted network or HTTPS termination.

## Retention and deletion

Palette records remain until the user deletes them or clears site data for the ColorCraft origin. Library deletion is confirmed and cannot be undone. Different browser profiles, origins, and port combinations have separate browser storage.

To remove all ColorCraft browser data, use the browser's site-data controls for the web origin. Uninstalling the repository does not necessarily clear browser data.

## Security posture

Defaults bind both services to loopback. Non-loopback hosts and CORS origins require explicit `COLORCRAFT_ALLOW_LAN_ACCESS=true`; wildcard CORS is rejected. ColorCraft does not provide authentication, so do not expose it directly to an untrusted network.
