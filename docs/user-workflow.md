# User workflow

## Create and refine

Choose **Upload image** for PNG, JPEG, or WebP files up to 10 MB, or choose **Start manually**. Extraction returns 3–10 representative colors. Select a palette row, type a six-digit HEX value, use the native picker, duplicate a color, or remove it.

Uploaded image previews exist only for the active page session. Saving an image-derived palette records its filename, colors, population data, and pixel counts—not the image bytes.

## Save states

- **Unsaved**: the open palette has no IndexedDB record. **Save palette** creates one.
- **Saved**: the current palette matches its record. The save action is disabled.
- **Modified**: colors, roles, name, or source metadata differ. **Save changes** updates the same record.

ColorCraft confirms before opening another record or starting over when doing so would discard meaningful unsaved or modified work.

## Review

Choose **Analyze palette** to enter Review:

- **Overview** summarizes temperature, saturation, lightness, geometric relationships, and next actions.
- **Harmony** explains detected relationships on the color wheel.
- **Contrast** assigns semantic interface roles and reports WCAG ratios.
- **Suggestions** proposes complementary, triadic, analogous, split-complementary, tetradic, monochromatic, or accessibility-oriented colors.

Relationship fit measures geometric hue structure; it is not a judgment of aesthetic quality.

## Export

Export the current palette as CSS custom properties, JSON, Tailwind configuration, or design tokens. Copy uses the Clipboard API; download creates a local file. Export does not upload the palette.

## Library

The Library lists browser-local records most recently updated first. Search by palette name or source filename. Open, inline rename, duplicate, or delete a record. Deletion always asks for confirmation; deleting the active record returns to the empty Library state and disables Review and Export until another palette opens.

The sidebar shows recent palettes only when records exist. Clearing browser site data permanently removes the Library.
