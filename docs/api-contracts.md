# ColorCraft API contracts

## Contract boundary

FastAPI Pydantic models define the service contracts. Matching frontend Zod
schemas validate API responses. Public JSON fields use camelCase. Unknown
request fields are rejected.

### Portable palette boundary

ColorCraft JSON import and export are browser-side portable-format contracts,
not backend API endpoints. Portable schema version 3 uses
`format: "colorcraft-palette"`, supports optional Unicode color names and exact
order, assigns deterministic document-local keys, and excludes internal
workspace IDs. Role assignments reference the portable keys. The importer also
accepts portable schema versions 1 and 2 and maps their HEX roles to the first
matching color. Backend endpoint request and response schemas are unchanged;
analysis and suggestion requests still contain only HEX, RGB, and HSL, never
IDs, names, portable keys, or roles.

The default base URL is `http://127.0.0.1:4100`. FastAPI provides interactive
OpenAPI documentation at `/docs` and the OpenAPI document at `/openapi.json`.

## Routes

| Method | Route | Request | Success response |
| --- | --- | --- | --- |
| `GET` | `/` | None | Service identity |
| `GET` | `/health` | None | Service liveness |
| `GET` | `/ready` | None | Readiness and capabilities |
| `GET` | `/metadata` | None | Runtime-resolved application metadata |
| `POST` | `/api/extract-colors?n_colors=5` | Multipart `file` | Extracted colors |
| `POST` | `/api/analyze-colors` | JSON palette | Relationship and all-pairs contrast analysis |
| `POST` | `/api/suggest-colors` | JSON palette | Suggestion approaches for each base color |
| `POST` | `/api/full-analysis?n_colors=5` | Multipart `file` | Extracted colors and analysis |

`n_colors` must be an integer from 3 through 10.

## Canonical color input

Analysis accepts 2–10 colors. Suggestions accept 1–10 colors.

```json
{
  "colors": [
    {
      "hex": "#667eea",
      "rgb": { "r": 102, "g": 126, "b": 234 },
      "hsl": { "h": 229, "s": 75, "l": 66 }
    },
    {
      "hex": "#f5f0e8",
      "rgb": { "r": 245, "g": 240, "b": 232 },
      "hsl": { "h": 37, "s": 39, "l": 94 }
    }
  ]
}
```

HEX must contain exactly six hexadecimal digits. RGB channels must be integers
from 0 through 255. HSL values must be integers. Hue must be from 0 through 360.
Saturation and lightness must be from 0 through 100.

The API derives RGB and HSL from HEX during validation. It rejects contradictory
representations. Hue 0 and hue 360 are equivalent when the other HSL values
match.

Do not send a bare color array. Send `{ "colors": [...] }`.

## Extracted color

Each extracted color contains:

```json
{
  "hex": "#667eea",
  "rgb": { "r": 102, "g": 126, "b": 234 },
  "hsl": { "h": 229, "s": 75, "l": 66 },
  "population": 0.425,
  "pixelCount": 4250
}
```

`population` and `pixelCount` describe the deterministic processing sample.
Extraction can return fewer colors than requested. See
[Color analysis](./color-analysis.md).

## Relationship evidence

Each detected relationship contains:

- `type`
- `colorIndexes`
- `expectedAngles`
- `measuredAngles`
- `deviation`
- `confidence`

`colorTheory` also contains:

- `harmonies`
- `temperatureBalance`
- `relationshipFit`
- `relationshipSummary`
- `relationshipFactors`
- `tags`
- `metrics`

Relationship fit describes measured geometry. It does not describe aesthetic
quality.

`temperatureBalance` contains:

- `balance`: `warm`, `transitional`, `cool`, `mixed`, or `neutral`
- `warmCount`, `transitionalCount`, and `coolCount`
- `warmRatio`, `transitionalRatio`, and `coolRatio`

The ratios use the total categorized meaningful-hue count. A category is
dominant only when its ratio is greater than 0.70.

## Contrast analysis

`accessibility` contains:

- `pairs`
- `issues`
- `summary`

Each pair contains `color1`, `color2`, `ratio`, `aaNormal`, `aaLarge`,
`aaaNormal`, and `aaaLarge`. These fields report contrast thresholds for the
pair. They do not prove complete accessibility or WCAG conformance.

`ratio` preserves the calculated floating-point precision. Threshold booleans
use that value. API consumers must not infer pass or fail from a value rounded
for display.

## Suggestion response

Each item in `suggestions` contains:

- `baseColor`
- `harmonies`

Each harmony item contains `type`, `angle`, `description`, `useCases`,
`commonAssociations`, `examples`, and `suggestions`. Each suggested color
contains `name`, `description`, HEX, RGB, and HSL values.

A suggested-color `description` compares the canonical base HSL with the final
canonical HSL returned in the same object. Saturation and lightness differences
are percentage-point differences. The description does not report an
unbounded intermediate adjustment.

`commonAssociations` is conventional guidance. It is not a measured result.
This field replaces the removed `mood` field and is a breaking response-contract
change.

## Metadata and readiness

`GET /metadata` returns schema version 1 with:

- `id`
- `name`
- `descriptor`
- `version`
- `icon`
- `webUrl`
- `apiUrl`
- `healthUrl`
- `readinessUrl`
- `networkMode`: `loopback` or `lan`
- `capabilities`

`networkMode` comes from resolved hosts and browser-visible origins. It does
not come only from the LAN opt-in environment variable.

`GET /ready` returns HTTP 200 with `status: "ready"` after startup. Before
startup completes, it can return HTTP 503 with `status: "not_ready"`.

## Errors

Errors use one envelope:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed.",
    "details": [
      {
        "location": ["body", "colors", 0, "hex"],
        "message": "String should match pattern",
        "type": "string_pattern_mismatch"
      }
    ]
  }
}
```

`details` can be absent or null for operational errors.

Expected extraction errors include:

| HTTP status | Code | Recovery |
| ---: | --- | --- |
| 413 | `upload_too_large` | Select a source image that is 10 MB or smaller. |
| 413 | `image_dimensions_too_large` | Reduce the decoded image dimensions below 40 million pixels. |
| 415 | `invalid_file_type` | Select a JPG, PNG, or WebP source image. |
| 422 | `image_decode_error` | Select a valid, decodable source image. |
| 422 | `no_visible_pixels` | Select an image that contains visible pixels. |
| 422 | `validation_error` | Correct the fields listed in `details`. |

The frontend converts the envelope to `ColorCraftApiError` and displays a
recoverable inline notice.
