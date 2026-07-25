import { beforeEach, describe, expect, it, vi } from 'vitest'
import { blue, red } from './test/fixtures'
import {
  deleteSavedPalette,
  duplicateSavedPalette,
  getSavedPalette,
  listSavedPalettes,
  migratePaletteRecord,
  paletteSnapshotFingerprint,
  renameSavedPalette,
  savePalette,
} from './persistence'

const draft = {
  name: 'Launch palette',
  sourceType: 'manual' as const,
  colors: [red, blue],
  roles: { primaryText: red.id },
}

const storedBase = {
  id: 'legacy-1',
  name: 'Legacy',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  sourceType: 'manual' as const,
}

describe('versioned palette persistence', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('round trips a version 3 palette without changing role identity', async () => {
    const saved = await savePalette(draft)
    const reopened = await getSavedPalette(saved.id)
    const updated = await savePalette(
      { ...draft, name: 'Updated palette' },
      saved,
    )
    expect(saved.schemaVersion).toBe(3)
    expect(reopened?.roles.primaryText).toBe(red.id)
    expect(updated.id).toBe(saved.id)
    expect(updated.createdAt).toBe(saved.createdAt)
    expect((await getSavedPalette(saved.id))?.name).toBe('Updated palette')
  })

  it('duplicates, remaps role IDs, renames, sorts, and deletes palettes', async () => {
    const first = await savePalette({
      ...draft,
      roles: { primaryText: red.id, actionText: red.id, surface: blue.id },
    })
    await new Promise((resolve) => setTimeout(resolve, 2))
    const duplicate = await duplicateSavedPalette(first)
    expect((await listSavedPalettes()).map((item) => item.id)).toEqual([
      duplicate.id,
      first.id,
    ])
    expect(duplicate.name).toBe('Launch palette copy')
    expect(duplicate.colors.map((color) => color.hex)).toEqual(
      first.colors.map((color) => color.hex),
    )
    expect(duplicate.colors.map((color) => color.id)).not.toEqual(
      first.colors.map((color) => color.id),
    )
    expect(duplicate.roles).toEqual({
      surface: duplicate.colors[1].id,
      primaryText: duplicate.colors[0].id,
      actionText: duplicate.colors[0].id,
    })
    expect(Object.values(duplicate.roles)).not.toContain(red.id)
    expect((await renameSavedPalette(first.id, 'Renamed')).name).toBe('Renamed')
    await deleteSavedPalette(first.id)
    expect(await getSavedPalette(first.id)).toBeNull()
  })

  it('migrates version 2 HEX roles with deterministic first-match behavior', () => {
    const first = { ...red, id: 'first-red' }
    const second = { ...red, id: 'second-red' }
    const record = {
      schemaVersion: 2,
      ...storedBase,
      colors: [first, second, blue],
      roles: {
        primaryText: red.hex,
        actionText: red.hex,
        surface: blue.hex,
      },
    }
    const migrated = migratePaletteRecord(record)
    expect(migrated).toEqual(
      expect.objectContaining({
        schemaVersion: 3,
        roles: {
          surface: blue.id,
          primaryText: first.id,
          actionText: first.id,
        },
      }),
    )
    expect(migratePaletteRecord(record)).toEqual(migrated)
  })

  it('prunes missing version 2 HEX roles without rejecting the palette', () => {
    const migrated = migratePaletteRecord({
      schemaVersion: 2,
      ...storedBase,
      colors: [red],
      roles: { primaryText: '#123456' },
    })
    expect(migrated?.roles).toEqual({})
  })

  it('migrates version 1, version 0, and unversioned records deterministically', () => {
    const legacyColor = { hex: red.hex, rgb: red.rgb, hsl: red.hsl }
    for (const schemaVersion of [1, 0, undefined]) {
      const record = {
        ...(schemaVersion === undefined ? {} : { schemaVersion }),
        ...storedBase,
        colors: [legacyColor],
        roles: { primaryText: red.hex },
      }
      const first = migratePaletteRecord(record)
      const second = migratePaletteRecord(record)
      expect(first?.schemaVersion).toBe(3)
      expect(first?.colors[0].id).toMatch(/^legacy-1-/)
      expect(first?.roles.primaryText).toBe(first?.colors[0].id)
      expect(second).toEqual(first)
    }
    expect(migratePaletteRecord({ schemaVersion: 99, id: 'future' })).toBeNull()
    expect(
      migratePaletteRecord({ id: 'broken', colors: [{ hex: '<script>' }] }),
    ).toBeNull()
  })

  it('fingerprints names, order, values, and roles without clone false positives', () => {
    const named = {
      ...draft,
      colors: [{ ...red, name: 'Primary' }, blue],
    }
    const baseline = paletteSnapshotFingerprint(named)
    expect(
      paletteSnapshotFingerprint({ ...named, colors: [...named.colors] }),
    ).toBe(baseline)
    expect(
      paletteSnapshotFingerprint({
        ...named,
        colors: [...named.colors].reverse(),
      }),
    ).not.toBe(baseline)
    expect(
      paletteSnapshotFingerprint({
        ...named,
        colors: [{ ...named.colors[0], name: 'Action' }, blue],
      }),
    ).not.toBe(baseline)
  })
})
