# User guide

## Create a palette from a source image

### Before you start

- Select a JPG, PNG, or WebP source image.
- Use a file that is 10 MB or smaller.
- Use an image with no more than 40 million decoded pixels.
- Saving the palette does not save the source-image bytes.

### Procedure

1. Select **Create**.
2. Drop a source image in the drop zone, or select **Choose image**.
3. Wait for the initial color extraction.
4. To change the palette size, set **Requested colors** from 3 through 10, and
   then select **Re-extract**.
5. Edit the returned palette colors as required.

### Result

ColorCraft shows the source-image preview and the extracted colors. ColorCraft
can return fewer colors than requested when the processing sample contains
fewer distinct colors.

### Recovery

If the API rejects the upload, read the inline error. Select a supported image
that is within the byte and decoded-pixel limits.

## Create a palette manually

1. Select **Create**.
2. Select **Start manually**.
3. Enter a six-digit HEX value for each palette color.
4. Select **Add color** to add a palette color.

The palette can contain at most 10 colors.

## Import a ColorCraft JSON palette

1. In empty Create, or from the active Create header, select **Import ColorCraft JSON**.
2. Choose a ColorCraft JSON file that is 1 MB or smaller.
3. If the current palette has unsaved or modified work, confirm whether to
   discard it.

Import runs entirely in the browser. ColorCraft accepts portable schema
versions 1, 2, and 3, validates the whole file before changing the workspace,
and never imports arbitrary JSON. The imported palette retains its name, color
order, optional color names, extraction metadata when present, and valid role
assignments. It has no source image and remains **Unsaved** until you select
**Save palette**.

## Edit a palette color

Use one of these controls:

- Enter a six-digit HEX value.
- Select **Open native color picker for color _n_**.
- Select **Duplicate color**.
- Select **Remove color**.
- For an active source image, select **Pick color _n_ from image**.

Enter an optional name in **Name for color N**. A name can contain at most 80
trimmed characters. Blur the field or press Enter to save it. Press Escape to
restore the previous name. Empty input clears the name.

Open the color actions menu and select **Move up** or **Move down** to reorder a
color. The first and last unavailable directions are disabled. Reordering
preserves the logical color, its name, and extraction metadata, and invalidates
the current analysis.

## Sample a color from the source image

1. Select a palette color.
2. Select **Pick from image** or **Pick color _n_ from image**.
3. Point, touch, or click the source image.
4. Select **Use selected color**.

ColorCraft samples a canvas preview with a maximum dimension of 1600 pixels.
The sampled preview is separate from the backend processing sample.

## Save the palette

- **Unsaved** means that the current palette has no saved record.
- **Saved** means that the current palette matches its IndexedDB record.
- **Modified** means that the current palette differs from its saved record.

Select **Save palette** to create a record. Select **Save changes** to update the
active record. Saved palettes remain in the current browser profile and origin.
They do not synchronize to an account or cloud service.

## Use the Palette Library

Select **Library** to list saved palettes. The Library sorts records by the most
recent update.

You can:

- Search saved palettes by name.
- Open a saved palette.
- Rename a saved palette.
- Duplicate a saved palette.
- Delete a saved palette.

**Warning:** **Delete palette** removes the record from IndexedDB. The action
cannot be undone.

## Analyze a palette

1. Create or open a palette with at least two valid colors.
2. Select **Analyze palette**.
3. Select **Review**.

ColorCraft invalidates the current analysis when a palette color changes.
Select **Refresh analysis** before you use a stale result.

### Overview

**Overview** shows hue positions, detected connections, population-based
dominant color information, temperature, saturation, lightness, relationship
fit, and a next action.

Temperature shows warm, transitional, and cool percentages. **Warm dominant**,
**Transitional dominant**, and **Cool dominant** require more than 70% evidence
in the named category. **Mixed temperature** means that no category exceeds
70%. Neutral colors do not contribute temperature evidence.

### Harmony

**Harmony** lists detected harmony relationships in descending relationship
confidence. Open **Advanced technical details** to inspect expected angles,
measured angles, angular deviation, and raw confidence.

Relationship fit and relationship confidence describe geometric evidence. They
do not measure aesthetic quality.

### Contrast

1. Select **Contrast**.
2. Assign palette colors to the available color roles.
3. Review each available contrast-role check.
4. Open **Advanced: all-pairs text contrast matrix** only when you need
   exploratory text-threshold comparisons.

The current color-role labels are:

- **Page background**
- **Surface**
- **Primary text**
- **Secondary text**
- **Primary action**
- **Action text**
- **Border**
- **Focus indicator**

Roles are bound to the selected palette color, not its HEX value. Renaming,
reordering, or editing that color preserves the assignment. Duplicate HEX
colors remain separate choices. Removing a color clears only roles assigned to
that color.

Text checks show AA and AAA text thresholds. **Border against surface** is a
non-text component check with a 3:1 threshold. Focus-indicator checks use 3:1
for the selected adjacent-color pair.

A non-text result evaluates color contrast only. A focus-indicator result does
not evaluate size, area, thickness, visibility, or focused-versus-unfocused
appearance. A passing contrast-role check does not prove that a complete
interface is accessible or conforms to WCAG.

ColorCraft evaluates contrast with the full calculated ratio. Most ratios show
two decimal places. A failing value near a threshold shows four decimal places
when ordinary rounding would make it appear equal to the threshold.

### Suggestions

1. Select **Suggestions**.
2. Select a base color.
3. Select **Generate suggestions**.
4. Review the suggested colors.
5. Select **Add** for an optional color.

Select **Explore all relationships** for the complete set of suggestion
approaches. **Common associations** and **Common applications** are conventional
guidance. They are not measured suitability. ColorCraft discards suggestion
results when a palette color changes.

Each suggested-color description refers to the final returned color after
range limits and RGB canonicalization. Saturation and lightness changes are
stated in percentage points.

## Export a palette

1. Select **Export**.
2. Enter a **Palette name**.
3. Select an export format:
   - **CSS custom properties**
   - **JSON**
   - **Tailwind theme colors**
   - **SVG swatch sheet**

Named colors produce safe ASCII keys in CSS and Tailwind output and visible
labels in SVG. Unnamed colors keep the `palette-1`, `palette-2` numeric pattern.
ColorCraft JSON schema version 3 preserves Unicode names, exact order,
extraction metadata, and unambiguous role ownership. Each color receives a
document-local key such as `color-1`; the file does not contain internal
workspace IDs.
4. Select **Copy** or **Download**.

**Copy** places the generated text on the clipboard. **Download** creates an
exported file through the browser. Export does not create or update a saved
palette record.

CSS output adds assigned `--role-*` aliases that reference base `--color-*`
tokens. Tailwind output adds assigned `role-*` keys, and SVG rows identify their
assigned roles. Imported version-1 and version-2 files still use HEX role
references. When duplicate HEX values make those older files ambiguous,
ColorCraft maps the role to the first matching color in palette order.

For SVG output, ColorCraft measures each swatch against black and white. It uses
the text color with the higher contrast ratio.

If clipboard permission is denied, select **Select preview**, and then copy the
selected text manually. If download creation fails, copy the preview instead.

## Understand session and history behavior

The current source-image preview, analysis, suggestions, and unsaved changes
remain in memory for the current session. Saved palette records remain in
IndexedDB until the user deletes them or clears site data.

The URL stores the active application view and Review tab. Browser Back and
Forward can restore that navigation state. The URL does not contain palette
data and cannot restore lost in-memory work after a new session.
