import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Analysis, Color } from '../api/contracts'
import { analysis as baseAnalysis, blue, red } from '../test/fixtures'
import ReviewWorkspace, { orderedRelationships } from './ReviewWorkspace'

const white: Color = {
  hex: '#FFFFFF',
  rgb: { r: 255, g: 255, b: 255 },
  hsl: { h: 0, s: 0, l: 100 },
}
const black: Color = {
  hex: '#000000',
  rgb: { r: 0, g: 0, b: 0 },
  hsl: { h: 0, s: 0, l: 0 },
}

function measuredAnalysis(): Analysis {
  return {
    ...baseAnalysis,
    colorTheory: {
      ...baseAnalysis.colorTheory,
      metrics: { hueDiversity: 180, saturationAvg: 62, lightnessRange: 100 },
      harmonies: {
        ...baseAnalysis.colorTheory.harmonies,
        analogous: [
          {
            type: 'analogous',
            colorIndexes: [0, 1],
            expectedAngles: [30],
            measuredAngles: [44],
            deviation: 14,
            confidence: 0.41,
          },
        ],
        complementary: [
          {
            type: 'complementary',
            colorIndexes: [0, 1],
            expectedAngles: [180],
            measuredAngles: [177],
            deviation: 3,
            confidence: 0.94,
          },
        ],
      },
    },
    accessibility: {
      ...baseAnalysis.accessibility,
      pairs: [
        {
          color1: '#FFFFFF',
          color2: '#000000',
          ratio: 21,
          aaNormal: true,
          aaLarge: true,
          aaaNormal: true,
          aaaLarge: true,
        },
      ],
    },
  }
}

function renderReview(
  selectedTab: 'overview' | 'harmony' | 'contrast' = 'overview',
  roles = {},
) {
  return render(
    <ReviewWorkspace
      colors={[white, black]}
      analysis={measuredAnalysis()}
      analysisStale={false}
      analyzing={false}
      selectedTab={selectedTab}
      roles={roles}
      onSelectTab={vi.fn()}
      onAnalyze={vi.fn()}
      onAssignRole={vi.fn()}
      onAddColor={vi.fn()}
    />,
  )
}

describe('ReviewWorkspace outcomes', () => {
  it('renders the wheel beside a concise measured overview', () => {
    renderReview()
    expect(screen.getByText('Palette summary')).toBeInTheDocument()
    expect(screen.getByText('Wide lightness range · 100%')).toBeInTheDocument()
    expect(
      screen.getByText(
        'This measures geometric color relationships, not subjective design quality.',
      ),
    ).toBeInTheDocument()
  })

  it('orders relationships by confidence and qualifies weak matches', () => {
    const relationships = orderedRelationships(measuredAnalysis())
    expect(relationships.map((item) => item.type)).toEqual([
      'complementary',
      'analogous',
    ])
    renderReview('harmony')
    const cards = document.querySelectorAll('.relationship-card')
    expect(
      within(cards[0] as HTMLElement).getByText(
        /Strong complementary relationship/,
      ),
    ).toBeInTheDocument()
    expect(
      within(cards[1] as HTMLElement).getByText(/Weak analogous relationship/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Two colors are near the edge of the configured analogous range.',
      ),
    ).toBeInTheDocument()
  })

  it('supports role assignment, contrast calculation, previews, and advanced pairs', () => {
    const onAssignRole = vi.fn()
    const view = render(
      <ReviewWorkspace
        colors={[white, black, red, blue]}
        analysis={measuredAnalysis()}
        analysisStale={false}
        analyzing={false}
        selectedTab="contrast"
        roles={{ pageBackground: white.hex, primaryText: black.hex }}
        onSelectTab={vi.fn()}
        onAnalyze={vi.fn()}
        onAssignRole={onAssignRole}
        onAddColor={vi.fn()}
      />,
    )
    expect(screen.getByText('21.00 to 1')).toBeInTheDocument()
    expect(screen.getByText('Page heading')).toBeInTheDocument()
    expect(screen.getAllByText('AA normal: Pass').length).toBeGreaterThan(0)
    fireEvent.change(screen.getByLabelText('Surface'), {
      target: { value: red.hex },
    })
    expect(onAssignRole).toHaveBeenCalledWith('surface', red.hex)
    expect(
      screen.getByText('Advanced: all-pairs contrast matrix'),
    ).toBeInTheDocument()
    view.unmount()
  })

  it('clearly identifies stale analysis without rendering prior results', () => {
    render(
      <ReviewWorkspace
        colors={[white, black]}
        analysis={null}
        analysisStale
        analyzing={false}
        selectedTab="overview"
        roles={{}}
        onSelectTab={vi.fn()}
        onAnalyze={vi.fn()}
        onAssignRole={vi.fn()}
        onAddColor={vi.fn()}
      />,
    )
    expect(
      screen.getByText('Analysis is stale because the palette changed.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Palette summary')).not.toBeInTheDocument()
  })
})
