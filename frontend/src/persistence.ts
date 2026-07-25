import { z } from 'zod'
import { colorSchema } from './api/contracts'
import {
  paletteRoles,
  pruneRoleAssignments,
  remapLegacyHexRoles,
  type RoleAssignments,
} from './contrast'
import {
  clonePaletteColor,
  deterministicPaletteColorId,
  type PaletteColor,
} from './workspace'

export const PALETTE_SCHEMA_VERSION = 3
const DATABASE_NAME = 'colorcraft'
const DATABASE_VERSION = 1
const STORE_NAME = 'palettes'

const storedColorSchema = colorSchema
  .extend({
    id: z.string().min(1).max(120),
    name: z.string().trim().min(1).max(80).optional(),
    population: z.number().min(0).max(1).optional(),
    pixelCount: z.number().int().positive().optional(),
  })
  .strict()
const legacyStoredColorSchema = colorSchema
  .extend({
    population: z.number().min(0).max(1).optional(),
    pixelCount: z.number().int().positive().optional(),
  })
  .strict()
const idRoleAssignmentsSchema = z.record(
  z.enum(paletteRoles),
  z.string().min(1).max(120),
)
const hexRoleAssignmentsSchema = z.record(
  z.enum(paletteRoles),
  z.string().regex(/^#[0-9A-Fa-f]{6}$/),
)
const savedPaletteBase = {
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  sourceType: z.enum(['image', 'manual']),
  sourceFilename: z.string().min(1).max(255).optional(),
}
const uniqueColors = z
  .array(storedColorSchema)
  .min(1)
  .max(10)
  .refine(
    (colors) => new Set(colors.map((color) => color.id)).size === colors.length,
    'Palette color IDs must be unique.',
  )
const savedPaletteV3Schema = z
  .object({
    schemaVersion: z.literal(3),
    ...savedPaletteBase,
    colors: uniqueColors,
    roles: idRoleAssignmentsSchema,
  })
  .strict()
const savedPaletteV2Schema = z
  .object({
    schemaVersion: z.literal(2),
    ...savedPaletteBase,
    colors: uniqueColors,
    roles: hexRoleAssignmentsSchema,
  })
  .strict()

export interface SavedPalette {
  schemaVersion: 3
  id: string
  name: string
  createdAt: string
  updatedAt: string
  sourceType: 'image' | 'manual'
  sourceFilename?: string
  colors: PaletteColor[]
  roles: RoleAssignments
}

export interface PaletteDraft {
  name: string
  sourceType: 'image' | 'manual'
  sourceFilename?: string
  colors: PaletteColor[]
  roles: RoleAssignments
}

function cloneColors(colors: PaletteColor[]): PaletteColor[] {
  return colors.map((color) => clonePaletteColor(color))
}

function normalizedV3(
  value: z.infer<typeof savedPaletteV3Schema>,
): SavedPalette {
  return {
    ...value,
    roles: pruneRoleAssignments(value.roles, value.colors),
  }
}

export function migratePaletteRecord(value: unknown): SavedPalette | null {
  const current = savedPaletteV3Schema.safeParse(value)
  if (current.success) return normalizedV3(current.data)

  const versionTwo = savedPaletteV2Schema.safeParse(value)
  if (versionTwo.success) {
    return normalizedV3({
      ...versionTwo.data,
      schemaVersion: PALETTE_SCHEMA_VERSION,
      roles: remapLegacyHexRoles(versionTwo.data.roles, versionTwo.data.colors),
    })
  }

  if (!value || typeof value !== 'object') return null
  const legacy = value as Record<string, unknown>
  if (
    legacy.schemaVersion !== undefined &&
    legacy.schemaVersion !== 0 &&
    legacy.schemaVersion !== 1
  )
    return null

  const parsedColors = z
    .array(legacyStoredColorSchema)
    .min(1)
    .max(10)
    .safeParse(legacy.colors)
  if (!parsedColors.success) return null
  const colors = parsedColors.data.map((color, index) => ({
    ...color,
    id: deterministicPaletteColorId(
      typeof legacy.id === 'string' ? legacy.id : 'palette',
      index,
      color.hex,
    ),
  }))
  const parsedLegacy = z
    .object({
      id: savedPaletteBase.id,
      name: savedPaletteBase.name,
      createdAt: savedPaletteBase.createdAt,
      updatedAt: savedPaletteBase.updatedAt,
      sourceType: savedPaletteBase.sourceType,
      sourceFilename: savedPaletteBase.sourceFilename,
      roles: hexRoleAssignmentsSchema,
    })
    .strict()
    .safeParse({
      id: legacy.id,
      name: legacy.name,
      createdAt: legacy.createdAt,
      updatedAt: legacy.updatedAt ?? legacy.createdAt,
      sourceType: legacy.sourceType ?? 'manual',
      sourceFilename: legacy.sourceFilename,
      roles: legacy.roles ?? {},
    })
  if (!parsedLegacy.success) return null
  return normalizedV3({
    schemaVersion: PALETTE_SCHEMA_VERSION,
    ...parsedLegacy.data,
    colors,
    roles: remapLegacyHexRoles(parsedLegacy.data.roles, colors),
  })
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('Could not open palette storage.'))
  })
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('Palette storage operation failed.'))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase()
  try {
    return await requestResult(
      action(database.transaction(STORE_NAME, mode).objectStore(STORE_NAME)),
    )
  } finally {
    database.close()
  }
}

