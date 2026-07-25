import { describe, expect, it } from 'vitest'
import { blue, red } from './test/fixtures'
import {
  contrastRatio,
  pruneRoleAssignments,
  resultsForContrastCheck,
} from './contrast'

describe('role contrast state', () => {
  it('calculates WCAG contrast from RGB values', () => {
    expect(
      contrastRatio(
        { rgb: { r: 255, g: 255, b: 255 } },
        { rgb: { r: 0, g: 0, b: 0 } },
      ),
    ).toBe(21)
    expect(
      contrastRatio(
        { rgb: { r: 118, g: 118, b: 118 } },
        { rgb: { r: 255, g: 255, b: 255 } },
      ),
    ).toBeCloseTo(4.5422, 3)
    expect(
      contrastRatio(
        { rgb: { r: 148, g: 148, b: 148 } },
        { rgb: { r: 255, g: 255, b: 255 } },
      ),
    ).toBeCloseTo(3.0335, 3)
  })

  it('uses text thresholds only for text checks', () => {
    expect(resultsForContrastCheck('text', 4.5)).toEqual([
      { label: 'AA normal text', threshold: 4.5, pass: true },
      { label: 'AA large text', threshold: 3, pass: true },
      { label: 'AAA normal text', threshold: 7, pass: false },
      { label: 'AAA large text', threshold: 4.5, pass: true },
    ])
  })

  it.each(['nonText', 'focus'] as const)(
    'uses the 3:1 non-text threshold for %s checks',
    (kind) => {
      expect(resultsForContrastCheck(kind, 3)[0].pass).toBe(true)
      expect(resultsForContrastCheck(kind, 2.99)[0].pass).toBe(false)
      expect(resultsForContrastCheck(kind, 3)[0].label).not.toMatch(/AA|AAA/)
    },
  )

  it('keeps only role assignments whose color still exists', () => {
    expect(
      pruneRoleAssignments(
        {
          primaryText: red.hex,
          pageBackground: blue.hex,
        },
        [red],
      ),
    ).toEqual({ primaryText: red.hex })
  })
})
