import { z } from 'zod'
import { colorSchema } from './api/contracts'
import type { RoleAssignments } from './contrast'
import type { PaletteColor } from './workspace'
import { clonePaletteColor, deterministicPaletteColorId } from './workspace'

export const PALETTE_SCHEMA_VERSION = 2
const DATABASE_NAME = 'colorcraft'
const DATABASE_VERSION = 1
const STORE_NAME = 'palettes'

const storedColorSchema = colorSchema.extend({
  id: z.string().min(1).max(120),
  name: z.string().trim().min(1).max(80).optional(),
  population: z.number().min(0).max(1).optional(),
  pixelCount: z.number().int().positive().optional(),
})

const roleAssignmentsSchema = z.record(
  z.enum([
    'pageBackground',
    'surface',
    'primaryText',
    'secondaryText',
    'primaryAction',
    'actionText',
    'border',
    'focusIndicator',
  ]),
  z.string().regex(/^#[0-9A-Fa-f]{6}$/),
)

const savedPaletteSchema = z
  .object({
    schemaVersion: z.literal(2),
    id: z.string().min(1).max(120),
    name: z.string().min(1).max(120),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    sourceType: z.enum(['image', 'manual']),
    sourceFilename: z.string().min(1).max(255).optional(),
    colors: z
      .array(storedColorSchema)
      .min(1)
      .max(10)
      .refine(
        (colors) =>
          new Set(colors.map((color) => color.id)).size === colors.length,
        'Palette color IDs must be unique.',
      ),
    roles: roleAssignmentsSchema,
  })
  .strict()

export interface SavedPalette {
  schemaVersion: 2
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

function cloneColors(
  colors: PaletteColor[],
  options: { newIds?: boolean } = {},
): PaletteColor[] {
  return colors.map((color) =>
    clonePaletteColor(color, { newId: options.newIds }),
  )
}

export function migratePaletteRecord(value: unknown): SavedPalette | null {
  const current = savedPaletteSchema.safeParse(value)
  if (current.success) return current.data

  if (!value || typeof value !== 'object') return null
  const legacy = value as Record<string, unknown>
  if (
    legacy.schemaVersion !== undefined &&
    legacy.schemaVersion !== 0 &&
    legacy.schemaVersion !== 1
  )
    return null
  const legacyColors = Array.isArray(legacy.colors)
    ? legacy.colors.map((color, index) => {
        if (!color || typeof color !== 'object') return color
        const item = color as Record<string, unknown>
        return {
          ...item,
          id: deterministicPaletteColorId(
            typeof legacy.id === 'string' ? legacy.id : 'palette',
            index,
            typeof item.hex === 'string' ? item.hex : '',
          ),
        }
      })
    : legacy.colors
  const migrated = savedPaletteSchema.safeParse({
    schemaVersion: PALETTE_SCHEMA_VERSION,
    id: legacy.id,
    name: legacy.name,
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt ?? legacy.createdAt,
    sourceType: legacy.sourceType ?? 'manual',
    sourceFilename: legacy.sourceFilename,
    colors: legacyColors,
    roles: legacy.roles ?? {},
  })
  return migrated.success ? migrated.data : null
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
    colors: cloneColors(draft.colors),
    roles: { ...draft.roles },
  }
  const parsed = savedPaletteSchema.parse(record)
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
  return savePalette({
    ...record,
    name: `${record.name} copy`,
    colors: cloneColors(record.colors, { newIds: true }),
    roles: { ...record.roles },
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
    roles: draft.roles,
  })
}
