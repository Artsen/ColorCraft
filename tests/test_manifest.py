from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def test_dashboard_manifest_schema_and_published_copy():
    manifest = json.loads((ROOT / "app-manifest.json").read_text(encoding="utf-8"))
    published = json.loads(
        (ROOT / "frontend" / "public" / "app-manifest.json").read_text(encoding="utf-8")
    )
    assert manifest == published
    assert manifest["schemaVersion"] == 1
    assert manifest["id"] == "colorcraft"
    assert manifest["defaults"] == {
        "webAddress": "http://127.0.0.1:5174",
        "apiAddress": "http://127.0.0.1:4100",
    }
    assert manifest["endpoints"] == {
        "metadata": "/metadata",
        "health": "/health",
        "readiness": "/ready",
    }
    assert "local-palette-library" in manifest["capabilities"]
