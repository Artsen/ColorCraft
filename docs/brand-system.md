# ColorCraft brand system

## Product position

ColorCraft is the color-analysis member of the same product family as Web Video
Optimizer. The family resemblance comes from structure: precise slate surfaces,
compact information density, restrained radii, semantic controls, and a narrow
iris-to-ember accent. ColorCraft remains its own product. It does not reuse the
Web Video Optimizer monogram, video metaphors, or video-specific navigation.

The product uses the family application-shell grammar for four real workflow
destinations: Create, Review, Export, and Library. Library and recent-palette
surfaces represent browser-local IndexedDB records. ColorCraft remains a focused
local utility rather than a dashboard and does not imply accounts or cloud sync.

## Voice

- Direct and technical without sounding clinical.
- Explain what a measurement means; do not overstate subjective design quality.
- Prefer concrete verbs such as extract, inspect, compare, and add.
- Avoid generic AI language and inflated claims.
- Keep helper text short and place detail beside the result it qualifies.

## Mark

The provisional ColorCraft mark is an original double-C aperture:

- Two controlled arcs describe selection and refinement.
- The open ember aperture represents a sampled point entering a palette.
- The geometry is deliberately distinct from the Web Video Optimizer monogram.
- Use `AppMark` for interface placement. Keep the mark beside the ColorCraft
  wordmark in primary product headers.
- Use the small size at 32px and the default size at 48px. Do not add gradients,
  glows, rotation, or decorative animation.
- On branded or unknown surfaces, use the automatic token-driven treatment.
  Explicit light and dark variants exist only for known contrasting surfaces.

## Color roles

Tokens live in `frontend/src/styles/tokens.css`. Components consume semantic
roles rather than literal palette values.

- App and workspace backgrounds establish depth.
- Surface, recessed, elevated, hover, and selected roles describe hierarchy.
- Primary iris identifies the main action, focus, and current selection.
- Ember is a sparing family accent, not a competing call-to-action color.
- Success, information, warning, and danger are reserved for status meaning.
- Text and border roles carry the hierarchy in both light and dark themes.
- Color samples, wheel segments, and contrast pairs are user content and may use
  literal colors; surrounding interface chrome must use tokens.

## Typography

Use the system UI stack for speed and platform familiarity. Headings are compact
and moderately weighted. Labels and metadata use the provided typography tokens.
Hex values and other color codes use the monospace token. Do not use oversized
marketing typography inside the workspace.

## Spacing, radii, and elevation

The base spacing unit is 4px. Prefer the named `--space-*` scale. Controls use an
8px radius, cards 10px, dialogs 12px, and large media or empty states 14px.
Elevation communicates real layering only: normal panels use the subtle shadow,
menus use elevated shadow, and modal dialogs use dialog shadow.

## Interaction

- Primary buttons are reserved for the next task-defining action.
- Secondary buttons perform adjacent actions; quiet buttons reduce emphasis.
- Destructive actions use the danger role and require a clear accessible name.
- Every icon-only control must use `IconButton` or provide an equivalent
  accessible name and visible tooltip.
- Use Lucide icons at a consistent optical size. Do not hand-draw one-off SVG
  interface icons.
- Selected states use explicit ARIA state plus semantic visual treatment.
- Keyboard focus must remain visible. Disabled controls must not rely on opacity
  alone.

## Application shell

- Desktop uses a compact 256px sidebar with product identity, New palette,
  workflow navigation, and theme selection.
- Workspace headers describe the current palette source and always state that
  work is local only.
- Create is always available. Review and Export reflect real palette
  prerequisites and explain disabled states.
- At 1024px and below, the sidebar becomes a mobile top bar and bottom
  navigation without changing the information architecture.
- Navigation is URL-backed so browser history restores the current workflow
  stage. Palette data itself remains session-only.
- Do not add Library or Recent Palettes until saved-palette persistence exists.

## Themes and accessibility

Dark, light, and system preferences are first-class. The no-flash bootstrap in
`index.html` resolves the stored preference before application CSS loads.
`ThemeControl` persists the choice and follows system changes while system mode
is selected.

All motion uses semantic duration tokens and is disabled under
`prefers-reduced-motion: reduce`. Forced-colors rules preserve native text,
selection, borders, and focus. New components must be checked in dark, light,
narrow, reduced-motion, and forced-colors contexts.

## CSS architecture

Styles load in this order:

1. `tokens.css` — theme values and semantic roles
2. `reset.css` — normalization
3. `foundations.css` — document typography and focus
4. `layout.css` — workspace composition
5. `components.css` — reusable controls and patterns
6. `features.css` — ColorCraft-specific palette, wheel, and picker styles
7. `responsive.css` — responsive adaptations

Keep product-specific rules in `features.css`. Promote a pattern to
`components.css` only after it has a stable reusable API. Tailwind remains
available for limited structural utilities during migration, but it is not the
source of brand color, type, motion, radius, or elevation decisions.
