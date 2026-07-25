import { describe, expect, it } from 'vitest'
import { blue, red } from './test/fixtures'
import {
  colorForRole,
  contrastRatio,
  formatContrastRatio,
  pruneRoleAssignments,
  remapLegacyHexRoles,
  resultsForContrastCheck,
  roleAssignmentEntries,
  rolesForColor,
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
      const epsilon = Number.EPSILON * Math.max(1, threshold)
      const failingValues = [threshold - 0.0001, threshold - epsilon]
      const exact = threshold
      const above = threshold + epsilon
      const kind = threshold === 3 ? 'nonText' : 'text'
      const resultAt = (ratio: number) =>
        resultsForContrastCheck(kind, ratio).find(
          (result) => result.threshold === threshold,
        )

      for (const failingValue of failingValues) {
        const formatted = formatContrastRatio(failingValue, [threshold])
        expect(resultAt(failingValue)?.pass).toBe(false)
        expect(Number(formatted)).toBeLessThan(threshold)
        expect(formatted).toMatch(/^\d+\.\d{4}$/)
      }
      expect(resultAt(exact)?.pass).toBe(true)
      expect(resultAt(above)?.pass).toBe(true)
      expect(formatContrastRatio(exact, [threshold])).toBe(threshold.toFixed(2))
      expect(formatContrastRatio(above, [threshold])).toBe(threshold.toFixed(2))
    },
  )

  it('keeps ordinary two-decimal contrast formatting unchanged', () => {
    expect(formatContrastRatio(4.5422)).toBe('4.54')
    expect(formatContrastRatio(21)).toBe('21.00')
  })

  it('keeps only role assignments whose color still exists', () => {
    expect(
      pruneRoleAssignments(
        {
          primaryText: red.id,
          pageBackground: blue.id,
        },
        [red],
      ),
    ).toEqual({ primaryText: red.id })
  })

  it('does not prune an assigned duplicate when the other duplicate is removed', () => {
    const assigned = { ...red, id: 'assigned-red' }
    expect(
      pruneRoleAssignments({ primaryText: assigned.id }, [assigned]),
    ).toEqual({ primaryText: assigned.id })
    expect(pruneRoleAssignments({ primaryText: assigned.id }, [red])).toEqual(
      {},
    )
  })

  it('resolves and enumerates role ownership by stable color ID', () => {
    const duplicate = { ...red, id: 'duplicate-red', name: 'Duplicate' }
    const roles = {
      pageBackground: red.id,
      primaryText: duplicate.id,
      actionText: duplicate.id,
    }
    const colorsById = new Map(
      [red, duplicate].map((color) => [color.id, color]),
    )
    expect(colorForRole('primaryText', roles, colorsById)).toBe(duplicate)
    expect(rolesForColor(duplicate.id, roles)).toEqual([
      'primaryText',
      'actionText',
    ])
    expect(roleAssignmentEntries(roles)).toEqual([
      ['pageBackground', red.id],
      ['primaryText', duplicate.id],
      ['actionText', duplicate.id],
    ])
    expect(contrastRatio(red, duplicate)).toBe(1)
  })

  it('migrates legacy duplicate HEX roles to the first match', () => {
    const duplicate = { ...red, id: 'duplicate-red' }
    expect(
      remapLegacyHexRoles({ primaryText: red.hex, surface: '#123456' }, [
        duplicate,
        red,
      ]),
    ).toEqual({ primaryText: duplicate.id })
  })
})
