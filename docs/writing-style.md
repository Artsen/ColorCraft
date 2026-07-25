# ColorCraft Technical English

## Purpose

ColorCraft Technical English is the project-specific standard for technical
writing. The standard is informed by principles from ASD-STE100 Simplified
Technical English.

ColorCraft does not claim formal ASD-STE100 compliance. This standard does not
reproduce the ASD-STE100 controlled dictionary.

Use this standard to make instructions clear, consistent, ready for translation,
and safer for AI-assisted maintenance. Current application code, API schemas,
and tests remain the source of truth for behavior.

Product-specific color-science terms are permitted when this document defines
them and writers use them consistently. Do not rewrite exact commands, API
fields, routes, color values, filenames, paths, formulas, schema versions, HTTP
status codes, or code.

## Application levels

### Level 1: Controlled procedural documentation

Apply the strongest rules to:

- `docs/getting-started.md`
- `docs/user-guide.md`
- `docs/troubleshooting.md`
- Installation, startup, upload, palette, Review, Export, and recovery
  procedures

### Level 2: Controlled technical reference

Apply controlled terminology and direct technical prose to:

- `docs/api-contracts.md`
- `docs/architecture.md`
- `docs/color-analysis.md`
- `docs/testing.md`
- `docs/runtime-configuration.md`
- `docs/persistence-and-privacy.md`
- `CONTRIBUTING.md`

Preserve formulas, schemas, identifiers, and necessary technical detail.

### Level 3: Product and brand explanation

Use clear product language in:

- `README.md`
- `docs/brand-system.md`
- Product positioning and design rationale
- Changelog entries and pull request descriptions

Level 3 permits more flexible sentence structure. It does not permit vague,
inflated, or misleading claims.

## Core rules

1. Use one preferred term for one concept.
2. Do not change terminology only to avoid repetition.
3. Use active voice in procedures. Write **Select Review**, not **The Review
   view should be selected**.
4. Start each procedural step with an action.
5. Put one primary action in each numbered step.
6. Put a condition before its action. Write **If the API is not ready, wait for
   the readiness check**.
7. Use short, direct sentences. Review a sentence when it is longer than
   approximately 20 words.
8. Avoid ambiguous pronouns.
9. Identify the actor, such as the user, ColorCraft, the frontend, the API, the
   extraction service, or the browser.
10. Use **must** for a requirement, **should** for a recommendation, **can** for
    capability, and **may** only for permission or possibility.
11. Give a recovery action for each recoverable error.
12. Explain the consequence before a destructive action.
13. Preserve exact technical strings and exact UI labels.
14. Use parallel grammar in lists.
15. Avoid promotional language and generic AI language.
16. Do not present subjective design quality as objective fact.
17. Keep geometric analysis separate from aesthetic judgment.
18. Keep contrast results separate from claims about complete accessibility.
19. Distinguish measured values from recommendations.
20. Label notes, important information, warnings, results, and examples
    consistently.

Use **Warning** only when an action can cause data loss, exposure, or another
material adverse result. Use **Important** for a constraint that can prevent a
procedure from succeeding. Use **Note** for useful additional information.

## Procedure pattern

Use this structure when a task needs more than a short command:

### Purpose

State what the procedure does.

### Before you start

State requirements, limits, permissions, and effects on current work.

### Procedure

Use numbered action steps.

### Result

State the expected observable result.

### Recovery

State what to check when the result does not occur.

Example:

> **Purpose**
>
> Start ColorCraft in one terminal.
>
> **Before you start**
>
> - Install Python 3.11.
> - Install Node.js 20 or newer.
> - Install the backend and frontend dependencies.
>
> **Procedure**
>
> 1. Open a terminal in the repository root.
> 2. Run `.\backend\.venv311\Scripts\python.exe dev.py`.
> 3. Wait for the API readiness check.
> 4. Open `http://127.0.0.1:5174`.
>
> **Result**
>
> The web application opens. The API listens on
> `http://127.0.0.1:4100`.
>
> **Recovery**
>
> If startup reports a port conflict, stop the process that uses the reported
> port or configure a different port.

## Error pattern

Write errors in this order:

1. State the problem.
2. State the cause when the cause is known and useful.
3. State the recovery action.

Examples:

- ColorCraft cannot reach the API. Start the API, and then retry the action.
- ColorCraft cannot copy the export to the clipboard. Select the generated
  preview, and then copy the text manually.
- The source image is larger than the API upload limit. Select an image that is
  10 MB or smaller.

Do not expose stack traces, local absolute paths, environment values, image
contents, clipboard contents, or unrelated palette data in user-facing errors.

## Controlled terminology