export async function listSavedPalettes(): Promise<SavedPalette[]> {
  const records = await withStore('readonly', (store) => store.getAll())
  return (records as unknown[])
    .map(migratePaletteRecord)
    .filter((record): record is SavedPalette => Boolean(record))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export async function savePalette(
  draft: PaletteDraft,
  existing?: SavedPalette,
): Promise<SavedPalette> {
  const now = new Date().toISOString()
  const colors = cloneColors(draft.colors)
  const record: SavedPalette = {
    schemaVersion: PALETTE_SCHEMA_VERSION,
    id:
      existing?.id ??
      globalThis.crypto?.randomUUID?.() ??
      `palette-${Date.now()}`,
    name: draft.name.trim() || 'Untitled palette',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    sourceType: draft.sourceType,
    ...(draft.sourceFilename ? { sourceFilename: draft.sourceFilename } : {}),
    colors,
    roles: pruneRoleAssignments(draft.roles, colors),
  }
  const parsed = normalizedV3(savedPaletteV3Schema.parse(record))
  await withStore('readwrite', (store) => store.put(parsed))
  return parsed
}

export async function renameSavedPalette(
  id: string,
  name: string,
): Promise<SavedPalette> {
  const current = await getSavedPalette(id)
  if (!current) throw new Error('The saved palette no longer exists.')
  return savePalette({ ...current, name }, current)
}

export async function duplicateSavedPalette(
  record: SavedPalette,
): Promise<SavedPalette> {
  const idMap = new Map<string, string>()
  const colors = record.colors.map((color) => {
    const duplicate = clonePaletteColor(color, { newId: true })
    idMap.set(color.id, duplicate.id)
    return duplicate
  })
  const roles = Object.fromEntries(
    Object.entries(record.roles).flatMap(([role, colorId]) => {
      const duplicateId = colorId ? idMap.get(colorId) : undefined
      return duplicateId ? [[role, duplicateId]] : []
    }),
  ) as RoleAssignments
  return savePalette({
    ...record,
    name: `${record.name} copy`,
    colors,
    roles,
  })
}

export async function getSavedPalette(
  id: string,
): Promise<SavedPalette | null> {
  const record = await withStore('readonly', (store) => store.get(id))
  return migratePaletteRecord(record)
}

export async function deleteSavedPalette(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id))
}

export function paletteSnapshotFingerprint(draft: PaletteDraft): string {
  return JSON.stringify({
    name: draft.name.trim() || 'Untitled palette',
    sourceType: draft.sourceType,
    sourceFilename: draft.sourceFilename ?? null,
    colors: cloneColors(draft.colors),
    roles: Object.fromEntries(
      paletteRoles.flatMap((role) =>
        draft.roles[role] ? [[role, draft.roles[role]]] : [],
      ),
    ),
  })
}
