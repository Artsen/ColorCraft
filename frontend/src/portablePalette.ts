import { z } from 'zod'
import { colorSchema } from './api/contracts'
import {
  paletteRoles,
  roleLabels,
  type PaletteRole,
  type RoleAssignments,
} from './contrast'
import {
  colorFromHex,
  paletteColorFromApi,
  type PaletteColor,
} from './workspace'

export const PORTABLE_PALETTE_FORMAT = 'colorcraft-palette'
export const PORTABLE_PALETTE_VERSION = 2
export const MAX_JSON_IMPORT_BYTES = 1024 * 1024
export const MAX_JSON_IMPORT_MEGABYTES = 1

const roleSchema = z
  .object({
    id: z.enum(paletteRoles),
    label: z.string(),
  })
  .strict()
const portableColorBase = colorSchema.extend({
  order: z.number().int().min(1).max(10),
  population: z.number().min(0).max(1).optional(),
  roles: z.array(roleSchema),
})
const portableColorV1 = portableColorBase.strict()
const portableColorV2 = portableColorBase
  .extend({
    name: z.string().trim().min(1).max(80).optional(),
    pixelCount: z.number().int().positive().optional(),
  })
  .strict()
const roleAssignmentsSchema = z
  .object({
    pageBackground: z.string().optional(),
    surface: z.string().optional(),
    primaryText: z.string().optional(),
    secondaryText: z.string().optional(),
    primaryAction: z.string().optional(),
    actionText: z.string().optional(),
    border: z.string().optional(),
    focusIndicator: z.string().optional(),
  })
  .strict()
const v1Schema = z
  .object({
    schemaVersion: z.literal(1),
    paletteName: z.string().trim().min(1).max(120),
    colors: z.array(portableColorV1).min(1).max(10),
    roleAssignments: roleAssignmentsSchema,
  })
  .strict()
const v2Schema = z
  .object({
    schemaVersion: z.literal(2),
    format: z.literal(PORTABLE_PALETTE_FORMAT),
    paletteName: z.string().trim().min(1).max(120),
    colors: z.array(portableColorV2).min(1).max(10),
    roleAssignments: roleAssignmentsSchema,
  })
  .strict()

export interface ImportedPalette {
  name: string
  colors: PaletteColor[]
  roles: RoleAssignments
}

export class PortablePaletteError extends Error {}

function fail(message: string): never {
  throw new PortablePaletteError(message)
}

function explainSchemaFailure(
  candidate: Record<string, unknown>,
  issues: z.ZodIssue[],
): never {
  if (!Array.isArray(candidate.colors) || candidate.colors.length === 0) {
    fail('A ColorCraft palette must contain at least one color.')
  }
  const issue = issues[0]
  const [field, colorIndex, colorField] = issue?.path ?? []
  if (field === 'paletteName') {
    fail('The palette name must contain between 1 and 120 characters.')
  }
  if (field === 'colors' && typeof colorIndex === 'number') {
    const label = `Color ${colorIndex + 1}`
    if (colorField === 'name')
      fail(`${label} has a name longer than 80 characters.`)
    if (colorField === 'hex')
      fail(`${label} must use a valid six-digit HEX value.`)
    if (colorField === 'rgb')
      fail(`${label} has an RGB value outside 0 through 255.`)
    if (colorField === 'hsl')
      fail(`${label} has an HSL value outside the supported range.`)
    if (colorField === 'population')
      fail(`${label} has a population outside 0 through 1.`)
    if (colorField === 'pixelCount')
      fail(`${label} must have a positive whole-number pixelCount.`)
    if (colorField === 'roles')
      fail(`${label} contains invalid role information.`)
  }
  if (field === 'roleAssignments') {
    fail('The palette contains an invalid role assignment.')
  }
  fail('This file is not a supported ColorCraft palette.')
}

function representationsMatch(color: z.infer<typeof portableColorV2>): boolean {
  const canonical = colorFromHex(color.hex)
  if (!canonical) return false
  const hueMatches =
    canonical.hsl.h === color.hsl.h ||
    ((canonical.hsl.h === 0 || canonical.hsl.h === 360) &&
      (color.hsl.h === 0 || color.hsl.h === 360))
  return (
    canonical.rgb.r === color.rgb.r &&
    canonical.rgb.g === color.rgb.g &&
    canonical.rgb.b === color.rgb.b &&
    hueMatches &&
    canonical.hsl.s === color.hsl.s &&
    canonical.hsl.l === color.hsl.l
  )
}

