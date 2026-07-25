# Color analysis

## Scope

This document describes the current extraction, relationship, fit, and contrast
calculations. It does not define aesthetic quality.

## Source-image validation

The API accepts:

- `image/jpeg`
- `image/png`
- `image/webp`

The API reads at most 10 MB plus one byte. It returns HTTP 413 when the upload is
larger than 10 MB. The decoded image can contain at most 40,000,000 pixels.

The extraction endpoint accepts `n_colors` from 3 through 10. The extraction
function can return fewer colors when the processing sample contains fewer
unique colors.

## Resize and transparency

Before clustering, the extraction service:

1. Loads the decoded source image.
2. Resizes the image when either dimension is larger than 400 pixels.
3. Preserves aspect ratio and uses Pillow LANCZOS resampling.
4. Removes pixels with alpha 0.
5. Composites partial-alpha RGB values over white.
6. Rounds the composited channel values to integers from 0 through 255.

A source image with no visible pixels returns `no_visible_pixels`.

The browser source-image picker uses a separate canvas preview with a maximum
dimension of 1600 pixels. That preview is not the backend processing sample.

## Deterministic processing sample

If the resized image contains 10,000 visible pixels or fewer, all visible
pixels form the processing sample. Otherwise, NumPy selects 10,000 pixels
without replacement with random seed 42.

Population and `pixelCount` describe this processing sample. They do not
describe every decoded pixel in the source image.

## LAB clustering and representative colors

The extraction service converts the processing-sample RGB pixels to CIE LAB
with a D65 reference white. It performs scikit-learn KMeans clustering with:

- `random_state=42`
- `n_init=10`
- `max_iter=300`

The effective cluster count is the minimum of:

- The requested color count
- The number of unique pixels in the processing sample
- The number of pixels in the processing sample

For each cluster, the extraction service selects the sampled RGB pixel with the
smallest squared LAB distance to the cluster center. This sampled RGB medoid is
the representative color. The service does not convert a LAB median or cluster
center back to RGB.

`population` is the cluster's sampled pixel count divided by the processing
sample size. `pixelCount` is the cluster's sampled pixel count. Results are
sorted by descending `pixelCount`, then by HEX value for a deterministic tie.

## Meaningful hue evidence

Relationship detection uses circular hue calculations. A palette color provides
meaningful hue evidence when HSL saturation is at least 10%.

The detector treats hue values less than 1 degree apart as duplicate hue
evidence. Repeated hues cannot create additional relationships.

## Relationship tolerances

All limits are inclusive.

| Harmony relationship | Expected geometry | Maximum angular deviation |
| --- | --- | --- |
| Complementary | One 180 degree separation | 12 degrees |
| Analogous | One 30 degree separation | 15 degrees |
| Triadic | Three 120 degree circular gaps | 12 degrees per gap |
| Tetradic | Four 90 degree circular gaps | 10 degrees per gap |
| Split-complementary | 150, 150, and 60 degree separations | 12 degrees |
| Monochromatic | Hues around one circular mean | 10 degrees |

Monochromatic detection also requires variation. It rejects a group when both
the saturation range and lightness range are 10 percentage points or less.

## Relationship confidence

For one detected relationship:

```text
confidence = max(0, 1 - deviation / (tolerance × 1.5))
```

The API rounds relationship confidence to three decimal places.

## Relationship fit

ColorCraft selects the relationship with the highest confidence for each
detected relationship type. It then calculates:

```text
relationship fit =
  round(70 × mean best confidence + 30 × meaningful-hue coverage)
```

Meaningful-hue coverage is the number of meaningful hues involved in any
detected relationship divided by the total meaningful-hue count, with a maximum
of 1.

The summary labels are:

- 75–100: `Strong geometric relationship`
- 45–74: `Moderate geometric relationship`
- 0–44: `Limited geometric relationship`
- No detected relationship: `No strong geometric relationship detected`

Relationship fit is not a harmony score, beauty score, palette-quality score,
accessibility score, or design recommendation.

## Other palette measurements

- Hue diversity is circular standard deviation in degrees, capped at 180.
- Average saturation is the arithmetic mean of HSL saturation.
- Lightness range is the maximum HSL lightness minus the minimum.
- Temperature evidence assigns every meaningful hue to one category:
  - Warm: 300 through 360 degrees and 0 through 60 degrees
  - Transitional: greater than 60 and less than 120 degrees
  - Cool: 120 through less than 300 degrees
- A hue at 300 degrees is warm so that the categories do not overlap.
- Low-saturation colors are excluded from temperature evidence.
- `warmRatio`, `transitionalRatio`, and `coolRatio` use all categorized
  meaningful hues as the denominator.
- A category is dominant when its ratio is greater than 70%. The result is
  `mixed` when no category exceeds 70% and `neutral` when no meaningful hue
  evidence exists.

## Contrast calculation

ColorCraft converts each sRGB channel to a linear value with the 0.04045
breakpoint. Relative luminance is:

```text
L = 0.2126R + 0.7152G + 0.0722B
```

Contrast ratio is:

```text
(lighter luminance + 0.05) / (darker luminance + 0.05)
```

The API all-pairs result reports text thresholds:

| Result | Minimum ratio |
| --- | ---: |
| WCAG AA normal text | 4.5:1 |
| WCAG AA large text | 3:1 |
| WCAG AAA normal text | 7:1 |
| WCAG AAA large text | 4.5:1 |

The API evaluates every palette color pair as text-contrast exploration data.
Review applies the ratio to typed role checks:

- Text checks show the AA and AAA normal-text and large-text thresholds.
- Non-text component checks use a 3:1 threshold and do not show text badges.
- Focus-indicator color checks use a 3:1 threshold for each evaluated adjacent
  color pair.

A non-text result evaluates color contrast only. It does not evaluate component
size, shape, state, or other accessibility requirements. A focus-indicator
result does not evaluate size, area, thickness, visibility, or the
focused-versus-unfocused appearance.

A passing ratio applies only to the evaluated contrast pair and text category.
It does not prove complete interface accessibility or WCAG conformance.

## Suggestions

Suggestions are optional geometric transformations from a selected base color.
Descriptions lead with hue, saturation, or lightness changes. `useCases` and
`commonAssociations` contain conventional guidance, not measured suitability.
A suggestion does not confirm that a detected relationship exists in the
current palette. The frontend invalidates suggestions when any palette color
changes.

## Export accuracy and escaping

JSON export uses `schemaVersion: 1`. JSON includes ordered colors, normalized
color values, optional population, color-role metadata, and role assignments.

CSS and Tailwind output sanitize palette names used in comments. SVG output
escapes XML-sensitive characters. Each SVG swatch compares measured contrast
against black and white and uses the label color with the higher ratio. Export
generation does not alter the palette and does not save it to IndexedDB.

## Interpretation limits

- A representative color comes from the processing sample, not every decoded
  source-image pixel.
- A harmony relationship describes geometry, not aesthetic quality.
- Relationship confidence applies to one relationship.
- Relationship fit summarizes detected geometry and coverage.
- Contrast is independent of hue geometry.
- Contrast evaluation covers one accessibility requirement.
- Suggestions are recommendations, not measurements.
- Temperature categories describe hue intervals, not aesthetic balance.
