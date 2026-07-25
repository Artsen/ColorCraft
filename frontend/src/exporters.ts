import type { PaletteColor } from './workspace'
import { paletteRoles, roleLabels, type RoleAssignments } from './contrast'

export type ExportFormat = 'css' | 'json' | 'tailwind' | 'svg'

export interface PaletteExport {
  name: string
  colors: PaletteColor[]
  roles: RoleAssignments
}

export const exportFormats: Record<ExportFormat, {
  label: string
  extension: string
  mime: string
}> = {
  css: { label: 'CSS custom properties', extension: 'css', mime: 'text/css' },
  json: { label: 'JSON', extension: 'json', mime: 'application/json' },
  tailwind: { label: 'Tailwind theme colors', extension: 'js', mime: 'text/javascript' },
  svg: { label: 'SVG swatch sheet', extension: 'svg', mime: 'image/svg+xml' },
}

export function sanitizeFilename(value: string): string {
  const sanitized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
  return sanitized || 'colorcraft-palette'
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function safeComment(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').replace(/\*\//g, '* /')
}

export function generateCss({ name, colors }: PaletteExport): string {
  return `/* Palette: ${safeComment(name)} */\n:root {\n${colors
    .map((color, index) => `  --color-palette-${index + 1}: ${color.hex.toLowerCase()};`)
    .join('\n')}\n}\n`
}

export function generateJson({ name, colors, roles }: PaletteExport): string {
  return JSON.stringify({
    schemaVersion: 1,
    paletteName: name,
    colors: colors.map((color, index) => ({
      order: index + 1,
      hex: color.hex.toUpperCase(),
      rgb: color.rgb,
      hsl: color.hsl,
      ...(color.population === undefined ? {} : { population: color.population }),
      roles: paletteRoles
        .filter((role) => roles[role]?.toLowerCase() === color.hex.toLowerCase())
        .map((role) => ({ id: role, label: roleLabels[role] })),
    })),
    roleAssignments: Object.fromEntries(
      paletteRoles
        .filter((role) => roles[role])
        .map((role) => [role, roles[role]]),
    ),
  }, null, 2)
}

export function generateTailwind({ name, colors }: PaletteExport): string {
  return `/* Palette: ${safeComment(name)} */\nexport default {\n  theme: {\n    extend: {\n      colors: {\n${colors
    .map((color, index) => `        'palette-${index + 1}': '${color.hex.toLowerCase()}',`)
    .join('\n')}\n      },\n    },\n  },\n}\n`
}

export function generateSvg({ name, colors }: PaletteExport): string {
  const width = 720
  const rowHeight = 72
  const height = 92 + colors.length * rowHeight
  const rows = colors.map((color, index) => {
    const y = 70 + index * rowHeight
    return `  <g aria-label="Color ${index + 1}: ${escapeXml(color.hex.toUpperCase())}">
    <rect x="24" y="${y}" width="672" height="56" rx="8" fill="${escapeXml(color.hex)}"/>
    <text x="44" y="${y + 35}" fill="${color.hsl.l > 55 ? '#111827' : '#ffffff'}" font-family="system-ui, sans-serif" font-size="18" font-weight="700">${index + 1}. ${escapeXml(color.hex.toUpperCase())}</text>
  </g>`
  }).join('\n')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title">
  <title id="title">${escapeXml(name)}</title>
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <text x="24" y="42" fill="#111827" font-family="system-ui, sans-serif" font-size="24" font-weight="700">${escapeXml(name)}</text>
${rows}
</svg>\n`
}

export function generateExport(format: ExportFormat, palette: PaletteExport): string {
  if (format === 'css') return generateCss(palette)
  if (format === 'json') return generateJson(palette)
  if (format === 'tailwind') return generateTailwind(palette)
  return generateSvg(palette)
}
