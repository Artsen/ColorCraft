# Persistence and privacy

## Storage model

ColorCraft is local-first and does not use accounts, cloud synchronization, or
a server-side palette database.

The frontend uses:

- IndexedDB for saved palette records
- LocalStorage for the theme preference
- Browser memory for source-image previews, analysis, suggestions, and unsaved
  changes

## Saved palette records

The `colorcraft` IndexedDB database contains the `palettes` object store. A
schema-version-3 record contains:

- Record ID and palette name
- Created and updated timestamps
- Manual or image source type
- Optional source filename
- 1–10 ordered normalized palette colors with stable internal IDs and optional names
- Optional population and `pixelCount`
- Color-role assignments that reference stable internal color IDs

The frontend validates each record with Zod. It can migrate a schema-version-2,
schema-version-1, version-0, or unversioned record to the current shape.
Legacy colors receive deterministic IDs, so repeatedly opening a migrated
record does not create a false modified state. Listing the Library does not
rewrite records. Version-2 and older HEX roles map to the first matching color
in palette order; missing matches are discarded. The next save writes schema
version 3.
The frontend ignores malformed records and unknown future schema versions.

Portable ColorCraft JSON is not an IndexedDB record. Portable schema version 3
uses `format: "colorcraft-palette"` and deterministic document-local keys while
excluding internal IDs. Import supports portable versions 1, 2, and 3, reads at
most 1 MB, validates the complete file locally, and does not send its contents
to the API. An imported palette remains session-only until the user selects
**Save palette**.

## Source images

The browser creates a session-only source-image preview. It sends the source
image to the configured API for extraction.

The API reads the image for the request. It does not write the image to disk or
a database. A saved palette can contain the source filename and extracted color
metadata. It does not contain the source-image bytes.

## Retention and deletion

A saved palette remains until the user selects **Delete palette** or clears site
data for the ColorCraft origin. Deletion cannot be undone.

Browser profiles and origins have separate IndexedDB databases. Changing the
web host or port can show a different, empty Palette Library.

Removing the repository does not necessarily remove browser storage. Use the
browser's site-data controls to remove all saved palettes and the theme
preference.

## Privacy and network boundary

The default services bind to loopback addresses. The default configuration
keeps browser-to-API traffic on the current computer.

`COLORCRAFT_ALLOW_LAN_ACCESS=true` permits a larger network boundary. On a LAN,
source-image data traverses the configured network path. ColorCraft does not
provide authentication or transport encryption. Do not expose it directly to
an untrusted network.

Runtime metadata reports `networkMode: "loopback"` when every resolved host and
browser origin is loopback. It reports `networkMode: "lan"` when any resolved
host or origin is non-loopback. The shell presents these values as **Loopback
only** and **LAN enabled**.

Local does not automatically mean private, secure, offline, anonymous, or
persistent.
