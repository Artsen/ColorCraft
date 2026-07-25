import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { analyzeColors, extractColors, suggestColors } from './api/client'
import { analysis, red } from './test/fixtures'
import App from './App'

vi.mock('./api/client', () => ({
  extractColors: vi.fn(),
  analyzeColors: vi.fn(),
  suggestColors: vi.fn(),
}))

function desktopNavigation() {
  return screen.getByRole('navigation', { name: 'Primary' })
}

describe('ColorCraft workspace', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/?view=create')
    localStorage.clear()
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })))
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:source'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
    vi.mocked(extractColors).mockReset()
    vi.mocked(analyzeColors).mockReset()
    vi.mocked(suggestColors).mockReset()
    vi.mocked(analyzeColors).mockResolvedValue({ success: true, analysis })
    vi.mocked(suggestColors).mockResolvedValue({ success: true, suggestions: [] })
  })

  it('enables views from real palette prerequisites and writes URL state', async () => {
    render(<App />)
    expect(within(desktopNavigation()).getByRole('button', { name: 'Review' })).toBeDisabled()
    expect(within(desktopNavigation()).getByRole('button', { name: 'Export' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Start manually' }))
    expect(within(desktopNavigation()).getByRole('button', { name: 'Export' })).toBeEnabled()
    expect(within(desktopNavigation()).getByRole('button', { name: 'Review' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    const review = within(desktopNavigation()).getByRole('button', { name: 'Review' })
    expect(review).toBeEnabled()
    fireEvent.click(review)
    expect(window.location.search).toBe('?view=review&review=overview')
    expect(screen.getByText('Analyze this palette')).toBeInTheDocument()

    fireEvent.click(within(desktopNavigation()).getByRole('button', { name: 'Create' }))
    expect(screen.getByText('Palette')).toBeInTheDocument()

    act(() => window.history.back())
    await waitFor(() => expect(window.location.search).toBe('?view=review&review=overview'))
    expect(screen.getByText('Analyze this palette')).toBeInTheDocument()

    act(() => window.history.forward())
    await waitFor(() => expect(window.location.search).toBe('?view=create'))
    expect(screen.getByText('Palette')).toBeInTheDocument()
  })

  it('confirms meaningful unsaved work before starting over', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start manually' }))
    fireEvent.click(screen.getByRole('button', { name: 'New palette' }))
    expect(screen.getByRole('dialog', { name: 'Start a new palette?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Keep working' }))
    expect(screen.getByText('Untitled palette')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'New palette' }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard and start new' }))
    expect(screen.getByText('Create a palette')).toBeInTheDocument()
  })

  it('revokes the active image URL when a palette is reset', async () => {
    vi.mocked(extractColors).mockResolvedValue({
      success: true,
      colors: [{ ...red, population: 1, pixelCount: 10 }],
      count: 1,
    })
    const { container } = render(<App />)
    const input = container.querySelector<HTMLInputElement>('#source-image')!
    fireEvent.change(input, {
      target: { files: [new File(['image'], 'sample.png', { type: 'image/png' })] },
    })
    expect((await screen.findAllByText('sample.png')).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'New palette' }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard and start new' }))
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:source'))
  })

  it('restores an unavailable refreshed view to Create', async () => {
    window.history.replaceState({}, '', '/?view=review')
    render(<App />)
    await waitFor(() => expect(window.location.search).toBe('?view=create'))
    expect(screen.getByText('Create a palette')).toBeInTheDocument()
  })

  it('restores the selected Review tab from URL history', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start manually' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    window.history.pushState({}, '', '/?view=review&review=contrast')
    act(() => window.dispatchEvent(new PopStateEvent('popstate')))
    expect(await screen.findByRole('tab', { name: 'Contrast' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('withholds stale analysis after the palette changes', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start manually' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    fireEvent.click(screen.getByRole('button', { name: 'Analyze palette' }))
    expect(await screen.findByText('Palette summary')).toBeInTheDocument()
    fireEvent.click(within(desktopNavigation()).getByRole('button', { name: 'Create' }))
    const input = screen.getByLabelText('Color 1')
    fireEvent.change(input, { target: { value: '#121212' } })
    fireEvent.blur(input)
    fireEvent.click(within(desktopNavigation()).getByRole('button', { name: 'Review' }))
    expect(screen.getByText('Analysis is stale because the palette changed.')).toBeInTheDocument()
    expect(screen.queryByText('Palette summary')).not.toBeInTheDocument()
  })
})
