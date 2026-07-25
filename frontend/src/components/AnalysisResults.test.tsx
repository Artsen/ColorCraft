import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
    expect(screen.getByText('#ff0000 + #0000ff • Ratio: 2.15')).toBeInTheDocument()
  })
})
