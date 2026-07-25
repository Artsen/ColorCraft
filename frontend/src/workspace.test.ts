import { describe, expect, it } from 'vitest'
import {
  colorFromHex,
  normalizeHexDraft,
  urlForView,
  viewFromLocation,
} from './workspace'

describe('workspace URL and color utilities', () => {
  it('reads valid views and safely restores invalid URLs to Create', () => {
    expect(viewFromLocation('?view=review')).toBe('review')
    expect(viewFromLocation('?view=unknown')).toBe('create')
    expect(viewFromLocation('')).toBe('create')
    expect(urlForView('export', 'http://localhost/?view=create')).toBe('/?view=export')
  })

  it('normalizes unprefixed HEX without accepting partial values', () => {
    expect(normalizeHexDraft('aabbcc')).toBe('#aabbcc')
    expect(colorFromHex('aabbcc')).toEqual(
      expect.objectContaining({ hex: '#AABBCC', rgb: { r: 170, g: 187, b: 204 } }),
    )
    expect(colorFromHex('#abc')).toBeNull()
  })
})
