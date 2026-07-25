import { describe, expect, it } from 'vitest'
import { blue, red } from './test/fixtures'
import {
  MAX_JSON_IMPORT_BYTES,
  parsePortablePaletteJson,
  readPortablePaletteFile,
  serializePortablePalette,
} from './portablePalette'

const roles = {
  primaryText: red.hex,
  pageBackground: blue.hex,
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

describe('portable ColorCraft JSON', () => {
  it('round trips version 2 names, order, metadata, and roles without IDs', () => {
    const text = exported()
    expect(text).not.toContain('color-red')
    const imported = parsePortablePaletteJson(text)
    expect(imported.name).toBe('Portable launch')
    expect(imported.colors.map(({ name, hex }) => ({ name, hex }))).toEqual([
      { name: 'Primary action', hex: '#FF0000' },
      { name: 'Surface', hex: '#0000FF' },
    ])
    expect(new Set(imported.colors.map((color) => color.id)).size).toBe(2)
    expect(imported.roles).toEqual({
      primaryText: '#FF0000',
      pageBackground: '#0000FF',
    })
  })

  it('imports the prior version 1 format as unnamed colors', () => {
    const v2 = JSON.parse(exported())
    delete v2.format
    v2.schemaVersion = 1
    v2.colors.forEach((color: { name?: string; pixelCount?: number }) => {
      delete color.name
      delete color.pixelCount
    })
    const imported = parsePortablePaletteJson(JSON.stringify(v2))
    expect(imported.colors.every((color) => color.name === undefined)).toBe(
      true,
    )
  })

  it.each([
    ['invalid JSON', '{', 'valid JSON'],
    [
      'future version',
      JSON.stringify({ schemaVersion: 99 }),
      'newer JSON schema',
    ],
    [
      'unknown format',
      JSON.stringify({
        ...JSON.parse(exported()),
        format: 'other-palette',
      }),
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

  it('rejects missing, excessive, duplicate, and nonsequential colors', () => {
    const empty = JSON.parse(exported())
    empty.colors = []
    expect(() => parsePortablePaletteJson(JSON.stringify(empty))).toThrow(
      'at least one color',
    )

    const excessive = JSON.parse(exported())
    excessive.colors = Array.from({ length: 11 }, (_, index) => ({
      ...excessive.colors[0],
      order: index + 1,
    }))
    expect(() => parsePortablePaletteJson(JSON.stringify(excessive))).toThrow(
      'contains 11 colors',
    )

    const duplicate = JSON.parse(exported())
    duplicate.colors[1].order = 1
    expect(() => parsePortablePaletteJson(JSON.stringify(duplicate))).toThrow(
      'unique and sequential',
    )
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

  it('rejects mismatched representations and contradictory or missing roles', () => {
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
    missing.roleAssignments.primaryText = '#123456'
    expect(() => parsePortablePaletteJson(JSON.stringify(missing))).toThrow(
      'not in the palette',
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
