import { describe, expect, it } from 'vitest'
import {
  clonePaletteColor,
  colorFromHex,
  deterministicPaletteColorId,
  normalizeHexDraft,
  normalizeColorName,
  paletteColorFromApi,
  replacePaletteColorValue,
  reviewFromLocation,
  urlForReview,
  urlForView,
  viewFromLocation,
} from './workspace'

describe('workspace URL and color utilities', () => {
  it('reads valid views and safely restores invalid URLs to Create', () => {
    expect(viewFromLocation('?view=review')).toBe('review')
    expect(viewFromLocation('?view=unknown')).toBe('create')
    expect(viewFromLocation('')).toBe('create')
    expect(urlForView('export', 'http://localhost/?view=create')).toBe(
      '/?view=export',
    )
  })

  it('normalizes unprefixed HEX without accepting partial values', () => {
    expect(normalizeHexDraft('aabbcc')).toBe('#aabbcc')
    expect(colorFromHex('aabbcc')).toEqual(
      expect.objectContaining({
        hex: '#AABBCC',
        rgb: { r: 170, g: 187, b: 204 },
      }),
    )
    expect(colorFromHex('#abc')).toBeNull()
  })

  it('restores and writes a review subview', () => {
    expect(reviewFromLocation('?view=review&review=contrast')).toBe('contrast')
    expect(reviewFromLocation('?view=review&review=unknown')).toBe('overview')
    expect(urlForReview('harmony', 'https://example.com/?source=local')).toBe(
      '/?source=local&view=review&review=harmony',
    )
  })

  it('creates stable workspace colors and preserves identity through edits', () => {
    const extracted = paletteColorFromApi({
      ...colorFromHex('#725fd6')!,
      population: 0.4,
      pixelCount: 40,
    })
    const other = paletteColorFromApi(colorFromHex('#725fd6')!)
    expect(extracted.id).not.toBe(other.id)

    const named = { ...extracted, name: 'Primary action' }
    const edited = replacePaletteColorValue(named, colorFromHex('#141d29')!)
    expect(edited).toMatchObject({
      id: extracted.id,
      name: 'Primary action',
      hex: '#141D29',
    })
    expect(edited).not.toHaveProperty('population')
    expect(edited).not.toHaveProperty('pixelCount')

    const duplicate = clonePaletteColor(named, {
      newId: true,
      copyName: true,
    })
    expect(duplicate.id).not.toBe(named.id)
    expect(duplicate.name).toBe('Primary action copy')
  })

  it('normalizes names and deterministic migration IDs safely', () => {
    expect(normalizeColorName('  Surface  ')).toBe('Surface')
    expect(normalizeColorName('   ')).toBeUndefined()
    expect(normalizeColorName('x'.repeat(81))).toHaveLength(80)
    expect(deterministicPaletteColorId('one', 0, '#FFFFFF')).toBe(
      deterministicPaletteColorId('one', 0, '#FFFFFF'),
    )
  })
})
