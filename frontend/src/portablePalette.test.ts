import { describe, expect, it } from 'vitest'
import { blue, red } from './test/fixtures'
import {
  MAX_JSON_IMPORT_BYTES,
  parsePortablePaletteJson,
  readPortablePaletteFile,
  serializePortablePalette,
} from './portablePalette'

const roles = {
  primaryText: red.id,
  pageBackground: blue.id,
} as const

function exported() {
  return serializePortablePalette(
    'Portable launch',
    [
      { ...red, name: 'Primary action', population: 0.6, pixelCount: 60 },
      { ...blue, name: 'Surface', population: 0.4, pixelCount: 40 },
    ],
    roles,
  )
}

function legacyDocument(version: 1 | 2) {
  const document = JSON.parse(exported())
  document.schemaVersion = version
  document.roleAssignments = {
    primaryText: '#FF0000',
    pageBackground: '#0000FF',
  }
  document.colors.forEach(
    (color: {
      key?: string
      name?: string
      pixelCount?: number
      roles: unknown[]
    }) => {
      delete color.key
      if (version === 1) {
        delete color.name
        delete color.pixelCount
      }
    },
  )
  if (version === 1) delete document.format
  return document
}

describe('portable ColorCraft JSON', () => {
  it('round trips version 3 names, order, metadata, and role ownership without IDs', () => {
    const text = exported()
    expect(text).not.toContain(red.id)
    expect(text).not.toContain(blue.id)
    const serialized = JSON.parse(text)
    expect(serialized.schemaVersion).toBe(3)
    expect(
      serialized.colors.map((color: { key: string }) => color.key),
    ).toEqual(['color-1', 'color-2'])
    expect(serialized.roleAssignments).toEqual({
      pageBackground: 'color-2',
      primaryText: 'color-1',
    })
    const imported = parsePortablePaletteJson(text)
    expect(imported.name).toBe('Portable launch')
    expect(imported.colors.map(({ name, hex }) => ({ name, hex }))).toEqual([
      { name: 'Primary action', hex: '#FF0000' },
      { name: 'Surface', hex: '#0000FF' },
    ])
    expect(imported.roles).toEqual({
      pageBackground: imported.colors[1].id,
      primaryText: imported.colors[0].id,
    })
  })

  it('round trips distinct role owners with duplicate HEX values', () => {
    const duplicate = { ...red, id: 'duplicate-red', name: 'Second red' }
    const text = serializePortablePalette(
      'Duplicates',
      [{ ...red, name: 'First red' }, duplicate],
      { pageBackground: red.id, primaryText: duplicate.id },
    )
    const document = JSON.parse(text)
    expect(document.roleAssignments).toEqual({
      pageBackground: 'color-1',
      primaryText: 'color-2',
    })
    const imported = parsePortablePaletteJson(text)
    expect(imported.roles.pageBackground).toBe(imported.colors[0].id)
    expect(imported.roles.primaryText).toBe(imported.colors[1].id)
  })

  it.each([1, 2] as const)(
    'imports version %s HEX roles and maps duplicate HEX to the first color',
    (version) => {
      const document = legacyDocument(version)
      document.colors.splice(1, 0, {
        ...document.colors[0],
        order: 2,
        ...(version === 2 ? { name: 'Duplicate' } : {}),
      })
      document.colors[2].order = 3
      const imported = parsePortablePaletteJson(JSON.stringify(document))
      expect(imported.roles.primaryText).toBe(imported.colors[0].id)
      expect(imported.colors.every((color) => color.id.length > 0)).toBe(true)
      if (version === 1) {
        expect(imported.colors.every((color) => color.name === undefined)).toBe(
          true,
        )
      }
    },
  )

  it.each([
    ['invalid JSON', '{', 'valid JSON'],
    [
      'future version',
      JSON.stringify({ schemaVersion: 99 }),
      'newer JSON schema',
    ],
    [
      'unknown format',
      JSON.stringify({ ...JSON.parse(exported()), format: 'other-palette' }),
      'not a supported ColorCraft palette',
    ],
    [
      'unknown field',
      JSON.stringify({ ...JSON.parse(exported()), surprise: true }),
      'not a supported ColorCraft palette',
    ],
  ])('rejects %s', (_case, text, message) => {
    expect(() => parsePortablePaletteJson(text)).toThrow(message)
  })

  it('rejects missing, excessive, duplicate, and nonsequential colors or keys', () => {
    const empty = JSON.parse(exported())
    empty.colors = []
    expect(() => parsePortablePaletteJson(JSON.stringify(empty))).toThrow(
      'at least one color',
    )

    const excessive = JSON.parse(exported())
    excessive.colors = Array.from({ length: 11 }, (_, index) => ({
      ...excessive.colors[0],
      key: `color-${index + 1}`,
      order: index + 1,
    }))
    expect(() => parsePortablePaletteJson(JSON.stringify(excessive))).toThrow(
      'contains 11 colors',
    )

    const duplicateOrder = JSON.parse(exported())
    duplicateOrder.colors[1].order = 1
    expect(() =>
      parsePortablePaletteJson(JSON.stringify(duplicateOrder)),
    ).toThrow('unique and sequential')

    const missingKey = JSON.parse(exported())
    delete missingKey.colors[0].key
    expect(() => parsePortablePaletteJson(JSON.stringify(missingKey))).toThrow(
      'missing or invalid portable key',
    )

    const duplicateKey = JSON.parse(exported())
    duplicateKey.colors[1].key = duplicateKey.colors[0].key
    expect(() =>
      parsePortablePaletteJson(JSON.stringify(duplicateKey)),
    ).toThrow('keys must be unique')
  })

  it('reports actionable name and range failures', () => {
    const longName = JSON.parse(exported())
    longName.colors[0].name = 'x'.repeat(81)
    expect(() => parsePortablePaletteJson(JSON.stringify(longName))).toThrow(
      'name longer than 80',
    )

    const invalidPopulation = JSON.parse(exported())
    invalidPopulation.colors[0].population = 2
    expect(() =>
      parsePortablePaletteJson(JSON.stringify(invalidPopulation)),
    ).toThrow('population outside 0 through 1')
  })

  it('rejects mismatched representations and contradictory or missing key roles', () => {
    const mismatch = JSON.parse(exported())
    mismatch.colors[0].rgb.r = 1
    expect(() => parsePortablePaletteJson(JSON.stringify(mismatch))).toThrow(
      'do not match its HEX',
    )

    const contradiction = JSON.parse(exported())
    contradiction.colors[0].roles = []
    expect(() =>
      parsePortablePaletteJson(JSON.stringify(contradiction)),
    ).toThrow('contradicts roleAssignments')

    const missing = JSON.parse(exported())
    missing.roleAssignments.primaryText = 'color-99'
    expect(() => parsePortablePaletteJson(JSON.stringify(missing))).toThrow(
      'key that is not in the palette',
    )

    const invalidRole = JSON.parse(exported())
    invalidRole.colors[0].roles.push({ id: 'logo', label: 'Logo' })
    expect(() => parsePortablePaletteJson(JSON.stringify(invalidRole))).toThrow(
      'invalid role information',
    )
  })

  it('rejects oversized files before reading them', async () => {
    const file = new File(['{}'], 'palette.json', {
      type: 'application/json',
    })
    Object.defineProperty(file, 'size', {
      value: MAX_JSON_IMPORT_BYTES + 1,
    })
    await expect(readPortablePaletteFile(file)).rejects.toThrow(
      '1 MB or smaller',
    )
  })

  it('rejects invalid UTF-8 without exposing file contents', async () => {
    const file = new File(['x'], 'palette.json', {
      type: 'application/json',
    })
    Object.defineProperty(file, 'arrayBuffer', {
      value: async () => new Uint8Array([0xff]).buffer,
    })
    await expect(readPortablePaletteFile(file)).rejects.toThrow(
      'not valid UTF-8',
    )
  })
})
