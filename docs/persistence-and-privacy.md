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
schema-version-1 record contains:

- Record ID and palette name
- Created and updated timestamps
- Manual or image source type
- Optional source filename
- 1–10 normalized palette colors
- Optional population and `pixelCount`
- Color-role assignments

The frontend validates each record with Zod. It can migrate an unversioned or
version-0 record to the current shape. The next save writes schema version 1.
The frontend ignores malformed records and unknown future schema versions.

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
