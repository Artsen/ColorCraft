import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Analysis } from '../api/contracts'
import { analysis as baseAnalysis, blue, red } from '../test/fixtures'
import type { PaletteColor } from '../workspace'
import ReviewWorkspace, { orderedRelationships } from './ReviewWorkspace'

const white: PaletteColor = {
  id: 'color-white',
  hex: '#FFFFFF',
  rgb: { r: 255, g: 255, b: 255 },
  hsl: { h: 0, s: 0, l: 100 },
}
const black: PaletteColor = {
  id: 'color-black',
  hex: '#000000',
  rgb: { r: 0, g: 0, b: 0 },
  hsl: { h: 0, s: 0, l: 0 },
}

function measuredAnalysis(): Analysis {
  return {
    ...baseAnalysis,
    colorTheory: {
      ...baseAnalysis.colorTheory,
      temperatureBalance: {
        balance: 'mixed',
        warmCount: 4,
        transitionalCount: 3,
        coolCount: 3,
        warmRatio: 0.4,
        transitionalRatio: 0.3,
        coolRatio: 0.3,
      },
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
        {
          color1: '#FF0000',
          color2: '#0000FF',
          ratio: 4.4999,
          aaNormal: false,
          aaLarge: true,
          aaaNormal: false,
          aaaLarge: false,
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
      screen.getByText(/40% warm · 30% transitional · 30% cool/),
    ).toBeInTheDocument()
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
        roles={{
          pageBackground: white.hex,
          surface: white.hex,
          primaryText: black.hex,
          border: black.hex,
          focusIndicator: black.hex,
        }}
        onSelectTab={vi.fn()}
        onAnalyze={vi.fn()}
        onAssignRole={onAssignRole}
        onAddColor={vi.fn()}
      />,
    )
    expect(screen.getAllByText('21.00 to 1').length).toBeGreaterThan(0)
    expect(screen.getByText('Page heading')).toBeInTheDocument()
    const textResult = screen
      .getByRole('heading', { name: 'Primary text on page background' })
      .closest('article')!
    expect(
      within(textResult).getByText(/AA normal text \(4.5:1\): Pass/),
    ).toBeInTheDocument()

    const borderResult = screen
      .getByRole('heading', { name: 'Border against surface' })
      .closest('article')!
    expect(
      within(borderResult).getByText(
        /Non-text component contrast \(3:1\): Pass/,
      ),
    ).toBeInTheDocument()
    expect(
      within(borderResult).queryByText(/AA normal/),
    ).not.toBeInTheDocument()

    const focusResult = screen
      .getByRole('heading', {
        name: 'Focus indicator against page background',
      })
      .closest('article')!
    expect(
      within(focusResult).getByText(
        /Focus-indicator color contrast \(3:1\): Pass/,
      ),
    ).toBeInTheDocument()
    expect(
      within(focusResult).getByText(/Size, area, thickness, visibility/),
    ).toBeInTheDocument()
    expect(within(focusResult).queryByText(/AA normal/)).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Surface'), {
      target: { value: red.hex },
    })
    expect(onAssignRole).toHaveBeenCalledWith('surface', red.hex)
    expect(
      screen.getByText('Advanced: all-pairs text contrast matrix'),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByText('Advanced: all-pairs text contrast matrix'),
    )
    expect(screen.getByText('4.4999:1')).toBeInTheDocument()
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
