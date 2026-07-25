import type { Color } from './api/contracts'

export const paletteRoles = [
  'pageBackground',
  'surface',
  'primaryText',
  'secondaryText',
  'primaryAction',
  'actionText',
  'border',
  'focusIndicator',
] as const

export type PaletteRole = (typeof paletteRoles)[number]
export type RoleAssignments = Partial<Record<PaletteRole, string>>

export const roleLabels: Record<PaletteRole, string> = {
  pageBackground: 'Page background',
  surface: 'Surface',
  primaryText: 'Primary text',
  secondaryText: 'Secondary text',
  primaryAction: 'Primary action',
  actionText: 'Action text',
  border: 'Border',
  focusIndicator: 'Focus indicator',
}

export const roleChecks: Array<{
  id: string
  label: string
  foreground: PaletteRole
  background: PaletteRole
  preview: 'page' | 'surface' | 'action' | 'border' | 'focus'
}> = [
  { id: 'primary-page', label: 'Primary text on page background', foreground: 'primaryText', background: 'pageBackground', preview: 'page' },
  { id: 'secondary-surface', label: 'Secondary text on surface', foreground: 'secondaryText', background: 'surface', preview: 'surface' },
  { id: 'action-primary', label: 'Action text on primary action', foreground: 'actionText', background: 'primaryAction', preview: 'action' },
  { id: 'border-surface', label: 'Border against surface', foreground: 'border', background: 'surface', preview: 'border' },
  { id: 'focus-page', label: 'Focus indicator against page background', foreground: 'focusIndicator', background: 'pageBackground', preview: 'focus' },
  { id: 'focus-surface', label: 'Focus indicator against surface', foreground: 'focusIndicator', background: 'surface', preview: 'focus' },
]

function linearChannel(value: number): number {
  const channel = value / 255
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(color: Pick<Color, 'rgb'>): number {
  return (
    0.2126 * linearChannel(color.rgb.r) +
    0.7152 * linearChannel(color.rgb.g) +
    0.0722 * linearChannel(color.rgb.b)
  )
}

export function contrastRatio(foreground: Pick<Color, 'rgb'>, background: Pick<Color, 'rgb'>): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background))
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

export function pruneRoleAssignments(
  assignments: RoleAssignments,
  colors: Color[],
): RoleAssignments {
  const current = new Set(colors.map((color) => color.hex.toLowerCase()))
  return Object.fromEntries(
    Object.entries(assignments).filter(([, hex]) => hex && current.has(hex.toLowerCase())),
  ) as RoleAssignments
}
