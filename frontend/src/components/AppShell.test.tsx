import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppShell from './AppShell'

describe('AppShell navigation', () => {
  beforeEach(() => {
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
  })

  it('explains unavailable Review and Export views', () => {
    render(
      <AppShell
        view="create"
        navigation={{
          review: { available: false, reason: 'Add two colors.' },
          export: { available: false, reason: 'Add one color.' },
        }}
        title="ColorCraft"
        sourceName="Local color utility"
        summary="Create a palette."
        networkStatus={{ state: 'available', mode: 'loopback' }}
        onNavigate={vi.fn()}
        onNewPalette={vi.fn()}
      >
        Workspace
      </AppShell>,
    )
    const desktop = screen.getByRole('navigation', { name: 'Primary' })
    expect(
      within(desktop).getByRole('button', { name: 'Create' }),
    ).toBeEnabled()
    expect(
      within(desktop).getByRole('button', { name: 'Review' }),
    ).toBeDisabled()
    expect(
      within(desktop).getByRole('button', { name: 'Review' }),
    ).toHaveAttribute('title', 'Add two colors.')
    expect(
      within(desktop).getByRole('button', { name: 'Export' }),
    ).toBeDisabled()
  })

  it('provides equivalent mobile navigation and shell theme control', () => {
    const onNavigate = vi.fn()
    render(
      <AppShell
        view="create"
        navigation={{
          review: { available: true, reason: '' },
          export: { available: true, reason: '' },
        }}
        title="Current palette"
        sourceName="Untitled palette"
        summary="Two colors · created manually"
        networkStatus={{ state: 'available', mode: 'lan' }}
        onNavigate={onNavigate}
        onNewPalette={vi.fn()}
      >
        Workspace
      </AppShell>,
    )
    const mobile = screen.getByRole('navigation', { name: 'Mobile primary' })
    fireEvent.click(within(mobile).getByRole('button', { name: 'Review' }))
    expect(onNavigate).toHaveBeenCalledWith('review')
    const themeControls = screen.getAllByLabelText('Theme')
    expect(themeControls).toHaveLength(2)
    fireEvent.change(themeControls[1], { target: { value: 'dark' } })
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(themeControls[0]).toHaveValue('dark')
    expect(themeControls[1]).toHaveValue('dark')
    expect(screen.getByText('LAN enabled')).toHaveAccessibleDescription(
      expect.stringMatching(/trusted LAN access/i),
    )
  })

  it('distinguishes loading from unavailable network metadata', () => {
    const props = {
      view: 'create' as const,
      navigation: {
        review: { available: false, reason: 'Add two colors.' },
        export: { available: false, reason: 'Add one color.' },
      },
      title: 'ColorCraft',
      sourceName: 'Local color utility',
      summary: 'Create a palette.',
      onNavigate: vi.fn(),
      onNewPalette: vi.fn(),
    }
    const view = render(
      <AppShell {...props} networkStatus={{ state: 'loading' }}>
        Workspace
      </AppShell>,
    )
    expect(
      screen.getByText('Checking network status'),
    ).toHaveAccessibleDescription(/checking the resolved network exposure/i)
    expect(
      screen.queryByText('Network status unavailable'),
    ).not.toBeInTheDocument()

    view.rerender(
      <AppShell {...props} networkStatus={{ state: 'unavailable' }}>
        Workspace
      </AppShell>,
    )
    expect(
      screen.getByText('Network status unavailable'),
    ).toHaveAccessibleDescription(/could not confirm/i)
  })
})
