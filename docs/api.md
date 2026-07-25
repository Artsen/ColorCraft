# API

The default base URL is `http://127.0.0.1:4100`. Interactive OpenAPI documentation is available at `/docs`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Service identity |
| `GET` | `/health` | Liveness |
| `GET` | `/ready` | Readiness and capability slugs |
| `GET` | `/metadata` | Runtime-resolved dashboard metadata |
| `POST` | `/api/extract-colors?n_colors=5` | Multipart image extraction |
| `POST` | `/api/analyze-colors` | Analyze 2–10 normalized colors |
| `POST` | `/api/suggest-colors` | Suggest colors for 1–10 normalized colors |
| `POST` | `/api/full-analysis?n_colors=5` | Extract and analyze in one request |

Analysis and suggestion requests wrap colors in an object:

```json
{
  "colors": [
    {
      "hex": "#6A5BCF",
      "rgb": { "r": 106, "g": 91, "b": 207 },
      "hsl": { "h": 248, "s": 53, "l": 58 }
    },
    {
      "hex": "#F5F0E8",
      "rgb": { "r": 245, "g": 240, "b": 232 },
      "hsl": { "h": 37, "s": 39, "l": 94 }
    }
  ]
}
```

Passing a bare array produces `422 validation_error`. Error responses are stable envelopes:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed.",
    "details": []
  }
}
```

Extraction accepts JPEG, PNG, and WebP files up to 10 MB, limits decoded dimensions, and ignores fully transparent pixels. `n_colors` must be 3–10. Expected client errors use 413, 415, or 422 rather than an unstructured server exception.

`/metadata` reports the resolved web, API, health, readiness, icon, version, and capabilities. `/ready` returns `503` with `not_ready` until application startup completes. See [Dashboard manifest](./dashboard-manifest.md).
