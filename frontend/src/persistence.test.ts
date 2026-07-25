import { beforeEach, describe, expect, it, vi } from 'vitest'
import { red, blue } from './test/fixtures'
import {
  deleteSavedPalette,
  duplicateSavedPalette,
  getSavedPalette,
  listSavedPalettes,
  migratePaletteRecord,
  renameSavedPalette,
  savePalette,
} from './persistence'

const draft = {
  name: 'Launch palette',
  sourceType: 'manual' as const,
  colors: [red, blue],
  roles: { primaryText: red.hex },
}

describe('versioned palette persistence', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('saves a new palette and updates it without changing identity or creation date', async () => {
    const saved = await savePalette(draft)
    const updated = await savePalette(
      { ...draft, name: 'Updated palette' },
      saved,
    )
    expect(updated.id).toBe(saved.id)
    expect(updated.createdAt).toBe(saved.createdAt)
    expect((await getSavedPalette(saved.id))?.name).toBe('Updated palette')
  })

  it('duplicates, renames, sorts, and deletes saved palettes', async () => {
    const first = await savePalette(draft)
    await new Promise((resolve) => setTimeout(resolve, 2))
    const duplicate = await duplicateSavedPalette(first)
    expect((await listSavedPalettes()).map((item) => item.id)).toEqual([
      duplicate.id,
      first.id,
    ])
    expect(duplicate.name).toBe('Launch palette copy')
    expect((await renameSavedPalette(first.id, 'Renamed')).name).toBe('Renamed')
    await deleteSavedPalette(first.id)
    expect(await getSavedPalette(first.id)).toBeNull()
  })

  it('migrates a valid legacy record and rejects corrupt or future records', () => {
    const legacy = migratePaletteRecord({
      id: 'legacy-1',
      name: 'Legacy',
      createdAt: '2026-01-01T00:00:00.000Z',
      colors: [red],
    })
    expect(legacy).toEqual(
      expect.objectContaining({
        schemaVersion: 1,
        sourceType: 'manual',
        roles: {},
      }),
    )
    expect(migratePaletteRecord({ schemaVersion: 99, id: 'future' })).toBeNull()
    expect(
      migratePaletteRecord({ id: 'broken', colors: [{ hex: '<script>' }] }),
    ).toBeNull()
  })
})
