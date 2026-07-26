import type { PaletteColor } from './workspace'
import { serializePortablePalette } from './portablePalette'
import {
  contrastRatio,
  paletteRoles,
  roleAssignmentEntries,
  roleLabels,
  roleTokenNames,
  rolesForColor,
  type RoleAssignments,
} from './contrast'

export type ExportFormat = 'css' | 'json' | 'tailwind' | 'svg'

export interface PaletteExport {
  name: string
  colors: PaletteColor[]
  roles: RoleAssignments
}

export const exportFormats: Record<
  ExportFormat,
  {
    label: string
    extension: string
    mime: string
  }
> = {
  css: { label: 'CSS custom properties', extension: 'css', mime: 'text/css' },
  json: { label: 'JSON', extension: 'json', mime: 'application/json' },
  tailwind: {
    label: 'Tailwind theme colors',
    extension: 'js',
    mime: 'text/javascript',
  },
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

export function generateCss({ name, colors, roles }: PaletteExport): string {
  const tokens = exportTokens(colors)
  const tokenById = new Map(
    colors.map((color, index) => [color.id, tokens[index]]),
  )
  const aliases = roleAssignmentEntries(roles).flatMap(([role, colorId]) => {
    const token = tokenById.get(colorId)
    return token
      ? [`  --role-${roleTokenNames[role]}: var(--color-${token});`]
      : []
  })
  const values = colors
    .map(
      (color, index) =>
        `  --color-${tokens[index]}: ${color.hex.toLowerCase()};`,
    )
    .join('\n')
  const semantic = aliases.length
    ? `\n\n  /* Semantic role aliases */\n${aliases.join('\n')}`
    : ''
  return `/* Palette: ${safeComment(name)} */\n:root {\n${values}${semantic}\n}\n`
}

export function generateJson({ name, colors, roles }: PaletteExport): string {
  return serializePortablePalette(name, colors, roles)
}

export function generateTailwind({
  name,
  colors,
  roles,
}: PaletteExport): string {
  const tokens = exportTokens(colors)
  const colorsById = new Map(colors.map((color) => [color.id, color]))
  const baseColors = colors
    .map(
      (color, index) =>
        `        '${tokens[index]}': '${color.hex.toLowerCase()}',`,
    )
    .join('\n')
  const semanticColors = roleAssignmentEntries(roles).flatMap(
    ([role, colorId]) => {
      const color = colorsById.get(colorId)
      return color
        ? [
            `        'role-${roleTokenNames[role]}': '${color.hex.toLowerCase()}',`,
          ]
        : []
    },
  )
  const semantic = semanticColors.length
    ? `\n        // Semantic role colors\n${semanticColors.join('\n')}`
    : ''
  return `/* Palette: ${safeComment(name)} */\nexport default {\n  theme: {\n    extend: {\n      colors: {\n${baseColors}${semantic}\n      },\n    },\n  },\n}\n`
}

export function generateSvg({ name, colors, roles }: PaletteExport): string {
  const width = 720
  const rowHeight = 92
  const height = 92 + colors.length * rowHeight
  const rows = colors
    .map((color, index) => {
      const y = 70 + index * rowHeight
      const black = { rgb: { r: 0, g: 0, b: 0 } }
      const white = { rgb: { r: 255, g: 255, b: 255 } }
      const labelColor =
        contrastRatio(color, black) >= contrastRatio(color, white)
          ? '#000000'
          : '#ffffff'
      const label = color.name
        ? `${color.name} · ${color.hex.toUpperCase()}`
        : color.hex.toUpperCase()
      const assignedRoles = rolesForColor(color.id, roles)
      const roleAnnotation = assignedRoles.length
        ? `Roles: ${assignedRoles.map((role) => roleLabels[role]).join(', ')}`
        : ''
      const annotationLine = roleAnnotation
        ? `\n    <text x="44" y="${y + 57}" fill="${labelColor}" font-family="system-ui, sans-serif" font-size="14">${escapeXml(roleAnnotation)}</text>`
        : ''
      return `  <g aria-label="Color ${index + 1}: ${escapeXml(label)}${roleAnnotation ? `. ${escapeXml(roleAnnotation)}` : ''}">
    <rect x="24" y="${y}" width="672" height="76" rx="8" fill="${escapeXml(color.hex)}"/>
    <text x="44" y="${y + 31}" fill="${labelColor}" font-family="system-ui, sans-serif" font-size="18" font-weight="700">${index + 1}. ${escapeXml(label)}</text>${annotationLine}
  </g>`
    })
    .join('\n')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title">
  <title id="title">${escapeXml(name)}</title>
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <text x="24" y="42" fill="#111827" font-family="system-ui, sans-serif" font-size="24" font-weight="700">${escapeXml(name)}</text>
${rows}
</svg>\n`
}

export function exportToken(value: string, fallback: string): string {
  return (
    value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || fallback
  )
}

export const reservedSemanticTokens = paletteRoles.map(
  (role) => `role-${roleTokenNames[role]}`,
)

function allocateToken(
  requested: string,
  allocated: Set<string>,
  reserved: ReadonlySet<string>,
): string {
  let token = requested
  let suffix = 2
  while (allocated.has(token) || reserved.has(token)) {
    token = `${requested}-${suffix}`
    suffix += 1
  }
  allocated.add(token)
  return token
}

export function exportTokens(colors: PaletteColor[]): string[] {
  const allocated = new Set<string>()
  const reserved = new Set(reservedSemanticTokens)
  return colors.map((color, index) => {
    const requested = exportToken(color.name ?? '', `palette-${index + 1}`)
    return allocateToken(requested, allocated, reserved)
  })
}

export function generateExport(
  format: ExportFormat,
  palette: PaletteExport,
): string {
  if (format === 'css') return generateCss(palette)
  if (format === 'json') return generateJson(palette)
  if (format === 'tailwind') return generateTailwind(palette)
  return generateSvg(palette)
}
