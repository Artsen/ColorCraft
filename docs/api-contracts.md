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