| Preferred term | Meaning | Usage constraint |
| --- | --- | --- |
| source image | The image that the user uploads for color extraction. | Do not substitute *input asset*, *source media*, *uploaded visual*, or *incoming image*. |
| palette | The ordered set of colors in the current ColorCraft workspace. | Do not substitute *color set*, *collection*, *theme*, or *scheme*. |
| palette color | One color in the current palette. | Use *color* when the context is unambiguous. |
| extracted color | A palette color returned by color extraction. | Do not use for a manually added or suggested color. |
| suggested color | A color proposed in Suggestions. | Do not call it an extracted color. |
| base color | The palette color selected as the start of a suggestion approach. | Preserve this term in Suggestions procedures. |
| swatch | The visual sample that represents one palette color. | Do not use as a synonym for the color value when the distinction matters. |
| color extraction | The process that derives representative colors from a source image. | Do not substitute *generation*, *scanning*, *image analysis*, or *palette creation*. |
| processing sample | The deterministic pixel sample used by color extraction. | Do not imply that the sample contains every source-image pixel. |
| population | The proportion of the processing sample assigned to a cluster. | Do not describe this value as complete-image population. |
| sampled pixel count | The number of processing-sample pixels assigned to a cluster. | Preserve the API field `pixelCount`. |
| representative color | The sampled RGB medoid nearest a LAB cluster center. | Do not call it an average, converted LAB median, or exact dominant color of the complete source image. |
| harmony relationship | A detected geometric hue relationship. | Do not use *harmony* as an automatic judgment of visual quality. |
| relationship fit | A value from 0 through 100 that summarizes relationship confidence and meaningful-hue coverage. | Never substitute *harmony score*, *palette score*, *quality score*, *beauty score*, or *aesthetic score*. |
| relationship confidence | The confidence value for one detected harmony relationship. | Keep separate from relationship fit. |
| angular deviation | The measured difference between detected and expected hue geometry. | State the unit when it is not already clear. |
| meaningful hue | A hue with enough saturation to provide geometric evidence under the current algorithm. | The current minimum saturation is documented in `color-analysis.md`. |
| contrast ratio | The relative-luminance contrast between two assigned colors. | A ratio is a measurement, not a complete accessibility result. |
| contrast pair | Two colors evaluated together for contrast. | State the roles when the pair is role-based. |
| color role | A semantic interface role assigned to a palette color. | Current labels are Page background, Surface, Primary text, Secondary text, Primary action, Action text, Border, and Focus indicator. |
| role assignment | The association between a palette color and a color role. | Do not use for an unassigned palette color. |
| contrast-role check | A contrast test between two meaningful assigned color roles. | Do not use as an exact synonym for the all-pairs contrast matrix. |
| all-pairs contrast matrix | The advanced matrix that compares every palette color pair. | Keep separate from contrast-role checks. |
| suggestion approach | One method that proposes colors from a base color. | Current API approaches include complementary, triadic, analogous, split-complementary, tetradic, rectangular, monochromatic, double-complementary, and shades and tints. |
| Review | The application view that contains palette analysis. | Preserve capitalization when referring to the UI destination. |
| Overview | The Review tab that summarizes the current analysis. | Preserve capitalization. |
| Harmony | The Review tab that presents detected geometric relationships. | Preserve capitalization. |
| Contrast | The Review tab that presents role assignments and contrast results. | Preserve capitalization. |
| Suggestions | The Review tab that proposes optional colors. | Preserve capitalization. |
| Export | The application view that formats the current palette for external use. | Preserve capitalization. |
| export format | One supported representation of the current palette. | Current labels are CSS custom properties, JSON, Tailwind theme colors, and SVG swatch sheet. |
| exported file | A file that the browser creates from the current palette. | Do not imply that ColorCraft stores the file. |
| copy | Place generated export text on the system clipboard. | Do not use as a synonym for export or download. |
| download | Save generated export data as a local file through the browser. | Do not use as a synonym for copy. |
| current session | The active in-memory application state in the current browser tab. | State separately whether data is saved in IndexedDB. |
| unsaved palette | A current palette that has no saved palette record. | Unsaved changes are session-only. |
| saved palette | A versioned palette record in the browser's IndexedDB database. | Do not imply an account or cloud copy. |
| Palette Library | The Library view that lists saved palettes in the current browser origin. | Use **Library** for the navigation label. |
| local | The application runs on the current computer or configured local network. | Do not use as an automatic synonym for private, secure, offline, anonymous, or persistent. |
| source-image preview | The in-memory browser preview of the current source image. | ColorCraft does not store source-image bytes in the Palette Library. |

## Required domain distinctions

### Palette and color scheme

A palette is the ordered set of current colors. A color scheme can describe a
theoretical arrangement. Do not use both terms only for variation.

### Extraction and analysis

Color extraction derives representative colors from a source image. Analysis
evaluates a palette. A manual palette can be analyzed without extraction.

### Relationship and suggestion

A harmony relationship describes measured palette geometry. A suggestion
proposes an optional palette change. A detected relationship does not instruct
the user to change the palette.

### Relationship fit and contrast

Relationship fit describes hue geometry. Contrast describes relative
luminance. A strong relationship fit does not imply sufficient contrast.
Sufficient contrast does not imply a strong harmony relationship.

### Contrast result and accessibility

Contrast evaluation measures one accessibility requirement. A passing contrast
result does not prove complete WCAG conformance or complete interface
accessibility.

Write **The assigned text and background colors meet WCAG AA contrast**. Do not
write **The palette is accessible** or **The design is WCAG compliant**.

### Extracted population and complete-image population

Population and `pixelCount` describe the deterministic processing sample after
resize and transparency handling. These values do not count every decoded
source-image pixel.

### Export and persistence

Export creates text or a file outside ColorCraft. Export does not create or
update a saved palette record. **Save palette** and **Save changes** write the
current palette to IndexedDB.

### Copy and download

Copy sends generated text to the clipboard. Download creates a file through the
browser.

### Reset and delete

**New palette** clears current session work after any required confirmation.
**Delete palette** removes a saved palette record from IndexedDB. Do not call
session reset deletion.

## Maintenance

Add a terminology entry when a stable product concept has no preferred term.
Verify new entries against application code, API contracts, and tests. Update
the canonical document instead of copying large explanations into the README.
