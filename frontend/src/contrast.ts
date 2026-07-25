import type { Color } from './api/contracts'
import type { PaletteColor } from './workspace'

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
export type PaletteColorId = string
export type RoleAssignments = Partial<Record<PaletteRole, PaletteColorId>>
export type ContrastCheckKind = 'text' | 'nonText' | 'focus'

export const textContrastThresholds = {
  aaNormal: 4.5,
  aaLarge: 3,
  aaaNormal: 7,
  aaaLarge: 4.5,
} as const
export const nonTextContrastThreshold = 3
export const contrastDisplayThresholds = [
  nonTextContrastThreshold,
  textContrastThresholds.aaNormal,
  textContrastThresholds.aaaNormal,
] as const

export interface ContrastResult {
  label: string
  threshold: number
  pass: boolean
}

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

export const roleTokenNames: Record<PaletteRole, string> = {
  pageBackground: 'page-background',
  surface: 'surface',
  primaryText: 'primary-text',
  secondaryText: 'secondary-text',
  primaryAction: 'primary-action',
  actionText: 'action-text',
  border: 'border',
  focusIndicator: 'focus-indicator',
}

export const roleChecks: Array<{
  id: string
  label: string
  foreground: PaletteRole
  background: PaletteRole
  kind: ContrastCheckKind
  preview: 'page' | 'surface' | 'action' | 'border' | 'focus'
}> = [
  {
    id: 'primary-page',
    label: 'Primary text on page background',
    foreground: 'primaryText',
    background: 'pageBackground',
    kind: 'text',
    preview: 'page',
  },
  {
    id: 'secondary-surface',
    label: 'Secondary text on surface',
    foreground: 'secondaryText',
    background: 'surface',
    kind: 'text',
    preview: 'surface',
  },
  {
    id: 'action-primary',
    label: 'Action text on primary action',
    foreground: 'actionText',
    background: 'primaryAction',
    kind: 'text',
    preview: 'action',
  },
  {
    id: 'border-surface',
    label: 'Border against surface',
    foreground: 'border',
    background: 'surface',
    kind: 'nonText',
    preview: 'border',
  },
  {
    id: 'focus-page',
    label: 'Focus indicator against page background',
    foreground: 'focusIndicator',
    background: 'pageBackground',
    kind: 'focus',
    preview: 'focus',
  },
  {
    id: 'focus-surface',
    label: 'Focus indicator against surface',
    foreground: 'focusIndicator',
    background: 'surface',
    kind: 'focus',
    preview: 'focus',
  },
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

export function contrastRatio(
  foreground: Pick<Color, 'rgb'>,
  background: Pick<Color, 'rgb'>,
): number {
  const lighter = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background),
  )
  const darker = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background),
  )
  return (lighter + 0.05) / (darker + 0.05)
}

export function formatContrastRatio(
  ratio: number,
  thresholds: readonly number[] = contrastDisplayThresholds,
): string {
  const roundedToTwo = Number(ratio.toFixed(2))
  const roundedUpToFailureBoundary = thresholds.some(
    (threshold) => ratio < threshold && roundedToTwo >= threshold,
  )
  if (!roundedUpToFailureBoundary) return ratio.toFixed(2)

  const [integerPart, fractionalPart = ''] = ratio.toString().split('.')
  return `${integerPart}.${fractionalPart.padEnd(4, '0').slice(0, 4)}`
}

export function resultsForContrastCheck(
  kind: ContrastCheckKind,
  ratio: number,
): ContrastResult[] {
  if (kind === 'text') {
    return [
      {
        label: 'AA normal text',
        threshold: textContrastThresholds.aaNormal,
        pass: ratio >= textContrastThresholds.aaNormal,
      },
      {
        label: 'AA large text',
        threshold: textContrastThresholds.aaLarge,
        pass: ratio >= textContrastThresholds.aaLarge,
      },
      {
        label: 'AAA normal text',
        threshold: textContrastThresholds.aaaNormal,
        pass: ratio >= textContrastThresholds.aaaNormal,
      },
      {
        label: 'AAA large text',
        threshold: textContrastThresholds.aaaLarge,
        pass: ratio >= textContrastThresholds.aaaLarge,
      },
    ]
  }
  return [
    {
      label:
        kind === 'focus'
          ? 'Focus-indicator color contrast'
          : 'Non-text component contrast',
      threshold: nonTextContrastThreshold,
      pass: ratio >= nonTextContrastThreshold,
    },
  ]
}

export function pruneRoleAssignments(
  assignments: RoleAssignments,
  colors: PaletteColor[],
): RoleAssignments {
  const current = new Set(colors.map((color) => color.id))
  return Object.fromEntries(
    Object.entries(assignments).filter(
      ([, colorId]) => colorId && current.has(colorId),
    ),
  ) as RoleAssignments
}

export function colorForRole(
  role: PaletteRole,
  assignments: RoleAssignments,
  colorsById: ReadonlyMap<string, PaletteColor>,
): PaletteColor | undefined {
  const colorId = assignments[role]
  return colorId ? colorsById.get(colorId) : undefined
}

export function rolesForColor(
  colorId: string,
  assignments: RoleAssignments,
): PaletteRole[] {
  return paletteRoles.filter((role) => assignments[role] === colorId)
}

export function roleAssignmentEntries(
  assignments: RoleAssignments,
): Array<[PaletteRole, string]> {
  return paletteRoles.flatMap((role) => {
    const colorId = assignments[role]
    return colorId ? [[role, colorId] as [PaletteRole, string]] : []
  })
}

export function remapLegacyHexRoles(
  assignments: Partial<Record<PaletteRole, string>>,
  colors: PaletteColor[],
): RoleAssignments {
  const firstIdByHex = new Map<string, string>()
  colors.forEach((color) => {
    const hex = color.hex.toLowerCase()
    if (!firstIdByHex.has(hex)) firstIdByHex.set(hex, color.id)
  })
  return Object.fromEntries(
    roleAssignmentEntries(assignments).flatMap(([role, hex]) => {
      const colorId = firstIdByHex.get(hex.toLowerCase())
      return colorId ? [[role, colorId]] : []
    }),
  ) as RoleAssignments
}
