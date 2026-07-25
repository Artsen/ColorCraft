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
        networkMode="loopback"
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
        networkMode="lan"
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
    expect(screen.getByText('LAN enabled')).toHaveAttribute(
      'title',
      expect.stringMatching(/trusted LAN access/i),
    )
  })
})
