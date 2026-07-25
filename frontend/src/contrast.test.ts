import { describe, expect, it } from 'vitest'
import { blue, red } from './test/fixtures'
import {
  contrastRatio,
  formatContrastRatio,
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

  it.each([3, 4.5, 7])(
    'formats and evaluates values around the %s:1 boundary without contradiction',
    (threshold) => {
      const below = threshold - 0.0001
      const exact = threshold
      const above = threshold + 0.0001
      const kind = threshold === 3 ? 'nonText' : 'text'
      const resultAt = (ratio: number) =>
        resultsForContrastCheck(kind, ratio).find(
          (result) => result.threshold === threshold,
        )

      expect(resultAt(below)?.pass).toBe(false)
      expect(resultAt(exact)?.pass).toBe(true)
      expect(resultAt(above)?.pass).toBe(true)
      expect(formatContrastRatio(below, [threshold])).toBe(
        `${threshold - 0.0001}`,
      )
      expect(formatContrastRatio(exact, [threshold])).toBe(threshold.toFixed(2))
      expect(formatContrastRatio(above, [threshold])).toBe(threshold.toFixed(2))
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
