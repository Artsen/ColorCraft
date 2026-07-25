import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  analyzeColors,
  extractColors,
  getMetadata,
  suggestColors,
} from './api/client'
import { analysis, red } from './test/fixtures'
import { savePalette } from './persistence'
import { serializePortablePalette } from './portablePalette'
import App from './App'

function portableFile(name = 'Imported palette') {
  const text = serializePortablePalette(
    name,
    [
      { ...red, name: 'Primary action' },
      {
        ...red,
        id: 'portable-blue',
        name: 'Surface',
        hex: '#0000FF',
        rgb: { r: 0, g: 0, b: 255 },
        hsl: { h: 240, s: 100, l: 50 },
      },
    ],
    { primaryText: red.hex },
  )
  const file = new File([text], 'palette.json', {
    type: 'application/json',
  })
  Object.defineProperty(file, 'arrayBuffer', {
    value: vi.fn(async () => new TextEncoder().encode(text).buffer),
  })
  return file
}

vi.mock('./api/client', () => ({
  extractColors: vi.fn(),
  analyzeColors: vi.fn(),
  getMetadata: vi.fn(),
  suggestColors: vi.fn(),
}))

function desktopNavigation() {
  return screen.getByRole('navigation', { name: 'Primary' })
}

describe('ColorCraft workspace', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/?view=create')
    localStorage.clear()
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
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
    vi.mocked(getMetadata).mockReset()
    vi.mocked(suggestColors).mockReset()
    vi.mocked(analyzeColors).mockResolvedValue({ success: true, analysis })
    vi.mocked(getMetadata).mockResolvedValue({
      schemaVersion: 1,
      id: 'colorcraft',
      name: 'ColorCraft',
      descriptor: 'Local color utility',
      version: '1.0.0',
      icon: 'http://127.0.0.1:5174/colorcraft-mark.svg',
      webUrl: 'http://127.0.0.1:5174',
      apiUrl: 'http://127.0.0.1:4100',
      healthUrl: 'http://127.0.0.1:4100/health',
      readinessUrl: 'http://127.0.0.1:4100/ready',
      networkMode: 'loopback',
      capabilities: [],
    })
    vi.mocked(suggestColors).mockResolvedValue({
      success: true,
      suggestions: [],
    })
  })

  it('renders trust-sensitive shell copy and metadata network mode', async () => {
    render(<App />)
    expect(
      screen.getByText(
        'Extract, refine, and review color palettes from images.',
      ),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Loopback only'),
    ).toHaveAccessibleDescription(
      expect.stringMatching(/loopback traffic only/i),
    )
  })

  it('renders LAN enabled from runtime metadata', async () => {
    vi.mocked(getMetadata).mockResolvedValueOnce({
      schemaVersion: 1,
      id: 'colorcraft',
      name: 'ColorCraft',
      descriptor: 'Local color utility',
      version: '1.0.0',
      icon: 'http://192.168.1.20:5174/colorcraft-mark.svg',
      webUrl: 'http://192.168.1.20:5174',
      apiUrl: 'http://192.168.1.20:4100',
      healthUrl: 'http://192.168.1.20:4100/health',
      readinessUrl: 'http://192.168.1.20:4100/ready',
      networkMode: 'lan',
      capabilities: [],
    })
    render(<App />)
    expect(await screen.findByText('LAN enabled')).toHaveAccessibleDescription(
      expect.stringMatching(/trusted LAN access/i),
    )
  })

  it('shows loading before metadata resolves and unavailable after failure', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    let rejectMetadata: ((reason?: unknown) => void) | undefined
    vi.mocked(getMetadata).mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejectMetadata = reject
      }),
    )
    render(<App />)
    expect(screen.getByText('Checking network status')).toBeInTheDocument()
    expect(
      screen.queryByText('Network status unavailable'),
    ).not.toBeInTheDocument()

    rejectMetadata?.(new Error('metadata unavailable'))
    expect(
      await screen.findByText('Network status unavailable'),
    ).toHaveAccessibleDescription(/could not confirm/i)
    expect(consoleError).toHaveBeenCalledWith(
      'Could not read runtime metadata:',
      expect.any(Error),
    )
    consoleError.mockRestore()
  })

  it('enables views from real palette prerequisites and writes URL state', async () => {
    render(<App />)
    expect(
      within(desktopNavigation()).getByRole('button', { name: 'Review' }),
    ).toBeDisabled()
    expect(
      within(desktopNavigation()).getByRole('button', { name: 'Export' }),
    ).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Start manually' }))
    expect(
      within(desktopNavigation()).getByRole('button', { name: 'Export' }),
    ).toBeEnabled()
    expect(
      within(desktopNavigation()).getByRole('button', { name: 'Review' }),
    ).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    const review = within(desktopNavigation()).getByRole('button', {
      name: 'Review',
    })
    expect(review).toBeEnabled()
    fireEvent.click(review)
    expect(window.location.search).toBe('?view=review&review=overview')
    expect(screen.getByText('Analyze this palette')).toBeInTheDocument()

    fireEvent.click(
      within(desktopNavigation()).getByRole('button', { name: 'Create' }),
    )
    expect(screen.getByText('Palette')).toBeInTheDocument()

    act(() => window.history.back())
    await waitFor(() =>
      expect(window.location.search).toBe('?view=review&review=overview'),
    )
    expect(screen.getByText('Analyze this palette')).toBeInTheDocument()

    act(() => window.history.forward())
    await waitFor(() => expect(window.location.search).toBe('?view=create'))
    expect(screen.getByText('Palette')).toBeInTheDocument()
  })

  it('confirms meaningful unsaved work before starting over', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start manually' }))
    fireEvent.click(screen.getByRole('button', { name: 'New palette' }))
    expect(
      screen.getByRole('dialog', { name: 'Start a new palette?' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Keep working' }))
    expect(screen.getByText('Untitled palette')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'New palette' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Discard and start new' }),
    )
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
      target: {
        files: [new File(['image'], 'sample.png', { type: 'image/png' })],
      },
    })
    expect((await screen.findAllByText('sample.png')).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'New palette' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Discard and start new' }),
    )
    await waitFor(() =>
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:source'),
    )
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
    expect(
      await screen.findByRole('tab', { name: 'Contrast' }),
    ).toHaveAttribute('aria-selected', 'true')
  })

  it('withholds stale analysis after the palette changes', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start manually' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    fireEvent.click(screen.getByRole('button', { name: 'Analyze palette' }))
    expect(await screen.findByText('Palette summary')).toBeInTheDocument()
    fireEvent.click(
      within(desktopNavigation()).getByRole('button', { name: 'Create' }),
    )
    const input = screen.getByLabelText('Color 1')
    fireEvent.change(input, { target: { value: '#121212' } })
    fireEvent.blur(input)
    fireEvent.click(
      within(desktopNavigation()).getByRole('button', { name: 'Review' }),
    )
    expect(
      screen.getByText('Analysis is stale because the palette changed.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Palette summary')).not.toBeInTheDocument()
  })

  it('shows unsaved, saved, and modified states around explicit saves', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start manually' }))
    expect(screen.getByText('Unsaved')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save palette' }))
    expect(await screen.findByText('Saved')).toBeInTheDocument()

    const input = screen.getByLabelText('Color 1')
    fireEvent.change(input, { target: { value: '#121212' } })
    fireEvent.blur(input)
    expect(screen.getByText('Modified')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument())
  })

  it('opens a saved palette and confirms before discarding another unsaved palette', async () => {
    await savePalette({
      name: 'Stored palette',
      sourceType: 'manual',
      colors: [red],
      roles: {},
    })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start manually' }))
    fireEvent.click(
      within(desktopNavigation()).getByRole('button', { name: 'Library' }),
    )
    fireEvent.click(
      await screen.findByRole('button', { name: 'Open Stored palette' }),
    )
    expect(
      screen.getByRole('dialog', { name: 'Open another palette?' }),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Discard changes and open' }),
    )
    expect(await screen.findByDisplayValue('#FF0000')).toBeInTheDocument()
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('leaves a predictable empty Library after deleting the active palette', async () => {
    await savePalette({
      name: 'Delete me',
      sourceType: 'manual',
      colors: [red],
      roles: {},
    })
    render(<App />)
    fireEvent.click(
      within(desktopNavigation()).getByRole('button', { name: 'Library' }),
    )
    fireEvent.click(
      await screen.findByRole('button', { name: 'Open Delete me' }),
    )
    fireEvent.click(
      within(desktopNavigation()).getByRole('button', { name: 'Library' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete Delete me' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete palette' }))
    expect(await screen.findByText('No saved palettes')).toBeInTheDocument()
    expect(
      within(desktopNavigation()).getByRole('button', { name: 'Review' }),
    ).toBeDisabled()
  })

  it('imports a validated portable palette locally into an unsaved workspace', async () => {
    const { container } = render(<App />)
    const input = container.querySelector<HTMLInputElement>(
      'input[accept=".json,application/json"]',
    )!
    fireEvent.change(input, { target: { files: [portableFile()] } })

    expect(await screen.findByText('Imported palette')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Primary action')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Surface')).toBeInTheDocument()
    expect(screen.getByText('Unsaved')).toBeInTheDocument()
    expect(
      screen.getByText(/was imported locally and remains unsaved/),
    ).toBeInTheDocument()
  })

  it('cancels or confirms import replacement without reparsing the file', async () => {
    const { container } = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start manually' }))
    const input = container.querySelector<HTMLInputElement>(
      'input[accept=".json,application/json"]',
    )!
    const file = portableFile('Replacement')
    fireEvent.change(input, { target: { files: [file] } })
    expect(
      await screen.findByRole('dialog', { name: 'Import another palette?' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Keep working' }))
    expect(screen.getByText('Untitled palette')).toBeInTheDocument()

    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Discard changes and import',
      }),
    )
    expect(await screen.findByText('Replacement')).toBeInTheDocument()
    expect(file.arrayBuffer).toHaveBeenCalledTimes(2)
  })
})
