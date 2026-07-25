# Dashboard manifest

[`app-manifest.json`](../app-manifest.json) is ColorCraft's static discovery contract. The identical file under `frontend/public` makes it available in the built web application.

The manifest contains schema version 1, a stable `colorcraft` ID, product name and descriptor, version, icon path, default web/API addresses, health and metadata paths, and machine-readable capability slugs.

Static addresses are defaults only. Environment variables can change ports or hosts at launch, so a dashboard should:

1. Discover the application from `app-manifest.json`.
2. Query the manifest's metadata path on the candidate API address.
3. Treat `/metadata` as authoritative for runtime-resolved URLs and
   `networkMode`.
4. Use `/ready` for dependency readiness and `/health` for liveness.

Current capability slugs are:

- `image-color-extraction`
- `palette-editing`
- `harmony-analysis`
- `contrast-review`
- `palette-export`
- `local-palette-library`

The manifest contract and public copy are tested for equality. Runtime tests
verify that metadata respects configuration overrides. The static manifest
does not guess the network exposure mode. Runtime metadata reports `loopback`
or `lan` from the resolved configuration.