function validatePortable(
  value: z.infer<typeof v1Schema> | z.infer<typeof v2Schema>,
): ImportedPalette {
  const ordered = [...value.colors].sort(
    (left, right) => left.order - right.order,
  )
  if (ordered.some((color, index) => color.order !== index + 1)) {
    fail('Color order values must be unique and sequential from 1.')
  }
  ordered.forEach((color, index) => {
    if (!representationsMatch(color)) {
      fail(
        `Color ${index + 1} has RGB or HSL values that do not match its HEX value.`,
      )
    }
    if (color.roles.some((role) => role.label !== roleLabels[role.id])) {
      fail(`Color ${index + 1} contains an invalid role label.`)
    }
  })

  const paletteHexes = new Set(ordered.map((color) => color.hex.toUpperCase()))
  const roles = Object.fromEntries(
    Object.entries(value.roleAssignments).map(([role, hex]) => {
      if (
        !hex ||
        !/^#[0-9a-f]{6}$/i.test(hex) ||
        !paletteHexes.has(hex.toUpperCase())
      ) {
        fail(
          `The ${roleLabels[role as PaletteRole]} role references a color that is not in the palette.`,
        )
      }
      return [role, hex.toUpperCase()]
    }),
  ) as RoleAssignments

  ordered.forEach((color, index) => {
    const described = [...color.roles.map((role) => role.id)].sort()
    const authoritative = paletteRoles
      .filter((role) => roles[role]?.toUpperCase() === color.hex.toUpperCase())
      .sort()
    if (
      described.length !== authoritative.length ||
      described.some((role, roleIndex) => role !== authoritative[roleIndex])
    ) {
      fail(
        `Color ${index + 1} has role information that contradicts roleAssignments.`,
      )
    }
  })

  return {
    name: value.paletteName,
    colors: ordered.map((color) =>
      paletteColorFromApi(color, {
        name: 'name' in color ? color.name : undefined,
      }),
    ),
    roles,
  }
}

export function parsePortablePaletteJson(text: string): ImportedPalette {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    fail('This file does not contain valid JSON.')
  }
  if (!raw || typeof raw !== 'object') {
    fail('This file is not a supported ColorCraft palette.')
  }
  const candidate = raw as Record<string, unknown>
  if (
    typeof candidate.schemaVersion === 'number' &&
    candidate.schemaVersion > PORTABLE_PALETTE_VERSION
  ) {
    fail(
      'This palette uses a newer JSON schema that this version of ColorCraft cannot import.',
    )
  }
  const parsed =
    candidate.schemaVersion === 1
      ? v1Schema.safeParse(raw)
      : candidate.schemaVersion === 2
        ? v2Schema.safeParse(raw)
        : null
  if (!parsed?.success) {
    const colorCount = Array.isArray(candidate.colors)
      ? candidate.colors.length
      : null
    if (colorCount !== null && colorCount > 10) {
      fail(
        `The imported palette contains ${colorCount} colors. ColorCraft supports up to 10.`,
      )
    }
    if (parsed) explainSchemaFailure(candidate, parsed.error.issues)
    fail('This file is not a supported ColorCraft palette.')
  }
  return validatePortable(parsed.data)
}

export async function readPortablePaletteFile(
  file: File,
): Promise<ImportedPalette> {
  if (file.size > MAX_JSON_IMPORT_BYTES) {
    fail(
      `Choose a ColorCraft JSON file that is ${MAX_JSON_IMPORT_MEGABYTES} MB or smaller.`,
    )
  }
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(
      await file.arrayBuffer(),
    )
  } catch {
    fail('This file is not valid UTF-8 text.')
  }
  return parsePortablePaletteJson(text)
}

export function serializePortablePalette(
  name: string,
  colors: PaletteColor[],
  roles: RoleAssignments,
): string {
  const value = {
    schemaVersion: PORTABLE_PALETTE_VERSION,
    format: PORTABLE_PALETTE_FORMAT,
    paletteName: name,
    colors: colors.map((color, index) => ({
      order: index + 1,
      ...(color.name ? { name: color.name } : {}),
      hex: color.hex.toUpperCase(),
      rgb: { ...color.rgb },
      hsl: { ...color.hsl },
      ...(color.population === undefined
        ? {}
        : { population: color.population }),
      ...(color.pixelCount === undefined
        ? {}
        : { pixelCount: color.pixelCount }),
      roles: paletteRoles
        .filter(
          (role) => roles[role]?.toLowerCase() === color.hex.toLowerCase(),
        )
        .map((role) => ({ id: role, label: roleLabels[role] })),
    })),
    roleAssignments: Object.fromEntries(
      paletteRoles
        .filter((role) => roles[role])
        .map((role) => [role, roles[role]!.toUpperCase()]),
    ),
  }
  return JSON.stringify(v2Schema.parse(value), null, 2)
}
