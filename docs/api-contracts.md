# ColorCraft API contracts

ColorCraft uses explicit Pydantic response models in the FastAPI service and
matching Zod schemas in the React client. Public JSON fields use camelCase.
Unknown request fields are rejected.

## Canonical color input

Palette analysis and suggestion requests use a strict full-color input:

```json
{
  "hex": "#667eea",
  "rgb": { "r": 102, "g": 126, "b": 234 },
  "hsl": { "h": 229, "s": 75, "l": 66 }
}
```

HEX must contain exactly six hexadecimal digits. RGB channels must be integers
from 0 through 255. HSL values must be integers with hue from 0 through 360 and
saturation and lightness from 0 through 100.

The API derives RGB and HSL from HEX during validation and rejects a request
when the supplied representations contradict one another. It never silently
chooses one representation over another.

## Extracted colors

Extraction returns between one and the requested maximum number of colors.
Each extracted color adds:

- `population`: ratio of the deterministic processing sample assigned to the
  cluster, from 0 through 1
- `pixelCount`: number of sampled processing pixels assigned to the cluster

Colors are sorted by population, largest first. Fully transparent pixels are
ignored. Partially transparent pixels are composited over white before
clustering. Representatives are sampled RGB medoids nearest the LAB cluster
center, rather than converted LAB medians.

Uploads are limited to 10 MB and 40 million decoded pixels. CPU-heavy
clustering runs in a worker thread instead of blocking the async server loop.

## Relationship evidence

Every detected relationship includes `type`, `colorIndexes`,
`expectedAngles`, `measuredAngles`, `deviation`, and `confidence`. Hue
calculations are circular. Colors below 10% saturation and duplicate hues do
not provide geometric evidence.

`relationshipFit`, `relationshipSummary`, and `relationshipFactors` replace
the former bonus-based harmony score. They describe measured geometric fit,
not subjective design quality.

The detector uses these inclusive tolerances:

| Relationship | Expected structure | Tolerance |
| --- | --- | --- |
| Complementary | one 180 degree separation | 12 degrees |
| Analogous | one 30 degree separation | 15 degrees |
| Triadic | three 120 degree circular gaps | 12 degrees per gap |
| Tetradic | four 90 degree circular gaps | 10 degrees per gap |
| Split-complementary | 150, 150, and 60 degree separations | 12 degrees |
| Monochromatic | meaningful hues around one circular mean | 10 degrees |

## Errors

API failures use a stable error envelope:

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

`details` is optional for operational errors. The frontend converts this
envelope into `ColorCraftApiError` and presents a recoverable inline notice.
