import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AnalysisResults from './AnalysisResults'
import { analysis, blue, red } from '../test/fixtures'

describe('AnalysisResults', () => {
  it('renders the canonical accessibility contract', () => {
    render(<AnalysisResults analysis={analysis} colors={[red, blue]} />)

    expect(screen.getByText('Total Pairs')).toBeInTheDocument()
    expect(screen.getAllByText('AA Normal')).toHaveLength(2)
    expect(screen.getAllByText('AA Large')).toHaveLength(2)
    expect(screen.getAllByText('AAA Normal')).toHaveLength(2)
    expect(screen.getAllByText('AAA Large')).toHaveLength(2)
    expect(
      screen.getByText('Low contrast detected between #ff0000 and #0000ff.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Relationship fit')).toBeInTheDocument()
    expect(
      screen.getByText(
        'This measures geometric color relationships, not subjective design quality.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('Harmony Score')).not.toBeInTheDocument()
    expect(
      screen.getByText('#ff0000 + #0000ff • Ratio: 2.15'),
    ).toBeInTheDocument()
  })

  it('renders duplicate pairs and issues without duplicate React keys', () => {
    const pair = { ...analysis.accessibility.pairs[0] }
    const issue = { ...analysis.accessibility.issues[0] }
    const duplicateAnalysis = {
      ...analysis,
      accessibility: {
        ...analysis.accessibility,
        pairs: [{ ...pair }, { ...pair }],
        issues: [{ ...issue }, { ...issue }],
      },
    }
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const { container } = render(
        <AnalysisResults
          analysis={duplicateAnalysis}
          colors={[red, { ...red, id: 'duplicate-red' }, blue]}
        />,
      )
      expect(
        screen.getAllByText(
          'Low contrast detected between #ff0000 and #0000ff.',
        ),
      ).toHaveLength(2)
      expect(
        container.querySelectorAll('.analysis-section .contrast-row'),
      ).toHaveLength(2)
      expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(
        /same key|unique "key"/i,
      )
    } finally {
      consoleError.mockRestore()
    }
  })
})
