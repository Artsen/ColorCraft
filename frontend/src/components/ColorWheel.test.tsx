import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Analysis } from '../api/contracts'
import { analysis, blue, red } from '../test/fixtures'
import ColorWheel from './ColorWheel'

describe('ColorWheel rendering', () => {
  it('keeps markers above relationships and uses a non-opaque annotation', () => {
    const withRelationship: Analysis = {
      ...analysis,
      colorTheory: {
        ...analysis.colorTheory,
        harmonies: {
          ...analysis.colorTheory.harmonies,
          complementary: [
            {
              type: 'complementary',
              colorIndexes: [0, 1],
              expectedAngles: [180],
              measuredAngles: [180],
              deviation: 0,
              confidence: 1,
            },
          ],
        },
      },
    }
    const { container } = render(
      <ColorWheel colors={[red, blue]} analysis={withRelationship} />,
    )
    const layerNames = Array.from(
      container.querySelectorAll('[data-layer]'),
      (element) => element.getAttribute('data-layer'),
    )
    expect(layerNames).toEqual([
      'background',
      'sectors',
      'structural-guides',
      'relationships',
      'markers',
      'marker-labels',
      'center-annotation',
    ])
    expect(
      container.querySelectorAll('[data-layer="markers"] circle'),
    ).toHaveLength(2)
    expect(
      container.querySelector('[data-layer="center-annotation"] circle'),
    ).not.toBeInTheDocument()
    expect(
      container.querySelector('[data-relationship-type="complementary"]'),
    ).toHaveAttribute('stroke-dasharray', '8,4')
    expect(screen.getByTestId('wheel-summary')).toHaveTextContent(
      'complementary: color 1, color 2',
    )
  })
})
