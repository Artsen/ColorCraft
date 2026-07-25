import { describe, expect, it } from 'vitest'
import { blue, red } from './test/fixtures'
import { contrastRatio, pruneRoleAssignments } from './contrast'

describe('role contrast state', () => {
  it('calculates WCAG contrast from RGB values', () => {
    expect(contrastRatio(
      { rgb: { r: 255, g: 255, b: 255 } },
      { rgb: { r: 0, g: 0, b: 0 } },
    )).toBe(21)
  })

  it('keeps only role assignments whose color still exists', () => {
    expect(pruneRoleAssignments({
      primaryText: red.hex,
      pageBackground: blue.hex,
    }, [red])).toEqual({ primaryText: red.hex })
  })
})
